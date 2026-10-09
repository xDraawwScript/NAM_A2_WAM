import test from 'node:test';
import assert from 'node:assert/strict';
import {RemotePresetStorage, fromApi} from '../../examples/wam/presets/RemotePresetStorage.js';
import {encodeAsset as assetToApi, decodeAsset as assetFromApi} from '../../examples/wam/presets/PresetFile.js';
import {ApiError} from '../../examples/wam/account/ApiClient.js';
import {createPreset} from '../../examples/wam/presets/PresetFormat.js';
import {dehydrateRack} from '../../examples/wam/presets/PresetAssets.js';
import {makeRackState, makeFactory, makeAssetMap, EXTERNAL_IR} from './fixtures.mjs';

/** Fausse API : même interface que ApiClient.request, réponses programmées, appels enregistrés. */
function fakeApi(handler) {
  const calls = [];
  return {
    calls,
    loggedIn: true,
    async request(path, options = {}) {
      const call = {path, method: options.method || 'GET', auth: options.auth, body: options.body};
      calls.push(call);
      return handler(call);
    },
  };
}

async function samplePreset(options) {
  const store = makeAssetMap();
  const {rack} = await dehydrateRack(await makeRackState(options), {factory: await makeFactory(), saveAsset: store.saveAsset});
  return {preset: createPreset({rack, name: 'Online tone', tags: ['rock']}), store};
}

const apiPreset = (preset, extra = {}) => ({...preset, id: 'srv-1', visibility: 'private', author: {id: 'u1', username: 'jimi'}, ...extra});

test('save sends the preset with its visibility; the server id replaces the local id', async () => {
  const {preset} = await samplePreset();
  const api = fakeApi((call) => apiPreset(preset, {visibility: call.body.visibility}));
  const storage = new RemotePresetStorage({api});
  const saved = await storage.save(preset, {visibility: 'public'});
  assert.equal(saved.id, 'srv-1');
  assert.equal(saved.visibility, 'public');
  assert.equal('rack' in saved, false, 'save returns light metadata');
  const [call] = api.calls;
  assert.equal(call.path, '/presets');
  assert.equal(call.method, 'POST');
  assert.equal(call.auth, true);
  assert.equal('id' in call.body, false, 'the local id is not sent');
  assert.deepEqual(call.body.rack, preset.rack);
});

test('list walks every page of my presets', async () => {
  const api = fakeApi((call) => {
    const page = Number(new URL(call.path, 'http://x').searchParams.get('page'));
    return {items: [{id: `p${page}`, name: `Preset ${page}`, tags: [], summary: {}, visibility: 'private'}], page, pages: 3};
  });
  const items = await new RemotePresetStorage({api}).list();
  assert.deepEqual(items.map((item) => item.id), ['p1', 'p2', 'p3']);
  assert.ok(api.calls.every((call) => call.auth === true));
});

test('get validates the preset like the browser does, and returns null on 404', async () => {
  const {preset} = await samplePreset();
  const storage = new RemotePresetStorage({api: fakeApi((call) => {
    if (call.path.endsWith('missing')) throw new ApiError(404, 'Preset not found');
    if (call.path.endsWith('broken')) return {...apiPreset(preset), format: 'other'};
    return apiPreset(preset);
  })});
  const loaded = await storage.get('srv-1');
  assert.deepEqual(loaded.rack, preset.rack);
  assert.equal(loaded.author.username, 'jimi');
  assert.equal(await storage.get('missing'), null);
  await assert.rejects(storage.get('broken'), /Not a NAM A2 preset/);
});

test('putAsset asks the server first (HEAD) and uploads only missing assets', async () => {
  const known = new Set(['already']);
  const api = fakeApi((call) => {
    const hash = call.path.split('/').at(-1);
    if (call.method === 'HEAD') { if (!known.has(hash)) throw new ApiError(404, 'Asset not found'); return null; }
    if (call.method === 'PUT') { known.add(hash); return {hash, created: true}; }
    throw new Error('unexpected');
  });
  const storage = new RemotePresetStorage({api});
  assert.equal(await storage.putAsset({hash: 'already', kind: 'nam', name: 'a.nam', data: '{}'}), false);
  assert.equal(await storage.putAsset({hash: 'new', kind: 'ir', name: 'b.wav', samples: Float32Array.from(EXTERNAL_IR)}), true);
  assert.deepEqual(api.calls.map((call) => call.method), ['HEAD', 'HEAD', 'PUT']);
  assert.equal(typeof api.calls[2].body.samples, 'string', 'IR samples travel as base64');
  await assert.rejects(storage.putAsset({hash: 'x', kind: 'video'}), /Invalid asset/);
  // Une autre erreur que 404 (ex. serveur injoignable) n'est pas masquée.
  const down = new RemotePresetStorage({api: fakeApi(() => { throw new ApiError(0, 'Cannot reach the server'); })});
  await assert.rejects(down.putAsset({hash: 'y', kind: 'nam', name: 'y', data: '{}'}), /Cannot reach/);
});

