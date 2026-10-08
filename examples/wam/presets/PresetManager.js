// Orchestration des presets (mission 1) : relie le rack, le stockage et les assets.
//
//   Enregistrer : rack.getState() → dehydrateRack (modèles/IR → références) → createPreset → storage.save
//   Charger     : storage.get → hydrateRack (références → modèles/IR) → rack.setState()
//
// Le stockage est un adaptateur (IndexedDbPresetStorage aujourd'hui, l'API demain). Charger un
// preset ne touche jamais à l'entrée live ni aux cartes son : rack.setState() ne le fait pas.
//
// Indicateur « modifié » : les éditeurs des plugins changent leurs paramètres sans prévenir le
// rack (setParameterValues n'émet pas d'événement). On compare donc une empreinte du son
// (rackFingerprint) à celle mémorisée au dernier enregistrement/chargement, après chaque
// interaction de l'utilisateur (clic, touche, molette) ou changement du rack.

import {createPreset, summarize, rackFingerprint, PresetError} from './PresetFormat.js';
import {dehydrateRack, hydrateRack} from './PresetAssets.js';
import {exportPresetFile, importPresetFile} from './PresetFile.js';

const INTERACTION_EVENTS = ['pointerup', 'keyup', 'wheel', 'change'];

export class PresetManager extends EventTarget {
  constructor({rack, storage, factory = null, nameForUri = null, beforeLoad = null, interactionTarget = null, checkDelay = 400}) {
    super();
    Object.assign(this, {rack, storage, factory, nameForUri, beforeLoad, interactionTarget, checkDelay});
    this.current = null;      // {id, name} du preset chargé ou enregistré en dernier
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

  /** Compare le son actuel à l'empreinte de référence et met à jour `dirty`. */
  async checkDirty() {
    if (!this.current || this.busy || this.baseline === null) return this.dirty;
    const dirty = rackFingerprint(await this.rack.getState()) !== this.baseline;
    if (dirty !== this.dirty && !this.busy) { this.dirty = dirty; this.changed(); }
    return this.dirty;
  }

  async setCurrent(preset) {
    this.current = preset ? {id: preset.id, name: preset.name} : null;
    this.baseline = preset ? rackFingerprint(await this.rack.getState()) : null;
    this.dirty = false;
    this.changed();
  }

  /** Une seule opération à la fois (évite deux chargements simultanés). */
  async exclusive(operation) {
    if (this.busy) throw new PresetError('Another preset operation is in progress');
    this.busy = true;
    clearTimeout(this.timer);
    this.changed();
    try { return await operation(); } finally { this.busy = false; this.changed(); }
  }

  list() { return this.storage.list(); }

  /** Capture le son actuel sous forme de rack « déshydraté » + résumé. */
  async capture() {
    const state = await this.rack.getState();
    const {rack} = await dehydrateRack(state, {factory: this.factory, saveAsset: (asset) => this.storage.putAsset(asset)});
    return {rack, summary: summarize(rack, this.nameForUri)};
  }

  /** « Save as » : crée un nouveau preset à partir du son actuel. */
  saveAs({name, description = '', tags = []}) {
    return this.exclusive(async () => {
      const {rack} = await this.capture();
      const preset = createPreset({rack, name, description, tags, nameForUri: this.nameForUri});
      const saved = await this.storage.save(preset);
      await this.setCurrent(saved);
      return saved;
    });
  }

  /** « Save » : écrase un preset existant avec le son actuel (confirmé par l'interface). */
  overwrite(id = this.current?.id) {
    if (!id) return Promise.reject(new PresetError('No current preset to overwrite'));
    return this.exclusive(async () => {
      const {rack, summary} = await this.capture();
      const saved = await this.storage.update(id, {rack, summary});
      await this.storage.collectGarbage?.();
      await this.setCurrent(saved);
      return saved;
    });
  }

  /** Charge un preset dans le rack. Retourne {preset, warnings} (assets manquants, etc.). */
  load(id) {
    return this.exclusive(async () => {
      const preset = await this.storage.get(id);
      if (!preset) throw new PresetError('Preset not found');
      const {rack, warnings} = await hydrateRack(preset.rack, {factory: this.factory, loadAsset: (hash) => this.storage.getAsset(hash)});
      await this.beforeLoad?.();
      await this.rack.setState(rack);
      await this.setCurrent(preset);
      return {preset, warnings};
    });
  }

  async rename(id, name) {
    const saved = await this.storage.rename(id, name);
    if (this.current?.id === id) { this.current.name = saved.name; this.changed(); }
    return saved;
  }

  async update(id, changes) {
    const saved = await this.storage.update(id, changes);
    if (this.current?.id === id) { this.current.name = saved.name; this.changed(); }
    return saved;
  }

  async remove(id) {
    await this.storage.delete(id);
    if (this.current?.id === id) { this.current = null; this.baseline = null; this.dirty = false; }
    this.changed();
  }

  async exportFile(id) {
    const preset = await this.storage.get(id);
    if (!preset) throw new PresetError('Preset not found');
    return {preset, ...(await exportPresetFile(preset, {loadAsset: (hash) => this.storage.getAsset(hash)}))};
  }

  /** Importe un fichier : enregistre ses assets puis le preset (copie avec un nouvel ID). */
  async importFile(text) {
    const {preset, assets, missing} = await importPresetFile(text);
    for (const asset of assets) await this.storage.putAsset(asset);
    const warnings = [];
    for (const ref of missing) if (!(await this.storage.getAsset(ref.hash))) warnings.push(`An asset (${ref.kind}) is missing from the file; the plugin will keep its current ${ref.kind === 'nam' ? 'model' : 'IR'}.`);
    const saved = await this.storage.save(preset);
    this.changed();
    return {preset: saved, warnings};
  }

  destroy() {
    clearTimeout(this.timer);
    this.rack.removeEventListener?.('change', this.scheduleCheck);
    for (const type of INTERACTION_EVENTS) this.interactionTarget?.removeEventListener(type, this.scheduleCheck, {capture: true});
  }
}
