import test from 'node:test';
import assert from 'node:assert/strict';
import {IDBFactory} from 'fake-indexeddb';
import {PresetManager} from '../../examples/wam/presets/PresetManager.js';
import {IndexedDbPresetStorage} from '../../examples/wam/presets/PresetStorage.js';
import {makeRackState, makeFactory, FakeRack} from './fixtures.mjs';

async function setup(options) {
  const rack = new FakeRack(await makeRackState(options));
  const factory = await makeFactory();
  const calls = [];
  const interactions = new EventTarget();
  const manager = new PresetManager({
    rack, factory, storage: new IndexedDbPresetStorage({indexedDB: new IDBFactory()}),
    beforeLoad: () => calls.push('beforeLoad'), interactionTarget: interactions, checkDelay: 0,
  });
  return {rack, factory, manager, calls, interactions};
}

const tick = () => new Promise((resolve) => setTimeout(resolve, 20));

test('save the current sound, change it, then load it back exactly', async () => {
  const {rack, manager, calls} = await setup({externalModel: true, withB: true});
  const original = await rack.getState();
  const saved = await manager.saveAs({name: 'Two amps', tags: ['stereo']});
  assert.equal(manager.current.name, 'Two amps');
  assert.equal(saved.summary.chains, 2);

  rack.state.a.entries[1].state.parameterValues.bass.value = 1;
  rack.state.a.entries.reverse();
  const {warnings} = await manager.load(saved.id);
  assert.deepEqual(warnings, []);
  assert.deepEqual(calls, ['beforeLoad']);
  const {sourceTrim, ...expected} = original;
  assert.deepEqual(rack.setStates.at(-1), expected, 'the whole rack (A, B, routing) is restored, without the input trim');
});

test('the "modified" flag compares the sound with the last save or load', async () => {
  const {rack, manager, interactions} = await setup();
  assert.equal(await manager.checkDirty(), false, 'no current preset: nothing to compare with');
  const saved = await manager.saveAs({name: 'Clean'});
  rack.touch();
  await tick();
  assert.equal(manager.dirty, false, 'an event without any real change is not a modification');
  // Un éditeur de plugin change un bouton sans émettre d'événement : l'interaction utilisateur
  // (relâchement de la souris) déclenche la vérification.
  rack.state.a.entries[1].state.parameterValues.bass.value = 2;
  interactions.dispatchEvent(new Event('pointerup'));
  await tick();
  assert.equal(manager.dirty, true);
  rack.state.a.entries[1].state.parameterValues.bass.value = 6.2;
  assert.equal(await manager.checkDirty(), false, 'back to the saved value: not modified any more');
  rack.state.a.entries[1].state.parameterValues.bass.value = 3;
  assert.equal(await manager.checkDirty(), true);
  await manager.overwrite();
  assert.equal(manager.dirty, false);
  await manager.load(saved.id);
  assert.equal(await manager.checkDirty(), false, 'loading is not a modification');
});

test('only one preset operation runs at a time', async () => {
  const {manager} = await setup();
  const saved = await manager.saveAs({name: 'Clean'});
  const first = manager.load(saved.id);
  await assert.rejects(manager.load(saved.id), /in progress/);
  await first;
});

test('rename, remove, export and import through the manager', async () => {
  const {manager} = await setup({externalIr: true});
  const saved = await manager.saveAs({name: 'Original'});
  await manager.rename(saved.id, 'Renamed');
  assert.equal(manager.current.name, 'Renamed');
  const {text} = await manager.exportFile(saved.id);
  await manager.remove(saved.id);
  assert.equal(manager.current, null);
  assert.deepEqual(await manager.list(), []);
  const {preset, warnings} = await manager.importFile(text);
  assert.deepEqual(warnings, []);
  assert.equal(preset.name, 'Renamed');
  assert.notEqual(preset.id, saved.id);
  const {warnings: loadWarnings} = await manager.load(preset.id);
  assert.deepEqual(loadWarnings, [], 'the imported IR is available again');
});
