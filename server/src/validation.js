import mongoose from "mongoose";
import {
  PRESET_FORMAT,
  PRESET_VERSION,
  validatePreset,
  summarize,
  rackEntries,
} from "../../examples/wam/presets/PresetFormat.js";
import { collectAssetRefs } from "../../examples/wam/presets/PresetAssets.js";
import { HttpError } from "./auth.js";

/*
 * Validation des données envoyées par le navigateur (« ne jamais faire confiance au client »).
 * Le format d'un preset est défini UNE seule fois, dans l'hôte (PresetFormat.js) : le serveur
 * réutilise exactement les mêmes règles que le navigateur.
 */

export const MAX_RACK_BYTES = 256 * 1024; // un rack déshydraté pèse ~15 Ko
export const HASH_PATTERN = /^[a-f0-9]{64}$/;

const text = (value, max) => String(value ?? "").trim().slice(0, max);

/** Vérifie un identifiant MongoDB avant toute requête (sinon CastError). */
export function assertObjectId(id, message = "Preset not found") {
  if (!mongoose.isValidObjectId(id)) throw new HttpError(404, message);
}

/** page et limit validés, avec un maximum (bonne pratique du TP). */
export function pagination(query, defaultLimit = 12) {
  const page = Math.max(1, Math.trunc(Number(query.page)) || 1);
  const limit = Math.min(50, Math.max(1, Math.trunc(Number(query.limit)) || defaultLimit));
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
      throw new HttpError(400, "The amp model or IR must be uploaded as an asset (/api/assets), not embedded in the preset");
    }
  }
  const refs = collectAssetRefs(rack);
  for (const ref of refs) {
    const valid = ref?.source === "factory"
      ? typeof ref.id === "string" && ref.id.startsWith("factory:") && ref.id.length < 500
      : ref?.source === "store" && HASH_PATTERN.test(ref.hash);
    if (!valid || !["nam", "ir"].includes(ref.kind)) throw new HttpError(400, "Invalid asset reference");
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
 */
export function presetInput(body = {}, { partial = false } = {}) {
  const has = (key) => Object.prototype.hasOwnProperty.call(body, key);
  const output = {};
  if (!partial || has("name") || has("tags") || has("description") || has("rack")) {
    // On réutilise validatePreset de l'hôte sur un preset « reconstitué ».
    const candidate = {
      format: body.format ?? PRESET_FORMAT,
      version: body.version ?? PRESET_VERSION,
      id: "server",
      name: has("name") || !partial ? body.name : "placeholder",
      description: body.description ?? "",
      tags: body.tags ?? [],
      rack: has("rack") || !partial ? body.rack : { version: 2, a: { version: 1, entries: [] } },
    };
    let valid;
    try {
      valid = validatePreset(candidate);
    } catch (error) {
      throw new HttpError(400, error.message);
    }
    if (valid.description.length > 500) throw new HttpError(400, "Description is limited to 500 characters");
    if (!partial || has("name")) output.name = valid.name;
    if (!partial || has("description")) output.description = valid.description;
    if (!partial || has("tags")) output.tags = valid.tags;
    if (!partial || has("rack")) {
      const size = Buffer.byteLength(JSON.stringify(valid.rack));
      if (size > MAX_RACK_BYTES) throw new HttpError(413, "Preset too large: amp models and IRs must be uploaded as assets");
      output.assetHashes = assertDehydrated(valid.rack);
      output.rack = valid.rack;
      output.summary = cleanSummary(body.summary, valid.rack);
      output.size = size;
      output.format = PRESET_FORMAT;
      output.version = valid.version;
    }
  }
  if (!partial || has("visibility")) {
    const visibility = body.visibility ?? "private";
    if (!["private", "public"].includes(visibility)) throw new HttpError(400, "Visibility must be private or public");
    output.visibility = visibility;
  }
  return output;
}
