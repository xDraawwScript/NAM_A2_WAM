// Test de bout en bout de la mission 4 : le VRAI code du navigateur (ApiClient, RemotePresetStorage,
// PresetManager) parle au VRAI serveur (Express + MongoDB en mémoire). Seuls le rack audio
// (FakeRack) et l'IndexedDB du navigateur (fake-indexeddb) sont simulés.
import test from "node:test";
import assert from "node:assert/strict";
import { IDBFactory } from "fake-indexeddb";
import { startApi } from "./helpers.js";
import { ApiClient } from "../../examples/wam/account/ApiClient.js";
import { RemotePresetStorage } from "../../examples/wam/presets/RemotePresetStorage.js";
import { PresetManager } from "../../examples/wam/presets/PresetManager.js";
import { IndexedDbPresetStorage } from "../../examples/wam/presets/PresetStorage.js";
import { makeRackState, makeFactory, FakeRack } from "../../tests/phase5/fixtures.mjs";

let ctx;
test.before(async () => { ctx = await startApi(); });
test.after(() => ctx.stop());

/** Un « navigateur » complet : client API + manager de presets + rack simulé. */
async function browser(username, rackOptions) {
  const storage = new Map();
  const api = new ApiClient({
    baseUrl: `${ctx.base}/api`,
    storage: { getItem: (k) => storage.get(k) ?? null, setItem: (k, v) => storage.set(k, v), removeItem: (k) => storage.delete(k) },
  });
  ctx.resetLimits(); // anti force brute : beaucoup de comptes créés depuis 127.0.0.1 pendant les tests
  if (username) await api.register({ username, email: `${username.toLowerCase()}@example.com`, password: "Password123" });
  const rack = new FakeRack(await makeRackState(rackOptions));
  const local = new IndexedDbPresetStorage({ indexedDB: new IDBFactory() });
  const manager = new PresetManager({ rack, storage: local, factory: await makeFactory(), checkDelay: 0 });
  const online = new RemotePresetStorage({ api, cache: local });
  if (api.loggedIn) manager.setAccountStorage(online);
  return { api, rack, manager, local, online };
}

test("save online, change the sound, load it back: identical rack, assets uploaded once", async () => {
  const { rack, manager } = await browser("E2eSaver", { externalModel: true, externalIr: true, withB: true });
  const original = await rack.getState();
  const saved = await manager.saveAs({ name: "Two amps online", tags: ["stereo"] });
  assert.equal(manager.current.source, "account");
  const again = await manager.saveAs({ name: "Same sound, second preset" });
  assert.notEqual(again.id, saved.id);

  rack.state.a.entries[1].state.parameterValues.bass.value = 0;
  const { warnings } = await manager.load(saved.id);
  assert.deepEqual(warnings, []);
  const { sourceTrim, ...expected } = original;
  assert.deepEqual(rack.setStates.at(-1), expected, "A + B + routing restored from the server");

  const mine = await ctx.api("/api/presets/mine", { token: (await ctx.api("/api/auth/login", { method: "POST", body: { email: "e2esaver@example.com", password: "Password123" } })).body.token });
  assert.equal(mine.body.total, 2);
  assert.ok(mine.body.items.every((item) => item.size < 20000), "presets stay light on the server (references, not data)");
});

test("another user can load a public preset (with its external assets) but not a private one", async () => {
  const author = await browser("E2eAuthor", { externalModel: true });
  const pub = await author.manager.saveAs({ name: "Shared tone", visibility: "public" });
  const priv = await author.manager.saveAs({ name: "Secret tone" });

  const reader = await browser("E2eReader");
  const loaded = await reader.online.get(pub.id);
  assert.equal(loaded.author.username, "E2eAuthor");
  reader.manager.source = "account";
  const { warnings } = await reader.manager.load(pub.id);
  assert.deepEqual(warnings, [], "the reader downloads the external model of a public preset");
  assert.equal(reader.rack.state.a.entries[1].state.model.name, "My capture.nam");
  assert.equal(await reader.online.get(priv.id), null, "a private preset is invisible to others");
});