test('getAsset uses memory, then the local cache, then the server', async () => {
  const api = fakeApi((call) => {
    const hash = call.path.split('/').at(-1);
    if (hash === 'gone') throw new ApiError(404, 'Asset not found');
    return {hash, kind: 'ir', name: 'cab.wav', samples: assetToApi({kind: 'ir', samples: Float32Array.from(EXTERNAL_IR)}).samples};
  });
  const cache = {getAsset: async (hash) => (hash === 'cached' ? {hash, kind: 'nam', name: 'c.nam', data: '{}'} : null)};
  const storage = new RemotePresetStorage({api, cache});
  assert.equal((await storage.getAsset('cached')).name, 'c.nam');
  const fromServer = await storage.getAsset('remote');
  assert.deepEqual([...fromServer.samples], EXTERNAL_IR);
  await storage.getAsset('remote');
  assert.equal(api.calls.filter((call) => call.path === '/assets/remote').length, 1, 'downloaded once, then kept in memory');
  assert.equal(await storage.getAsset('gone'), null);
});

test('update, rename, visibility and delete call the right routes', async () => {
  const {preset} = await samplePreset();
  const api = fakeApi((call) => (call.method === 'DELETE' ? null : apiPreset(preset, {name: call.body?.name ?? preset.name, visibility: call.body?.visibility ?? 'private'})));
  const storage = new RemotePresetStorage({api});
  assert.equal((await storage.update('srv-1', {name: 'Renamed'})).name, 'Renamed');
  assert.equal((await storage.update('srv-1', {visibility: 'public'})).visibility, 'public');
  assert.deepEqual(await storage.delete('srv-1'), []);
  assert.deepEqual(api.calls.map((call) => `${call.method} ${call.path}`), ['PUT /presets/srv-1', 'PUT /presets/srv-1', 'DELETE /presets/srv-1']);
  assert.deepEqual(api.calls[0].body, {name: 'Renamed'}, 'only the changed fields are sent');
});

test('asset conversions are lossless', () => {
  const ir = {hash: 'h', kind: 'ir', name: 'cab.wav', samples: Float32Array.from(EXTERNAL_IR)};
  assert.deepEqual([...assetFromApi({hash: 'h', ...assetToApi(ir)}).samples], EXTERNAL_IR);
  assert.deepEqual(assetFromApi({hash: 'n', ...assetToApi({kind: 'nam', name: 'm.nam', data: '{"a":1}'})}), {hash: 'n', kind: 'nam', name: 'm.nam', data: '{"a":1}'});
  assert.throws(() => fromApi({format: 'nam-a2-preset', version: 1, id: 'x', name: '', rack: {}}), /name is required/);
});

test('an asset confirmed on the server is not asked again; clear() forgets everything (account change)', async () => {
  const api = fakeApi((call) => (call.method === 'HEAD' ? null : {hash: 'h', kind: 'nam', name: 'm.nam', data: '{}'}));
  const storage = new RemotePresetStorage({api});
  await storage.putAsset({hash: 'h', kind: 'nam', name: 'm.nam', data: '{}'});
  await storage.putAsset({hash: 'h', kind: 'nam', name: 'm.nam', data: '{}'});
  assert.equal(api.calls.filter((call) => call.method === 'HEAD').length, 1, 'one HEAD per hash and session');
  await storage.getAsset('h');
  storage.clear();
  await storage.getAsset('h');
  assert.equal(api.calls.filter((call) => call.method === 'GET').length, 2, 'after clear(), nothing from the previous account is reused');
  await storage.putAsset({hash: 'h', kind: 'nam', name: 'm.nam', data: '{}'});
  assert.equal(api.calls.filter((call) => call.method === 'HEAD').length, 2);
});

test('the memory cache keeps only the most recent assets', async () => {
  const api = fakeApi((call) => ({hash: call.path.split('/').at(-1), kind: 'nam', name: 'm.nam', data: '{}'}));
  const storage = new RemotePresetStorage({api});
  for (let i = 0; i < 40; i++) await storage.getAsset(`h${i}`);
  assert.ok(storage.assetMemory.size <= 16);
  assert.ok(storage.assetMemory.has('h39') && !storage.assetMemory.has('h0'));
});

test('public catalogue: search without account, copy with account', async () => {
  const api = fakeApi((call) => (call.method === 'POST'
    ? {...call, id: 'copy-1', name: 'Shared (copy)', format: 'nam-a2-preset', version: 1, tags: [], summary: {}, visibility: 'private',
      rack: {version: 2, a: {version: 1, entries: []}, b: null, visible: false, route: null, inputDbB: 0, outputDbA: 0, outputDbB: 0, mutedA: false, enabledB: false, panA: 0, panB: 0}}
    : {items: [{id: 'p1', name: 'Shared', author: {id: 'u2', username: 'eric'}, summary: {}, tags: [], visibility: 'public'}], page: 1, pages: 2, total: 13}));
  const storage = new RemotePresetStorage({api});
  const result = await storage.listPublic({q: '  big muff ', page: 1});
  assert.equal(result.total, 13);
  assert.equal(result.items[0].author.username, 'eric');
  const call = api.calls[0];
  assert.equal(call.path, '/presets/public?page=1&limit=12&q=big+muff');
  assert.notEqual(call.auth, true, 'browsing public presets needs no account');
  const copy = await storage.copyFrom('p1');
  assert.equal(copy.id, 'copy-1');
  assert.deepEqual([api.calls[1].method, api.calls[1].path, api.calls[1].auth], ['POST', '/presets/p1/copy', true]);
});
