import test from 'node:test';
import assert from 'node:assert/strict';
import {IDBFactory} from 'fake-indexeddb';
import {IndexedDbPresetStorage} from '../../examples/wam/presets/PresetStorage.js';
import {createPreset} from '../../examples/wam/presets/PresetFormat.js';
import {dehydrateRack} from '../../examples/wam/presets/PresetAssets.js';
import {makeRackState, makeFactory} from './fixtures.mjs';

// Chaque test a sa propre IndexedDB en mémoire (fake-indexeddb), comme un navigateur neuf.
const newStorage = (now = () => new Date('2026-10-08T12:00:00Z')) => new IndexedDbPresetStorage({indexedDB: new IDBFactory(), now});

async function storedPreset(storage, name, options) {
  const {rack} = await dehydrateRack(await makeRackState(options), {factory: await makeFactory(), saveAsset: (asset) => storage.putAsset(asset)});
  return storage.save(createPreset({rack, name}));
}

test('save, list, get, rename and update presets in IndexedDB', async () => {
  const storage = newStorage();
  const first = await storedPreset(storage, 'Clean');
  await new Promise((resolve) => setTimeout(resolve, 5));
  const second = await storedPreset(storage, 'Lead');
  const list = await storage.list();
  assert.deepEqual(list.map((item) => item.name).sort(), ['Clean', 'Lead']);
  assert.equal('rack' in list[0], false, 'lists are light: no rack state');
  const loaded = await storage.get(first.id);
  assert.equal(loaded.rack.a.entries.length, 3);
  const renamed = await storage.rename(first.id, 'Clean & bright');
  assert.equal(renamed.name, 'Clean & bright');
  assert.equal(renamed.updatedAt, '2026-10-08T12:00:00.000Z');
  const updated = await storage.update(second.id, {tags: ['Lead', 'solo'], description: 'For solos'});
  assert.deepEqual(updated.tags, ['lead', 'solo']);
  assert.equal(await storage.get('unknown'), null);
  await assert.rejects(storage.rename('unknown', 'x'), /not found/);
});

test('an asset shared by two presets survives the deletion of one of them', async () => {
  const storage = newStorage();
  const a = await storedPreset(storage, 'A', {externalModel: true});
  const b = await storedPreset(storage, 'B', {externalModel: true});
  assert.equal((await storage.listAssetHashes()).length, 1, 'same model, stored once');
  assert.deepEqual(await storage.delete(a.id), []);
  assert.equal((await storage.listAssetHashes()).length, 1, 'still used by B');
  const removed = await storage.delete(b.id);
  assert.equal(removed.length, 1, 'no preset uses it any more: removed');
  assert.deepEqual(await storage.listAssetHashes(), []);
});

test('putAsset keeps the first copy and stores IR samples as Float32Array', async () => {
  const storage = newStorage();
  const samples = Float32Array.from([0.5, -0.5]);
  assert.equal(await storage.putAsset({hash: 'abc', kind: 'ir', name: 'a.wav', samples}), true);
  assert.equal(await storage.putAsset({hash: 'abc', kind: 'ir', name: 'b.wav', samples}), false);
  const asset = await storage.getAsset('abc');
  assert.equal(asset.name, 'a.wav');
  assert.ok(asset.samples instanceof Float32Array);
  await assert.rejects(storage.putAsset({hash: 'x', kind: 'video'}), /Invalid asset/);
});

test('storage reports when IndexedDB is unavailable', async () => {
  const storage = new IndexedDbPresetStorage({indexedDB: null});
  assert.equal(storage.available, false);
  await assert.rejects(storage.list(), /IndexedDB is not available/);
});