test("visibility, rename, update and delete through the manager", async () => {
  const { rack, manager, online } = await browser("E2eEditor");
  const saved = await manager.saveAs({ name: "Draft" });
  await manager.setVisibility(saved.id, "public");
  assert.equal((await online.get(saved.id)).visibility, "public");
  await manager.rename(saved.id, "Final");
  assert.equal(manager.current.name, "Final");
  rack.state.a.entries[0].state.parameterValues.drive.value = 0.05;
  assert.equal(await manager.checkDirty(), true);
  await manager.overwrite();
  assert.equal((await online.get(saved.id)).rack.a.entries[0].state.parameterValues.drive.value, 0.05);
  assert.equal(await manager.checkDirty(), false);
  await manager.remove(saved.id);
  assert.equal(manager.current, null);
  assert.deepEqual(await manager.list("account"), []);
});

test("guest presets copied to a new account: still in the browser, loadable online", async () => {
  const guest = await browser(null, { externalIr: true });
  await guest.manager.saveAs({ name: "Guest A" });
  await guest.manager.saveAs({ name: "Guest B" });
  ctx.resetLimits();
  await guest.api.register({ username: "E2eGuest", email: "e2eguest@example.com", password: "Password123" });
  guest.manager.setAccountStorage(guest.online);
  const ids = (await guest.manager.list("browser")).map((preset) => preset.id);
  const result = await guest.manager.copyToAccount(ids);
  assert.deepEqual(result.copied.sort(), ["Guest A", "Guest B"]);
  assert.equal((await guest.manager.list("browser")).length, 2, "copy, not move");
  const online = await guest.manager.list("account");
  assert.equal(online.length, 2);
  const { warnings } = await guest.manager.load(online[0].id, "account");
  assert.deepEqual(warnings, []);
});

test("an expired session falls back to the browser tab without losing the sound", async () => {
  const { api, rack, manager } = await browser("E2eExpired");
  const saved = await manager.saveAs({ name: "Before expiry" });
  api.session = { ...api.session, token: "invalid.token.value" };
  // Le manager est rebranché/débranché par main.js sur l'événement 'change' de l'ApiClient.
  api.addEventListener("change", () => manager.setAccountStorage(api.loggedIn ? manager.storages.account : null));
  await assert.rejects(manager.list("account"), (error) => error.status === 401);
  assert.equal(api.loggedIn, false);
  assert.equal(manager.source, "browser");
  assert.equal(manager.current, null, "the online preset is detached");
  assert.ok(rack.state.a.entries.length > 0, "the sound itself is untouched");
  assert.ok(saved.id);
});

test("Explore : un invité cherche et charge un preset public, puis se connecte et le copie", async () => {
  const author = await browser("E2eExplorer", { externalModel: true, externalIr: true });
  await author.manager.saveAs({ name: "Explore me", tags: ["blues"], visibility: "public" });
  await author.manager.saveAs({ name: "Hidden draft" }); // privé : ne doit jamais apparaître

  const guest = await browser(null);
  guest.manager.setPublicStorage(new RemotePresetStorage({ api: guest.api }));
  guest.manager.setSource("public");
  const byAuthor = await guest.manager.searchPublic({ q: "e2eexplorer" });
  assert.deepEqual(byAuthor.items.map((item) => item.name), ["Explore me"], "search by author, private presets excluded");
  assert.equal((await guest.manager.searchPublic({ q: "blues" })).items[0].author.username, "E2eExplorer");

  const { warnings } = await guest.manager.load(byAuthor.items[0].id, "public");
  assert.deepEqual(warnings, [], "a guest downloads the external model and IR of a public preset");
  assert.equal(guest.manager.current.source, "public");
  await assert.rejects(guest.manager.overwrite(), /read-only/);
  await assert.rejects(guest.manager.copyPublic(byAuthor.items[0].id), /Sign in/);

  ctx.resetLimits();
  await guest.api.register({ username: "E2eCopier", email: "e2ecopier@example.com", password: "Password123" });
  guest.manager.setAccountStorage(guest.online);
  assert.equal(guest.manager.source, "public", "stays on Explore after signing in");
  const copy = await guest.manager.copyPublic(byAuthor.items[0].id);
  assert.equal(copy.name, "Explore me (copy)");
  assert.equal(copy.visibility, "private");
  const mine = await guest.manager.list("account");
  assert.deepEqual(mine.map((item) => item.name), ["Explore me (copy)"]);
  const loaded = await guest.manager.load(copy.id, "account");
  assert.deepEqual(loaded.warnings, [], "the copy is loadable and editable from My account");
  guest.rack.state.a.entries[0].state.parameterValues.drive.value = 0.11;
  await guest.manager.overwrite();
  assert.equal((await guest.online.get(copy.id)).rack.a.entries[0].state.parameterValues.drive.value, 0.11);
});
