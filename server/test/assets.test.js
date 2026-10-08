import test from "node:test";
import assert from "node:assert/strict";
import { startApi, makePresetPayload, uploadAssets } from "./helpers.js";
import { sha256Hex } from "../../examples/wam/presets/PresetAssets.js";
import { base64ToFloats } from "../../examples/wam/presets/PresetFile.js";
import { EXTERNAL_IR } from "../../tests/phase5/fixtures.mjs";

let ctx;
test.before(async () => { ctx = await startApi(); });
test.after(() => ctx.stop());

test("envoi d'un asset : le serveur recalcule le hash et refuse un contenu falsifié", async () => {
  const { token } = await ctx.register("Uploader");
  const data = JSON.stringify({ architecture: "WaveNet", weights: [1, 2, 3] });
  const hash = await sha256Hex(data);
  assert.equal((await ctx.api(`/api/assets/${hash}`, { method: "PUT", token, body: { kind: "nam", name: "a.nam", data: data + " " } })).status, 400);
  assert.equal((await ctx.api(`/api/assets/${hash}`, { method: "HEAD", token })).status, 404);
  const first = await ctx.api(`/api/assets/${hash}`, { method: "PUT", token, body: { kind: "nam", name: "a.nam", data } });
  assert.equal(first.status, 201);
  const again = await ctx.api(`/api/assets/${hash}`, { method: "PUT", token, body: { kind: "nam", name: "a.nam", data } });
  assert.equal(again.status, 200, "même contenu = même asset, stocké une seule fois");
  assert.equal(again.body.created, false);
  assert.equal((await ctx.api(`/api/assets/${hash}`, { method: "HEAD", token })).status, 200);
});

test("entrées invalides : hash mal formé, type inconnu, IR corrompue, sans jeton", async () => {
  const { token } = await ctx.register("BadInput");
  const hash = "a".repeat(64);
  assert.equal((await ctx.api("/api/assets/not-a-hash", { method: "PUT", token, body: { kind: "nam", data: "x" } })).status, 400);
  assert.equal((await ctx.api(`/api/assets/${hash}`, { method: "PUT", token, body: { kind: "video", data: "x" } })).status, 400);
  assert.equal((await ctx.api(`/api/assets/${hash}`, { method: "PUT", token, body: { kind: "ir", samples: "AAA" } })).status, 400);
  assert.equal((await ctx.api(`/api/assets/${hash}`, { method: "PUT", body: { kind: "nam", data: "x" } })).status, 401);
});

test("lecture d'un asset : autorisée via un preset public ou le sien, sinon 404", async () => {
  const owner = await ctx.register("AssetOwner");
  const other = await ctx.register("Other");
  const { payload, assets } = await makePresetPayload("With IR", { externalIr: true });
  await uploadAssets(ctx.api, owner.token, assets);
  const preset = (await ctx.api("/api/presets", { method: "POST", token: owner.token, body: payload })).body;
  const irHash = assets[0].hash;

  const mine = await ctx.api(`/api/assets/${irHash}`, { token: owner.token });
  assert.equal(mine.status, 200);
  assert.deepEqual([...base64ToFloats(mine.body.samples)], EXTERNAL_IR, "les échantillons reviennent à l'identique");
  assert.equal((await ctx.api(`/api/assets/${irHash}`, { token: other.token })).status, 404, "preset privé : asset invisible");
  assert.equal((await ctx.api(`/api/assets/${irHash}`)).status, 404);

  await ctx.api(`/api/presets/${preset.id}`, { method: "PUT", token: owner.token, body: { visibility: "public" } });
  assert.equal((await ctx.api(`/api/assets/${irHash}`)).status, 200, "preset public : asset lisible par tous");
});

test("un asset partagé par deux presets survit à la suppression de l'un d'eux", async () => {
  const { token } = await ctx.register("Sharer");
  const first = await makePresetPayload("A", { externalModel: true });
  const second = await makePresetPayload("B", { externalModel: true });
  await uploadAssets(ctx.api, token, first.assets);
  const hash = first.assets[0].hash;
  assert.equal(second.assets[0].hash, hash);
  const a = (await ctx.api("/api/presets", { method: "POST", token, body: first.payload })).body;
  const b = (await ctx.api("/api/presets", { method: "POST", token, body: second.payload })).body;
  await ctx.api(`/api/presets/${a.id}`, { method: "DELETE", token });
  assert.equal((await ctx.api(`/api/assets/${hash}`, { method: "HEAD", token })).status, 200, "encore utilisé par B");
  await ctx.api(`/api/presets/${b.id}`, { method: "DELETE", token });
  assert.equal((await ctx.api(`/api/assets/${hash}`, { method: "HEAD", token })).status, 404, "plus utilisé : supprimé");
});

test("remplacer le son d'un preset supprime l'ancien asset devenu inutile", async () => {
  const { token } = await ctx.register("Replacer");
  const external = await makePresetPayload("Ext", { externalModel: true });
  await uploadAssets(ctx.api, token, external.assets);
  const preset = (await ctx.api("/api/presets", { method: "POST", token, body: external.payload })).body;
  const factoryOnly = await makePresetPayload("Factory");
  const updated = await ctx.api(`/api/presets/${preset.id}`, { method: "PUT", token, body: { rack: factoryOnly.payload.rack } });
  assert.equal(updated.status, 200);
  assert.equal((await ctx.api(`/api/assets/${external.assets[0].hash}`, { method: "HEAD", token })).status, 404);
});

test("on ne peut pas référencer l'asset privé d'un autre en connaissant seulement son hash", async () => {
  const owner = await ctx.register("PrivateOwner");
  const thief = await ctx.register("Thief");
  const { payload, assets } = await makePresetPayload("Private model", { externalModel: true });
  await uploadAssets(ctx.api, owner.token, assets);
  await ctx.api("/api/presets", { method: "POST", token: owner.token, body: payload });
  const stolen = await ctx.api("/api/presets", { method: "POST", token: thief.token, body: payload });
  assert.equal(stolen.status, 400, "le hash d'un asset privé ne suffit pas");
  assert.equal((await ctx.api(`/api/assets/${assets[0].hash}`, { token: thief.token })).status, 404);
});

test("un envoi anonyme est refusé avant la lecture du corps (même volumineux)", async () => {
  const big = JSON.stringify({ kind: "nam", data: "x".repeat(5 * 1024 * 1024) });
  const response = await ctx.api(`/api/assets/${"b".repeat(64)}`, { method: "PUT", body: big });
  assert.equal(response.status, 401);
});

test("les assets envoyés mais jamais utilisés sont supprimés après 24 h", async () => {
  const { removeOrphanAssets } = await import("../src/routes/assets.js");
  const { token } = await ctx.register("Orphan");
  const data = JSON.stringify({ orphan: true });
  const hash = await sha256Hex(data);
  await ctx.api(`/api/assets/${hash}`, { method: "PUT", token, body: { kind: "nam", name: "o.nam", data } });
  assert.deepEqual(await removeOrphanAssets(), [], "trop récent : conservé");
  assert.ok((await removeOrphanAssets(Date.now() + 25 * 3600 * 1000)).includes(hash));
  assert.equal((await ctx.api(`/api/assets/${hash}`, { method: "HEAD", token })).status, 404);
});
