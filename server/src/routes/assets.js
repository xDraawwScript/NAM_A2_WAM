import express, { Router } from "express";
import crypto from "node:crypto";
import mongoose from "mongoose";
import { Asset } from "../models/Asset.js";
import { Preset } from "../models/Preset.js";
import { requireAuth, optionalAuth, HttpError } from "../auth.js";
import { HASH_PATTERN } from "../validation.js";

/*
 * Modèles .nam et IR externes, adressés par leur hash SHA-256.
 *   PUT  /api/assets/:hash  (JWT)       envoie un asset ; le serveur RECALCULE le hash et refuse
 *                                       s'il ne correspond pas (on ne fait pas confiance au client).
 *                                       S'il existe déjà, l'envoi du bon contenu ajoute simplement
 *                                       l'utilisateur à ses propriétaires (preuve de possession).
 *   HEAD /api/assets/:hash  (JWT)       puis-je déjà utiliser cet asset ? (évite de renvoyer 300 Ko)
 *   GET  /api/assets/:hash  (JWT opt.)  lit un asset, seulement s'il est utilisé par un preset
 *                                       public ou par un preset de l'utilisateur
 *
 * Format JSON échangé (le même que dans les fichiers exportés par l'hôte) :
 *   modèle : {kind:'nam', name, data: <texte du .nam>}        hash = SHA-256 du texte UTF-8
 *   IR     : {kind:'ir',  name, samples: <base64 des Float32>} hash = SHA-256 des octets Float32
 */
export const assetsRouter = Router();

export const MAX_ASSET_BYTES = 8 * 1024 * 1024;
export const USER_QUOTA_BYTES = 200 * 1024 * 1024; // total des assets envoyés par un utilisateur
export const ORPHAN_DELAY_MS = 24 * 60 * 60 * 1000; // délai avant de supprimer un asset jamais utilisé

function assertHash(hash) {
  if (!HASH_PATTERN.test(hash)) throw new HttpError(400, "Invalid asset hash (hexadecimal SHA-256 expected)");
}

/** Transforme le corps JSON en octets + vérifie que leur SHA-256 est bien `hash`. */
function decodeAsset(hash, body = {}) {
  let bytes;
  if (body.kind === "nam") {
    if (typeof body.data !== "string" || !body.data) throw new HttpError(400, "Amp model: the data field (text) is required");
    bytes = Buffer.from(body.data, "utf8");
  } else if (body.kind === "ir") {
    if (typeof body.samples !== "string" || !body.samples) throw new HttpError(400, "IR: the samples field (base64) is required");
    bytes = Buffer.from(body.samples, "base64");
    if (!bytes.length || bytes.length % 4) throw new HttpError(400, "IR: invalid Float32 samples");
  } else {
    throw new HttpError(400, "kind must be nam or ir");
  }
  if (bytes.length > MAX_ASSET_BYTES) throw new HttpError(413, "Asset too large (8 MB maximum)");
  const actual = crypto.createHash("sha256").update(bytes).digest("hex");
  if (actual !== hash) throw new HttpError(400, "The content does not match the announced hash");
  return bytes;
}

/** Supprime, parmi `hashes`, les assets qui ne sont plus utilisés par aucun preset (« ramasse-miettes »). */
export async function removeUnusedAssets(hashes = []) {
  const candidates = [...new Set(hashes)];
  if (!candidates.length) return [];
  const used = new Set(await Preset.distinct("assetHashes", { assetHashes: { $in: candidates } }));
  const removed = candidates.filter((hash) => !used.has(hash));
  if (removed.length) {
    await Asset.deleteMany({ hash: { $in: removed } });
    console.log(`[assets] ${removed.length} asset(s) inutilisé(s) supprimé(s)`);
  }
  return removed;
}

/** Supprime les assets envoyés depuis plus de 24 h et jamais rattachés à un preset. */
export async function removeOrphanAssets(now = Date.now()) {
  const old = await Asset.find({ createdAt: { $lt: new Date(now - ORPHAN_DELAY_MS) } }).select("hash").lean();
  return removeUnusedAssets(old.map((asset) => asset.hash));
}

const missingMessage = (hashes) => `Missing asset(s), upload them first: ${hashes.map((hash) => hash.slice(0, 12)).join(", ")}`;

const isOwner = (asset, userId) => Boolean(userId) && [asset.uploadedBy, ...(asset.owners || [])].some((id) => String(id) === String(userId));

/** Parmi `hashes`, ceux que l'utilisateur peut utiliser : il en est propriétaire, ou ils servent déjà à un preset public ou à lui. */
async function usableHashes(hashes, userId) {
  const assets = await Asset.find({ hash: { $in: hashes } }).select("hash uploadedBy owners").lean();
  const usable = new Set(assets.filter((asset) => isOwner(asset, userId)).map((asset) => asset.hash));
  const others = assets.map((asset) => asset.hash).filter((hash) => !usable.has(hash));
  if (others.length) {
    const readable = await Preset.distinct("assetHashes", { assetHashes: { $in: others }, $or: [{ visibility: "public" }, ...(userId ? [{ ownerId: userId }] : [])] });
    for (const hash of readable) if (others.includes(hash)) usable.add(hash);
  }
  return { usable, existing: new Set(assets.map((asset) => asset.hash)) };
}

