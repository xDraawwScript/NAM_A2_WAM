# Contrat HTTP — API des comptes et presets NAM A2

Base : `http://localhost:3000/api`. Toutes les réponses sont en JSON (sauf `204` et `HEAD`).
Authentification : en-tête `Authorization: Bearer <token>` (JWT valable 12 h, obtenu à
l'inscription ou à la connexion). Sur les routes « JWT optionnel », un jeton expiré ou invalide est
ignoré (la requête est traitée comme celle d'un visiteur). Les erreurs ont toujours la forme
`{ "message": "…" }`, avec un message **en anglais** (affiché tel quel par l'interface de l'hôte).

CORS : seules les origines listées dans `CORS_ORIGINS` (par défaut Live Server
`http://127.0.0.1:5500` et `http://localhost:5500`) peuvent appeler l'API depuis un navigateur.

## Récapitulatif

| Méthode | Route | Auth | Rôle |
|---|---|---|---|
| GET | `/health` | — | L'API répond |
| POST | `/auth/register` | — | Créer un compte |
| POST | `/auth/login` | — | Se connecter |
| GET | `/users/me` | JWT | Mon profil |
| PUT | `/users/me` | JWT | Changer mon pseudo |
| GET | `/presets/mine` | JWT | Mes presets (liste) |
| GET | `/presets/public` | — | Presets publics (récents, recherche) |
| POST | `/presets` | JWT | Créer un preset |
| GET | `/presets/:id` | JWT optionnel | Lire un preset complet |
| PUT | `/presets/:id` | JWT (propriétaire) | Modifier un preset |
| DELETE | `/presets/:id` | JWT (propriétaire) | Supprimer un preset |
| POST | `/presets/:id/copy` | JWT | Copier un preset public dans mes presets |
| PUT | `/assets/:hash` | JWT | Envoyer un modèle / une IR externe |
| HEAD | `/assets/:hash` | JWT | L'asset existe-t-il déjà ? |
| GET | `/assets/:hash` | JWT optionnel | Lire un asset |

## Objets

**User (privé, pour soi)** : `{ id, username, email, createdAt }`
**Auteur (public)** : `{ id, username }` — l'email n'est **jamais** exposé aux autres.

**PresetCard** (listes, sans le rack) :
```json
{ "id": "…", "name": "Crunch rhythm", "description": "", "tags": ["rock"],
  "visibility": "private|public", "summary": { "chains": 1, "amp": "…", "cabinet": "…",
  "effects": ["BigMuff"], "chainA": [{ "kind": "effect", "name": "BigMuff", "bypass": false }], "chainB": [] },
  "size": 14231, "copiedFrom": null, "author": { "id": "…", "username": "demo" },
  "createdAt": "…", "updatedAt": "…" }
```
**Preset** (complet) = PresetCard + `{ "format": "nam-a2-preset", "version": 1, "rack": { … } }`.
`rack` est l'état `FxRack.getState()` de l'hôte, **déshydraté** : les modèles et IR y sont des
références `assetRef` (`{source:"factory", kind, id, contentHash}` ou `{source:"store", kind, hash}`),
jamais leurs données.

**Page<T>** : `{ items: T[], page, limit, total, pages }` — `page` ≥ 1, `limit` entre 1 et 50
(12 par défaut).

## Comptes

### POST `/auth/register`
Corps : `{ "username": "Jimi", "email": "jimi@example.com", "password": "…" }`
- `username` : 3 à 24 caractères `A-Z a-z 0-9 . _ -`, unique sans tenir compte de la casse ;
- `email` : valide, unique (stocké en minuscules) ;
- `password` : 8 à 128 caractères (stocké haché avec bcrypt).

Réponses : `201 { token, user: User }` · `400` champ invalide · `409` pseudo ou email déjà pris.

### POST `/auth/login`
Corps : `{ "email", "password" }` → `200 { token, user: User }` · `401` « Incorrect email or password »
(même message que le compte existe ou non).

### GET `/users/me` (JWT)
→ `200 User` · `401` jeton absent, invalide ou expiré.

### PUT `/users/me` (JWT)
Corps : `{ "username" }` → `200 User` · `400` pseudo invalide · `409` pseudo déjà pris.

## Presets

### GET `/presets/mine` (JWT)
Paramètres : `page`, `limit`. Tri : dernière modification d'abord. → `200 Page<PresetCard>`.

### GET `/presets/public`
Paramètres : `page`, `limit`, `q` (60 caractères max). Tri : création la plus récente d'abord
(« récemment ajoutés »). `q` cherche, sans tenir compte de la casse, dans le nom, les tags, l'ampli,
le cabinet, les pédales et le pseudo de l'auteur (saisie échappée). → `200 Page<PresetCard>`.

### POST `/presets` (JWT)
Corps : `{ format?, version?, name, description?, tags?, visibility?, rack, summary? }`
- validé avec les **mêmes règles que l'hôte** (`examples/wam/presets/PresetFormat.js`) : nom 1–80
  caractères, description ≤ 500, 10 tags max (≤ 24 caractères, minuscules, sans doublon), rack v2
  valide, identifiants de plugins uniques ;
- `visibility` : `private` (défaut) ou `public` ;
- le rack doit être **déshydraté** (pas de `model.data` ni `ir.samples`) et ≤ 256 Ko ;
- chaque asset `store` référencé doit avoir été envoyé avant (`PUT /assets/:hash`), **par
  l'utilisateur lui-même** ou être déjà utilisé par un preset public ou un de ses presets (connaître
  le hash d'un modèle privé d'un autre ne suffit pas) ;
- `summary` (optionnel) est nettoyé ; absent, il est recalculé par le serveur.

Réponses : `201 Preset` · `400` validation / données embarquées / asset manquant · `401` · `413`
trop volumineux.

### GET `/presets/:id` (JWT optionnel)
→ `200 Preset` si le preset est public ou appartient à l'utilisateur ; `404` sinon (un preset privé
d'un autre utilisateur est indiscernable d'un preset inexistant).

