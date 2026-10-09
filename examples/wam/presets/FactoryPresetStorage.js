// Presets d'usine (mission 6) : un catalogue de sons prêts à jouer, livré avec l'appli.
//
// SPECIFICATION_FX_CHAIN.md §7.2 : « les presets d'usine sont des modèles en lecture seule.
// Modifier un preset d'usine change le projet courant ; l'enregistrer crée un preset utilisateur,
// sans modifier la définition livrée. » Ils ne référencent que des assets d'usine (modèles NAM et IR
// livrés dans la dist), sans URL propre à une machine : ils marchent en local comme sur mainline.
//
// Même interface de lecture que les autres stockages (list, get, getAsset) ; aucune écriture.
// Le catalogue est généré par tools/factory-presets/generate-factory-presets.js.

import {validatePreset, presetMetadata, PresetError} from './PresetFormat.js';
import {collectAssetRefs} from './PresetAssets.js';

/** Valide le catalogue : un preset d'usine invalide est une erreur de développement. */
function validateCatalogue(presets) {
  return presets.map((preset) => {
    const valid = validatePreset(preset);
    if (!valid.id.startsWith('factory:')) throw new PresetError(`Factory preset id must start with "factory:": ${valid.id}`, 'factoryId', {id: valid.id});
    if (collectAssetRefs(valid.rack).some((ref) => ref.source !== 'factory')) throw new PresetError(`Factory preset "${valid.name}" references a non-factory asset`, 'factoryAsset', {name: valid.name});
    return Object.freeze(valid);
  });
}

export class FactoryPresetStorage {
  /**
   * `presets` : le catalogue (tableau), ou une fonction qui le charge à la demande
   * (`() => import('./factoryPresets.js')…`) pour ne pas alourdir le démarrage de l'appli (~116 Ko).
   * Un catalogue invalide ne fait échouer QUE l'onglet Factory (erreur affichée), jamais l'hôte.
   */
  constructor(presets) {
    this.readOnly = true;
    if (typeof presets === 'function') this.loader = presets;
    else this.presets = validateCatalogue(presets);
  }

  async catalogue() {
    if (!this.presets) {
      this.loading ||= Promise.resolve().then(this.loader).then(validateCatalogue);
      try { this.presets = await this.loading; } catch (error) { this.loading = null; throw error; }
    }
    return this.presets;
  }

  /** Les presets d'usine sont listés dans l'ordre du catalogue (du plus clean au plus saturé). */
  async list() { return (await this.catalogue()).map(presetMetadata); }

  /** Copie profonde : le preset livré ne peut jamais être modifié par l'appelant. */
  async get(id) {
    const preset = (await this.catalogue()).find((item) => item.id === id);
    return preset ? structuredClone(preset) : null;
  }

  /** Aucun asset « store » : modèles et IR sont lus depuis la bibliothèque d'usine. */
  async getAsset() { return null; }
}
