import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {IDBFactory} from 'fake-indexeddb';
import {FACTORY_PRESETS} from '../../examples/wam/presets/factoryPresets.js';
import {FactoryPresetStorage} from '../../examples/wam/presets/FactoryPresetStorage.js';
import {PresetManager} from '../../examples/wam/presets/PresetManager.js';
import {IndexedDbPresetStorage} from '../../examples/wam/presets/PresetStorage.js';
import {validatePreset, rackEntries} from '../../examples/wam/presets/PresetFormat.js';
import {collectAssetRefs} from '../../examples/wam/presets/PresetAssets.js';
import {makeRackState, FakeRack} from './fixtures.mjs';

const json = async (path) => JSON.parse(await readFile(new URL(`../../${path}`, import.meta.url), 'utf8'));

test('the factory catalogue has 7 valid, uniquely named, read-only presets', () => {
  assert.equal(FACTORY_PRESETS.length, 7);
  const names = FACTORY_PRESETS.map((preset) => preset.name);
  assert.equal(new Set(names).size, names.length, 'unique names');
  for (const preset of FACTORY_PRESETS) {
    const valid = validatePreset(preset);
    assert.match(valid.id, /^factory:[a-z0-9-]+$/u);
    assert.ok(valid.description.length > 20, `${valid.name} has a description`);
    assert.ok(valid.tags.length > 0, `${valid.name} has tags`);
  }
});

test('every factory reference points to a REAL bundled model/IR with the same hash', async () => {
  const models = new Map((await json('src/nam-wam/models-manifest.json')).assets.map((asset) => [asset.id, asset]));
  const irs = new Map((await json('src/cabinet-wam/irs-manifest.json')).assets.map((asset) => [asset.id, asset]));
  for (const preset of FACTORY_PRESETS) {
    const refs = collectAssetRefs(preset.rack);
    assert.ok(refs.length >= 2, `${preset.name}: amp model + cabinet IR`);
    for (const ref of refs) {
      assert.equal(ref.source, 'factory', `${preset.name}: factory references only, never copied data`);
      const asset = (ref.kind === 'nam' ? models : irs).get(ref.id);
      assert.ok(asset, `${preset.name}: ${ref.id} exists in the ${ref.kind} manifest`);
      assert.equal(ref.contentHash, asset.contentHash, `${preset.name}: same file (hash)`);
    }
  }
});

test('every pedal of the factory presets exists in the plugin catalogue', async () => {
  const catalogue = new Set((await json('examples/wam/wamPlugins/plugins.json')).plugins.map((entry) => (typeof entry === 'string' ? entry : entry.uri)));
  for (const preset of FACTORY_PRESETS) {
    for (const entry of rackEntries(preset.rack).filter((item) => item.kind === 'effect')) {
      assert.ok(catalogue.has(entry.pluginUri), `${preset.name}: ${entry.pluginUri} is a bundled pedal`);
    }
  }
});

test('factory presets are portable: no machine-specific URL, no input trim, no device', () => {
  const text = JSON.stringify(FACTORY_PRESETS);
  assert.doesNotMatch(text, /localhost|127\.0\.0\.1|file:|"imageUrl"/u, 'no URL computed from the developer page');
  assert.doesNotMatch(text, /sourceTrim|deviceId|"token"/u);
});

test('the generator recipes and the generated catalogue match', async () => {
  const source = await readFile(new URL('../../tools/factory-presets/generate-factory-presets.js', import.meta.url), 'utf8');
  for (const preset of FACTORY_PRESETS) assert.ok(source.includes(`id: '${preset.id.replace('factory:', '')}'`), `${preset.id} has a recipe`);
});

