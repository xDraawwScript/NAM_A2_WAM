// Modèles .nam et IR adressés par leur hash (mission 1).
//
// Pourquoi : le state d'un plugin NAM contient le texte complet du modèle (~300 Ko) et celui du
// Cabinet les échantillons de l'IR (jusqu'à ~500 Ko en JSON). Recopier ces données dans chaque
// preset serait lourd et dupliqué. On les remplace par une référence `assetRef` :
//   - asset d'usine (livré dans la dist) : {source:'factory', kind, id, contentHash}
//     → rechargé depuis src/nam-wam/models/ ou src/cabinet-wam/IRs/ grâce aux manifestes ;
//   - asset externe (fichier importé, TONE3000…) : {source:'store', kind, hash}
//     → stocké une seule fois dans un magasin d'assets (IndexedDB, puis backend).
// « Déshydrater » = remplacer les données par des références ; « hydrater » = l'inverse, juste
// avant `rack.setState()`. Les plugins ne sont jamais modifiés : on ne manipule que leurs states.

import {rackEntries} from './PresetFormat.js';

const toHex = (buffer) => Array.from(new Uint8Array(buffer), (byte) => byte.toString(16).padStart(2, '0')).join('');

/** SHA-256 en hexadécimal d'un texte, d'un ArrayBuffer ou d'un tableau typé (Web Crypto). */
export async function sha256Hex(data) {
  const bytes = typeof data === 'string' ? new TextEncoder().encode(data)
    : ArrayBuffer.isView(data) ? new Uint8Array(data.buffer, data.byteOffset, data.byteLength) : new Uint8Array(data);
  return toHex(await crypto.subtle.digest('SHA-256', bytes));
}

/** Hash des échantillons d'une IR (Float32, ordre des octets little-endian du navigateur). */
export const irSamplesHash = (samples) => sha256Hex(Float32Array.from(samples));

/** Même construction d'URL que src/shared/assetBrowser.js (factoryAssetUrl), sans l'importer. */
export function factoryAssetUrl(manifestUrl, directory, relativePath) {
  const segments = String(relativePath || '').replaceAll('\\', '/').split('/');
  if (!segments.length || segments.some((segment) => !segment || segment === '.' || segment === '..')) throw new Error(`Invalid factory asset path: ${relativePath}`);
  return new URL(`${encodeURIComponent(directory)}/${segments.map(encodeURIComponent).join('/')}`, manifestUrl);
}

/**
 * Accès en lecture seule aux modèles et IR d'usine décrits par les manifestes des plugins
 * (`models-manifest.json`, `irs-manifest.json`), qui contiennent un `contentHash` par fichier.
 */
export class FactoryAssets {
  constructor({namManifestUrl, irManifestUrl, fetch = globalThis.fetch?.bind(globalThis), decodeAudio}) {
    Object.assign(this, {namManifestUrl: String(namManifestUrl), irManifestUrl: String(irManifestUrl), fetch, decodeAudio});
    this.manifests = new Map();
  }

  /**
   * Les manifestes sont à côté du descriptor.json de chaque plugin, en source comme dans la dist :
   * on part donc de l'URL du descripteur exposée par l'instance WAM (lecture seule).
   */
  static fromPlugins({namPlugin, cabinetPlugin, context, fetch}) {
    return new FactoryAssets({
      namManifestUrl: new URL('models-manifest.json', namPlugin._descriptorUrl),
      irManifestUrl: new URL('irs-manifest.json', cabinetPlugin._descriptorUrl),
      fetch,
      decodeAudio: (buffer) => context.decodeAudioData(buffer),
    });
  }

  manifestUrl(kind) { return kind === 'nam' ? this.namManifestUrl : this.irManifestUrl; }

  async assets(kind) {
    if (!this.manifests.has(kind)) {
      const promise = this.fetch(this.manifestUrl(kind)).then(async (response) => {
        if (!response.ok) throw new Error(`Factory ${kind} manifest: HTTP ${response.status}`);
        return (await response.json()).assets || [];
      });
      this.manifests.set(kind, promise);
      promise.catch(() => this.manifests.delete(kind));
    }
    return this.manifests.get(kind);
  }

  async findNamByHash(hash) { return hash ? (await this.assets('nam')).find((asset) => asset.contentHash === hash) || null : null; }
  async findIrById(id) { return id ? (await this.assets('ir')).find((asset) => asset.id === id) || null : null; }
  async findById(kind, id) { return (await this.assets(kind)).find((asset) => asset.id === id) || null; }

  async fetchAsset(kind, id) {
    const asset = await this.findById(kind, id);
    if (!asset) throw new Error('not found in the factory library');
    const response = await this.fetch(factoryAssetUrl(this.manifestUrl(kind), kind === 'nam' ? 'models' : 'IRs', asset.relativePath));
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return response;
  }

  async loadNamText(id) { return (await this.fetchAsset('nam', id)).text(); }

  async loadIrSamples(id) {
    if (!this.decodeAudio) throw new Error('no audio decoder available');
    const audio = await this.decodeAudio(await (await this.fetchAsset('ir', id)).arrayBuffer());
    return new Float32Array(audio.getChannelData(0));
  }
}

