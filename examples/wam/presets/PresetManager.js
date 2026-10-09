// Orchestration des presets (missions 1 et 4) : relie le rack, les stockages et les assets.
//
//   Enregistrer : rack.getState() → dehydrateRack (modèles/IR → références) → createPreset → storage.save
//   Charger     : storage.get → hydrateRack (références → modèles/IR) → rack.setState()
//
// Trois sources (« adaptateurs » aux méthodes identiques) :
//   - 'browser' : IndexedDbPresetStorage, toujours disponible (mode invité) ;
//   - 'account' : RemotePresetStorage (API server/), disponible seulement une fois connecté ;
//   - 'public'  : les presets publics de tout le monde (mission 5), en LECTURE SEULE : on peut les
//                 chercher, les charger et les copier dans ses presets, pas les modifier.
// `source` = l'onglet affiché (où l'on enregistre / liste). Le preset courant retient sa propre
// source, pour que « Update » écrase le bon preset même si l'on a changé d'onglet entre-temps.
// Charger un preset ne touche jamais à l'entrée live ni aux cartes son : rack.setState() ne le fait pas.
//
// Indicateur « modifié » : les éditeurs des plugins changent leurs paramètres sans prévenir le
// rack (setParameterValues n'émet pas d'événement). On compare donc une empreinte du son
// (rackFingerprint) à celle mémorisée au dernier enregistrement/chargement, après chaque
// interaction de l'utilisateur (clic, touche, molette) ou changement du rack.

import {createPreset, summarize, rackFingerprint, PresetError} from './PresetFormat.js';
import {dehydrateRack, hydrateRack, collectAssetRefs} from './PresetAssets.js';
import {exportPresetFile, importPresetFile} from './PresetFile.js';

const INTERACTION_EVENTS = ['pointerup', 'keyup', 'wheel', 'change'];
export const SOURCES = ['browser', 'account', 'public'];
const READ_ONLY = 'Public presets of other users are read-only: copy it to your presets or save the sound as a new preset.';

export class PresetManager extends EventTarget {
  constructor({rack, storage, factory = null, nameForUri = null, beforeLoad = null, interactionTarget = null, checkDelay = 400}) {
    super();
    Object.assign(this, {rack, factory, nameForUri, beforeLoad, interactionTarget, checkDelay});
    this.storages = {browser: storage, account: null, public: null};
    this.source = 'browser';  // onglet affiché : 'browser' | 'account'
    this.current = null;      // {id, name, source} du preset chargé ou enregistré en dernier
    this.dirty = false;       // le son a-t-il changé depuis ?
    this.busy = false;
    this.baseline = null;     // empreinte du son au dernier enregistrement / chargement
    this.timer = null;
    this.scheduleCheck = () => {
      if (!this.current) return;
      clearTimeout(this.timer);
      this.timer = setTimeout(() => this.checkDirty().catch(() => {}), this.checkDelay);
    };
    rack.addEventListener?.('change', this.scheduleCheck);
    for (const type of INTERACTION_EVENTS) interactionTarget?.addEventListener(type, this.scheduleCheck, {passive: true, capture: true});
  }

  changed() { this.dispatchEvent(new Event('change')); }

  // --- Sources (ce navigateur / mon compte) ----------------------------------------------------

  /** Stockage de l'onglet affiché. */
  get storage() { return this.storages[this.source]; }

  storageOf(source) {
    const storage = this.storages[source];
    if (!storage) throw new PresetError(source === 'account' ? 'Sign in to use your online presets' : 'Preset storage unavailable');
    return storage;
  }

  /**
   * Branche (connexion) ou débranche (déconnexion) le stockage du compte. À la connexion, l'onglet
   * « My account » devient l'onglet par défaut. À la déconnexion, on revient au navigateur et le
   * preset en ligne courant est « détaché » (le son reste, mais on ne peut plus l'écraser).
   */
  setAccountStorage(storage) {
    this.storages.account = storage;
    // On bascule sur « My account » depuis l'onglet navigateur, mais on ne quitte pas « Explore ».
    if (storage && this.source === 'browser') this.source = 'account';
    else {
      if (this.source === 'account') this.source = 'browser';
      if (this.current?.source === 'account') { this.current = null; this.baseline = null; this.dirty = false; }
    }
    this.changed();
  }

