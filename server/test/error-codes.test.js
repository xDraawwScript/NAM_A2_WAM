// Mission 8 : chaque réponse d'erreur porte un `code` stable (traduit par l'interface),
// en plus du message anglais historique (rétrocompatible).
import test from "node:test";
import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import { startApi } from "./helpers.js";
import { ERROR_CODES } from "../src/errorCodes.js";

let ctx;
test.before(async () => { ctx = await startApi(); });
test.after(() => ctx.stop());

/** Vérifie statut + code, et que le message anglais est toujours là. */
function expectError(response, status, code) {
  assert.equal(response.status, status, JSON.stringify(response.body));
  assert.equal(response.body.code, code);
  assert.ok(ERROR_CODES.includes(response.body.code), `code non déclaré : ${response.body.code}`);
  assert.equal(typeof response.body.message, "string");
  assert.ok(response.body.message.length > 0);
}

test("tout code écrit dans le serveur est déclaré dans errorCodes.js", async () => {
  const files = [];
  for (const dir of ["src", "src/routes"]) {
    for (const name of await readdir(new URL(`../${dir}/`, import.meta.url))) if (name.endsWith(".js")) files.push(`../${dir}/${name}`);
  }
  const used = new Set();
  for (const file of files) {
    const source = await readFile(new URL(file, import.meta.url), "utf8");
    // new HttpError(400, "…", "le_code") et rateLimit({ …, code: "le_code" })
    for (const [, code] of source.matchAll(/new HttpError\([^;]*?,\s*"([a-z_]+)"\s*(?:,\s*\{[^}]*\})?\)/gu)) used.add(code);
    for (const [, code] of source.matchAll(/code(?:\s*=|:)\s*"([a-z_]+)"/gu)) used.add(code);
  }
  assert.ok(used.size >= 20, `trop peu de codes trouvés (${used.size}) : le scan est cassé`);
  for (const code of used) assert.ok(ERROR_CODES.includes(code), `code non déclaré : ${code}`);
  assert.equal(new Set(ERROR_CODES).size, ERROR_CODES.length, "codes en double");
});

test("erreurs de requête : route inconnue, JSON invalide, identifiant mal formé", async () => {
  expectError(await ctx.api("/api/nothing-here"), 404, "route_unknown");
  expectError(await ctx.api("/api/auth/login", { method: "POST", body: "{not json", headers: { "Content-Type": "application/json" } }), 400, "invalid_json");
  const { token } = await ctx.register();
  expectError(await ctx.api("/api/presets/not-an-id", { token }), 404, "preset_not_found");
});

test("inscription : un code par règle, et les limites du mot de passe en paramètres", async () => {
  const cases = [
    [{ username: "ab", email: "a@b.co", password: "Password123" }, 400, "auth_username_invalid"],
    [{ username: "valid", email: "", password: "Password123" }, 400, "auth_email_required"],
    [{ username: "valid", email: "not-an-email", password: "Password123" }, 400, "auth_email_invalid"],
    [{ username: "valid", email: "a@b.co", password: "short" }, 400, "auth_password_length"],
  ];
  for (const [body, status, code] of cases) expectError(await ctx.api("/api/auth/register", { method: "POST", body }), status, code);
  const short = await ctx.api("/api/auth/register", { method: "POST", body: { username: "valid", email: "a@b.co", password: "short" } });
  assert.deepEqual(short.body.params, { min: 8, max: 72 });

  await ctx.register("taken");
  expectError(await ctx.api("/api/auth/register", { method: "POST", body: { username: "TAKEN", email: "other@example.com", password: "Password123" } }), 409, "auth_username_taken");
  expectError(await ctx.api("/api/auth/register", { method: "POST", body: { username: "other", email: "taken@example.com", password: "Password123" } }), 409, "auth_email_taken");
});

test("connexion et jeton : mauvais identifiants, jeton absent ou invalide", async () => {
  expectError(await ctx.api("/api/auth/login", { method: "POST", body: { email: "nobody@example.com", password: "Password123" } }), 401, "auth_bad_credentials");
  expectError(await ctx.api("/api/users/me"), 401, "auth_required");
  expectError(await ctx.api("/api/users/me", { token: "not.a.jwt" }), 401, "auth_invalid_token");
});

test("limiteur de tentatives : code rate_login", async () => {
  ctx.resetLimits();
  let last;
  for (let i = 0; i < 11; i++) last = await ctx.api("/api/auth/login", { method: "POST", body: { email: "x@example.com", password: "Password123" }, keepLimits: true });
  expectError(last, 429, "rate_login");
  ctx.resetLimits();
});

test("presets et assets : codes de validation", async () => {
  const { token } = await ctx.register();
  expectError(await ctx.api("/api/presets", { method: "POST", token, body: { name: "x", rack: {} } }), 400, "preset_invalid");
  expectError(await ctx.api("/api/assets/xyz", { method: "PUT", token, body: { kind: "nam", data: "{}" } }), 400, "asset_invalid_hash");
  expectError(await ctx.api(`/api/assets/${"a".repeat(64)}`, { token }), 404, "asset_not_found");
});
