import test from "node:test";
import assert from "node:assert/strict";
import { startApi } from "./helpers.js";

let ctx;
test.before(async () => { ctx = await startApi(); });
test.after(() => ctx.stop());

test("health répond sans authentification", async () => {
  const { status, body } = await ctx.api("/api/health");
  assert.equal(status, 200);
  assert.deepEqual(body, { status: "ok" });
});

test("inscription : pseudo, email et mot de passe validés", async () => {
  const bad = [
    [{ username: "ab", email: "a@b.co", password: "Password123" }, /Username/],
    [{ username: "nice name", email: "a@b.co", password: "Password123" }, /Username/],
    [{ username: "valid", email: "", password: "Password123" }, /Email is required/],
    [{ username: "valid", email: "not-an-email", password: "Password123" }, /^Invalid email address$/],
    [{ username: "valid", email: "a@b.co", password: "short" }, /Password/],
  ];
  for (const [body, message] of bad) {
    const response = await ctx.api("/api/auth/register", { method: "POST", body });
    assert.equal(response.status, 400, JSON.stringify(body));
    assert.match(response.body.message, message);
  }
});

test("inscription puis connexion : le jeton ouvre /users/me, sans hash de mot de passe", async () => {
  const created = await ctx.api("/api/auth/register", { method: "POST", body: { username: "Jimi", email: "Jimi@Example.com", password: "Password123" } });
  assert.equal(created.status, 201);
  assert.ok(created.body.token);
  assert.deepEqual(Object.keys(created.body.user).sort(), ["createdAt", "email", "id", "username"]);
  assert.equal(created.body.user.email, "jimi@example.com");

  const login = await ctx.api("/api/auth/login", { method: "POST", body: { email: "JIMI@example.com", password: "Password123" } });
  assert.equal(login.status, 200);
  const me = await ctx.api("/api/users/me", { token: login.body.token });
  assert.equal(me.status, 200);
  assert.equal(me.body.username, "Jimi");
  assert.equal("passwordHash" in me.body, false);
});

test("pseudo unique sans tenir compte de la casse, email unique", async () => {
  await ctx.register("Stevie");
  const sameName = await ctx.api("/api/auth/register", { method: "POST", body: { username: "stevie", email: "other@example.com", password: "Password123" } });
  assert.equal(sameName.status, 409);
  assert.match(sameName.body.message, /username/);
  const sameEmail = await ctx.api("/api/auth/register", { method: "POST", body: { username: "Stevie2", email: "stevie@example.com", password: "Password123" } });
  assert.equal(sameEmail.status, 409);
  assert.match(sameEmail.body.message, /email/);
});

test("connexion refusée avec le même message, que l'email existe ou non", async () => {
  await ctx.register("Eric");
  const wrongPassword = await ctx.api("/api/auth/login", { method: "POST", body: { email: "eric@example.com", password: "nope-nope" } });
  const unknown = await ctx.api("/api/auth/login", { method: "POST", body: { email: "ghost@example.com", password: "Password123" } });
  assert.equal(wrongPassword.status, 401);
  assert.equal(unknown.status, 401);
  assert.equal(wrongPassword.body.message, unknown.body.message);
});

test("routes privées : 401 sans jeton ou avec un jeton invalide", async () => {
  assert.equal((await ctx.api("/api/users/me")).status, 401);
  assert.equal((await ctx.api("/api/users/me", { token: "abc.def.ghi" })).status, 401);
  assert.equal((await ctx.api("/api/users/me", { headers: { Authorization: "Basic xyz" } })).status, 401);
});

test("changement de pseudo, avec contrôle d'unicité", async () => {
  const { token } = await ctx.register("Brian");
  await ctx.register("Freddie");
  assert.equal((await ctx.api("/api/users/me", { method: "PUT", token, body: { username: "freddie" } })).status, 409);
  const renamed = await ctx.api("/api/users/me", { method: "PUT", token, body: { username: "BrianMay" } });
  assert.equal(renamed.status, 200);
  assert.equal(renamed.body.username, "BrianMay");
  assert.equal((await ctx.api("/api/users/me", { method: "PUT", token, body: { username: "x" } })).status, 400);
});

test("CORS : seule l'origine de Live Server est autorisée", async () => {
  const allowed = await fetch(`${ctx.base}/api/health`, { headers: { Origin: "http://127.0.0.1:5500" } });
  assert.equal(allowed.headers.get("access-control-allow-origin"), "http://127.0.0.1:5500");
  const denied = await fetch(`${ctx.base}/api/health`, { headers: { Origin: "http://evil.example" } });
  assert.equal(denied.headers.get("access-control-allow-origin"), null);
});

test("JSON invalide et route inconnue : erreurs propres", async () => {
  const invalid = await ctx.api("/api/auth/login", { method: "POST", body: "{oops" });
  assert.equal(invalid.status, 400);
  assert.equal(invalid.body.message, "Invalid JSON");
  assert.equal((await ctx.api("/api/nothing")).status, 404);
});

test("un jeton expiré ou invalide n'empêche pas de lire un contenu public", async () => {
  const response = await ctx.api("/api/presets/public", { token: "expired.or.invalid" });
  assert.equal(response.status, 200);
});

test("anti force brute : la 11e tentative de connexion en 15 min est refusée (429)", async () => {
  const statuses = [];
  for (let i = 0; i < 11; i++) {
    statuses.push((await ctx.api("/api/auth/login", { method: "POST", body: { email: "brute@example.com", password: `guess-${i}` }, keepLimits: true })).status);
  }
  assert.deepEqual(statuses.slice(0, 10), Array(10).fill(401));
  const blocked = await ctx.api("/api/auth/login", { method: "POST", body: { email: "brute@example.com", password: "again" }, keepLimits: true });
  assert.equal(blocked.status, 429);
  assert.ok(Number(blocked.headers.get("retry-after")) > 0);
});

test("anti création en masse : la 6e inscription en une heure est refusée (429)", async () => {
  const statuses = [];
  for (let i = 0; i < 6; i++) {
    statuses.push((await ctx.api("/api/auth/register", { method: "POST", body: { username: `Mass${i}`, email: `mass${i}@example.com`, password: "Password123" }, keepLimits: true })).status);
  }
  assert.deepEqual(statuses, [201, 201, 201, 201, 201, 429]);
});

test("mot de passe : au-delà de 72 octets, refusé (bcrypt ignorerait la fin)", async () => {
  const long = await ctx.api("/api/auth/register", { method: "POST", body: { username: "LongPass", email: "longpass@example.com", password: "a".repeat(73) } });
  assert.equal(long.status, 400);
  assert.match(long.body.message, /72/);
  const accents = await ctx.api("/api/auth/register", { method: "POST", body: { username: "Accents", email: "accents@example.com", password: "é".repeat(37) } });
  assert.equal(accents.status, 400, "37 « é » = 74 octets");
  assert.equal((await ctx.api("/api/auth/register", { method: "POST", body: { username: "Exact72", email: "exact72@example.com", password: "a".repeat(72) } })).status, 201);
});

test("un jeton signé avec un autre algorithme est refusé", async () => {
  const jwt = (await import("jsonwebtoken")).default;
  const { user } = await ctx.register("AlgoUser");
  const forged = jwt.sign({ sub: user.id }, process.env.JWT_SECRET, { algorithm: "HS512" });
  assert.equal((await ctx.api("/api/users/me", { token: forged })).status, 401);
});
