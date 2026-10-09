import { Router } from "express";
import { Preset } from "../models/Preset.js";
import { User } from "../models/User.js";
import { requireAuth, optionalAuth, HttpError } from "../auth.js";
import { presetInput, pagination, assertObjectId, escapeRegex } from "../validation.js";
import { NAME_MAX } from "../../../examples/wam/presets/PresetFormat.js";
import { assertAssetsUsable, removeUnusedAssets } from "./assets.js";

/*
 * Presets en ligne.
 *   GET    /api/presets/mine          (JWT)       mes presets (liste légère, sans rack)
 *   GET    /api/presets/public        (public)    presets publics récents, recherche ?q=
 *   POST   /api/presets               (JWT)       créer
 *   GET    /api/presets/:id           (JWT opt.)  lire (avec rack) si public ou si c'est le mien
 *   PUT    /api/presets/:id           (JWT)       modifier (propriétaire uniquement)
 *   DELETE /api/presets/:id           (JWT)       supprimer (propriétaire uniquement)
 *   POST   /api/presets/:id/copy      (JWT)       copier un preset public dans mes presets
 * Un preset privé d'un autre utilisateur répond 404 (et non 403) : on ne révèle pas qu'il existe.
 */
export const presetsRouter = Router();

const LIST_FIELDS = "-rack -assetHashes";

/** Carte de preset renvoyée dans les listes (sans le rack, sans données privées). */
function card(preset, author) {
  return {
    id: String(preset._id),
    name: preset.name,
    description: preset.description,
    tags: preset.tags,
    visibility: preset.visibility,
    summary: preset.summary,
    size: preset.size,
    copiedFrom: preset.copiedFrom ? String(preset.copiedFrom) : null,
    author: author ? { id: String(author._id ?? author.id), username: author.username } : null,
    createdAt: preset.createdAt,
    updatedAt: preset.updatedAt,
  };
}

/** Preset complet (avec le rack), pour le charger dans l'hôte. */
function full(preset, author) {
  return { ...card(preset, author), format: preset.format, version: preset.version, rack: preset.rack };
}

/** Preset complet d'un document Mongoose fraîchement écrit, avec le pseudo de son auteur. */
async function fullWithAuthor(doc) {
  await doc.populate("ownerId", "username");
  const preset = doc.toObject();
  return full(preset, preset.ownerId);
}

async function pageOf(filter, query, { sort = { updatedAt: -1 } } = {}) {
  const { page, limit, skip } = pagination(query);
  const request = Preset.find(filter).sort(sort).skip(skip).limit(limit).select(LIST_FIELDS).populate("ownerId", "username").lean();
  const [items, total] = await Promise.all([request, Preset.countDocuments(filter)]);
  return {
    items: items.map((item) => card(item, item.ownerId)),
    page,
    limit,
    total,
    pages: Math.max(1, Math.ceil(total / limit)),
  };
}

presetsRouter.get("/mine", requireAuth, async (req, res, next) => {
  try {
    res.json(await pageOf({ ownerId: req.userId }, req.query));
  } catch (error) {
    next(error);
  }
});

presetsRouter.get("/public", async (req, res, next) => {
  try {
    const filter = { visibility: "public" };
    const q = String(req.query.q ?? "").trim().slice(0, 60);
    if (q) {
      // Recherche insensible à la casse dans le nom, les tags, l'ampli, le cabinet, les pédales
      // et le pseudo de l'auteur. La saisie est échappée : pas d'injection d'expression régulière.
      const pattern = new RegExp(escapeRegex(q), "i");
      const authors = await User.find({ username: pattern }).select("_id").limit(50).lean();
      filter.$or = [
        { name: pattern }, { tags: pattern }, { "summary.amp": pattern }, { "summary.cabinet": pattern }, { "summary.effects": pattern },
        ...(authors.length ? [{ ownerId: { $in: authors.map((author) => author._id) } }] : []),
      ];
    }
    res.json(await pageOf(filter, req.query, { sort: { createdAt: -1 } }));
  } catch (error) {
    next(error);
  }
});

presetsRouter.post("/", requireAuth, async (req, res, next) => {
  try {
    const input = presetInput(req.body);
    await assertAssetsUsable(input.assetHashes, req.userId);
    const preset = await Preset.create({ ...input, ownerId: req.userId });
    console.log(`[presets] Créé : ${preset.id} (${input.visibility}, ${input.size} octets)`);
    res.status(201).json(await fullWithAuthor(preset));
  } catch (error) {
    next(error);
  }
});

presetsRouter.get("/:id", optionalAuth, async (req, res, next) => {
  try {
    assertObjectId(req.params.id);
    const preset = await Preset.findById(req.params.id).populate("ownerId", "username").lean();
    const isOwner = preset && req.userId && String(preset.ownerId?._id) === req.userId;
    if (!preset || (preset.visibility !== "public" && !isOwner)) throw new HttpError(404, "Preset not found");
    res.json(full(preset, preset.ownerId));
  } catch (error) {
    next(error);
  }
});

presetsRouter.put("/:id", requireAuth, async (req, res, next) => {
  try {
    assertObjectId(req.params.id);
    const preset = await Preset.findOne({ _id: req.params.id, ownerId: req.userId });
    if (!preset) throw new HttpError(404, "Preset not found");
    const input = presetInput(req.body, { partial: true });
    const previousHashes = [...preset.assetHashes];
    if (input.assetHashes) await assertAssetsUsable(input.assetHashes, req.userId);
    preset.set(input);
    if (input.rack) preset.markModified("rack");
    await preset.save();
    if (input.assetHashes) await removeUnusedAssets(previousHashes.filter((hash) => !input.assetHashes.includes(hash)));
    console.log(`[presets] Modifié : ${preset.id}`);
    res.json(await fullWithAuthor(preset));
  } catch (error) {
    next(error);
  }
});

presetsRouter.delete("/:id", requireAuth, async (req, res, next) => {
  try {
    assertObjectId(req.params.id);
    const preset = await Preset.findOneAndDelete({ _id: req.params.id, ownerId: req.userId });
    if (!preset) throw new HttpError(404, "Preset not found");
    await removeUnusedAssets(preset.assetHashes);
    console.log(`[presets] Supprimé : ${preset.id}`);
    res.status(204).end();
  } catch (error) {
    next(error);
  }
});

presetsRouter.post("/:id/copy", requireAuth, async (req, res, next) => {
  try {
    assertObjectId(req.params.id);
    const source = await Preset.findById(req.params.id).lean();
    if (!source || (source.visibility !== "public" && String(source.ownerId) !== req.userId)) throw new HttpError(404, "Preset not found");
    const name = `${source.name} (copy)`.slice(0, NAME_MAX);
    const copy = await Preset.create({
      ownerId: req.userId, name, description: source.description, tags: source.tags, visibility: "private",
      format: source.format, version: source.version, summary: source.summary, rack: source.rack,
      assetHashes: source.assetHashes, size: source.size, copiedFrom: source._id,
    });
    console.log(`[presets] Copie ${copy.id} de ${source._id}`);
    res.status(201).json(await fullWithAuthor(copy));
  } catch (error) {
    next(error);
  }
});