test('FactoryPresetStorage: list, get returns a copy, and refuses invalid catalogues', async () => {
  const storage = new FactoryPresetStorage(FACTORY_PRESETS);
  const list = await storage.list();
  assert.deepEqual(list.map((item) => item.name), FACTORY_PRESETS.map((preset) => preset.name));
  assert.equal('rack' in list[0], false);
  const copy = await storage.get(list[0].id);
  copy.name = 'Hacked';
  assert.equal((await storage.get(list[0].id)).name, FACTORY_PRESETS[0].name, 'the shipped preset cannot be modified');
  assert.equal(await storage.get('factory:unknown'), null);
  assert.equal(await storage.getAsset('any'), null);
  assert.throws(() => new FactoryPresetStorage([{...FACTORY_PRESETS[0], id: 'not-factory'}]), /must start with "factory:"/);
  const external = structuredClone(FACTORY_PRESETS[0]);
  rackEntries(external.rack).find((entry) => entry.state?.model).state.model.assetRef = {source: 'store', kind: 'nam', hash: 'a'.repeat(64)};
  assert.throws(() => new FactoryPresetStorage([external]), /non-factory asset/);
});

test('load a factory preset, tweak it, save it as MY preset; the factory one never changes', async () => {
  // Bibliothèque d'usine simulée : renvoie un contenu pour n'importe quel identifiant d'usine.
  const factoryAssets = {
    findNamByHash: async () => null, findIrById: async (id) => ({id, contentHash: 'x'}),
    loadNamText: async (id) => JSON.stringify({id}), loadIrSamples: async () => Float32Array.from([0.5, 0.25]),
  };
  const rack = new FakeRack(await makeRackState());
  const manager = new PresetManager({rack, storage: new IndexedDbPresetStorage({indexedDB: new IDBFactory()}), factory: factoryAssets, checkDelay: 0});
  manager.setStorage('factory', new FactoryPresetStorage(FACTORY_PRESETS));
  manager.setSource('factory');
  const fuzz = FACTORY_PRESETS.find((preset) => preset.id === 'factory:fuzz-muff');
  const {warnings} = await manager.load(fuzz.id);
  assert.deepEqual(warnings, []);
  assert.deepEqual(manager.current, {id: fuzz.id, name: 'Fuzz Muff', source: 'factory'});
  assert.ok(rack.setStates.at(-1).a.entries.some((entry) => entry.pluginUri === './BigMuff/index.js'), 'the Big Muff pedal is in the chain');
  await assert.rejects(manager.overwrite(), /read-only/);
  await assert.rejects(manager.saveAs({name: 'x'}), /read-only/);
  await assert.rejects(manager.rename(fuzz.id, 'x'), /read-only/);
  manager.setSource('browser');
  const mine = await manager.saveAs({name: 'My fuzz'});
  assert.deepEqual(manager.current, {id: mine.id, name: 'My fuzz', source: 'browser'});
  assert.equal((await manager.storages.factory.get(fuzz.id)).name, 'Fuzz Muff');
});

test('a lazily loaded catalogue: nothing is loaded until used, and a bad catalogue only fails the Factory tab', async () => {
  let loads = 0;
  const lazy = new FactoryPresetStorage(async () => { loads++; return FACTORY_PRESETS; });
  assert.equal(loads, 0, 'nothing loaded at startup');
  assert.equal((await lazy.list()).length, 7);
  await lazy.get(FACTORY_PRESETS[0].id);
  assert.equal(loads, 1, 'loaded once, then kept');
  const broken = new FactoryPresetStorage(async () => [{...FACTORY_PRESETS[0], id: 'oops'}]);
  await assert.rejects(broken.list(), /must start with "factory:"/, 'the error is reported when the tab is opened, not at startup');
});

test('NAM and Cabinet entries carry no pluginUri (it depends on source vs dist mode)', () => {
  for (const preset of FACTORY_PRESETS) {
    for (const entry of rackEntries(preset.rack).filter((item) => item.kind !== 'effect')) assert.equal(entry.pluginUri, undefined, `${preset.name}: ${entry.kind}`);
  }
});
