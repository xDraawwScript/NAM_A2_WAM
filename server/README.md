# NAM presets API (`server/`)

Backend of the NAM A2 WAM host: **user accounts, online presets (private or public) and shared
amp models / impulse responses**. Node.js + Express 5 + MongoDB (Mongoose 9), JWT authentication.

Part of the fork by Mathys Bellini--Le Gall — see the [root README](../README.md) for the whole
project. Full HTTP contract (bodies, limits, every error code): [`API_CONTRACT.md`](API_CONTRACT.md)
(in French).

## Contents

- [Quick start](#quick-start)
- [Configuration](#configuration)
- [Routes](#routes)
- [How it works](#how-it-works)
- [Data model](#data-model)
- [Security](#security)
- [Tests](#tests)
- [Project layout](#project-layout)

## Quick start

Requirements: Node.js 22 or newer, and a MongoDB database (MongoDB Atlas or a local `mongod`).

```sh
cd server
npm install
cp .env.example .env    # then fill the values, see Configuration
npm start
```

Check that the API answers: <http://localhost:3000/api/health> → `{"status":"ok"}`.

The host (`dist/NAM_A2_WAM/index.html`, served by Live Server on port 5500 for example) calls the
API at `http://localhost:3000/api` (`api.baseUrl` in
[`examples/wam/config.js`](../examples/wam/config.js)). In development a demo account is created
at startup: `demo@example.com` / `Demo1234!`.

## Configuration

`server/.env` is read by `node --env-file=.env` and is **never committed** (it is in `.gitignore`).
Start from [`.env.example`](.env.example).

| Variable | Required | Default | Purpose |
|---|---|---|---|
| `MONGODB_URI` | yes | — | MongoDB connection string (Atlas `mongodb+srv://…` or `mongodb://127.0.0.1:27017/`) |
| `MONGODB_DB` | no | `nam-presets` | Database name, used even if the URI names another database |
| `JWT_SECRET` | yes | — | Secret used to sign tokens: a long random string. The server refuses to start without it |
| `PORT` | no | `3000` | HTTP port |
| `CORS_ORIGINS` | no | `http://127.0.0.1:5500,http://localhost:5500` | Comma-separated page origins allowed to call the API from a browser |
| `SEED_DEMO` | no | `true` | Create the demo account at startup. Never created when `NODE_ENV=production` |

If the host is opened from another address (another port, a deployed site), add that origin to
`CORS_ORIGINS`, otherwise the browser blocks the calls.

## Routes

All routes are under `/api` and answer JSON (except `204` and `HEAD`). Authenticated routes expect
`Authorization: Bearer <token>`; the token is returned by sign-up and sign-in and is valid for
12 hours. On "optional JWT" routes an invalid or expired token is ignored and the request is
treated as a visitor's.

| Method | Route | Auth | Purpose |
|---|---|---|---|
| GET | `/health` | — | The API is up |
| POST | `/auth/register` | — | Create an account (`username`, `email`, `password`) |
| POST | `/auth/login` | — | Sign in (`email`, `password`) |
| GET | `/users/me` | JWT | My profile |
| PUT | `/users/me` | JWT | Change my username |
| GET | `/presets/mine` | JWT | My presets, most recently updated first (`?page=&limit=`) |
| GET | `/presets/public` | — | Public presets, newest first; search with `?q=` (name, tag, amp, pedal, author) |
| POST | `/presets` | JWT | Create a preset |
| GET | `/presets/:id` | optional JWT | Read a full preset (a private preset is visible to its owner only) |
| PUT | `/presets/:id` | JWT (owner) | Update a preset (name, description, tags, visibility, sound) |
| DELETE | `/presets/:id` | JWT (owner) | Delete a preset |
| POST | `/presets/:id/copy` | JWT | Copy a public preset into my presets (private copy) |
| PUT | `/assets/:hash` | JWT | Upload an amp model / IR identified by its SHA-256 hash |
| HEAD | `/assets/:hash` | JWT | Does this asset already exist? (avoids re-uploading it) |
| GET | `/assets/:hash` | optional JWT | Download an asset used by a preset I can read |

Lists are paginated: `page` (default 1) and `limit` (default 12, maximum 50).

Errors always look like:

```json
{ "message": "Preset not found", "code": "preset_not_found", "params": {} }
```

`message` is English (logs, `curl`); `code` is stable and is what the host translates into French
or English ([`src/errorCodes.js`](src/errorCodes.js)). A 500 error never contains internal
details.

Example with `curl`:

```sh
curl -s -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"demo@example.com","password":"Demo1234!"}'
# → {"token":"…","user":{"id":"…","username":"demo","email":"demo@example.com","createdAt":"…"}}
curl -s "http://localhost:3000/api/presets/public?q=marshall"
```

## How it works

```text
request → log → CORS → JSON body (1 MB, 12 MB for assets after the token check)
        → route → auth middleware → validation → Mongoose model → MongoDB
        → any error → central error handler (clear status + stable code)
```

- **Same rules as the browser.** Preset validation reuses the host's own modules
  (`examples/wam/presets/PresetFormat.js`, `examples/wam/account/accountRules.js`), so the
  browser and the server accept exactly the same presets, usernames and passwords.
- **Presets without heavy files.** A preset only stores *references* to amp models and IRs (their
  SHA-256 hash). Each model or IR is uploaded once as an asset and shared by every preset that
  uses it, so a preset weighs about 14 KB instead of about 850 KB. The client first asks
  `HEAD /assets/:hash` and only uploads missing files.
- **Asset ownership.** The server recomputes every hash. An asset can only be referenced by its
  owners, i.e. the users who uploaded its content (`owners`): knowing a hash is not enough. It can
  be downloaded by its owners or through a public preset; otherwise the answer is `404`.
- **Housekeeping.** Shortly after startup and then every hour, assets uploaded more than 24 hours
  ago but never attached to a preset are removed; an asset still used by another preset is kept.
- **Testable app.** [`src/app.js`](src/app.js) builds the Express app without opening a port;
  [`src/server.js`](src/server.js) connects to MongoDB, seeds the demo account and listens. Tests
  build the same app.

## Data model

| Collection | Main fields |
|---|---|
| `users` | `username` (public, unique ignoring case), `email` (private, unique, used to sign in), `passwordHash` (bcrypt, never returned) |
| `presets` | `ownerId`, `name`, `description`, `tags`, `visibility` (`private` / `public`), `format`, `version`, `summary` (amp, cabinet, effects — used by search and previews), `rack` (state of both chains, with asset references), `assetHashes`, `size`, `copiedFrom` |
| `assets` | `hash` (SHA-256, unique), `kind` (`nam` / `ir`), `name`, `size`, `bytes` (never listed), `uploadedBy`, `owners` |

## Security

Main measures (every measure, where it lives and the test that checks it: [`SECURITE.md`](../SECURITE.md),
in French):

- passwords hashed with bcrypt, 8 to 72 bytes (bcrypt ignores anything longer);
- JWT signed with HS256 only, secret read from `.env`;
- rate limiting per IP: 10 sign-in attempts per 15 minutes, 5 sign-ups per hour (`429`);
- someone else's private preset answers `404`, so its existence is not revealed;
- every input validated, search text escaped before being used in a regular expression;
- request size limits (1 MB, 256 KB per rack, 8 MB per asset) and a 200 MB asset quota per user;
- the email address is never exposed by any route; CORS limited to the configured origins.

## Tests

```sh
npm test
```

43 tests in [`test/`](test/), run one file at a time. Each run starts a **real MongoDB in memory**
(`mongodb-memory-server`): the tests never touch Atlas or any real database.

| File | What it covers |
|---|---|
| `auth.test.js` | Sign-up, sign-in, profile, username change, password rules, rate limiting, CORS, rejected tokens |
| `presets.test.js` | Create, read, update, delete, visibility, public list and search, copy, pagination |
| `assets.test.js` | Upload, hash check, ownership, download rights, shared assets, orphan cleanup, owner migration |
| `error-codes.test.js` | Stable error codes and their parameters |
| `host-integration.test.js` | End to end: the host's real preset code (`PresetManager`, `RemotePresetStorage`) against this API, including Explore |

## Project layout

```text
server/
  src/
    server.js        entry point: MongoDB connection, demo account, housekeeping, listen
    app.js           Express app: CORS, body limits, routers, central error handler
    auth.js          JWT creation and checks (requireAuth / optionalAuth), HttpError
    rateLimit.js     in-memory per-IP rate limiter
    validation.js    preset and pagination validation
    errorCodes.js    stable error codes
    models/          User, Preset, Asset (Mongoose)
    routes/          auth.js, presets.js, assets.js
  test/              node:test suites + helpers (in-memory MongoDB)
  API_CONTRACT.md    full HTTP contract (French)
  .env.example       configuration template
```
