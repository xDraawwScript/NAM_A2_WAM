import test from 'node:test';
import assert from 'node:assert/strict';
import {createPreset, validatePreset, summarize, rackFingerprint, normalizeTags, pluginNameFromUri, presetMetadata, PRESET_FORMAT, PRESET_VERSION, PresetError} from '../../examples/wam/presets/PresetFormat.js';
import {makeRackState} from './fixtures.mjs';

const fixed = {id: 'preset-1', now: new Date('2026-10-08T10:00:00Z')};

test('createPreset produces a versioned preset without the input trim', async () => {
  const preset = createPreset({rack: await makeRackState(), name: '  Crunch   rhythm ', tags: ['Rock', 'rock', ' Crunch '], ...fixed});
  assert.equal(preset.format, PRESET_FORMAT);
  assert.equal(preset.version, PRESET_VERSION);
  assert.equal(preset.name, 'Crunch rhythm');
  assert.deepEqual(preset.tags, ['rock', 'crunch']);
  assert.equal(preset.createdAt, '2026-10-08T10:00:00.000Z');
  assert.equal('sourceTrim' in preset.rack, false, 'the input trim depends on the guitar, not on the sound');
  assert.equal(preset.rack.a.entries.length, 3);
});

test('createPreset rejects empty names, long names and too many tags', async () => {
  const rack = await makeRackState();
  assert.throws(() => createPreset({rack, name: '   ', ...fixed}), PresetError);
  assert.throws(() => createPreset({rack, name: 'x'.repeat(81), ...fixed}), /80 characters/);
  assert.throws(() => normalizeTags(Array.from({length: 11}, (_, i) => `t${i}`)), /at most 10 tags/);
  assert.throws(() => normalizeTags('rock'), /list/);
});

test('summarize lists amp, cabinet and effects in signal order, including chain B when visible', async () => {
  const summary = summarize(await makeRackState({withB: true}), (uri) => (uri === './SmoothDelay/index.js' ? 'Smooth Delay' : null));
  assert.equal(summary.chains, 2);
  assert.equal(summary.amp, 'Twin Clean');
  assert.equal(summary.cabinet, 'V30');
  assert.deepEqual(summary.effects, ['BigMuff', 'Smooth Delay']);
  assert.deepEqual(summary.chainA.map((item) => item.kind), ['effect', 'nam', 'cabinet']);
});

test('summarize prefers the readable factory title over the file name', async () => {
  const rack = await makeRackState();
  rack.a.entries[1].state.model.provenance.title = 'Fender Twin Reverb';
  rack.a.entries[2].state.ir.metadata.title = 'Celestion V30';
  const summary = summarize(rack);
  assert.equal(summary.amp, 'Fender Twin Reverb');
  assert.equal(summary.cabinet, 'Celestion V30');
});

test('rackFingerprint ignores heavy data, asset references and the input trim', async () => {
  const live = await makeRackState();
  const dehydrated = structuredClone(live);
  const nam = dehydrated.a.entries[1].state.model;
  delete nam.data;
  nam.assetRef = {source: 'factory', kind: 'nam', id: 'factory:Twin Clean.nam'};
  delete dehydrated.a.entries[2].state.ir.samples;
  delete dehydrated.sourceTrim;
  assert.equal(rackFingerprint(live), rackFingerprint(dehydrated));
  live.a.entries[0].state.parameterValues.drive.value = 0.1;
  assert.notEqual(rackFingerprint(live), rackFingerprint(dehydrated));
});

test('pluginNameFromUri derives readable names', () => {
  assert.equal(pluginNameFromUri('./BigMuff/index.js'), 'BigMuff');
  assert.equal(pluginNameFromUri('./faustPingPongDelay/plugin/index.js'), 'faustPingPongDelay');
  assert.equal(pluginNameFromUri(undefined, 'nam'), 'NAM amp');
});

test('validatePreset accepts a valid preset and rejects foreign or future formats', async () => {
  const preset = createPreset({rack: await makeRackState(), name: 'Clean', ...fixed});
  assert.deepEqual(validatePreset(JSON.parse(JSON.stringify(preset))).rack, preset.rack);
  assert.throws(() => validatePreset({...preset, format: 'other'}), /Not a NAM A2 preset/);
  assert.throws(() => validatePreset({...preset, version: PRESET_VERSION + 1}), /newer than this app/);
  assert.throws(() => validatePreset({...preset, rack: {...preset.rack, version: 1}}), /rack state version/);
  const duplicate = structuredClone(preset);
  duplicate.rack.a.entries[1].id = duplicate.rack.a.entries[0].id;
  assert.throws(() => validatePreset(duplicate), /Duplicate plugin entry ID/);
});

test('presetMetadata never includes the heavy rack state', async () => {
  const metadata = presetMetadata(createPreset({rack: await makeRackState(), name: 'Clean', ...fixed}));
  assert.equal('rack' in metadata, false);
  assert.equal(metadata.summary.amp, 'Twin Clean');
});

test('portable presets: core modules lose their mode-dependent pluginUri, pedals keep theirs', async () => {
  const rack = await makeRackState();
  rack.a.entries[1].pluginUri = '../plugins/nam-wam/index.js';
  rack.a.entries[2].pluginUri = '../plugins/cabinet-wam/index.js';
  const preset = createPreset({rack, name: 'Portable', ...fixed});
  assert.equal(preset.rack.a.entries[1].pluginUri, undefined);
  assert.equal(preset.rack.a.entries[2].pluginUri, undefined);
  assert.equal(preset.rack.a.entries[0].pluginUri, './BigMuff/index.js');
  const old = structuredClone(preset);
  old.rack.a.entries[1].pluginUri = '../plugins/nam-wam/index.js';
  assert.equal(validatePreset(old).rack.a.entries[1].pluginUri, undefined, 'presets saved before the rule are cleaned when read');
});
