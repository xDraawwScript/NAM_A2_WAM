import test from "node:test";
import assert from "node:assert/strict";
import { startApi, makePresetPayload, uploadAssets } from "./helpers.js";

let ctx;
test.before(async () => { ctx = await startApi(); });
test.after(() => ctx.stop());

test("créer, lister, lire, modifier et supprimer mes presets", async () => {
  const { token, user } = await ctx.register("Owner1");
  const { payload } = await makePresetPayload("Clean Twin");
  const created = await ctx.api("/api/presets", { method: "POST", token, body: payload });
  assert.equal(created.status, 201);
  assert.equal(created.body.name, "Clean Twin");
  assert.equal(created.body.visibility, "private");
  assert.deepEqual(created.body.author, { id: user.id, username: "Owner1" });
  assert.deepEqual(created.body.rack, payload.rack);

  const mine = await ctx.api("/api/presets/mine", { token });
  assert.equal(mine.body.total, 1);
  assert.equal("rack" in mine.body.items[0], false, "les listes ne contiennent pas le rack");
  assert.equal(mine.body.items[0].author.username, "Owner1");

  const id = created.body.id;
  const updated = await ctx.api(`/api/presets/${id}`, { method: "PUT", token, body: { name: "Clean Twin v2", tags: ["Clean", "Jazz"], visibility: "public" } });
  assert.equal(updated.status, 200);
  assert.equal(updated.body.name, "Clean Twin v2");
  assert.deepEqual(updated.body.tags, ["clean", "jazz"]);
  assert.equal(updated.body.visibility, "public");
  assert.deepEqual(updated.body.rack, payload.rack, "une mise à jour partielle garde le rack");

  assert.equal((await ctx.api(`/api/presets/${id}`, { method: "DELETE", token })).status, 204);
  assert.equal((await ctx.api(`/api/presets/${id}`, { token })).status, 404);
});

test("un preset privé est invisible pour les autres (404), un public est lisible par tous", async () => {
  const alice = await ctx.register("Alice");
  const bob = await ctx.register("Bob");
  const { payload } = await makePresetPayload("Secret");
  const secret = (await ctx.api("/api/presets", { method: "POST", token: alice.token, body: payload })).body;
  assert.equal((await ctx.api(`/api/presets/${secret.id}`, { token: bob.token })).status, 404);
  assert.equal((await ctx.api(`/api/presets/${secret.id}`)).status, 404);
  assert.equal((await ctx.api(`/api/presets/${secret.id}`, { method: "PUT", token: bob.token, body: { name: "Hacked" } })).status, 404);
  assert.equal((await ctx.api(`/api/presets/${secret.id}`, { method: "DELETE", token: bob.token })).status, 404);

  await ctx.api(`/api/presets/${secret.id}`, { method: "PUT", token: alice.token, body: { visibility: "public" } });
  const asGuest = await ctx.api(`/api/presets/${secret.id}`);
  assert.equal(asGuest.status, 200);
  assert.equal(asGuest.body.author.username, "Alice");
  assert.equal("email" in asGuest.body.author, false, "l'email n'est jamais exposé");
});

test("validation : nom requis, visibilité, identifiant invalide, champs du format", async () => {
  const { token } = await ctx.register("Validator");
  const { payload } = await makePresetPayload("Valid");
  assert.equal((await ctx.api("/api/presets", { method: "POST", token, body: { ...payload, name: " " } })).status, 400);
  assert.equal((await ctx.api("/api/presets", { method: "POST", token, body: { ...payload, visibility: "friends" } })).status, 400);
  assert.equal((await ctx.api("/api/presets", { method: "POST", token, body: { ...payload, format: "other" } })).status, 400);
  assert.equal((await ctx.api("/api/presets", { method: "POST", token, body: { ...payload, rack: { version: 1 } } })).status, 400);
  assert.equal((await ctx.api("/api/presets/not-an-id", { token })).status, 404);
  assert.equal((await ctx.api("/api/presets", { method: "POST", body: payload })).status, 401);
});

test("le preset doit référencer ses assets, jamais les embarquer", async () => {
  const { token } = await ctx.register("Embedder");
  const { payload, assets } = await makePresetPayload("External", { externalModel: true, externalIr: true });
  const embedded = structuredClone(payload);
  embedded.rack.a.entries[1].state.model.data = "{}";
  const refused = await ctx.api("/api/presets", { method: "POST", token, body: embedded });
  assert.equal(refused.status, 400);
  assert.match(refused.body.message, /asset/);

  const missing = await ctx.api("/api/presets", { method: "POST", token, body: payload });
  assert.equal(missing.status, 400, "les assets n'ont pas encore été envoyés");
  assert.match(missing.body.message, /Missing asset/);

  await uploadAssets(ctx.api, token, assets);
  assert.equal((await ctx.api("/api/presets", { method: "POST", token, body: payload })).status, 201);
});

test("presets publics : récents d'abord, pagination et recherche (nom, tag, ampli, pédale, auteur)", async () => {
  const { token } = await ctx.register("Searcher");
  const names = ["Blues Lead", "Metal Rhythm", "Ambient Pad", "Private One"];
  for (const name of names) {
    const { payload } = await makePresetPayload(name, { visibility: name.startsWith("Private") ? "private" : "public", tags: [name.split(" ")[0]] });
    await ctx.api("/api/presets", { method: "POST", token, body: payload });
  }
  const all = await ctx.api("/api/presets/public?limit=2");
  assert.equal(all.status, 200);
  assert.ok(all.body.total >= 3);
  assert.equal(all.body.items.length, 2);
  assert.ok(all.body.items.every((item) => item.author?.username));
  assert.ok(!JSON.stringify(all.body).includes("Private One"));
  const byName = await ctx.api("/api/presets/public?q=metal");
  assert.deepEqual(byName.body.items.map((item) => item.name), ["Metal Rhythm"]);
  const byTag = await ctx.api("/api/presets/public?q=ambient");
  assert.deepEqual(byTag.body.items.map((item) => item.name), ["Ambient Pad"]);
  const byEffect = await ctx.api("/api/presets/public?q=bigmuff");
  assert.ok(byEffect.body.total >= 3, "recherche dans les pédales du résumé");
  const byAuthor = await ctx.api("/api/presets/public?q=searcher");
  assert.equal(byAuthor.body.total, 3);
  const regexInjection = await ctx.api(`/api/presets/public?q=${encodeURIComponent(".*")}`);
  assert.equal(regexInjection.body.total, 0, "la saisie est échappée");
});

test("copier un preset public dans mes presets (privé), pas un preset privé d'autrui", async () => {
  const author = await ctx.register("Author");
  const reader = await ctx.register("Reader");
  const pub = (await ctx.api("/api/presets", { method: "POST", token: author.token, body: (await makePresetPayload("Shared", { visibility: "public" })).payload })).body;
  const priv = (await ctx.api("/api/presets", { method: "POST", token: author.token, body: (await makePresetPayload("Mine only")).payload })).body;
  const copy = await ctx.api(`/api/presets/${pub.id}/copy`, { method: "POST", token: reader.token });
  assert.equal(copy.status, 201);
  assert.equal(copy.body.name, "Shared (copy)");
  assert.equal(copy.body.visibility, "private");
  assert.equal(copy.body.copiedFrom, pub.id);
  assert.equal(copy.body.author.username, "Reader");
  assert.deepEqual(copy.body.rack, pub.rack);
  assert.equal((await ctx.api(`/api/presets/${priv.id}/copy`, { method: "POST", token: reader.token })).status, 404);
});