/**
 * Vérifie que l'utilisateur peut utiliser les assets référencés par son preset. Sinon, connaître le
 * hash d'un modèle privé suffirait pour se l'approprier : il doit d'abord en envoyer le contenu.
 */
export async function assertAssetsUsable(hashes = [], userId) {
  if (!hashes.length) return;
  const { usable } = await usableHashes(hashes, userId);
  const denied = hashes.filter((hash) => !usable.has(hash));
  if (denied.length) throw new HttpError(400, missingMessage(denied));
}

async function assertQuota(userId, extraBytes) {
  const [usage] = await Asset.aggregate([
    { $match: { $or: [{ owners: new mongoose.Types.ObjectId(String(userId)) }, { uploadedBy: new mongoose.Types.ObjectId(String(userId)) }] } },
    { $group: { _id: null, bytes: { $sum: "$size" } } },
  ]);
  if ((usage?.bytes ?? 0) + extraBytes > USER_QUOTA_BYTES) throw new HttpError(413, "Asset quota reached (200 MB per user)");
}

// Le corps (jusqu'à 12 Mo) n'est lu qu'après la vérification du jeton.
assetsRouter.put("/:hash", requireAuth, express.json({ limit: "12mb" }), async (req, res, next) => {
  try {
    const { hash } = req.params;
    assertHash(hash);
    const existing = await Asset.findOne({ hash }).select("uploadedBy owners").lean();
    if (existing && isOwner(existing, req.userId)) return res.status(200).json({ hash, created: false });
    // Contenu vérifié AVANT toute écriture : c'est la preuve que l'utilisateur possède le fichier.
    const bytes = decodeAsset(hash, req.body);
    await assertQuota(req.userId, bytes.length);
    if (existing) {
      await Asset.updateOne({ hash }, { $addToSet: { owners: req.userId } });
      console.log(`[assets] Nouveau propriétaire pour l'asset ${hash.slice(0, 12)} (déjà stocké, pas de doublon)`);
      return res.status(200).json({ hash, created: false });
    }
    try {
      await Asset.create({ hash, kind: req.body.kind, name: String(req.body.name || req.body.kind).slice(0, 200), size: bytes.length, bytes, uploadedBy: req.userId, owners: [req.userId] });
    } catch (error) {
      if (error?.code !== 11000) throw error;
      // Envoyé en parallèle par quelqu'un d'autre : le document existe, on s'ajoute aux propriétaires.
      await Asset.updateOne({ hash }, { $addToSet: { owners: req.userId } });
      return res.status(200).json({ hash, created: false });
    }
    console.log(`[assets] Asset ${req.body.kind} enregistré : ${hash.slice(0, 12)} (${bytes.length} octets)`);
    res.status(201).json({ hash, created: true });
  } catch (error) {
    next(error);
  }
});

assetsRouter.head("/:hash", requireAuth, async (req, res, next) => {
  try {
    assertHash(req.params.hash);
    // 200 seulement si l'utilisateur peut DÉJÀ utiliser l'asset ; sinon 404 et le client envoie le
    // contenu (PUT). On ne révèle pas qu'un asset privé d'un autre utilisateur existe.
    const { usable } = await usableHashes([req.params.hash], req.userId);
    res.status(usable.has(req.params.hash) ? 200 : 404).end();
  } catch (error) {
    next(error);
  }
});

assetsRouter.get("/:hash", optionalAuth, async (req, res, next) => {
  try {
    const { hash } = req.params;
    assertHash(hash);
    // Lecture autorisée si l'utilisateur en est propriétaire, ou si l'asset sert à un preset public
    // ou à un de ses presets. Sinon 404 (on ne révèle pas son existence).
    const asset = await Asset.findOne({ hash }).select("+bytes").lean();
    const allowed = asset && (isOwner(asset, req.userId)
      || await Preset.exists({ assetHashes: hash, $or: [{ visibility: "public" }, ...(req.userId ? [{ ownerId: req.userId }] : [])] }));
    if (!allowed) throw new HttpError(404, "Asset not found");
    const bytes = Buffer.from(asset.bytes.buffer ?? asset.bytes);
    res.set("Cache-Control", "private, max-age=86400");
    res.json(asset.kind === "nam"
      ? { hash, kind: "nam", name: asset.name, data: bytes.toString("utf8") }
      : { hash, kind: "ir", name: asset.name, samples: bytes.toString("base64") });
  } catch (error) {
    next(error);
  }
});
