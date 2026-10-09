// Format d'un preset utilisateur (mission 1) — fonctions pures, sans DOM ni réseau,
// donc testables avec `node --test` (tests/phase5/preset-format.test.mjs).
//
// Un preset = l'état complet du rack (FxRack.getState(), chaînes A et B + routage) dans lequel
// les gros contenus (modèle .nam, échantillons d'IR) ont été remplacés par des références
// (`assetRef`, voir PresetAssets.js). Conforme à SPECIFICATION_FX_CHAIN.md §7.2 : format
// versionné, migration, pas de token ni d'identifiant de carte son, pas de gain d'entrée.

export const PRESET_FORMAT = 'nam-a2-preset';
export const PRESET_VERSION = 1;
export const NAME_MAX = 80;
export const DESCRIPTION_MAX = 500;
export const TAGS_MAX = 10;
export const TAG_MAX = 24;

export class PresetError extends Error {
  constructor(message) { super(message); this.name = 'PresetError'; }
}

const clean = (value) => String(value ?? '').trim();

export function normalizeName(name) {
  const value = clean(name).replace(/\s+/gu, ' ');
  if (!value) throw new PresetError('Preset name is required');
  if (value.length > NAME_MAX) throw new PresetError(`Preset name is limited to ${NAME_MAX} characters`);
  return value;
}

export function normalizeDescription(description = '') {
  const value = clean(description);
  if (value.length > DESCRIPTION_MAX) throw new PresetError(`Description is limited to ${DESCRIPTION_MAX} characters`);
  return value;
}

export function normalizeTags(tags = []) {
  if (!Array.isArray(tags)) throw new PresetError('Tags must be a list');
  const unique = [...new Set(tags.map((tag) => clean(tag).toLocaleLowerCase('en-US').replace(/\s+/gu, ' ')).filter(Boolean))];
  if (unique.length > TAGS_MAX) throw new PresetError(`A preset has at most ${TAGS_MAX} tags`);
  if (unique.some((tag) => tag.length > TAG_MAX)) throw new PresetError(`A tag is limited to ${TAG_MAX} characters`);
  return unique;
}

/** Liste des entrées (plugins) des deux chaînes du rack. */
export function rackEntries(rack) {
  return [...(rack?.a?.entries || []), ...(rack?.b?.entries || [])];
}

/**
 * Retire du state du rack ce qui ne doit pas voyager dans un preset :
 *  - le gain d'entrée (`sourceTrim`), qui dépend de la guitare / carte son et non du son ;
 *  - l'URI des modules NAM et Cabinet, qui dépend de l'endroit d'où l'appli est servie
 *    (« ../plugins/nam-wam/… » dans la dist, « ../../../src/nam-wam/… » en mode source). Sans elle,
 *    l'hôte retrouve ces modules par leur rôle dans le catalogue, quel que soit le mode.
 */
export function portableRack(rack) {
  const copy = structuredClone(rack);
  delete copy.sourceTrim;
  for (const entry of rackEntries(copy)) if (entry.kind !== 'effect') delete entry.pluginUri;
  return copy;
}

/** Vérifie la forme du state du rack (FxRack v2 / FxChain v1) sans dépendre de l'audio. */
export function validateRack(rack) {
  if (!rack || rack.version !== 2) throw new PresetError('Unsupported rack state version');
  if (!rack.a || rack.a.version !== 1 || !Array.isArray(rack.a.entries)) throw new PresetError('Chain A is missing or invalid');
  if (rack.b && (rack.b.version !== 1 || !Array.isArray(rack.b.entries))) throw new PresetError('Chain B is invalid');
  const ids = new Set();
  for (const entry of rackEntries(rack)) {
    if (!entry?.id || !['nam', 'cabinet', 'effect'].includes(entry.kind)) throw new PresetError('Invalid plugin entry');
    if (ids.has(entry.id)) throw new PresetError('Duplicate plugin entry ID');
    ids.add(entry.id);
  }
  return rack;
}

/** Nom lisible d'un plugin à partir de son URI de catalogue (« ./BigMuff/index.js » → « BigMuff »). */
export function pluginNameFromUri(uri, kind = 'effect') {
  if (kind === 'nam') return 'NAM amp';
  if (kind === 'cabinet') return 'Cabinet';
  const parts = clean(uri).split(/[\\/]/u).filter((part) => part && part !== '.' && !/\.m?js$/u.test(part) && part !== 'plugin');
  return parts.at(-1) || 'Effect';
}