### PUT `/presets/:id` (JWT, propriétaire)
Corps : n'importe quel sous-ensemble de `{ name, description, tags, visibility, rack, summary }`
(mêmes règles que la création). Si le rack change, les assets devenus inutilisés sont supprimés.
→ `200 Preset` · `400` · `401` · `404` (inexistant ou pas à moi).

### DELETE `/presets/:id` (JWT, propriétaire)
→ `204`. Les assets que plus aucun preset n'utilise sont supprimés. · `401` · `404`.

### POST `/presets/:id/copy` (JWT)
Copie un preset **public** (ou un des miens) dans mes presets : nom `« <nom> (copy) »`, privé,
`copiedFrom` = id d'origine. → `201 Preset` · `401` · `404`.

## Assets (modèles et IR externes)

Les assets d'usine (livrés avec l'appli) ne passent **jamais** par l'API.

### PUT `/assets/:hash` (JWT)
`hash` = SHA-256 hexadécimal (64 caractères) du contenu. Corps (limite 12 Mo) :
- modèle : `{ "kind": "nam", "name": "capture.nam", "data": "<texte du .nam>" }` — hash du texte UTF-8 ;
- IR : `{ "kind": "ir", "name": "cab.wav", "samples": "<base64 des Float32 little-endian>" }` — hash des octets.

Le serveur **recalcule** le hash et refuse un contenu qui ne correspond pas. Si le même fichier est
déjà stocké (envoyé par quelqu'un d'autre), l'envoi du **bon contenu** prouve que l'utilisateur le
possède : il est ajouté aux propriétaires, **sans doublon**. Contenu ≤ 8 Mo ;
quota de 200 Mo d'assets par utilisateur. Le corps n'est lu qu'après vérification du jeton.
Un asset jamais rattaché à un preset est supprimé après 24 h.
Réponses : `201 { hash, created: true }` · `200 { hash, created: false }` (déjà présent : stocké une
seule fois) · `400` hash/kind/contenu invalide ou hash différent · `401` · `413` trop gros ou quota
atteint.

### HEAD `/assets/:hash` (JWT)
→ `200` si l'utilisateur peut **déjà utiliser** cet asset (il en est propriétaire, ou il sert à un
preset public ou à un de ses presets) · `404` sinon (absent, ou asset privé d'un autre : son existence
n'est pas révélée) · `400` hash invalide. Sur `404`, le client envoie le contenu avec `PUT`.

### GET `/assets/:hash` (JWT optionnel)
→ `200 { hash, kind, name, data | samples }` si l'asset est utilisé par un preset public, par un de
mes presets, ou si j'en suis propriétaire (je l'ai envoyé) ; `404` sinon.

## Codes d'erreur communs

`400` données invalides ou JSON mal formé · `401` authentification requise / jeton invalide ·
`404` ressource inconnue ou non autorisée · `409` conflit (pseudo/email) · `413` requête trop
volumineuse · `500` erreur interne (détail uniquement dans les logs du serveur).
