import test from 'node:test';
import assert from 'node:assert/strict';
import {exportPresetFile, importPresetFile, floatsToBase64, base64ToFloats, presetFileName} from '../../examples/wam/presets/PresetFile.js';
import {createPreset} from '../../examples/wam/presets/PresetFormat.js';
import {dehydrateRack} from '../../examples/wam/presets/PresetAssets.js';
import {makeRackState, makeFactory, makeAssetMap} from './fixtures.mjs';

async function externalPreset() {
  const store = makeAssetMap();
  const {rack} = await dehydrateRack(await makeRackState({externalModel: true, externalIr: true}), {factory: await makeFactory(), saveAsset: store.saveAsset});
  return {store, preset: createPreset({rack, name: 'My tone', id: 'original-id'})};
}

test('Float32 samples survive the base64 round trip exactly', () => {
  const samples = Float32Array.from({length: 70000}, (_, i) => Math.sin(i / 10));
  assert.deepEqual(base64ToFloats(floatsToBase64(samples)), samples);
});

test('export includes external assets; import verifies them and creates a copy', async () => {
  const {store, preset} = await externalPreset();
  const {text, warnings} = await exportPresetFile(preset, {loadAsset: store.loadAsset});
  assert.deepEqual(warnings, []);
  const file = JSON.parse(text);
  assert.equal(file.assets.length, 2);
  const imported = await importPresetFile(text, {newId: () => 'copy-id', now: new Date('2026-10-09T00:00:00Z')});
  assert.equal(imported.preset.id, 'copy-id', 'an import is a new preset');
  assert.equal(imported.preset.name, 'My tone');
  assert.deepEqual(imported.preset.rack, preset.rack);
  assert.deepEqual(imported.missing, []);
  const ir = imported.assets.find((asset) => asset.kind === 'ir');
  assert.ok(ir.samples instanceof Float32Array);
});

test('import refuses corrupted or foreign files', async () => {
  const {store, preset} = await externalPreset();
  const file = JSON.parse((await exportPresetFile(preset, {loadAsset: store.loadAsset})).text);
  const tampered = structuredClone(file);
  tampered.assets.find((asset) => asset.kind === 'nam').data += ' ';
  await assert.rejects(importPresetFile(JSON.stringify(tampered)), /corrupted/);
  await assert.rejects(importPresetFile('{not json'), /not valid JSON/);
  await assert.rejects(importPresetFile(JSON.stringify({format: 'other'})), /Not a NAM A2 preset file/);
});

test('factory assets are not embedded and missing external assets are reported', async () => {
  const store = makeAssetMap();
  const {rack} = await dehydrateRack(await makeRackState(), {factory: await makeFactory(), saveAsset: store.saveAsset});
  const factoryOnly = createPreset({rack, name: 'Factory sound'});
  assert.equal(JSON.parse((await exportPresetFile(factoryOnly, {loadAsset: store.loadAsset})).text).assets.length, 0);
  const {preset} = await externalPreset();
  const {text, warnings} = await exportPresetFile(preset, {loadAsset: async () => null});
  assert.equal(warnings.length, 2);
  assert.equal((await importPresetFile(text)).missing.length, 2);
});

test('presetFileName is safe for every OS', () => {
  assert.equal(presetFileName({name: 'Crunch / Lead: "80s"'}), 'Crunch-Lead-80s.nam-preset.json');
  assert.equal(presetFileName({name: '***'}), 'preset.nam-preset.json');
});
