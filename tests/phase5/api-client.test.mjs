import test from 'node:test';
import assert from 'node:assert/strict';
import {ApiClient, ApiError, tokenExpiry, SESSION_KEY} from '../../examples/wam/account/ApiClient.js';

// Faux JWT : seule la partie centrale (payload) est lue par le client, la signature est ignorée.
const jwt = (payload) => `header.${Buffer.from(JSON.stringify(payload)).toString('base64url')}.signature`;
const NOW = Date.parse('2026-10-10T10:00:00Z');
const VALID = jwt({sub: 'u1', exp: NOW / 1000 + 3600});
const EXPIRED = jwt({sub: 'u1', exp: NOW / 1000 - 60});
const USER = {id: 'u1', username: 'jimi', email: 'jimi@example.com'};

function memoryStorage(initial = {}) {
  const data = new Map(Object.entries(initial));
  return {data, getItem: (key) => data.get(key) ?? null, setItem: (key, value) => data.set(key, String(value)), removeItem: (key) => data.delete(key)};
}

/** Faux serveur : `routes` associe "MÉTHODE /chemin" à [status, corps]. Enregistre les appels. */
function fakeFetch(routes) {
  const calls = [];
  const fetch = async (url, options) => {
    calls.push({url, ...options, body: options.body ? JSON.parse(options.body) : undefined});
    const key = `${options.method} ${new URL(url).pathname}`;
    if (!(key in routes)) throw new TypeError('Failed to fetch');
    const [status, body] = routes[key];
    return {ok: status >= 200 && status < 300, status, text: async () => (body === undefined ? '' : JSON.stringify(body))};
  };
  return {fetch, calls};
}

const client = (routes, storage = memoryStorage()) => {
  const fake = fakeFetch(routes);
  return {api: new ApiClient({baseUrl: 'http://localhost:3000/api/', fetch: fake.fetch, storage, now: () => NOW}), calls: fake.calls, storage};
};

test('tokenExpiry reads the exp claim of a JWT, without the secret', () => {
  assert.equal(tokenExpiry(VALID), NOW + 3600 * 1000);
  assert.equal(tokenExpiry('not-a-jwt'), null);
});

test('login stores the session and sends the Bearer token afterwards', async () => {
  const {api, calls, storage} = client({'POST /api/auth/login': [200, {token: VALID, user: USER}], 'GET /api/users/me': [200, {...USER, username: 'Jimi'}]});
  let changes = 0;
  api.addEventListener('change', () => changes++);
  assert.equal(api.loggedIn, false);
  const user = await api.login({email: 'jimi@example.com', password: 'Password123'});
  assert.equal(user.username, 'jimi');
  assert.equal(api.loggedIn, true);
  assert.ok(changes >= 1, 'the interface is notified');
  assert.deepEqual(JSON.parse(storage.data.get(SESSION_KEY)), {token: VALID, user: USER});
  assert.equal(calls[0].url, 'http://localhost:3000/api/auth/login', 'no double slash');
  assert.equal(calls[0].headers.Authorization, undefined);
  assert.equal('password' in JSON.parse(storage.data.get(SESSION_KEY)).user, false, 'the password is never stored');

  const refreshed = await api.refresh();
  assert.equal(calls[1].headers.Authorization, `Bearer ${VALID}`);
  assert.equal(refreshed.username, 'Jimi', 'the profile is updated from the server');
});

test('the session survives a page reload, but not an expired token', () => {
  const kept = new ApiClient({baseUrl: 'http://x/api', fetch: async () => {}, storage: memoryStorage({[SESSION_KEY]: JSON.stringify({token: VALID, user: USER})}), now: () => NOW});
  assert.equal(kept.user.username, 'jimi');
  const storage = memoryStorage({[SESSION_KEY]: JSON.stringify({token: EXPIRED, user: USER})});
  const expired = new ApiClient({baseUrl: 'http://x/api', fetch: async () => {}, storage, now: () => NOW});
  assert.equal(expired.loggedIn, false);
  assert.equal(storage.data.has(SESSION_KEY), false, 'the expired session is removed');
  const broken = new ApiClient({baseUrl: 'http://x/api', fetch: async () => {}, storage: memoryStorage({[SESSION_KEY]: '{oops'}), now: () => NOW});
  assert.equal(broken.loggedIn, false);
});

