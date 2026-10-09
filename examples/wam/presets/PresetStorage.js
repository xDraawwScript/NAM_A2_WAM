// Stockage local des presets dans IndexedDB (mission 1).
//
// Pourquoi IndexedDB et pas localStorage : localStorage est limité (~5 Mo), synchrone et ne
// stocke que du texte. IndexedDB stocke des objets structurés (dont des Float32Array pour les IR)
// sur plusieurs centaines de Mo. C'est aussi ce que demande la spec du prof (§7.2).
//
// Cette classe est un « adaptateur » : le backend (mission 4) exposera les mêmes méthodes
// (list, get, save, update, delete, putAsset, getAsset), et PresetManager ne fera pas la
// différence.
//
// Base « nam-a2-wam-presets », deux object stores :
//   presets : un preset complet par clé `id`
//   assets  : modèles .nam et IR externes, par clé `hash` (SHA-256), partagés entre presets

import {validatePreset, presetMetadata, normalizeName, normalizeDescription, normalizeTags, PresetError} from './PresetFormat.js';
import {referencedStoreHashes, ASSET_KINDS} from './PresetAssets.js';

const DB_VERSION = 1;

const promisify = (request) => new Promise((resolve, reject) => {
  request.onsuccess = () => resolve(request.result);
  request.onerror = () => reject(request.error);
});

export class IndexedDbPresetStorage {
  constructor({indexedDB = globalThis.indexedDB, name = 'nam-a2-wam-presets', now = () => new Date()} = {}) {
    Object.assign(this, {indexedDB, name, now});
    this.dbPromise = null;
  }

  open() {
    if (!this.indexedDB) return Promise.reject(new Error('IndexedDB is not available in this browser'));
    this.dbPromise ||= new Promise((resolve, reject) => {
      const request = this.indexedDB.open(this.name, DB_VERSION);
      // Appelé à la création de la base (ou à un changement de DB_VERSION) : on crée les stores.
      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains('presets')) db.createObjectStore('presets', {keyPath: 'id'});
        if (!db.objectStoreNames.contains('assets')) db.createObjectStore('assets', {keyPath: 'hash'});
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
      request.onblocked = () => reject(new Error('Preset database is blocked by another tab'));
    }).catch((error) => { this.dbPromise = null; throw error; });
    return this.dbPromise;
  }

  /** Exécute `operation(store)` dans une transaction et attend sa fin (commit). */
  async transaction(storeName, mode, operation) {
    const db = await this.open();
    const tx = db.transaction(storeName, mode);
    const done = new Promise((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
      tx.onabort = () => reject(tx.error || new Error('Transaction aborted'));
    });
    const result = await operation(tx.objectStore(storeName));
    await done;
    return result;
  }

  /** Métadonnées de tous les presets (sans le rack), du plus récent au plus ancien. */
  async list() {
    const presets = await this.transaction('presets', 'readonly', (store) => promisify(store.getAll()));
    return presets.map(presetMetadata).sort((a, b) => String(b.updatedAt).localeCompare(String(a.updatedAt)));
  }

  async get(id) {
    const preset = await this.transaction('presets', 'readonly', (store) => promisify(store.get(id)));
    return preset ? validatePreset(preset) : null;
  }

  /** Enregistre (crée ou écrase) un preset complet. L'écrasement est décidé par l'appelant. */
  async save(preset) {
    const valid = validatePreset(preset);
    await this.transaction('presets', 'readwrite', (store) => promisify(store.put(valid)));
    return presetMetadata(valid);
  }

  /** Modifie les métadonnées (nom, description, tags) et/ou le rack d'un preset existant. */
  async update(id, changes = {}) {
    const preset = await this.get(id);
    if (!preset) throw new PresetError('Preset not found');
    if ('name' in changes) preset.name = normalizeName(changes.name);
    if ('description' in changes) preset.description = normalizeDescription(changes.description);
    if ('tags' in changes) preset.tags = normalizeTags(changes.tags);
    if ('rack' in changes) { preset.rack = changes.rack; preset.summary = changes.summary ?? preset.summary; }
    preset.updatedAt = this.now().toISOString();
    return this.save(preset);
  }

  /**
   * Supprime un preset, puis les assets que plus aucun preset n'utilise (« ramasse-miettes »).
   * Un modèle partagé par deux presets reste donc disponible pour le second.
   */
  async delete(id) {
    await this.transaction('presets', 'readwrite', (store) => promisify(store.delete(id)));
    return this.collectGarbage();
  }

  async collectGarbage() {
    const presets = await this.transaction('presets', 'readonly', (store) => promisify(store.getAll()));
    const used = referencedStoreHashes(presets);
    return this.transaction('assets', 'readwrite', async (store) => {
      const hashes = await promisify(store.getAllKeys());
      const removed = hashes.filter((hash) => !used.has(hash));
      for (const hash of removed) store.delete(hash);
      return removed;
    });
  }

  /** Ajoute un asset s'il n'existe pas déjà (même hash = même contenu). */
  async putAsset(asset) {
    if (!asset?.hash || !ASSET_KINDS.includes(asset.kind)) throw new PresetError('Invalid asset');
    return this.transaction('assets', 'readwrite', async (store) => {
      if (await promisify(store.getKey(asset.hash)) !== undefined) return false;
      store.put({...asset, savedAt: this.now().toISOString()});
      return true;
    });
  }

  async getAsset(hash) {
    return (await this.transaction('assets', 'readonly', (store) => promisify(store.get(hash)))) || null;
  }

  async listAssetHashes() {
    return this.transaction('assets', 'readonly', (store) => promisify(store.getAllKeys()));
  }
}