  /** Branche le catalogue des presets publics (disponible avec ou sans compte). */
  setPublicStorage(storage) {
    this.storages.public = storage;
    if (!storage && this.source === 'public') this.source = 'browser';
    this.changed();
  }

  /** Les sources où l'on peut écrire : le navigateur et le compte, jamais le catalogue public. */
  writableStorage(source) {
    if (source === 'public') throw new PresetError(READ_ONLY);
    return this.storageOf(source);
  }

  setSource(source) {
    if (!SOURCES.includes(source)) throw new PresetError('Unknown preset source');
    this.storageOf(source);
    this.source = source;
    this.changed();
  }

  // --- Indicateur « modifié » ------------------------------------------------------------------

  /** Compare le son actuel à l'empreinte de référence et met à jour `dirty`. */
  async checkDirty() {
    if (!this.current || this.busy || this.baseline === null) return this.dirty;
    const dirty = rackFingerprint(await this.rack.getState()) !== this.baseline;
    if (dirty !== this.dirty && !this.busy) { this.dirty = dirty; this.changed(); }
    return this.dirty;
  }

  async setCurrent(preset, source) {
    this.current = preset ? {id: preset.id, name: preset.name, source} : null;
    this.baseline = preset ? rackFingerprint(await this.rack.getState()) : null;
    this.dirty = false;
    this.changed();
  }

  isCurrent(id, source = this.source) { return this.current?.id === id && this.current.source === source; }

  /** Une seule opération à la fois (évite deux chargements simultanés). */
  async exclusive(operation) {
    if (this.busy) throw new PresetError('Another preset operation is in progress');
    this.busy = true;
    clearTimeout(this.timer);
    this.changed();
    try { return await operation(); } finally { this.busy = false; this.changed(); }
  }

  // --- Opérations ------------------------------------------------------------------------------

  list(source = this.source) { return this.storageOf(source).list(); }

  /** Capture le son actuel sous forme de rack « déshydraté » + résumé (assets envoyés à `storage`). */
  async capture(storage) {
    const state = await this.rack.getState();
    const {rack} = await dehydrateRack(state, {factory: this.factory, saveAsset: (asset) => storage.putAsset(asset)});
    return {rack, summary: summarize(rack, this.nameForUri)};
  }

  /** « Save as » : crée un nouveau preset dans l'onglet affiché. `visibility` ne sert qu'en ligne. */
  saveAs({name, description = '', tags = [], visibility = 'private'}) {
    const source = this.source;
    return this.exclusive(async () => {
      const storage = this.writableStorage(source);
      const {rack} = await this.capture(storage);
      const preset = createPreset({rack, name, description, tags, nameForUri: this.nameForUri});
      const saved = await storage.save(preset, {visibility});
      await this.setCurrent(saved, source);
      return saved;
    });
  }

  /** « Update » : écrase le preset courant (dans SA source) avec le son actuel. */
  overwrite() {
    const current = this.current;
    if (!current) return Promise.reject(new PresetError('No current preset to overwrite'));
    return this.exclusive(async () => {
      const storage = this.writableStorage(current.source);
      const {rack, summary} = await this.capture(storage);
      const saved = await storage.update(current.id, {rack, summary});
      await storage.collectGarbage?.();
      await this.setCurrent(saved, current.source);
      return saved;
    });
  }

  /** Charge un preset dans le rack. Retourne {preset, warnings} (assets manquants, etc.). */
  load(id, source = this.source) {
    return this.exclusive(async () => {
      const storage = this.storageOf(source);
      const preset = await storage.get(id);
      if (!preset) throw new PresetError('Preset not found');
      const {rack, warnings} = await hydrateRack(preset.rack, {factory: this.factory, loadAsset: (hash) => storage.getAsset(hash)});
      await this.beforeLoad?.();
      await this.rack.setState(rack);
      await this.setCurrent(preset, source);
      return {preset, warnings};
    });
  }

