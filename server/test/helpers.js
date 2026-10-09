// Outils communs aux tests de l'API : une vraie MongoDB lancée en mémoire (jamais Atlas),
// l'application Express sur un port libre, et des raccourcis pour appeler l'API.
import { MongoMemoryServer } from "mongodb-memory-server";
import mongoose from "mongoose";
import { createApp } from "../src/app.js";
import { loginLimiter, registerLimiter } from "../src/routes/auth.js";
import { dehydrateRack } from "../../examples/wam/presets/PresetAssets.js";
import { encodeAsset } from "../../examples/wam/presets/PresetFile.js";
import { createPreset } from "../../examples/wam/presets/PresetFormat.js";
import { makeRackState, makeFactory, makeAssetMap } from "../../tests/phase5/fixtures.mjs";

// Secret propre aux tests (le serveur refuse de démarrer sans JWT_SECRET).
process.env.JWT_SECRET ||= "test-only-secret";

// Les logs HTTP de l'API sont coupés pendant les tests pour garder une sortie lisible.
console.log = () => {};
console.warn = () => {};

export async function startApi() {
  const mongo = await MongoMemoryServer.create();
  await mongoose.connect(mongo.getUri(), { dbName: "nam-presets-test" });
  await mongoose.connection.syncIndexes();
  const server = createApp({ corsOrigins: ["http://127.0.0.1:5500"] }).listen(0);
  await new Promise((resolve) => server.once("listening", resolve));
  const base = `http://127.0.0.1:${server.address().port}`;

  /** Remet à zéro les compteurs anti force brute (les tests créent beaucoup de comptes depuis 127.0.0.1). */
  const resetLimits = () => { loginLimiter.reset(); registerLimiter.reset(); };

  /** Appel JSON de l'API. Retourne {status, body, headers}. `keepLimits` pour tester le limiteur. */
  async function api(path, { method = "GET", token, body, headers = {}, keepLimits = false } = {}) {
    if (!keepLimits) resetLimits();
    const response = await fetch(base + path, {
      method,
      headers: { ...(body !== undefined ? { "Content-Type": "application/json" } : {}), ...(token ? { Authorization: `Bearer ${token}` } : {}), ...headers },
      body: body === undefined ? undefined : typeof body === "string" ? body : JSON.stringify(body),
    });
    const textBody = method === "HEAD" ? "" : await response.text();
    return { status: response.status, body: textBody ? JSON.parse(textBody) : null, headers: response.headers };
  }

  let counter = 0;
  /** Crée un compte et retourne {token, user}. */
  async function register(username = `user${++counter}`) {
    const { status, body } = await api("/api/auth/register", { method: "POST", body: { username, email: `${username.toLowerCase()}@example.com`, password: "Password123" } });
    if (status !== 201) throw new Error(`register ${username}: ${status} ${JSON.stringify(body)}`);
    return body;
  }

  async function stop() {
    server.close();
    await mongoose.disconnect();
    await mongo.stop();
  }

  return { base, api, register, stop, resetLimits };
}

/**
 * Prépare un preset comme le fera l'hôte : rack déshydraté + assets externes au format de l'API.
 * Retourne {payload, assets} : `assets` = liste de {hash, body} à envoyer sur PUT /api/assets/:hash.
 */
export async function makePresetPayload(name = "My tone", options = {}) {
  const store = makeAssetMap();
  const { rack } = await dehydrateRack(await makeRackState(options), { factory: await makeFactory(), saveAsset: store.saveAsset });
  const preset = createPreset({ rack, name, tags: options.tags ?? ["rock"] });
  const assets = [...store.map.values()].map((asset) => ({
    hash: asset.hash,
    body: encodeAsset(asset),
  }));
  const { id, createdAt, updatedAt, ...payload } = preset;
  return { payload: { ...payload, visibility: options.visibility ?? "private" }, assets };
}

export async function uploadAssets(api, token, assets) {
  for (const asset of assets) {
    const { status } = await api(`/api/assets/${asset.hash}`, { method: "PUT", token, body: asset.body });
    if (status !== 201 && status !== 200) throw new Error(`asset upload: ${status}`);
  }
}
