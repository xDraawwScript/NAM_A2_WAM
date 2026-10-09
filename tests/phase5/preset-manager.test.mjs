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

// --- Mission 4 : deux stockages (ce navigateur / mon compte) ------------------------------------
// Le « compte » est simulé par une seconde IndexedDB : même interface que RemotePresetStorage.
async function setupTwoSources(options) {
  const ctx = await setup(options);
  const account = new IndexedDbPresetStorage({indexedDB: new IDBFactory(), name: 'account'});
  return {...ctx, account};
}

test('signing in switches to the account tab; signing out goes back and detaches online presets', async () => {
  const {manager, account} = await setupTwoSources();
  assert.equal(manager.source, 'browser');
  assert.throws(() => manager.setSource('account'), /Sign in/);
  manager.setAccountStorage(account);
  assert.equal(manager.source, 'account', 'online by default once signed in');
  const online = await manager.saveAs({name: 'Online', visibility: 'public'});
  assert.deepEqual(manager.current, {id: online.id, name: 'Online', source: 'account'});
  assert.equal((await account.list()).length, 1);
  assert.equal((await manager.list('browser')).length, 0, 'nothing written in the browser');
  manager.setAccountStorage(null);
  assert.equal(manager.source, 'browser');
  assert.equal(manager.current, null, 'an online preset cannot be updated once signed out');
});

test('Update writes to the source of the current preset, even after switching tab', async () => {
  const {rack, manager, account} = await setupTwoSources();
  manager.setAccountStorage(account);
  const online = await manager.saveAs({name: 'Online'});
  manager.setSource('browser');
  rack.state.a.entries[1].state.parameterValues.bass.value = 9;
  await manager.overwrite();
  assert.equal((await account.get(online.id)).rack.a.entries[1].state.parameterValues.bass.value, 9);
  assert.equal((await manager.list('browser')).length, 0);
});

test('copy browser presets to the account: they stay in the browser, assets follow', async () => {
  const {manager, account} = await setupTwoSources({externalModel: true, externalIr: true});
  const first = await manager.saveAs({name: 'Local A'});
  const second = await manager.saveAs({name: 'Local B'});
  manager.setAccountStorage(account);
  const result = await manager.copyToAccount([first.id, second.id, 'unknown']);
  assert.deepEqual(result.copied.sort(), ['Local A', 'Local B']);
  assert.deepEqual(result.failed, []);
  assert.equal((await manager.list('browser')).length, 2, 'copy, not move');
  const copies = await account.list();
  assert.equal(copies.length, 2);
  assert.equal((await account.listAssetHashes()).length, 2, 'the external model and IR are uploaded once');
  manager.setSource('account');
  const {warnings} = await manager.load(copies[0].id);
  assert.deepEqual(warnings, [], 'the copied preset loads with all its assets');
});

test('a preset whose asset is missing locally is reported, the others are copied', async () => {
  const {manager, account} = await setupTwoSources({externalModel: true});
  const broken = await manager.saveAs({name: 'Broken'});
  const browser = manager.storages.browser;
  for (const hash of await browser.listAssetHashes()) await browser.transaction('assets', 'readwrite', (store) => store.delete(hash));
  manager.setAccountStorage(account);
  const result = await manager.copyToAccount([broken.id]);
  assert.deepEqual(result.copied, []);
  assert.match(result.failed[0].error, /model is missing/);
});

test('the copy banner only counts browser presets that are not on the account yet', async () => {
  // PresetView importe el() qui utilise le DOM uniquement à l'appel : l'import est sûr dans Node.
  const {pendingCopies} = await import('../../examples/wam/presets/PresetView.js');
  const a = {id: '1', name: 'Clean', summary: {amp: 'Twin'}};
  const b = {id: '2', name: 'Lead', summary: {amp: 'Plexi'}};
  const sameNameOtherSound = {id: '3', name: 'Clean', summary: {amp: 'Bogner'}};
  const online = [{id: 'x', name: 'Clean', summary: {amp: 'Twin'}}];
  assert.deepEqual(pendingCopies([a, b, sameNameOtherSound], online).map((preset) => preset.id), ['2', '3']);
  assert.deepEqual(pendingCopies([a], online), []);
});

test('importing a file that lacks an asset: warning in the browser, clear refusal online', async () => {
  const {manager, account} = await setupTwoSources({externalModel: true});
  const saved = await manager.saveAs({name: 'Incomplete'});
  const file = JSON.parse((await manager.exportFile(saved.id)).text);
  file.assets = [];
  const text = JSON.stringify(file);
  const fresh = await setupTwoSources();
  const local = await fresh.manager.importFile(text);
  assert.equal(local.warnings.length, 1);
  fresh.manager.setAccountStorage(fresh.account);
  await assert.rejects(fresh.manager.importFile(text), /import it in “This browser” instead/);
  assert.deepEqual(await fresh.account.list(), [], 'nothing half-imported online');
  assert.ok(account);
});
