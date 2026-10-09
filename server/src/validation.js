import mongoose from "mongoose";
import {
  PRESET_FORMAT,
  PRESET_VERSION,
  PresetError,
  normalizeName,
  normalizeDescription,
  normalizeTags,
  validateRack,
  portableRack,
  summarize,
  rackEntries,
} from "../../examples/wam/presets/PresetFormat.js";
import { collectAssetRefs, ASSET_KINDS, HASH_PATTERN } from "../../examples/wam/presets/PresetAssets.js";
import { HttpError } from "./auth.js";

/*
 * Validation des données envoyées par le navigateur (« ne jamais faire confiance au client »).
 * Le format d'un preset est défini UNE seule fois, dans l'hôte (PresetFormat.js) : le serveur
 * réutilise exactement les mêmes règles que le navigateur.
 */

export const MAX_RACK_BYTES = 256 * 1024; // un rack déshydraté pèse ~15 Ko
export { HASH_PATTERN };

const text = (value, max) => String(value ?? "").trim().slice(0, max);

/** Vérifie un identifiant MongoDB avant toute requête (sinon CastError). */
export function assertObjectId(id) {
  if (!mongoose.isValidObjectId(id)) throw new HttpError(404, "Preset not found", "preset_not_found");
}

/** page et limit validés, avec un maximum (bonne pratique du TP). */
export function pagination(query) {
  const page = Math.max(1, Math.trunc(Number(query.page)) || 1);
  const limit = Math.min(50, Math.max(1, Math.trunc(Number(query.limit)) || 12));
  return { page, limit, skip: (page - 1) * limit };
}

/** Échappe une saisie utilisateur avant de l'utiliser dans une expression régulière MongoDB. */
export function escapeRegex(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** Le rack doit contenir des références, jamais le modèle ou l'IR eux-mêmes. */
function assertDehydrated(rack) {
  for (const entry of rackEntries(rack)) {
    if (entry.state?.model?.data !== undefined || entry.state?.ir?.samples !== undefined) {
      throw new HttpError(400, "The amp model or IR must be uploaded as an asset (/api/assets), not embedded in the preset", "preset_embedded_asset");
    }
  }
  const refs = collectAssetRefs(rack);
  for (const ref of refs) {
    const valid = ref?.source === "factory"
      ? typeof ref.id === "string" && ref.id.startsWith("factory:") && ref.id.length < 500
      : ref?.source === "store" && HASH_PATTERN.test(ref.hash);
    if (!valid || !ASSET_KINDS.includes(ref.kind)) throw new HttpError(400, "Invalid asset reference", "preset_invalid_asset_ref");
  }
  return [...new Set(refs.filter((ref) => ref.source === "store").map((ref) => ref.hash))];
}

/** Résumé envoyé par le client : on ne garde que des chaînes courtes, sinon on le recalcule. */
function cleanSummary(summary, rack) {
  if (!summary || typeof summary !== "object") return summarize(rack);
  const item = (entry) => ({ kind: text(entry?.kind, 10), name: text(entry?.name, 100), bypass: Boolean(entry?.bypass) });
  const list = (value) => (Array.isArray(value) ? value.slice(0, 50).map(item) : []);
  return {
    chains: summary.chains === 2 ? 2 : 1,
    amp: summary.amp ? text(summary.amp, 100) : null,
    cabinet: summary.cabinet ? text(summary.cabinet, 100) : null,
    effects: Array.isArray(summary.effects) ? summary.effects.slice(0, 50).map((name) => text(name, 100)) : [],
    chainA: list(summary.chainA),
    chainB: list(summary.chainB),
  };
}

/**
 * Valide le corps d'une création ou d'une mise à jour de preset.
 * `partial` = mise à jour : seuls les champs présents sont validés et renvoyés.
 * Chaque champ est validé avec LA fonction partagée de l'hôte (PresetFormat.js).
 */
export function presetInput(body = {}, { partial = false } = {}) {
  const wanted = (key) => !partial || Object.prototype.hasOwnProperty.call(body, key);
  const output = {};
  try {
    if (body.format !== undefined && body.format !== PRESET_FORMAT) throw new PresetError("Not a NAM A2 preset");
    if (body.version !== undefined && !(Number.isInteger(body.version) && body.version >= 1 && body.version <= PRESET_VERSION)) {
      throw new PresetError(`Unsupported preset version (this server reads up to version ${PRESET_VERSION})`);
    }
    if (wanted("name")) output.name = normalizeName(body.name);
    if (wanted("description")) output.description = normalizeDescription(body.description);
    if (wanted("tags")) output.tags = normalizeTags(body.tags ?? []);
    if (wanted("rack")) {
      const rack = portableRack(validateRack(body.rack));
      const size = Buffer.byteLength(JSON.stringify(rack));
      if (size > MAX_RACK_BYTES) throw new HttpError(413, "Preset too large: amp models and IRs must be uploaded as assets", "preset_too_large");
      Object.assign(output, { rack, size, assetHashes: assertDehydrated(rack), summary: cleanSummary(body.summary, rack), format: PRESET_FORMAT, version: body.version ?? PRESET_VERSION });
    }
  } catch (error) {
    // detailCode / detailParams : le client affiche le détail dans sa langue (errors.preset.<code>).
    if (error instanceof PresetError) throw new HttpError(400, error.message, "preset_invalid", { detail: error.message, ...(error.code ? { detailCode: error.code, detailParams: error.params } : {}) });
    throw error;
  }
  if (wanted("visibility")) {
    const visibility = body.visibility ?? "private";
    if (!["private", "public"].includes(visibility)) throw new HttpError(400, "Visibility must be private or public", "preset_invalid_visibility");
    output.visibility = visibility;
  }
  return output;
}
