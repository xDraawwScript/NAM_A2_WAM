// Stockage des presets sur le compte de l'utilisateur, via l'API server/ (mission 4).
//
// C'est un « adaptateur » : il a exactement les mêmes méthodes que IndexedDbPresetStorage
// (list, get, save, update, rename, delete, putAsset, getAsset). PresetManager ne fait donc pas
// la différence entre « ce navigateur » et « mon compte » : seul l'objet de stockage change.
//
//   save   : POST /api/presets                 (le serveur attribue l'identifiant)
//   assets : HEAD /api/assets/:hash, puis PUT seulement s'il manque (pas de renvoi inutile)
//   get    : GET  /api/presets/:id → validé avec les mêmes règles que le navigateur
// Les assets lus sont mis en cache : d'abord en mémoire, puis dans l'IndexedDB locale si elle est
// fournie (`cache`), pour ne pas retélécharger 300 Ko à chaque chargement du même modèle.

import {validatePreset, presetMetadata, PresetError} from './PresetFormat.js';
import {encodeAsset, decodeAsset} from './PresetFile.js';
import {ASSET_KINDS} from './PresetAssets.js';

const MAX_PAGES = 20; // 20 × 50 presets : largement assez pour un compte d'étudiant
const MEMORY_LIMIT = 16; // assets gardés en mémoire (~300 Ko chacun), les plus anciens sont oubliés

/** Préset au format de l'hôte à partir de la réponse de l'API (qui ajoute auteur et visibilité). */
export function fromApi(item) {
  const {id, name, description, tags, summary, createdAt, updatedAt, format, version, rack, visibility, author, copiedFrom} = item;
  const preset = validatePreset({format, version, id, name, description, tags, summary, createdAt, updatedAt, rack});
  return {...preset, visibility, author, copiedFrom};
}

/** Métadonnées d'une carte de liste (pas de rack). */
export function cardFromApi(item) {
  const {id, name, description, tags, summary, createdAt, updatedAt, visibility, author, copiedFrom, size} = item;
  return {id, name, description, tags, summary, createdAt, updatedAt, visibility, author, copiedFrom, size};
}

export class RemotePresetStorage {
  /** `readOnly: true` pour le catalogue public (onglet Explore) : on lit et on copie, sans écrire. */
  constructor({api, cache = null, readOnly = false}) {
    Object.assign(this, {api, cache, readOnly});
    this.assetMemory = new Map(); // hash → asset, du plus ancien au plus récent
    this.onServer = new Set();    // hashes déjà présents sur le serveur pour CE compte
  }

  /**
   * Oublie tout ce qui concerne le compte précédent (appelé à chaque connexion/déconnexion) :
   * un autre utilisateur du même onglet ne doit jamais lire les assets privés du précédent.
   */
  clear() {
    this.assetMemory.clear();
    this.onServer.clear();
  }

  remember(asset) {
    this.assetMemory.delete(asset.hash);
    this.assetMemory.set(asset.hash, asset);
    while (this.assetMemory.size > MEMORY_LIMIT) this.assetMemory.delete(this.assetMemory.keys().next().value);
    return asset;
  }

  /** Tous mes presets (toutes les pages), du plus récemment modifié au plus ancien. */
  async list() {
    const items = [];
    for (let page = 1; page <= MAX_PAGES; page++) {
      const result = await this.api.request(`/presets/mine?page=${page}&limit=50`, {auth: true});
      items.push(...result.items.map(cardFromApi));
      if (page >= result.pages) break;
    }
    return items;
  }

  async get(id) {
    try {
      return fromApi(await this.api.request(`/presets/${encodeURIComponent(id)}`));
    } catch (error) {
      if (error.status === 404) return null;
      throw error;
    }
  }

  /** Crée le preset sur le compte. L'identifiant local éventuel est ignoré : le serveur en donne un. */
  async save(preset, {visibility = 'private'} = {}) {
    const {format, version, name, description, tags, summary, rack} = validatePreset(preset);
    const created = await this.api.request('/presets', {method: 'POST', auth: true, body: {format, version, name, description, tags, summary, rack, visibility}});
    return presetMetadata(fromApi(created));
  }

  /** Modifie nom, description, tags, visibilité et/ou le son (rack + résumé). */
  async update(id, changes = {}) {
    const body = {};
    for (const key of ['name', 'description', 'tags', 'visibility', 'rack', 'summary']) if (key in changes) body[key] = changes[key];
    const updated = await this.api.request(`/presets/${encodeURIComponent(id)}`, {method: 'PUT', auth: true, body});
    return presetMetadata(fromApi(updated));
  }

  /**
   * Presets publics de tous les utilisateurs (mission 5), du plus récent au plus ancien.
   * `q` cherche dans le nom, les tags, l'ampli, le cabinet, les pédales et le pseudo de l'auteur.
   * Accessible sans compte. Retourne {items, page, pages, total}.
   */
  async listPublic({q = '', page = 1, limit = 12} = {}) {
    const params = new URLSearchParams({page: String(page), limit: String(limit)});
    if (q.trim()) params.set('q', q.trim().slice(0, 60));
    const result = await this.api.request(`/presets/public?${params}`);
    return {...result, items: result.items.map(cardFromApi)};
  }

  /** Copie un preset public dans MES presets (privé) : POST /api/presets/:id/copy. */
  async copyFrom(id) {
    const copy = await this.api.request(`/presets/${encodeURIComponent(id)}/copy`, {method: 'POST', auth: true});
    return presetMetadata(fromApi(copy));
  }

  /** Le serveur supprime lui-même les assets devenus inutiles. */
  async delete(id) {
    await this.api.request(`/presets/${encodeURIComponent(id)}`, {method: 'DELETE', auth: true});
    return [];
  }

  /** Envoie un asset seulement s'il n'est pas déjà sur le serveur (même hash = même contenu). */
  async putAsset(asset) {
    if (!asset?.hash || !ASSET_KINDS.includes(asset.kind)) throw new PresetError('Invalid asset', 'invalidAsset');
    if (this.onServer.has(asset.hash)) return false; // déjà confirmé pendant cette session
    try {
      await this.api.request(`/assets/${asset.hash}`, {method: 'HEAD', auth: true});
      this.onServer.add(asset.hash);
      return false; // déjà présent et utilisable
    } catch (error) {
      if (error.status !== 404) throw error;
    }
    await this.api.request(`/assets/${asset.hash}`, {method: 'PUT', auth: true, body: encodeAsset(asset)});
    this.onServer.add(asset.hash);
    this.remember(asset);
    return true;
  }

  /** Lit un asset : mémoire → cache IndexedDB local → serveur. Retourne null s'il est introuvable. */
  async getAsset(hash) {
    if (this.assetMemory.has(hash)) return this.assetMemory.get(hash);
    const cached = await this.cache?.getAsset(hash).catch(() => null);
    if (cached) return this.remember(cached);
    try {
      return this.remember(decodeAsset(await this.api.request(`/assets/${hash}`)));
    } catch (error) {
      if (error.status === 404) return null;
      throw error;
    }
  }
}
