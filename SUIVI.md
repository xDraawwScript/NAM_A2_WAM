# Suivi du projet — Hôte NAM A2 WAM avec utilisateurs et presets

> Journal de bord tenu **au fil de l'eau** : ce qui est fait, pourquoi, comment ça marche,
> comment le tester. Le rendu final pour le prof est [`REPORT.md`](REPORT.md), rédigé à partir
> de ce fichier. Règles du projet : [`CLAUDE.md`](CLAUDE.md).

## Sommaire

1. [Le sujet](#1-le-sujet)
2. [Tableau d'avancement](#2-tableau-davancement)
3. [Comprendre l'architecture existante](#3-comprendre-larchitecture-existante)
4. [Journal des missions](#4-journal-des-missions)
5. [Mémo pratique](#5-mémo-pratique)
6. [Reste à faire / idées](#6-reste-à-faire--idées)

---

## 1. Le sujet

**Diapo TP4 « Début du projet »** (M1 MIAGE, Technos Web) : mini-projet libre à partir du
prototype (gestion d'utilisateurs + fichiers). Avant de coder, définir avec l'assistant IA :
fonctionnalités, interfaces, choix techniques, découpage en tâches. Ajouter des **tests unitaires**
pour toutes les nouvelles fonctionnalités et rédiger un **`REPORT.md`**.

**Mail du prof (Michel Buffa)** :
- repo : https://github.com/micbuffa/NAM_A2_WAM — démo : https://mainline.i3s.unice.fr/NAM_A2_WAM/
- d'abord faire marcher `npm run dist` et ouvrir `dist/.../index.html` avec Live Server ;
- `index.html` est un **hôte** (code dans `examples/wam`), les **plugins** sont dans
  `examples/wam/wamPlugins`, plus deux cas particuliers : l'**ampli à réseau de neurones**
  (`src/nam-wam`) et la **simulation de haut-parleur** (`src/cabinet-wam`) ;
- **ne rien toucher dans le code des plugins** ; faire une **version améliorée de l'hôte** qui gère
  **utilisateurs / connexions / presets (load/save)** ;
- les plugins sont des **Web Audio Modules (WAM)** avec `getState()` / `setState()` pour capturer et
  restaurer leur état (ils doivent être chargés).

**Spec du prof déjà existante** : [`SPECIFICATION_FX_CHAIN.md`](SPECIFICATION_FX_CHAIN.md) §7.2
« Factory and user presets » décrit cette phase, mise en attente dans son propre travail. On s'y
aligne (voir mission 0).

### Choix validés (fonctionnalités, interface, technique)

| Sujet | Choix | Pourquoi |
|---|---|---|
| Périmètre | Comptes + presets privés/publics (recherche, récents, copie) + presets d'usine. Pas d'amis. | Bon équilibre effort/rendu ; colle au diapo (fichiers publics/privés, recherche, récents) et à la spec. |
| Interface | JavaScript vanilla (modules ES) intégré à l'hôte, dialogs `<dialog>` | L'hôte est déjà en vanilla ; Angular imposerait de tout réécrire et casserait le build. |
| Stockage local | IndexedDB derrière un **adaptateur** (même interface que le backend) | Exigé par la spec ; localStorage est trop petit (~5 Mo) pour des presets de ~1 Mo. |
| Modèles / IR | **Adressés par hash**, partagés entre presets | Un preset brut pèse ~1 Mo (modèle .nam ~300 Ko + IR jusqu'à ~500 Ko) ; avec des références il pèse quelques Ko. |
| Backend | Celui du TP1-3 (Express 5, Mongoose, bcrypt, JWT) dans `server/` | Déjà maîtrisé et testé. |
| Base | Cluster Atlas du TP, base séparée `nam-presets` | Pas d'installation ; pas de mélange avec le TP. |
| Tests | `node --test` (hôte : `tests/phase5/`, backend : `server/test/` + mongodb-memory-server) | Même outil que le projet du prof et le TP. |
| Git | Une branche `feature/...` par mission (depuis `develop`), commit + push auto, puis **merge auto dans `develop`** ; `main` seulement sur accord | Historique lisible sur GitHub ; `develop` = version intégrée en cours. |
| Langue de l'interface | Anglais | Cohérent avec l'hôte existant (*Amplifier rack*, *Tuner*…). |
| Contenu d'un preset | Tout le rack : chaînes A **et** B, pan, mute, routage A→B. **Sans** backing track ni gain d'entrée (trim) | Le trim dépend de la guitare / carte son, pas du son ; la backing track est un choix de séance. |
| Identité publique | Inscription avec un **pseudo unique** (affiché comme auteur des presets publics), un **email privé** (sert à se connecter, jamais renvoyé par les routes publiques) et un mot de passe | Protéger l'email des utilisateurs tout en signant les presets publics. |
| MCP | Aucun serveur MCP supplémentaire | Pas nécessaire ; on vérifie via les tests, l'API et le navigateur intégré. |
| Skills | Navigateur intégré (vérifs visuelles), `/code-review`, `/security-review`, `/simplify` | Vérifier l'UI réelle et relire le code sécurité (JWT, droits). |

---

## 2. Tableau d'avancement

Légende : ✅ fait · 🔄 en cours · ⏳ à faire

| # | Mission (branche) | État | Date | Commit |
|---|---|---|---|---|
| — | Installation, build, fork (avant le plan) | ✅ | 2026-10-08 | — |
| 0 | Organisation (`feature/organisation`) | ✅ | 2026-10-08 | voir `git log feature/organisation` |
| 1 | Format + presets locaux IndexedDB + assets par hash (`feature/presets-locaux`) | ✅ | 2026-10-08 | voir `git log feature/presets-locaux` |
| 2 | Backend presets + assets (`feature/backend-presets`) | ✅ | 2026-10-09 | voir `git log feature/backend-presets` |
| 3 | Comptes dans l'hôte (`feature/comptes`) | ✅ | 2026-10-10 | voir `git log feature/comptes` |
| 4 | Presets en ligne (`feature/presets-en-ligne`) | ⏳ | | |
| 5 | Explorer les presets publics (`feature/explorer-public`) | ⏳ | | |
| 6 | Presets d'usine (`feature/presets-usine`) | ⏳ | | |
| 7 | Finitions, relectures, REPORT.md (`feature/finitions`) | ⏳ | | |

### Détail mission 0

- ✅ Lecture du diapo, du mail, du code de l'hôte et de la spec §7.2
- ✅ Branche `feature/organisation`, fins de ligne LF forcées pour ce repo
- ✅ `.gitignore` (build.bat, `server/.env`, `server/node_modules`)
- ✅ `CLAUDE.md` (règles du projet)
- ✅ `SUIVI.md` (ce fichier)
- ✅ Squelette `REPORT.md`
- ✅ Commit + push (tests : 146/146)

### Détail mission 1

- ✅ Étude : comment NAM et Cabinet chargent leurs modèles et IR d'usine (`src/shared/defaultAssets.js`),
  ce que contient leur state, contraintes des tests existants
- ✅ `examples/wam/presets/PresetFormat.js` — format, validation, migration, résumé
- ✅ `examples/wam/presets/PresetAssets.js` — modèles/IR ↔ références par hash
- ✅ `examples/wam/presets/PresetStorage.js` — IndexedDB (presets + assets partagés)
- ✅ `examples/wam/presets/PresetFile.js` — export/import `.json` vérifié
- ✅ `examples/wam/presets/PresetManager.js` — enregistrer / charger / « modifié »
- ✅ Tests `tests/phase5/` (avec `fake-indexeddb`)
- ✅ `PresetView.js` (dialog) + bouton dans `index.html` + câblage `main.js` + `presets.css`
- ✅ `tools/build-static-dist.mjs` (copie + vérification des fichiers) + test d'intégration
- ✅ Correctif « modifié » : empreinte du son au lieu des seuls événements (voir journal)
- ✅ Vérification dans le vrai navigateur (plugins réels) — tests : **176/176**
- ✅ Commit, push, merge dans `develop`

### Détail mission 2

- ✅ Décision : pseudo unique public + email privé
- ✅ `server/` : `package.json`, modèles `User` / `Preset` / `Asset`, `auth.js` (JWT), `validation.js`
  (réutilise `PresetFormat.js`), routes `auth` / `presets` / `assets`, `app.js`, `server.js`
- ✅ Tests `server/test/` avec MongoDB en mémoire : 24/24
- ✅ `server/API_CONTRACT.md`, `server/.env.example`, `server/.env` (non versionné)
- ✅ Test manuel du vrai serveur (MongoDB locale, base temporaire supprimée ensuite)
- ✅ Relecture `/code-review` : 10 points relevés, tous corrigés et testés
- ✅ Connexion Atlas refusée (IP non autorisée) → IP ajoutée par l'étudiant le 2026-10-09, connexion vérifiée
- ✅ Commit, push, merge dans `develop`

### Détail mission 3

- ✅ `ApiClient.js` (session, JWT, erreurs, serveur injoignable) + 10 tests
- ✅ `AccountView.js` + `account.css` (connexion, inscription, profil, déconnexion)
- ✅ `accountRules.js` partagé client/serveur, `ui/el.js` partagé entre les fenêtres
- ✅ `config.js` (`api.baseUrl`), bouton dans `index.html`, câblage `main.js`, build
- ✅ Messages de l'API en anglais (choix de l'étudiant)
- ✅ Vérification dans le navigateur avec le vrai backend
- ✅ Relecture `/code-review` : 8 points traités
- ✅ Tests : hôte 190/190, backend 24/24 — commit, push, merge dans `develop`

---

## 3. Comprendre l'architecture existante

### 3.1 Qu'est-ce qu'un WAM ?

Un **Web Audio Module** est un plugin audio pour le navigateur (l'équivalent web d'un VST). Il
expose un `audioNode` que l'on branche dans le graphe Web Audio comme n'importe quel nœud, et une
GUI optionnelle (`createGui()`). Son **état** (valeurs des boutons, modèle chargé…) se lit avec
`audioNode.getState()` et se remet avec `audioNode.setState(state)`. C'est **la seule porte
d'entrée** que l'hôte utilise : on ne lit jamais l'intérieur du plugin.

Certains plugins sont compilés depuis du C++ en **WebAssembly** (`.wasm`) : c'est le cas du
moteur NAM (réseau de neurones qui imite un ampli réel) et du cabinet (convolution par une
**IR**, *impulse response* = « empreinte sonore » d'un haut-parleur + micro).

### 3.2 Le chemin du son

```
Guitare (entrée live) ou fichier audio DI
        │
        ▼
  INPUT · A (gain)  ──►  [pédales…]  ──►  NAM (ampli)  ──►  [pédales…]  ──►  Cabinet (HP)  ──►  OUTPUT (volume, pan)
                                                                                                      │
                                                         Backing track (mixée après l'ampli) ───────►─┤
                                                                                                      ▼
                                                                                               Haut-parleurs
```

Une 2ᵉ chaîne **B** peut être affichée (mode « full ») : entrée indépendante ou branchée sur A.

### 3.3 Les fichiers de l'hôte (`examples/wam/`)

| Fichier | Rôle |
|---|---|
| `index.html` | La page : header du rack, chaîne A, panneau latéral (source audio, session) |
| `main.js` | Point d'entrée : crée l'`AudioContext` (48 kHz), instancie NAM + Cabinet, charge le catalogue de plugins, crée la chaîne, branche tous les boutons |
| `WamPluginRegistry.js` | Lit `wamPlugins/plugins.json` et sait instancier un plugin du catalogue |
| `FxChain.js` | **Une chaîne** : liste ordonnée de plugins (insérer, retirer, déplacer, bypass) + son état |
| `FxRack.js` | **Le rack** : chaînes A et B, pan, mute, routage A→B + son état |
| `FxRackView.js`, `FxChainView.js`, `PluginCard.js` | Affichage des cartes de plugins |
| `SourceManager.js` | Entrée live (micro / carte son) ou lecteur de fichiers |
| `TunerView.js` | Accordeur dans un `<dialog>` (modèle pour nos futurs dialogs) |
| `backing-track-player/` | Lecteur d'accompagnements |
| `config.js` | Configuration publique (TONE3000) — on y ajoutera l'URL de l'API |

### 3.4 Comment l'état est capturé (la base des presets)

```
FxRack.getState()            → { version: 2, a: <chaîne A>, b: <chaîne B|null>, panA, panB, route, gains, sourceTrim… }
  └─ FxChain.captureState()  → { version: 1, entries: [ {id, kind, pluginUri, bypass, inputDb, outputDb, state}, … ] }
       └─ plugin.audioNode.getState()   → état propre au plugin
            · NAM     : { parameterValues, model: { name, data: <texte .nam ~300 Ko>, contentHash }, … }
            · Cabinet : { parameterValues, ir: { id: 'factory:…', name, samples: [ …nombres… ] }, routingMode, … }
            · pédale  : { parameterValues } (quelques Ko)
```

La restauration fait le chemin inverse (`FxRack.setState` → `FxChain.restoreState` → `setState` de
chaque plugin) et sait déjà : recréer les pédales absentes depuis le catalogue, garder l'état d'un
plugin introuvable sans le perdre, revenir en arrière en cas d'erreur.

**Ce qui manque** (notre travail) : aujourd'hui le bouton *Save WAM state* garde cet état dans une
**variable en mémoire** (`main.js`, `savedState`) : un seul emplacement, perdu au rechargement, pas
de nom, pas d'utilisateur.

### 3.5 Le build (`npm run dist`)

`tools/build-static-dist.mjs` régénère les manifestes de modèles/IR, recompile le WASM si besoin,
puis **copie une liste fixe de fichiers** dans `dist/NAM_A2_WAM/` en réécrivant les chemins. ⚠️ Un
nouveau fichier de l'hôte doit être **ajouté à cette liste**, sinon il n'existe pas dans `dist`.

---

## 4. Journal des missions

### Avant le plan — Installation et build (2026-10-08)

**Fait**
- Repo cloné. Le premier clone dans OneDrive a échoué (chemins trop longs + synchronisation
  OneDrive qui verrouille les fichiers) → projet placé dans `C:\Users\NITRO\Projects\NAM_A2_WAM`.
- Outils installés dans **WSL Ubuntu**, sans droits admin, dans le dossier utilisateur :
  emsdk (compilateur C++ → WebAssembly) dans `~/emsdk`, CMake 4.4.4, Ninja 1.13.2 et Node 22 dans
  `~/.local`. Le fichier `~/.nam_env` (chargé par `~/.bashrc`) règle le `PATH` et force Ninja
  (`make` n'est pas installé).
- Dépendances `third_party/` (wam-examples, NeuralAmpModelerCore) récupérées comme dans
  `tools/setup.sh`.
- `npm run setup` (compilation WASM), `npm run dist` et `npm test` (**146/146**) passent.
- `build.bat` (non versionné) : double-clic = `npm run dist` via WSL ; `build.bat test` lance aussi
  les tests.
- Extension VS Code **Live Server** installée.
- Fork GitHub : `origin` = https://github.com/xDraawwScript/NAM_A2_WAM, `upstream` = repo du prof.

**Pourquoi WSL ?** Les scripts du projet (`npm run dist`, `npm run setup`) sont des scripts
**bash** (`.sh`) et `build-static-dist.mjs` lance directement un `.sh` : sous Windows natif il aurait
fallu modifier ces outils. Sous Linux (WSL) tout marche sans toucher au code.

**Bon à savoir**
- Les fichiers audio peuvent servir d'entrée à la place de la guitare : bouton *Change audio
  source* → *Source*. Utiliser des pistes **DI** (guitare seule, sans ampli). Pour ajouter un
  fichier : le copier dans `examples/wam/assets/audio/`, l'ajouter à `audioFiles.json`, relancer
  `build.bat`.
- Les *backing tracks* sont mixées **après** l'ampli (accompagnement), elles ne passent pas dans
  les effets.

### Mission 0 — Organisation (`feature/organisation`, 2026-10-08)

**Fait**
- Relecture des consignes (diapo, mail) et du code de l'hôte.
- **Découverte** : la spec du prof (`SPECIFICATION_FX_CHAIN.md` §7.2) décrit déjà la phase presets.
  Le plan a été ajusté pour s'y conformer (IndexedDB + adaptateur, assets par hash, presets
  d'usine, migration, assets manquants, rien de sensible dans un preset).
- `.gitignore` : `build.bat`, `server/.env`, `server/node_modules/`.
- `CLAUDE.md` : règles permanentes du projet (impératifs, Git, build, architecture).
- `SUIVI.md` (ce fichier) et squelette de `REPORT.md`.
- Config Git locale : `core.autocrlf=input`, `core.eol=lf`.

**Explication — pourquoi forcer les fins de ligne LF ?** Windows termine les lignes par `\r\n`
(CRLF), Linux par `\n` (LF). Git pour Windows convertit par défaut en CRLF à chaque checkout. Or nos
scripts `.sh` sont exécutés dans Ubuntu par `build.bat` : avec un `\r` en fin de ligne, bash
échoue (`$'\r': command not found`). Le réglage ne concerne que ce repo, sur ce PC.

**Explication — le stockage par hash (décision clé du projet)**
Un **hash** (SHA-256) est une empreinte unique calculée à partir du contenu d'un fichier : deux
fichiers identiques ont le même hash. Au lieu de recopier le modèle `.nam` (~300 Ko) dans chaque
preset, le preset garde seulement `{ ref: "<hash>" }` :
- modèle/IR **d'usine** (livré avec l'appli) → retrouvé dans `models-manifest.json` /
  `irs-manifest.json` grâce à son `contentHash` et rechargé depuis la dist ;
- modèle/IR **externe** (fichier importé, TONE3000) → stocké **une seule fois** sous son hash.
Résultat : presets légers, pas de doublons, et on peut savoir si un asset est encore utilisé avant
de le supprimer.

**Explication — le workflow Git choisi**
```
main      ●───────────────────────────────────────────────●  (version rendue, sur accord)
           \                                             /
develop     ●────────●─────────────●─────────────●───────●   (intégration : merge auto de chaque mission)
             \      /  \          /  \          /
feature/…     ●──●─●    ●──●──●──●    ●──●──●──●            (une branche par mission, pushée)
```
Chaque mission vit sur sa branche `feature/...` (pushée sur GitHub), puis est fusionnée dans
`develop` avec `git merge --no-ff` (le *no fast-forward* garde un commit de fusion : on voit sur
GitHub où chaque mission commence et finit).

**Comment vérifier** : `git status` propre après commit ; `CLAUDE.md` et `SUIVI.md` lisibles sur
GitHub dans les branches `feature/organisation` et `develop`.

### Mission 1 — Presets locaux (`feature/presets-locaux`, 2026-10-08)

**Fait** : un bouton **Presets** dans le header ouvre une fenêtre où l'on peut enregistrer le son
actuel sous un nom (+ tags), le recharger, le renommer, le mettre à jour, le supprimer, l'exporter
en fichier `.json` et importer un fichier. Les presets sont stockés **dans le navigateur**
(IndexedDB) : c'est le « mode invité », avant l'arrivée des comptes (missions 2 à 4).

**Fichiers créés** (tous dans `examples/wam/presets/`, aucun fichier de plugin touché)

| Fichier | Rôle | Pourquoi séparé |
|---|---|---|
| `PresetFormat.js` | Format `{format:'nam-a2-preset', version:1, id, name, tags, summary, rack}`, validation, migration, résumé, empreinte | Fonctions pures → testables sans navigateur |
| `PresetAssets.js` | Remplace modèles/IR par des références (et l'inverse) ; lit les manifestes d'usine | Cœur de la « déduplication » par hash |
| `PresetStorage.js` | Adaptateur IndexedDB : `list/get/save/update/rename/delete/putAsset/getAsset` | Le backend aura la même interface (mission 4) |
| `PresetFile.js` | Export/import `.json` autonome, vérification des hash | Sauvegarde / partage hors navigateur |
| `PresetManager.js` | Orchestration (capturer, enregistrer, charger, « modifié ») | Relie rack + stockage + assets |
| `PresetView.js` + `presets.css` | La fenêtre (en anglais, comme l'hôte) | Interface séparée de la logique |

**Fichiers modifiés** : `index.html` (bouton + CSS), `main.js` (création du manager et de la vue,
~8 lignes), `tools/build-static-dist.mjs` (copie du dossier `presets/` + vérification),
`package.json` (tests `phase5` + `fake-indexeddb` en dépendance de dev).

**Explication — ce qui se passe quand on clique sur « Save as new preset »**
```
PresetView.saveAs()
  └─ PresetManager.saveAs({name, tags})
       ├─ rack.getState()                         → état complet (~850 Ko : modèle .nam + IR)
       ├─ dehydrateRack(state)                    → modèle/IR remplacés par des références
       │     · modèle d'usine ? son contentHash est dans models-manifest.json → {source:'factory', id}
       │     · sinon → storage.putAsset({hash, data}) une seule fois → {source:'store', hash}
       ├─ createPreset({rack, name, tags})        → valide, retire le gain d'entrée, calcule le résumé
       ├─ storage.save(preset)                    → IndexedDB, store « presets » (~14 Ko)
       └─ setCurrent(preset)                      → mémorise l'empreinte du son (indicateur « modifié »)
```
**… et sur « Load »** : `storage.get(id)` → `hydrateRack` (va chercher le modèle d'usine dans la
dist, ou l'asset dans IndexedDB) → `chainView.close()` → `rack.setState(rack)` (qui appelle
`setState()` de chaque plugin, et recrée les pédales manquantes depuis le catalogue).

**Explication — IndexedDB** : base de données du navigateur (clé → objet), asynchrone, qui stocke
des objets JavaScript (y compris des `Float32Array`). Notre base `nam-a2-wam-presets` a deux
« object stores » : `presets` (clé `id`) et `assets` (clé `hash`). Visible dans les DevTools →
Application → IndexedDB. Elle est propre à l'origine (`http://127.0.0.1:5500` ≠ mainline) : c'est
pour ça que la fenêtre propose l'export.

**Explication — supprimer sans casser les autres presets** : quand on supprime un preset,
`collectGarbage()` liste les hash encore utilisés par les presets restants et ne supprime que les
assets orphelins (principe du « ramasse-miettes »).

**Problèmes rencontrés et solutions**
1. *Un test du prof interdit à `main.js` de mentionner `models-manifest`* (l'hôte ne doit pas faire
   de « découverte » d'assets). → La lecture des manifestes est dans `PresetAssets.js`, et l'URL est
   déduite de `plugin._descriptorUrl` (les manifestes sont à côté du `descriptor.json` de chaque
   plugin, en source comme dans la dist).
2. *L'indicateur « modifié » ne réagissait pas quand on tournait un bouton* : l'éditeur NAM appelle
   `setParameterValues()`, qui n'émet aucun événement vers le rack. → On compare une **empreinte**
   du son (`rackFingerprint` : le state JSON sans les gros contenus) à celle mémorisée au dernier
   enregistrement/chargement, après chaque interaction (clic relâché, touche, molette) ou
   changement du rack. Avantage : revenir à la valeur d'origine enlève l'indicateur.
3. *Valeurs Float32* : `0.1` n'existe pas exactement en Float32 ; les tests utilisent donc des IR déjà
   arrondies en Float32, comme celles que renvoie le vrai plugin Cabinet.

**Résultats**
- Tests : **176/176** (146 d'origine + 30 nouveaux dans `tests/phase5/`).
- Navigateur, plugins réels (dist servie en local) :
  - enregistrer → ajouter une pédale + changer un bouton → recharger : état **strictement
    identique** ; preset de **14 Ko** au lieu de 852 Ko ;
  - modèle et IR externes : stockés **une fois** pour deux presets, conservés après suppression du
    premier, supprimés avec le second ;
  - export → suppression → import → chargement : identique (fichier de 517 Ko, assets inclus) ;
  - presets toujours là après rechargement de la page ; affichage correct en largeur mobile.

**Comment tester soi-même**
1. `build.bat`, puis Live Server sur `dist/NAM_A2_WAM/index.html`.
2. Bouton **Presets** → nom + tags → *Save as new preset*.
3. Ajouter une pédale avec `+`, tourner un bouton du NAM → le header affiche `Nom •`.
4. *Load* sur le preset → la chaîne revient comme avant, le `•` disparaît.
5. *Export* → un fichier `.nam-preset.json` est téléchargé ; *Import file…* le réimporte.
6. DevTools → Application → IndexedDB → `nam-a2-wam-presets` pour voir les données.

### Mission 2 — Backend des comptes et presets (`feature/backend-presets`, 2026-10-09)

**Fait** : une API REST dans `server/` (Express 5 + Mongoose + MongoDB), reprise du backend du TP1-3
et adaptée : comptes avec **pseudo public + email privé**, presets en ligne privés ou publics,
recherche, copie, et stockage des modèles/IR externes **par hash**. L'hôte ne l'utilise pas encore
(missions 3 et 4) : cette mission livre et teste le serveur seul.

**Organisation du code** (même découpage que le TP, en plus fin)

| Fichier | Rôle |
|---|---|
| `src/app.js` | `createApp()` : log, CORS, lecteurs JSON, routes, gestionnaire d'erreurs central |
| `src/server.js` | Connexion MongoDB (base `nam-presets`), compte démo, ménage des assets, écoute du port |
| `src/auth.js` | Création/vérification des JWT, middlewares `requireAuth` / `optionalAuth`, `HttpError` |
| `src/validation.js` | Validation des presets **en réutilisant `examples/wam/presets/PresetFormat.js`**, pagination, échappement des recherches |
| `src/models/User.js` | `username` (unique, insensible à la casse), `email` (privé), `passwordHash` (bcrypt) |
| `src/models/Preset.js` | Preset : métadonnées + `rack` déshydraté + `assetHashes` (assets utilisés) |
| `src/models/Asset.js` | Modèle `.nam` ou IR, identifié par son SHA-256, octets bruts |
| `src/routes/*.js` | Les routes (voir [`server/API_CONTRACT.md`](server/API_CONTRACT.md)) |
| `test/*.test.js` | 24 tests avec une vraie MongoDB lancée en mémoire |

**Explication — le chemin d'une requête** (ex. « créer un preset »)
```
POST /api/presets  (Authorization: Bearer <JWT>, corps JSON)
  → log → CORS (origine Live Server autorisée ?) → express.json (≤ 1 Mo)
  → requireAuth : vérifie la signature et l'expiration du JWT → req.userId
  → presetInput() : mêmes règles que le navigateur (PresetFormat.validatePreset)
                    + refuse un rack qui contient encore le modèle ou l'IR (doit être « déshydraté »)
  → assertAssetsUsable() : les assets référencés existent et appartiennent à l'utilisateur
                           (ou sont déjà publics)
  → Preset.create() → MongoDB → 201 + preset complet (avec le pseudo de l'auteur)
  (toute erreur → gestionnaire central → statut 400/401/404/409/413 + {message})
```

**Explication — pourquoi le serveur réutilise le code de l'hôte** : le format d'un preset (nom,
tags, structure du rack…) est défini une seule fois dans `PresetFormat.js`. Le navigateur et le
serveur appliquent donc exactement les mêmes règles ; si le format évolue, un seul fichier change.

**Explication — les assets côté serveur** : avant d'enregistrer un preset qui utilise un modèle
externe, l'hôte enverra ce modèle sur `PUT /api/assets/<hash>`. Le serveur **recalcule** le SHA-256
et refuse si ça ne correspond pas (on ne fait jamais confiance au client). Si le hash existe déjà,
rien n'est renvoyé ni stocké en double. Un asset n'est lisible que s'il sert à un preset public ou à
un preset de l'utilisateur, et il est supprimé quand plus aucun preset ne l'utilise.

**Explication — sécurité**
- Mots de passe hachés avec **bcrypt** ; jamais renvoyés (`select: false`).
- **JWT** signé avec `JWT_SECRET` (dans `server/.env`, jamais commité) ; le serveur refuse de démarrer
  sans secret. Le jeton ne contient que l'id de l'utilisateur.
- Un preset privé d'un autre répond **404** (pas 403) : on ne révèle même pas qu'il existe.
- L'**email n'est jamais exposé** aux autres (seulement le pseudo).
- Connexion : même message **et même durée** que l'email existe ou non (anti-énumération).
- Recherche : la saisie est **échappée** avant d'être utilisée dans une expression régulière MongoDB.
- **CORS** limité aux origines de Live Server ; corps JSON limités (1 Mo, 12 Mo pour les assets,
  lus seulement après vérification du jeton) ; quota de 200 Mo d'assets par utilisateur.

**Relecture de code (`/code-review`)** : 10 points relevés, tous corrigés et couverts par des tests :
1. un jeton expiré bloquait la lecture des presets publics → il est maintenant ignoré sur les routes publiques ;
2. le corps de 12 Mo des assets était lu avant de vérifier le jeton → lu après ;
3. les assets envoyés mais jamais utilisés restaient pour toujours → ménage après 24 h + quota ;
4. un secret JWT de développement était utilisé si `JWT_SECRET` manquait → démarrage refusé ;
5. connaître le hash du modèle privé d'un autre permettait de se l'approprier → vérification de l'appartenance ;
6. la durée de la connexion révélait quels emails existent → calcul bcrypt factice ;
7. la liste « mes presets » n'avait pas d'auteur (contraire au contrat) → corrigé ;
8–9. requêtes MongoDB en trop (une par asset, une par écriture) → regroupées ;
10. `SUIVI.md` pas tenu à jour pendant la mission → ce journal.

**Problème rencontré — Atlas refuse la connexion** : erreur TLS « alert internal error » au
démarrage. C'est ce qu'Atlas renvoie quand **l'adresse IP du PC n'est pas autorisée** (*Network
Access*) — l'IP a sans doute changé depuis le TP. Solution (à faire par l'étudiant, c'est un réglage
de son compte) : Atlas → *Security* → *Network Access* → *Add IP Address* → *Add Current IP
Address*. ✅ Fait par l'étudiant le 2026-10-09 : connexion à Atlas vérifiée (base `nam-presets`).
En attendant, le serveur avait été vérifié sur la MongoDB **locale** déjà installée sur le PC
(service Windows « MongoDB »), qu'on peut aussi utiliser pour développer (voir mémo).

**Résultats**
- Tests du backend : **24/24** (`cd server && npm test`) — comptes, droits, validation, recherche,
  pagination, copie, assets (hash vérifié, partage, ménage, quota, accès), CORS.
- Tests de l'hôte : toujours **176/176**.
- Test manuel du vrai `server.js` : health + CORS, compte démo, création d'un preset public,
  recherche, suppression → OK.

**Comment tester soi-même**
1. `cd server`, `npm install` (une fois), puis `npm test`.
2. Autoriser son IP dans Atlas (ou passer `MONGODB_URI` sur la base locale), puis `npm start`.
3. Ouvrir http://localhost:3000/api/health → `{"status":"ok"}`.
4. Avec un client HTTP (extension REST Client / Thunder Client / Postman) : `POST /api/auth/login`
   avec `demo@example.com` / `Demo1234!`, puis `GET /api/presets/public`.

### Mission 3 — Comptes dans l'hôte (`feature/comptes`, 2026-10-10)

**Fait** : un bouton **Account** dans le header (il affiche *Sign in* ou le pseudo connecté) ouvre
une fenêtre pour **se connecter**, **créer un compte** (pseudo public, email privé, mot de passe +
confirmation), voir son **profil**, **changer de pseudo** et **se déconnecter**. La session reste
active après un rechargement de la page, tant que le jeton (12 h) n'a pas expiré. Les presets restent
encore locaux : leur passage en ligne est la mission 4.

**Fichiers**

| Fichier | Rôle |
|---|---|
| `examples/wam/account/ApiClient.js` | Client HTTP de l'API : session (jeton + profil), en-tête `Authorization`, erreurs lisibles, détection du serveur injoignable, déconnexion automatique si le jeton est refusé |
| `examples/wam/account/AccountView.js` + `account.css` | La fenêtre Account (anglais), onglets *Sign in* / *Create account*, profil |
| `examples/wam/account/accountRules.js` | Règles du pseudo et du mot de passe, **partagées avec le serveur** |
| `examples/wam/ui/el.js` | Petit utilitaire DOM extrait de `PresetView.js`, partagé par les deux fenêtres |
| `examples/wam/config.js` | `api.baseUrl = 'http://localhost:3000/api'` (adresse publique, aucun secret) |
| `index.html`, `main.js`, `tools/build-static-dist.mjs` | Bouton, câblage, copie des dossiers `account/` et `ui/` dans la dist |
| `server/src/**` | Messages d'erreur de l'API traduits en anglais (logs et commentaires restent en français) |

**Explication — le cycle de vie de la session**
```
Inscription / connexion → le serveur renvoie {token, user}
  → ApiClient.writeSession() : garde {token, user} en mémoire + localStorage → événement 'change'
  → AccountView.render() : le header affiche le pseudo
Rechargement de la page → ApiClient lit le localStorage
  → jeton expiré ? (date « exp » lue dans le JWT, sans le secret) → session effacée
  → sinon refresh() : GET /users/me pour vérifier le jeton et rafraîchir le profil
      · 401 → session effacée + message « session expired »
      · serveur éteint → on garde la session locale, le header indique « unreachable »
Déconnexion → session effacée (mémoire + localStorage)
```

**Explication — CORS en pratique** : la page est servie par Live Server (`http://127.0.0.1:5500`) et
l'API par Node (`http://localhost:3000`). Ce sont deux « origines » différentes : le navigateur
n'autorise l'appel que parce que l'API répond `Access-Control-Allow-Origin: http://127.0.0.1:5500`.
Si Live Server utilise un autre port (5501…), il faut l'ajouter à `CORS_ORIGINS` dans `server/.env`.

**Décision : messages de l'API en anglais** (choix de l'étudiant) pour une interface cohérente ;
les tests du serveur ont été adaptés.

**Relecture de code (`/code-review`)** : 8 points relevés.
1. Une déconnexion pendant la vérification du profil pouvait recréer une session sans jeton →
   la réponse est ignorée si la session a changé (test ajouté).
2. Un `config.js` sans `api` faisait planter tout l'hôte → seule la fonction Account est désactivée.
3. Les erreurs de validation Mongoose affichaient « User validation failed: email: … » → seul le
   message utile est renvoyé (test ajouté).
4. On pouvait changer d'onglet pendant une requête → tout est bloqué pendant l'appel.
5. Double message quand la session enregistrée est refusée → un seul.
6. Le jeton est stocké dans le localStorage (lisible par un script injecté) → **compromis assumé**
   et documenté : aucun HTML utilisateur interprété, jeton limité à 12 h ; un cookie HttpOnly
   imposerait que la page et l'API aient la même origine.
7. Les règles du pseudo étaient écrites deux fois (client et serveur) → `accountRules.js` partagé.
8. `SUIVI.md` pas tenu pendant la mission → ce journal.

**Vérifié dans le navigateur** (vrai backend sur MongoDB locale, base temporaire supprimée ensuite) :
inscription (avec erreur « passwords are different » sans perdre la saisie), session conservée
après rechargement (le mot de passe n'est jamais stocké), changement de pseudo, pseudo déjà pris,
déconnexion, mauvais mot de passe, connexion au compte démo, **backend éteint** : message clair,
« unreachable », audio et presets locaux toujours utilisables.

**Résultats** : hôte **190/190** (dont 16 nouveaux : `api-client.test.mjs`,
`account-host-integration.test.mjs`) · backend **24/24**.

**Comment tester soi-même**
1. Terminal 1 : `cd server` puis `npm start` (Atlas).
2. `build.bat`, puis Live Server sur `dist/NAM_A2_WAM/index.html` (port 5500).
3. Bouton **Sign in** → *Create account* (ou compte démo `demo@example.com` / `Demo1234!`).
4. Recharger la page : toujours connecté. Couper le backend : le message « unreachable » apparaît.

---

## 5. Mémo pratique

| Je veux… | Commande / action |
|---|---|
| Recompiler la dist | double-clic `build.bat` (ou `wsl bash -lc "cd /mnt/c/Users/NITRO/Projects/NAM_A2_WAM && npm run dist"`) |
| Lancer les tests de l'hôte | `.\build.bat test` |
| Voir l'appli | VS Code → clic droit `dist/NAM_A2_WAM/index.html` → *Open with Live Server* |
| Récupérer les mises à jour du prof | `git pull upstream main` |
| Lancer uniquement les tests des presets | `wsl bash -lc "cd /mnt/c/Users/NITRO/Projects/NAM_A2_WAM && node --test tests/phase5/*.test.mjs"` |
| Voir les presets stockés | DevTools (F12) → Application → IndexedDB → `nam-a2-wam-presets` |
| Installer le backend (une fois) | `cd server` puis `npm install` |
| Lancer le backend | `cd server` puis `npm start` (lit `server/.env`) → http://localhost:3000/api/health |
| Lancer les tests du backend | `cd server` puis `npm test` (MongoDB en mémoire, n'écrit jamais dans Atlas) |
| Backend sur la MongoDB locale au lieu d'Atlas | dans `server/.env` : `MONGODB_URI=mongodb://127.0.0.1:27017/` (service Windows « MongoDB » déjà installé) |
| Comptes de test | `demo@example.com` / `Demo1234!` (créé au démarrage du backend, pseudo `demo`) |
| Documentation de l'API | [`server/API_CONTRACT.md`](server/API_CONTRACT.md) |

---

## 6. Reste à faire / idées

- Missions 1 à 7 (voir tableau).
- Idées hors périmètre : amis et partage privé, presets favoris, notes/likes, aperçu audio d'un
  preset, déploiement en ligne (backend + dist).
