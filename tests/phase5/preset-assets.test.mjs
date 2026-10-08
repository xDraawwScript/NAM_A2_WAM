import test from 'node:test';
import assert from 'node:assert/strict';
import {dehydrateRack, hydrateRack, collectAssetRefs, referencedStoreHashes, FactoryAssets, factoryAssetUrl, sha256Hex, irSamplesHash} from '../../examples/wam/presets/PresetAssets.js';
import {makeRackState, makeFactory, makeAssetMap, EXTERNAL_MODEL_TEXT, EXTERNAL_IR, FACTORY_MODEL_TEXT} from './fixtures.mjs';

test('factory model and IR become light references and come back identical', async () => {
  const original = await makeRackState();
  const factory = await makeFactory();
  const store = makeAssetMap();
  const {rack, refs} = await dehydrateRack(original, {factory, saveAsset: store.saveAsset});
  assert.deepEqual(refs.map((ref) => `${ref.source}:${ref.kind}`), ['factory:nam', 'factory:ir']);
  assert.equal(store.map.size, 0, 'factory assets are never copied');
  const nam = rack.a.entries.find((entry) => entry.kind === 'nam');
  assert.equal(nam.state.model.data, undefined);
  assert.equal(nam.state.model.assetRef.id, 'factory:Twin Clean.nam');
  assert.equal(rack.a.entries.find((entry) => entry.kind === 'cabinet').state.ir.samples, undefined);
  assert.equal(original.a.entries[1].state.model.data, FACTORY_MODEL_TEXT, 'the original state is not modified');

  const {rack: restored, warnings} = await hydrateRack(rack, {factory, loadAsset: store.loadAsset});
  assert.deepEqual(warnings, []);
  assert.deepEqual(restored, original);
});

test('external model and IR are stored once by hash and restored', async () => {
  const original = await makeRackState({externalModel: true, externalIr: true, withB: true});
  const factory = await makeFactory();
  const store = makeAssetMap();
  const {rack, refs} = await dehydrateRack(original, {factory, saveAsset: store.saveAsset});
  assert.ok(refs.every((ref) => ref.source === 'store'));
  assert.equal(store.map.size, 2, 'chain A and B share the same model and IR: stored once each');
  assert.ok(store.map.has(await sha256Hex(EXTERNAL_MODEL_TEXT)));
  assert.ok(store.map.has(await irSamplesHash(EXTERNAL_IR)));
  const {rack: restored, warnings} = await hydrateRack(rack, {factory, loadAsset: store.loadAsset});
  assert.deepEqual(warnings, []);
  assert.deepEqual(restored, original);
});

test('a missing asset is reported and the rest of the preset still loads', async () => {
  const factory = await makeFactory();
  const store = makeAssetMap();
  const {rack} = await dehydrateRack(await makeRackState({externalModel: true}), {factory, saveAsset: store.saveAsset});
  store.map.clear();
  const {rack: restored, warnings} = await hydrateRack(rack, {factory, loadAsset: store.loadAsset});
  assert.equal(warnings.length, 1);
  assert.match(warnings[0], /My capture\.nam.*unavailable/);
  const nam = restored.a.entries.find((entry) => entry.kind === 'nam');
  assert.equal(nam.state.model, undefined, 'the NAM keeps its current model');
  assert.equal(nam.state.parameterValues.bass.value, 6.2, 'knob values are still restored');
  assert.equal(restored.a.entries.find((entry) => entry.kind === 'cabinet').state.ir.samples.length, 4);
});

test('collectAssetRefs and referencedStoreHashes find shared assets', async () => {
  const factory = await makeFactory();
  const store = makeAssetMap();
  const {rack} = await dehydrateRack(await makeRackState({externalModel: true}), {factory, saveAsset: store.saveAsset});
  assert.equal(collectAssetRefs(rack).length, 2);
  const hashes = referencedStoreHashes([{rack}, {rack}]);
  assert.deepEqual([...hashes], [await sha256Hex(EXTERNAL_MODEL_TEXT)]);
});

test('FactoryAssets reads plugin manifests and builds encoded asset URLs', async () => {
  const requested = [];
  const manifests = {
    'models-manifest.json': {assets: [{id: 'factory:A B/amp.nam', relativePath: 'A B/amp.nam', contentHash: 'h1'}]},
    'irs-manifest.json': {assets: [{id: 'factory:cab.wav', relativePath: 'cab.wav', contentHash: 'h2'}]},
  };
  const fetch = async (url) => {
    const href = String(url);
    requested.push(href);
    const name = href.split('/').at(-1);
    if (manifests[name]) return {ok: true, json: async () => manifests[name]};
    if (href.endsWith('amp.nam')) return {ok: true, text: async () => 'MODEL'};
    if (href.endsWith('cab.wav')) return {ok: true, arrayBuffer: async () => new ArrayBuffer(8)};
    return {ok: false, status: 404};
  };
  const factory = FactoryAssets.fromPlugins({
    namPlugin: {_descriptorUrl: 'http://127.0.0.1:5500/dist/NAM_A2_WAM/plugins/nam-wam/descriptor.json'},
    cabinetPlugin: {_descriptorUrl: 'http://127.0.0.1:5500/dist/NAM_A2_WAM/plugins/cabinet-wam/descriptor.json'},
    context: {decodeAudioData: async () => ({getChannelData: () => Float32Array.from([0.5, 0.25])})},
    fetch,
  });
  assert.equal((await factory.findNamByHash('h1')).id, 'factory:A B/amp.nam');
  assert.equal(await factory.findNamByHash('nope'), null);
  assert.equal(await factory.loadNamText('factory:A B/amp.nam'), 'MODEL');
  assert.deepEqual([...await factory.loadIrSamples('factory:cab.wav')], [0.5, 0.25]);
  assert.ok(requested.includes('http://127.0.0.1:5500/dist/NAM_A2_WAM/plugins/nam-wam/models/A%20B/amp.nam'));
  await assert.rejects(factory.loadNamText('factory:unknown.nam'), /not found/);
  assert.throws(() => factoryAssetUrl('http://x/m.json', 'models', '../secret'), /Invalid factory asset path/);
});
