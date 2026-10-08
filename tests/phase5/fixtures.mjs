// Données de test partagées par les tests de la phase 5 (presets).
// Un faux state de rack réaliste (même forme que FxRack.getState()) et une fausse bibliothèque
// d'usine (même interface que FactoryAssets), sans navigateur ni audio.

import {sha256Hex} from '../../examples/wam/presets/PresetAssets.js';

export const FACTORY_MODEL_TEXT = JSON.stringify({architecture: 'WaveNet', weights: [0.1, 0.2, 0.3]});
export const EXTERNAL_MODEL_TEXT = JSON.stringify({architecture: 'LSTM', weights: [0.9, 0.8]});
export const FACTORY_IR = [0.5, 0.25, 0.125, -0.0625];
// CabinetNode.getState() renvoie Array.from(Float32Array) : les valeurs sont déjà en précision Float32.
export const EXTERNAL_IR = Array.from(Float32Array.from([1, -0.5, 0.25, 0.1, 0.05]));

export async function factoryModelHash() { return sha256Hex(FACTORY_MODEL_TEXT); }

/** State de rack : NAM (modèle d'usine) → pédale → Cabinet (IR d'usine), chaîne B absente. */
export async function makeRackState({externalModel = false, externalIr = false, withB = false} = {}) {
  const modelText = externalModel ? EXTERNAL_MODEL_TEXT : FACTORY_MODEL_TEXT;
  const modelHash = await sha256Hex(modelText);
  const nam = (id) => ({
    id, kind: 'nam', bypass: false, inputDb: 0, outputDb: 0,
    state: {
      parameterValues: {inputGain: {id: 'inputGain', value: 4.5, normalized: false}, bass: {id: 'bass', value: 6.2, normalized: false}},
      model: {name: externalModel ? 'My capture.nam' : 'Twin Clean.nam', data: modelText, contentHash: modelHash,
        ...(externalModel ? {} : {provenance: {source: 'Factory', identity: 'factory:Twin Clean.nam'}})},
      modelVariant: 'full', autoLevel: true, stateVersion: 5,
    },
  });
  const cabinet = (id) => ({
    id, kind: 'cabinet', bypass: false, inputDb: 0, outputDb: -2,
    state: {
      parameterValues: {irTrim: {id: 'irTrim', value: 0, normalized: false}},
      ir: externalIr ? {id: 'my-ir.wav', name: 'my-ir.wav', samples: [...EXTERNAL_IR], metadata: {}}
        : {id: 'factory:V30.wav', name: 'V30.wav', samples: [...FACTORY_IR], metadata: {source: 'Factory'}},
      routingMode: 'auto', stateVersion: 2,
    },
  });
  const effect = (id, uri, value) => ({id, kind: 'effect', pluginUri: uri, bypass: false, inputDb: 0, outputDb: 0, state: {parameterValues: {drive: {id: 'drive', value}}}});
  return {
    version: 2, panA: 0, panB: 0,
    a: {version: 1, entries: [effect('fx-1', './BigMuff/index.js', 0.7), nam('nam'), cabinet('cabinet')]},
    b: withB ? {version: 1, entries: [nam('b-nam'), effect('fx-2', './SmoothDelay/index.js', 0.3), cabinet('b-cabinet')]} : null,
    visible: withB, route: null, inputDbB: 0, outputDbA: 0, outputDbB: 0, mutedA: false, enabledB: false,
    sourceTrim: {live: 0, file: -6},
  };
}

/** Fausse bibliothèque d'usine (interface de FactoryAssets). Compte les chargements. */
export async function makeFactory() {
  const namHash = await factoryModelHash();
  const factory = {
    loads: 0,
    async findNamByHash(hash) { return hash === namHash ? {id: 'factory:Twin Clean.nam', contentHash: namHash} : null; },
    async findIrById(id) { return id === 'factory:V30.wav' ? {id, contentHash: 'irfilehash'} : null; },
    async loadNamText(id) { factory.loads++; if (id !== 'factory:Twin Clean.nam') throw new Error('not found in the factory library'); return FACTORY_MODEL_TEXT; },
    async loadIrSamples(id) { factory.loads++; if (id !== 'factory:V30.wav') throw new Error('not found in the factory library'); return Float32Array.from(FACTORY_IR); },
  };
  return factory;
}

/** Magasin d'assets en mémoire (interface putAsset/getAsset du stockage). */
export function makeAssetMap() {
  const map = new Map();
  return {
    map,
    saveAsset: async (asset) => { if (!map.has(asset.hash)) map.set(asset.hash, structuredClone(asset)); },
    loadAsset: async (hash) => map.get(hash) || null,
  };
}

/** Faux rack : getState / setState + événement 'change', comme FxRack. */
export class FakeRack extends EventTarget {
  constructor(state) { super(); this.state = structuredClone(state); this.setStates = []; }
  async getState() { return structuredClone(this.state); }
  async setState(state) { this.setStates.push(structuredClone(state)); this.state = structuredClone(state); this.dispatchEvent(new Event('change')); }
  touch() { this.dispatchEvent(new Event('change')); }
}