/** Toutes les références d'assets présentes dans un state de rack (déjà déshydraté). */
export function collectAssetRefs(rack) {
  const refs = [];
  for (const entry of rackEntries(rack)) {
    if (entry.state?.model?.assetRef) refs.push(entry.state.model.assetRef);
    if (entry.state?.ir?.assetRef) refs.push(entry.state.ir.assetRef);
  }
  return refs;
}

/** Hashs des assets « store » utilisés par une liste de presets (pour ne pas supprimer un asset partagé). */
export function referencedStoreHashes(presets) {
  const hashes = new Set();
  for (const preset of presets) for (const ref of collectAssetRefs(preset.rack)) if (ref.source === 'store') hashes.add(ref.hash);
  return hashes;
}

/**
 * Remplace les modèles et IR du state du rack par des références.
 * `saveAsset({hash, kind, name, data|samples})` enregistre un asset externe (une seule fois).
 * Retourne {rack, refs}. Le state d'origine n'est pas modifié (copie).
 */
export async function dehydrateRack(rack, {factory = null, saveAsset}) {
  const copy = structuredClone(rack);
  const refs = [];
  for (const entry of rackEntries(copy)) {
    const state = entry.state;
    if (!state || typeof state !== 'object') continue;

    if (typeof state.model?.data === 'string') {
      const {data, ...model} = state.model;
      const hash = model.contentHash || await sha256Hex(data);
      const factoryAsset = await factory?.findNamByHash(hash).catch(() => null);
      let ref;
      if (factoryAsset) ref = {source: 'factory', kind: 'nam', id: factoryAsset.id, contentHash: hash};
      else {
        await saveAsset({hash, kind: 'nam', name: model.name || 'model.nam', data});
        ref = {source: 'store', kind: 'nam', hash};
      }
      state.model = {...model, contentHash: hash, assetRef: ref};
      refs.push(ref);
    } else if (state.model?.assetRef) refs.push(state.model.assetRef);

    if (Array.isArray(state.ir?.samples) || ArrayBuffer.isView(state.ir?.samples)) {
      const {samples, ...ir} = state.ir;
      const factoryAsset = String(ir.id || '').startsWith('factory:') ? await factory?.findIrById(ir.id).catch(() => null) : null;
      let ref;
      if (factoryAsset) ref = {source: 'factory', kind: 'ir', id: factoryAsset.id, contentHash: factoryAsset.contentHash};
      else {
        const floats = Float32Array.from(samples);
        const hash = await irSamplesHash(floats);
        await saveAsset({hash, kind: 'ir', name: ir.name || 'cabinet.wav', samples: floats});
        ref = {source: 'store', kind: 'ir', hash};
      }
      state.ir = {...ir, assetRef: ref};
      refs.push(ref);
    } else if (state.ir?.assetRef) refs.push(state.ir.assetRef);
  }
  return {rack: copy, refs};
}

/**
 * Inverse de dehydrateRack : remet le texte du modèle et les échantillons de l'IR dans les states,
 * pour que `rack.setState()` (et donc `setState()` de chaque plugin) les recharge.
 * `loadAsset(hash)` lit un asset externe. Un asset introuvable n'empêche pas le chargement : il
 * est signalé dans `warnings` et le plugin garde son modèle/IR actuel (spec §7.2 : diagnostic et
 * restauration récupérable).
 */
export async function hydrateRack(rack, {factory = null, loadAsset}) {
  const copy = structuredClone(rack);
  const warnings = [];
  for (const entry of rackEntries(copy)) {
    const state = entry.state;
    if (state?.model?.assetRef) {
      const {assetRef, ...model} = state.model;
      try {
        const data = assetRef.source === 'factory' ? await requireFactory(factory).loadNamText(assetRef.id) : (await requireAsset(loadAsset, assetRef.hash)).data;
        if (typeof data !== 'string') throw new Error('invalid model data');
        state.model = {...model, data};
      } catch (error) {
        delete state.model;
        warnings.push(`Amp model "${model.name || assetRef.id || assetRef.hash}" unavailable (${error.message}); the current model was kept.`);
      }
    }
    if (state?.ir?.assetRef) {
      const {assetRef, ...ir} = state.ir;
      try {
        const samples = assetRef.source === 'factory' ? await requireFactory(factory).loadIrSamples(assetRef.id) : (await requireAsset(loadAsset, assetRef.hash)).samples;
        if (!samples?.length) throw new Error('invalid impulse response');
        state.ir = {...ir, samples: Array.from(samples)};
      } catch (error) {
        delete state.ir;
        warnings.push(`Cabinet IR "${ir.name || assetRef.id || assetRef.hash}" unavailable (${error.message}); the current IR was kept.`);
      }
    }
  }
  return {rack: copy, warnings};
}

function requireFactory(factory) {
  if (!factory) throw new Error('factory library unavailable');
  return factory;
}

async function requireAsset(loadAsset, hash) {
  const asset = await loadAsset(hash);
  if (!asset) throw new Error('not found in this browser');
  return asset;
}