  async update(id, changes, source = this.source) {
    const saved = await this.writableStorage(source).update(id, changes);
    if (this.isCurrent(id, source)) { this.current.name = saved.name; }
    this.changed();
    return saved;
  }

  rename(id, name, source = this.source) { return this.update(id, {name}, source); }

  /** Rendre un preset en ligne public (visible et copiable par tous) ou privé. */
  setVisibility(id, visibility) { return this.update(id, {visibility}, 'account'); }

  async remove(id, source = this.source) {
    await this.writableStorage(source).delete(id);
    if (this.isCurrent(id, source)) { this.current = null; this.baseline = null; this.dirty = false; }
    this.changed();
  }

  /**
   * Copie des presets du navigateur vers le compte (ils restent aussi dans le navigateur).
   * Les modèles/IR externes sont envoyés une seule fois (le serveur reconnaît leur hash).
   * Retourne {copied: [noms], failed: [{name, error}]}.
   */
  copyToAccount(ids) {
    return this.exclusive(async () => {
      const browser = this.storageOf('browser');
      const account = this.storageOf('account');
      const copied = [];
      const failed = [];
      for (const id of ids) {
        const preset = await browser.get(id);
        if (!preset) continue;
        try {
          for (const ref of collectAssetRefs(preset.rack)) {
            if (ref.source !== 'store') continue;
            const asset = await browser.getAsset(ref.hash);
            if (!asset) throw new PresetError(`a ${ref.kind === 'nam' ? 'model' : 'IR'} is missing in this browser`);
            await account.putAsset(asset);
          }
          await account.save(preset, {visibility: 'private'});
          copied.push(preset.name);
        } catch (error) {
          failed.push({name: preset.name, error: error.message});
        }
      }
      return {copied, failed};
    });
  }

  // --- Presets publics (mission 5) ----------------------------------------------------------------

  /** Recherche dans les presets publics : {items, page, pages, total}. */
  searchPublic({q = '', page = 1, limit = 12} = {}) {
    return this.storageOf('public').listPublic({q, page, limit});
  }

  /** Copie un preset public dans « My account » (privé). Il faut être connecté. */
  async copyPublic(id) {
    const saved = await this.storageOf('account').copyFrom(id);
    this.changed();
    return saved;
  }

  async exportFile(id, source = this.source) {
    const storage = this.storageOf(source);
    const preset = await storage.get(id);
    if (!preset) throw new PresetError('Preset not found');
    return {preset, ...(await exportPresetFile(preset, {loadAsset: (hash) => storage.getAsset(hash)}))};
  }

  /** Importe un fichier dans l'onglet affiché : enregistre ses assets puis le preset (copie, nouvel ID). */
  async importFile(text, source = this.source) {
    const storage = this.writableStorage(source);
    const {preset, assets, missing} = await importPresetFile(text);
    const absent = [];
    for (const ref of missing) if (!(await storage.getAsset(ref.hash))) absent.push(ref);
    // En ligne, le serveur exige que chaque modèle/IR référencé existe : un fichier incomplet ne
    // peut pas y être importé (dans le navigateur, il l'est avec un avertissement).
    if (absent.length && source === 'account') throw new PresetError(`This file is missing ${absent.length} amp model/IR file(s): import it in “This browser” instead.`);
    for (const asset of assets) await storage.putAsset(asset);
    const warnings = absent.map((ref) => `An asset (${ref.kind}) is missing from the file; the plugin will keep its current ${ref.kind === 'nam' ? 'model' : 'IR'}.`);
    const saved = await storage.save(preset, {visibility: 'private'});
    this.changed();
    return {preset: saved, warnings};
  }

  destroy() {
    clearTimeout(this.timer);
    this.rack.removeEventListener?.('change', this.scheduleCheck);
    for (const type of INTERACTION_EVENTS) this.interactionTarget?.removeEventListener(type, this.scheduleCheck, {capture: true});
  }
}