/**
 * Résumé affichable / cherchable d'un preset : ampli, IR, pédales dans l'ordre du signal.
 * `nameForUri` (optionnel) traduit une URI de plugin en nom du catalogue.
 */
export function summarize(rack, nameForUri = null) {
  const summarizeChain = (chain) => (chain?.entries || []).map((entry) => {
    // Les assets d'usine ont un titre lisible (« Bogner Uberschall… ») dans leur provenance ;
    // sinon on prend le nom du fichier sans extension.
    if (entry.kind === 'nam') return {kind: 'nam', name: clean(entry.state?.model?.provenance?.title) || entry.state?.model?.name?.replace(/\.nam$/iu, '') || 'NAM amp', bypass: Boolean(entry.bypass)};
    if (entry.kind === 'cabinet') return {kind: 'cabinet', name: clean(entry.state?.ir?.metadata?.title) || entry.state?.ir?.name?.replace(/\.wav$/iu, '') || 'Cabinet', bypass: Boolean(entry.bypass)};
    return {kind: 'effect', name: nameForUri?.(entry.pluginUri) || pluginNameFromUri(entry.pluginUri), bypass: Boolean(entry.bypass)};
  });
  const a = summarizeChain(rack?.a);
  const b = rack?.visible && rack?.b ? summarizeChain(rack.b) : [];
  const all = [...a, ...b];
  return {
    chains: b.length ? 2 : 1,
    amp: all.find((item) => item.kind === 'nam')?.name || null,
    cabinet: all.find((item) => item.kind === 'cabinet')?.name || null,
    effects: all.filter((item) => item.kind === 'effect').map((item) => item.name),
    chainA: a,
    chainB: b,
  };
}

/**
 * Crée un preset à partir d'un state de rack déjà « déshydraté » (références d'assets).
 * `now` et `id` sont injectables pour les tests.
 */
export function createPreset({rack, name, description = '', tags = [], nameForUri = null, id = crypto.randomUUID(), now = new Date()}) {
  const portable = validateRack(portableRack(rack));
  const timestamp = now.toISOString();
  return {
    format: PRESET_FORMAT,
    version: PRESET_VERSION,
    id,
    name: normalizeName(name),
    description: normalizeDescription(description),
    tags: normalizeTags(tags),
    createdAt: timestamp,
    updatedAt: timestamp,
    summary: summarize(portable, nameForUri),
    rack: portable,
  };
}

/**
 * Migration des anciennes versions du format. Aujourd'hui il n'existe que la v1 ; la fonction
 * est le point d'entrée unique pour les futures évolutions (v1 → v2…).
 */
export function migratePreset(preset) {
  const copy = structuredClone(preset);
  if (copy.version > PRESET_VERSION) throw new PresetError(`Preset version ${copy.version} is newer than this app (max ${PRESET_VERSION})`);
  // Exemple de migration future : if (copy.version === 1) { ...; copy.version = 2; }
  return copy;
}

/** Valide (et migre si besoin) un objet reçu d'IndexedDB, d'un fichier ou de l'API. */
export function validatePreset(value) {
  if (!value || typeof value !== 'object') throw new PresetError('Not a preset');
  if (value.format !== PRESET_FORMAT) throw new PresetError('Not a NAM A2 preset');
  if (!Number.isInteger(value.version) || value.version < 1) throw new PresetError('Invalid preset version');
  const preset = migratePreset(value);
  if (!clean(preset.id)) throw new PresetError('Preset ID is missing');
  preset.name = normalizeName(preset.name);
  preset.description = normalizeDescription(preset.description);
  preset.tags = normalizeTags(preset.tags || []);
  validateRack(preset.rack);
  preset.rack = portableRack(preset.rack); // aussi pour les presets enregistrés avant cette règle
  return preset;
}

/**
 * Empreinte du « son » d'un rack, pour savoir s'il a changé depuis le dernier enregistrement.
 * On ignore les gros contenus (texte du modèle, échantillons d'IR, références d'assets) et le gain
 * d'entrée : un rack hydraté et sa version déshydratée ont donc la même empreinte.
 */
export function rackFingerprint(rack) {
  return JSON.stringify(rack, (key, value) => (['data', 'samples', 'assetRef', 'sourceTrim'].includes(key) ? undefined : value));
}

/** Métadonnées sans le state du rack (pour les listes). */
export function presetMetadata(preset) {
  const {rack, ...metadata} = preset;
  return structuredClone(metadata);
}