test('a 401 on an authenticated request signs the user out and reports it', async () => {
  const storage = memoryStorage({[SESSION_KEY]: JSON.stringify({token: VALID, user: USER})});
  const {api} = client({'GET /api/users/me': [401, {message: 'Jeton invalide ou expiré'}]}, storage);
  let expired = false;
  api.addEventListener('expired', () => { expired = true; });
  await assert.rejects(api.refresh(), (error) => error instanceof ApiError && error.status === 401 && /expired/.test(error.message));
  assert.equal(api.loggedIn, false);
  assert.equal(expired, true);
  assert.equal(storage.data.has(SESSION_KEY), false);
});

test('a wrong password shows the server message and does not sign in', async () => {
  const {api} = client({'POST /api/auth/login': [401, {message: 'Email ou mot de passe incorrect'}]});
  await assert.rejects(api.login({email: 'a@b.co', password: 'bad'}), /Email ou mot de passe incorrect/);
  assert.equal(api.loggedIn, false);
});

test('register signs in; validation errors keep the server message', async () => {
  const ok = client({'POST /api/auth/register': [201, {token: VALID, user: USER}]});
  assert.equal((await ok.api.register({username: 'jimi', email: 'jimi@example.com', password: 'Password123'})).username, 'jimi');
  assert.deepEqual(ok.calls[0].body, {username: 'jimi', email: 'jimi@example.com', password: 'Password123'});
  const taken = client({'POST /api/auth/register': [409, {message: 'Ce pseudo est déjà pris'}]});
  await assert.rejects(taken.api.register({username: 'jimi', email: 'x@y.z', password: 'Password123'}), (error) => error.status === 409 && /pseudo/.test(error.message));
});

test('an unreachable server gives a clear message and keeps the local session', async () => {
  const storage = memoryStorage({[SESSION_KEY]: JSON.stringify({token: VALID, user: USER})});
  const {api} = client({}, storage);
  await assert.rejects(api.health(), (error) => error.status === 0 && /Cannot reach the server/.test(error.message));
  assert.equal(api.online, false);
  assert.equal((await api.refresh()).username, 'jimi', 'offline: still signed in locally');
});

test('profile update, logout, and protected calls without a session', async () => {
  const storage = memoryStorage({[SESSION_KEY]: JSON.stringify({token: VALID, user: USER})});
  const {api, calls} = client({'PUT /api/users/me': [200, {...USER, username: 'Hendrix'}]}, storage);
  assert.equal((await api.updateProfile({username: 'Hendrix'})).username, 'Hendrix');
  assert.equal(api.user.username, 'Hendrix');
  assert.equal(calls[0].method, 'PUT');
  api.logout();
  assert.equal(api.loggedIn, false);
  assert.equal(storage.data.has(SESSION_KEY), false);
  await assert.rejects(api.updateProfile({username: 'x'}), /sign in/);
  assert.throws(() => new ApiClient({baseUrl: ''}), /not configured/);
});

test('signing out while the profile is being refreshed keeps the user signed out', async () => {
  const storage = memoryStorage({[SESSION_KEY]: JSON.stringify({token: VALID, user: USER})});
  let release;
  const api = new ApiClient({baseUrl: 'http://x/api', storage, now: () => NOW,
    fetch: () => new Promise((resolve) => { release = () => resolve({ok: true, status: 200, text: async () => JSON.stringify(USER)}); })});
  const pending = api.refresh();
  api.logout();
  release();
  await pending;
  assert.equal(api.loggedIn, false, 'the late answer does not recreate a session without token');
  assert.equal(storage.data.has(SESSION_KEY), false);
});

test('account rules are shared and consistent', async () => {
  const {USERNAME_PATTERN, USERNAME_HINT} = await import('../../examples/wam/account/accountRules.js');
  assert.ok(USERNAME_PATTERN.test('Jimi_H.69-x'));
  assert.ok(!USERNAME_PATTERN.test('ab') && !USERNAME_PATTERN.test('a'.repeat(25)) && !USERNAME_PATTERN.test('nice name'));
  assert.match(USERNAME_HINT, /3–24/);
});
