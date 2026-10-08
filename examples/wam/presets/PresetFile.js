// Export / import d'un preset dans un fichier .json autonome (mission 1).
//
// Le stockage du navigateur est propre à ce navigateur et peut être effacé : l'export sert de
// sauvegarde et permet de passer un preset d'une machine à une autre (spec §7.2).
// Le fichier contient le preset + les assets externes qu'il référence (les assets d'usine sont
// déjà livrés avec l'appli, inutile de les recopier). À l'import, chaque asset est vérifié :
// son hash recalculé doit correspondre, sinon le fichier est refusé (fichier corrompu ou modifié).

import {validatePreset, PresetError} from './PresetFormat.js';
import {collectAssetRefs, sha256Hex, irSamplesHash} from './PresetAssets.js';

export const FILE_FORMAT = 'nam-a2-preset-file';
export const FILE_VERSION = 1;

/** Float32Array → base64 (octets bruts), par morceaux pour ne pas saturer la pile. */
export function floatsToBase64(samples) {
  const bytes = new Uint8Array(Float32Array.from(samples).buffer);
  let binary = '';
  for (let i = 0; i < bytes.length; i += 0x8000) binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(binary);
}

export function base64ToFloats(text) {
  const binary = atob(String(text));
  if (binary.length % 4) throw new PresetError('Invalid impulse response data');
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return new Float32Array(bytes.buffer);
}

/** Nom de fichier sûr à partir du nom du preset. */
export function presetFileName(preset) {
  const base = String(preset?.name || 'preset').normalize('NFKD').replace(/[^\w\- ]+/gu, '').trim().replace(/\s+/gu, '-').slice(0, 60) || 'preset';
  return `${base}.nam-preset.json`;
}

/**
 * Construit le contenu du fichier. `loadAsset(hash)` lit un asset du magasin local.
 * Retourne {text, warnings} (un asset manquant est signalé mais n'empêche pas l'export).
 */
export async function exportPresetFile(preset, {loadAsset, now = new Date()}) {
  const valid = validatePreset(preset);
  const assets = [];
  const warnings = [];
  const seen = new Set();
  for (const ref of collectAssetRefs(valid.rack)) {
    if (ref.source !== 'store' || seen.has(ref.hash)) continue;
    seen.add(ref.hash);
    const asset = await loadAsset(ref.hash);
    if (!asset) { warnings.push(`Asset ${ref.hash.slice(0, 12)}… is missing and was not exported.`); continue; }
    assets.push(asset.kind === 'nam'
      ? {hash: asset.hash, kind: 'nam', name: asset.name, data: asset.data}
      : {hash: asset.hash, kind: 'ir', name: asset.name, samples: floatsToBase64(asset.samples)});
  }
  const file = {format: FILE_FORMAT, version: FILE_VERSION, exportedAt: now.toISOString(), preset: valid, assets};
  return {text: JSON.stringify(file), warnings};
}

/**
 * Lit et vérifie un fichier exporté. Le preset importé reçoit un nouvel identifiant (c'est une
 * copie) et la date d'import. Retourne {preset, assets} prêts à être enregistrés.
 */
export async function importPresetFile(text, {now = new Date(), newId = () => crypto.randomUUID()} = {}) {
  let file;
  try { file = JSON.parse(text); } catch { throw new PresetError('The file is not valid JSON'); }
  if (file?.format !== FILE_FORMAT) throw new PresetError('Not a NAM A2 preset file');
  if (!Number.isInteger(file.version) || file.version > FILE_VERSION) throw new PresetError('Unsupported preset file version');
  const preset = validatePreset(file.preset);
  const assets = [];
  for (const item of Array.isArray(file.assets) ? file.assets : []) {
    if (item?.kind === 'nam') {
      if (typeof item.data !== 'string' || await sha256Hex(item.data) !== item.hash) throw new PresetError(`Amp model "${item.name}" is corrupted (hash mismatch)`);
      assets.push({hash: item.hash, kind: 'nam', name: String(item.name || 'model.nam'), data: item.data});
    } else if (item?.kind === 'ir') {
      const samples = base64ToFloats(item.samples);
      if (await irSamplesHash(samples) !== item.hash) throw new PresetError(`Cabinet IR "${item.name}" is corrupted (hash mismatch)`);
      assets.push({hash: item.hash, kind: 'ir', name: String(item.name || 'cabinet.wav'), samples});
    } else throw new PresetError('Unknown asset in preset file');
  }
  const provided = new Set(assets.map((asset) => asset.hash));
  const missing = collectAssetRefs(preset.rack).filter((ref) => ref.source === 'store' && !provided.has(ref.hash));
  const timestamp = now.toISOString();
  return {preset: {...preset, id: newId(), createdAt: timestamp, updatedAt: timestamp}, assets, missing};
}
