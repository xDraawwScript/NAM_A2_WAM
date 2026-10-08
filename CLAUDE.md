# Instructions pour Claude Code — projet étudiant NAM_A2_WAM

Fork étudiant du projet de Michel Buffa (`upstream` = https://github.com/micbuffa/NAM_A2_WAM,
`origin` = https://github.com/xDraawwScript/NAM_A2_WAM). Objectif du mini-projet (TP4 Technos
Web, M1 MIAGE) : améliorer **l'hôte** WAM pour gérer **utilisateurs, connexions et presets
(sauvegarde/chargement)**. Le plan détaillé et l'avancement sont dans [`SUIVI.md`](SUIVI.md).

## Impératifs (ne jamais enfreindre)

1. **Ne pas modifier le code des plugins** : `src/` (nam-wam, cabinet-wam, nam-wasm, shared) et
   `examples/wam/wamPlugins/`. On peut les *importer* ou les *lire*, jamais les éditer. Les états
   se manipulent uniquement via `audioNode.getState()` / `audioNode.setState()` (plugin chargé).
2. **Tout nouveau fichier de l'hôte** (`examples/wam/*.js|.css`) doit être ajouté à la liste de
   copie de [`tools/build-static-dist.mjs`](tools/build-static-dist.mjs), sinon il manque dans
   `dist/` (et le test `tests/phase4a3/distribution.test.mjs` doit le vérifier).
3. **Les tests existants restent verts** (`npm test`) ; toute nouvelle fonctionnalité a ses
   tests unitaires (`tests/phase5/` pour l'hôte, `server/test/` pour le backend).
4. **Tenir [`SUIVI.md`](SUIVI.md) à jour à chaque étape** (pas seulement en fin de mission) :
   avancement, fichiers touchés et pourquoi, explications (schémas de flux, notions), décisions,
   problèmes, comment tester, résultats des tests. `REPORT.md` (rendu final) en est dérivé.
5. **Respecter la spec du prof** : [`SPECIFICATION_FX_CHAIN.md`](SPECIFICATION_FX_CHAIN.md) §7,
   §7.1, §7.2 — presets d'usine en lecture seule, stockage local IndexedDB derrière un adaptateur,
   assets modèles/IR adressés par hash et conservés s'ils sont encore référencés, migration de
   versions, plugins/assets manquants signalés, **aucun token ni identifiant de carte son dans un
   preset**, **le chargement d'un preset n'active jamais l'entrée live**.
6. **Pas de secret dans le code** : `server/.env` (non versionné) contient `MONGODB_URI` et
   `JWT_SECRET` ; fournir `server/.env.example`.

## Git

- Une branche `feature/<sujet>` par mission (créée depuis `develop`), jamais de travail direct sur `main` ni `develop`.
- En fin de mission (tests verts) : commit + `git push -u origin feature/<sujet>`.
- Messages de commit détaillés et compréhensibles : *quoi*, *pourquoi*, *comment tester*.
- Branche d'intégration `develop` : chaque `feature/...` terminée y est **fusionnée sans demander** (`git merge --no-ff`), puis `develop` est pushée. Les nouvelles features partent de `develop`.
- Ne jamais pousser sur `main` sans accord explicite de l'étudiant.
- Repo configuré en fins de ligne LF (`core.autocrlf=input`) : les scripts `.sh` sont exécutés
  dans WSL et cassent en CRLF.

## Build et tests (Windows + WSL)

- Les outils (emsdk, CMake, Ninja, Node 22) sont installés dans WSL Ubuntu ; les scripts npm du
  projet sont en bash. Depuis Windows :
  - `build.bat` (non versionné) ou `wsl bash -lc "cd /mnt/c/Users/NITRO/Projects/NAM_A2_WAM && npm run dist"`
  - `build.bat test` ou `wsl bash -lc "cd /mnt/c/Users/NITRO/Projects/NAM_A2_WAM && npm test"`
- Résultat : `dist/NAM_A2_WAM/index.html`, ouvert avec Live Server (VS Code).
- Backend `server/` (Node Windows) : `cd server && npm install`, `npm test` (MongoDB en mémoire),
  `npm start` (lit `server/.env`, port 3000). Contrat HTTP : `server/API_CONTRACT.md` — à mettre à
  jour à chaque route ajoutée ou modifiée.

## Architecture de l'hôte (`examples/wam/`)

- `main.js` : AudioContext 48 kHz, plugins NAM + Cabinet, `WamPluginRegistry`
  (`wamPlugins/plugins.json`), `FxChain` (chaîne A), `FxRack` (chaînes A/B), vues, tuner,
  backing tracks, Save/Restore diagnostic en mémoire.
- État : `FxRack.getState()` (v2) → `FxChain.captureState()` (v1, entrées
  `{id, kind, pluginUri, bypass, inputDb, outputDb, state}`) → `plugin.audioNode.getState()`.
- NAM : `state.model = {name, data (texte .nam ~300 Ko), contentHash (SHA-256)}`.
  Cabinet : `state.ir = {id ('factory:…' si usine), name, samples[], metadata}`.
  Manifestes d'usine avec `contentHash` : `src/nam-wam/models-manifest.json`,
  `src/cabinet-wam/irs-manifest.json`.
