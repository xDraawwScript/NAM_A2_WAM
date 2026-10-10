# Suivi du projet — Hôte NAM A2 WAM avec utilisateurs et presets

> Journal de bord tenu **au fil de l'eau** : ce qui est fait, pourquoi, comment ça marche,
> comment le tester. Toutes les mesures de sécurité sont récapitulées dans [`SECURITE.md`](SECURITE.md). Le rendu final pour le prof est [`REPORT.md`](REPORT.md), rédigé à partir
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
| 4 | Presets en ligne (`feature/presets-en-ligne`) | ✅ | 2026-10-10 | voir `git log feature/presets-en-ligne` |
| S | Revue de sécurité avancée (`feature/revue-securite`) | ✅ | 2026-10-10 | voir `git log feature/revue-securite` |
| 5 | Explorer les presets publics (`feature/explorer-public`) | ✅ | 2026-10-10 | voir `git log feature/explorer-public` |
| 6 | Presets d'usine (`feature/presets-usine`) | ✅ | 2026-10-10 | voir `git log feature/presets-usine` |
| 7 | Finitions, relectures, REPORT.md (`feature/finitions`) | ✅ | 2026-10-10 | voir `git log feature/finitions` |
| F | Correctif « Copy to account » sur les presets d'usine (`feature/fix-copie-usine`) | ✅ | 2026-10-09 | voir `git log feature/fix-copie-usine` |
| 8 | Refonte de l'interface : thème rock, FR/EN, ergonomie (`feature/interface-design`) | 🔄 | 2026-10-09 | |

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

### Détail mission 4

- ✅ Ménage : `import` mal placé dans `server/src/routes/auth.js`
- ✅ Décisions : copier (pas déplacer) vers le compte ; enregistrement sur le compte par défaut une fois connecté
- ✅ `RemotePresetStorage.js` (adaptateur en ligne, même interface qu'IndexedDB) + tests
- ✅ `PresetManager` : deux sources (navigateur / compte), copie vers le compte, preset courant lié à sa source
- ✅ `PresetView` : onglets, « Public », badges, Make public/private, Copy to account, bandeau de copie
- ✅ Test de bout en bout navigateur ↔ serveur (`server/test/host-integration.test.js`)
- ✅ **Bug trouvé par ce test et corrigé** : même fichier chez deux utilisateurs → preuve de possession
- ✅ Bandeau de copie qui proposait de recopier des presets déjà copiés → corrigé
- ✅ Vérification dans le navigateur (vrais plugins + vrai backend, base temporaire)
- ✅ Relecture `/code-review` : 6 points traités
- ✅ Tests : hôte 205/205, backend 30/30 — commit, push, merge dans `develop`

### Détail mission 5

- ✅ `RemotePresetStorage` : `listPublic()` (recherche, pagination, sans compte) et `copyFrom()`
- ✅ `PresetManager` : troisième source `public` en **lecture seule**, `searchPublic()`, `copyPublic()`
- ✅ `ExplorePanel.js` (onglet Explore) + `presetText.js` (textes partagés)
- ✅ Octet nul invisible dans `PresetView.js` (Git le voyait comme binaire) → corrigé + test
- ✅ Tests unitaires + test de bout en bout navigateur ↔ serveur de l'exploration
- ✅ Vérification dans le navigateur (invité, autre compte, mobile)
- ✅ Relecture `/code-review` : 5 points traités
- ✅ Tests : hôte 209/209, backend 35/35 — commit, push, merge dans `develop`

### Détail mission 6

- ✅ `SECURITE.md` : récapitulatif de toutes les mesures de sécurité (demande de l'étudiant)
- ✅ Générateur `tools/factory-presets/generate-factory-presets.js` (7 recettes, vrais plugins)
- ✅ `presets/factoryPresets.js` (généré) + `FactoryPresetStorage.js` (lecture seule, chargé à la demande)
- ✅ `PresetManager` : source `factory` en lecture seule ; `PresetView` : onglet **Factory**
- ✅ Niveaux mesurés puis égalisés (écart ramené de 18,6 dB à 3,9 dB)
- ✅ `pluginUri` des modules NAM/Cabinet retiré de tous les presets (dépend du mode source/dist)
- ✅ Tests + vérification dans le navigateur (7 sons, aller-retour d'un preset perso)
- ✅ Relecture `/code-review` : 6 points traités
- ✅ Tests : hôte 219/219, backend 35/35 — commit, push, merge dans `develop`

### Détail mission 7

- ✅ `/simplify` : 4 relectures (réutilisation, simplification, efficacité, « altitude »), ~30 remarques
- ✅ Lot 1 (hôte) : règle de description unique, encodeur d'assets unique, code mort supprimé
- ✅ Lot 2 (hôte) : lecture seule = capacité du stockage, `setStorage`, chargement partagé, efficacité
- ✅ Lot 3 (serveur) : validation champ par champ, règles partagées, une seule règle d'accès aux assets,
  propriété par `owners` + migration, ménage après l'ouverture du port
- ✅ Bug évité grâce à un nouveau test : option Mongoose manquante (le serveur n'aurait pas démarré)
- ✅ Vérification complète dans le navigateur + 5 captures d'écran (`docs/screenshots/projet/`)
- ✅ `REPORT.md` final, `SECURITE.md` (mesure 49), ce journal
- ✅ Tests : hôte 222/222, backend 37/37 — commit, push, merge dans `develop`

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

### Mission 4 — Presets en ligne (`feature/presets-en-ligne`, 2026-10-10)

**Fait** : une fois connecté, la fenêtre **Presets** s'ouvre sur l'onglet **My account** : les
presets sont enregistrés sur le compte (en ligne), **privés** ou **publics** (case *Public*, boutons
*Make public / Make private*). L'onglet **This browser** reste disponible (mode invité). Les presets du
navigateur peuvent être **copiés** sur le compte (un bouton par preset + un bandeau « N presets from
this browser are not on your account yet → Copy them »). Ils restent aussi dans le navigateur.

**Choix de l'étudiant** : *copier* plutôt que *déplacer* (aucune perte possible) ; une fois connecté,
on enregistre **sur le compte par défaut**.

**Fichiers**

| Fichier | Rôle |
|---|---|
| `presets/RemotePresetStorage.js` (nouveau) | Adaptateur « en ligne » : **mêmes méthodes** qu'`IndexedDbPresetStorage` (`list`, `get`, `save`, `update`, `delete`, `putAsset`, `getAsset`) mais via l'API |
| `presets/PresetManager.js` | Deux stockages (`browser`, `account`), onglet actif `source`, preset courant lié à **sa** source, `copyToAccount()` |
| `presets/PresetView.js` + `presets.css` | Onglets, case *Public*, badges, *Copy to account*, bandeau de copie |
| `main.js` | Branche le stockage du compte à la connexion, le débranche à la déconnexion |
| `server/src/models/Asset.js`, `routes/assets.js` | Assets à **plusieurs propriétaires** (preuve de possession, voir plus bas) |
| `server/test/host-integration.test.js` (nouveau) | Test de bout en bout : le code du navigateur contre le vrai serveur |

**Explication — le patron « adaptateur »** : `PresetManager` appelle `storage.save(…)`,
`storage.get(…)`… sans savoir si `storage` est l'IndexedDB du navigateur ou l'API. Ajouter le mode
en ligne n'a donc presque pas touché à la logique d'enregistrement / chargement écrite en mission 1 :
on a seulement ajouté un second objet de stockage avec les mêmes méthodes.
```
PresetManager ──► storage.save(preset)
                    ├─ IndexedDbPresetStorage → IndexedDB du navigateur
                    └─ RemotePresetStorage    → HEAD/PUT /api/assets/:hash (modèles/IR manquants)
                                                → POST /api/presets (le serveur donne l'identifiant)
```

**Explication — envoyer un modèle seulement s'il manque** : avant d'enregistrer un preset en ligne,
chaque modèle/IR externe est proposé au serveur. `HEAD /api/assets/<hash>` demande « puis-je déjà
utiliser ce fichier ? ». Si oui, rien n'est envoyé ; sinon le contenu part avec `PUT`. Pendant une
session, un hash déjà confirmé n'est plus redemandé.

**Bug trouvé par le test de bout en bout — « même fichier, deux utilisateurs »**
Scénario : deux guitaristes ont téléchargé **la même capture** (même hash). Le second demandait
« ce fichier existe ? » → « oui » (envoyé par le premier), ne l'envoyait donc pas… puis le serveur
refusait son preset, car l'asset « appartenait » au premier (protection ajoutée en mission 2).
**Correction : la preuve de possession.** Un asset a maintenant une liste de **propriétaires**.
`HEAD` ne répond « oui » que si l'utilisateur peut *déjà* l'utiliser ; sinon il envoie le contenu, le
serveur **vérifie le hash**, et l'ajoute aux propriétaires **sans stocker de doublon**. Avoir le
contenu prouve qu'on a le droit de s'en servir ; connaître seulement le hash ne suffit toujours pas.

**Autre défaut corrigé** : le bandeau de copie proposait de recopier des presets déjà copiés (risque
de doublons). Il ne compte maintenant que les presets du navigateur absents du compte (même nom et
même son).

**Relecture de code (`/code-review`)** : 6 points traités.
1. Le cache mémoire des modèles n'était jamais vidé : un autre utilisateur du même onglet aurait pu
   réutiliser les modèles privés du précédent → vidé à chaque connexion/déconnexion, et limité aux
   16 derniers modèles (test ajouté).
2. Une requête `HEAD` par modèle et par preset lors d'une copie → une seule par session (test ajouté).
3. Importer sur le compte un fichier incomplet échouait avec une erreur serveur peu claire → message
   explicite, rien n'est envoyé (test ajouté).
4. Le quota ignorait les assets créés avant la notion de propriétaires → corrigé.
5. Téléchargement d'un asset : deux lectures MongoDB → une seule.
6. `SUIVI.md` pas tenu pendant la mission → ce journal.

**Vérifié dans le navigateur** (vrais plugins, vrai backend sur MongoDB locale, base temporaire
supprimée ensuite) : preset invité avec modèle externe → connexion (bascule sur *My account*) →
preset public enregistré puis **rechargé à l'identique** → copie du preset invité sur le compte (il
reste dans le navigateur) → rechargement de la page (toujours connecté, bandeau masqué car déjà
copié) → nouveau preset local (bandeau « 1 preset… ») → déconnexion (retour sur *This browser*,
onglet compte désactivé).

**Résultats** : hôte **205/205** · backend **30/30** (dont 5 tests de bout en bout navigateur ↔ serveur).

**Comment tester soi-même**
1. `cd server` puis `npm start` ; `build.bat` ; Live Server sur `dist/NAM_A2_WAM/index.html`.
2. Sans compte : *Presets* → enregistrer un preset dans *This browser*.
3. *Account* → se connecter (ou `demo@example.com` / `Demo1234!`) → *Presets* s'ouvre sur *My account*.
4. Enregistrer un preset en cochant *Public* ; essayer *Make private*, *Rename*, *Load*.
5. Le bandeau propose de copier le preset du navigateur → *Copy it to my account*.
6. Ouvrir la page dans un autre navigateur, se connecter : les presets en ligne y sont.

### Revue de sécurité (`feature/revue-securite`, 2026-10-10)

Prévue en mission 7, **avancée à la demande de l'étudiant** : toute la partie sensible (comptes,
JWT, droits, assets) existait déjà, et la mission 5 ouvre les presets publics à tout le monde.

**Méthode** : la skill `/security-review` ne peut pas tourner ici (la session Claude n'est pas
ouverte dans le dossier du dépôt Git, et la déplacer aurait fait perdre la mémoire du projet). La
revue a donc été faite à la main avec la même grille : authentification, autorisations (accès aux
données d'un autre), injections (NoSQL, expressions régulières, HTML), secrets, déni de service,
fuite d'informations.

| # | Gravité | Problème | Correction |
|---|---|---|---|
| 1 | Moyenne | Aucune limite de tentatives : force brute sur la connexion, création de comptes en masse (pour remplir la base) | `server/src/rateLimit.js` : 10 connexions / 15 min et 5 inscriptions / heure par IP → `429` + `Retry-After` |
| 2 | Moyenne | Le compte démo (mot de passe public, affiché dans l'interface) serait créé aussi sur un serveur déployé | Jamais créé si `NODE_ENV=production` ; l'indice n'apparaît qu'avec une API locale |
| 3 | Faible | **bcrypt ne lit que 72 octets** : avec un mot de passe de 80 caractères, n'importe quelle fin après le 72ᵉ était acceptée (vérifié par l'expérience) | Mot de passe limité à 72 octets (règle partagée `accountRules.js`) |
| 4 | Faible | L'algorithme du JWT n'était pas imposé à la vérification | `HS256` imposé à la signature et à la vérification |

**Vérifié et sain** : pas d'injection NoSQL (entrées converties, identifiants validés, recherche
échappée) ; toutes les routes filtrent par propriétaire (un preset privé d'un autre répond 404) ;
aucun HTML utilisateur interprété (XSS) ; mots de passe hachés et jamais renvoyés ; secrets hors du
code ; CORS limité ; tailles de requêtes bornées ; erreurs 500 sans détail. Compromis assumé et
documenté : jeton dans le localStorage (mission 3).

**Explication — la force brute** : sans limite, un script peut essayer des milliers de mots de
passe par minute sur un compte. Le limiteur compte les requêtes par adresse IP dans une fenêtre de
temps ; au-delà du seuil, le serveur répond `429 Too Many Requests` et indique dans `Retry-After`
combien de secondes attendre.

**Tests** : 4 tests ajoutés (11ᵉ connexion → 429, 6ᵉ inscription → 429, mot de passe de 73 octets
refusé, jeton signé avec un autre algorithme refusé). Les tests créent beaucoup de comptes depuis
127.0.0.1 : leurs outils remettent les compteurs à zéro entre deux appels, sauf dans les tests du
limiteur. Résultats : backend **34/34**, hôte **205/205**.

### Mission 5 — Explorer les presets publics (`feature/explorer-public`, 2026-10-10)

**Fait** : un troisième onglet **Explore** dans la fenêtre Presets montre les presets **publics de
tous les utilisateurs**, accessibles **même sans compte** :
- « récemment ajoutés » par défaut, avec un bouton *Load more* (12 par page) ;
- une **recherche** (nom, tag, ampli, cabinet, pédale, pseudo de l'auteur), lancée 300 ms après la
  dernière frappe pour ne pas interroger le serveur à chaque lettre ;
- un **aperçu** : auteur, date, résumé, tags, et *Details* = l'ordre du signal de chaque chaîne
  (« Faust BigMuff → Bogner Uberschall → (Celestion V30) », les modules bypassés entre parenthèses) ;
- **Load** : essayer le son (le modèle et l'IR externes sont téléchargés automatiquement) ;
- **Copy to my presets** (connecté) : copie **privée** sur son compte, qu'on peut ensuite modifier.
  Ses propres presets publics portent un badge *Yours*.

**Lecture seule** : un preset public d'un autre utilisateur ne peut être ni écrasé (*Update* masqué),
ni renommé, ni supprimé — le manager le refuse (`writableStorage`) et l'interface ne le propose pas.
Pour le garder : *Copy to my presets*, ou *Save as new preset*.

**Fichiers**

| Fichier | Rôle |
|---|---|
| `presets/ExplorePanel.js` (nouveau) | L'onglet Explore : recherche, liste, *Load more*, détails, chargement, copie |
| `presets/presetText.js` (nouveau) | Textes partagés (résumé, date, ordre du signal) entre les deux vues |
| `presets/RemotePresetStorage.js` | `listPublic()` (GET `/api/presets/public`) et `copyFrom()` (POST `/api/presets/:id/copy`) |
| `presets/PresetManager.js` | Source `public` en lecture seule ; rester sur Explore quand on se connecte |
| `presets/PresetView.js`, `presets.css`, `main.js` | Troisième onglet, câblage du catalogue public |

Le serveur n'a pas changé : les routes `/api/presets/public` et `/copy` existaient depuis la mission 2.

**Explication — « lecture seule » sans dupliquer de code** : le catalogue public est un
`RemotePresetStorage` comme le compte. La différence est faite à un seul endroit :
`writableStorage(source)` refuse toute écriture quand `source === 'public'`. Toutes les opérations
d'écriture (enregistrer, écraser, renommer, supprimer, importer) passent par lui.

**Explication — les recherches qui se croisent** : si l'on tape vite, plusieurs recherches partent ;
la réponse de la première peut arriver après la seconde. Chaque recherche reçoit donc un **numéro** :
une réponse dont le numéro n'est plus le dernier est ignorée (même principe pour *Load more*).

**Problème découvert : un octet nul invisible** dans `PresetView.js` (ajouté en mission 4 par un
script, dans la clé `copyKey`). Le code marchait, mais **Git considérait le fichier comme binaire** :
ses diffs étaient illisibles sur GitHub. Remplacé par la séquence `\u0000`, et un test interdit
désormais tout octet nul dans les sources.

**Relecture de code (`/code-review`)** : 5 points traités.
1. La fenêtre réactivait tous les boutons après chaque opération, y compris *Copy* pour un invité →
   l'onglet Explore gère ses propres boutons.
2. *Load more* pendant une nouvelle recherche affichait des résultats de l'ancienne → numéros séparés.
3. Le badge *Yours* comparait les pseudos (qui peuvent changer) → comparaison par identifiant.
4. Un test de texte acceptait une mauvaise réponse (expression régulière trop large) → égalité exacte.
5. `SUIVI.md` pas tenu pendant la mission → ce journal.

**Vérifié dans le navigateur** (vrais plugins, vrai backend sur MongoDB locale, base temporaire) :
invité → 2 presets publics (le privé n'apparaît pas) → recherche « fuzz » → *Load* : son
**identique** à l'original (pédale BigMuff comprise), *Update* masqué, *Copy* désactivé → connexion
d'un autre compte (on reste sur Explore) → *Copy* → copie privée dans *My account* → *Details* →
affichage mobile correct → compte de l'auteur : badge *Yours*, pas de bouton de copie.

**Résultats** : hôte **209/209** · backend **35/35** (dont 6 tests de bout en bout).

**Comment tester soi-même**
1. Avec un compte : enregistrer un preset en cochant *Public*.
2. Se déconnecter → *Presets* → onglet **Explore** : le preset apparaît ; *Details*, *Load*.
3. Chercher par tag, ampli, pédale ou pseudo.
4. Se connecter avec un autre compte → *Copy to my presets* → il apparaît dans *My account*.

### Mission 6 — Presets d'usine (`feature/presets-usine`, 2026-10-10)

**Fait** : un onglet **Factory** (premier onglet de la fenêtre Presets) propose **7 sons prêts à
jouer**, construits avec les modèles d'ampli et les pédales livrés avec l'appli :

| Preset | Ampli (capture NAM) | Pédales | Pour |
|---|---|---|---|
| Clean Deluxe | Fender Deluxe Reverb | — | accords, jazz |
| Ambient Clean | Fender Deluxe Reverb | Chorus → SmoothDelay | arpèges, textures |
| Crunch JCM800 | Marshall JCM800 | TS9 → ampli | rythmique rock |
| Lead Soldano | Soldano SLO-100 (overdrive) | ampli → SmoothDelay | solos |
| High Gain 5150 | Peavey 5150 + Maxon (full rig), gate activé | — | metal |
| Fuzz Muff | Fender Deluxe Reverb | Big Muff → ampli | fuzz, stoner |
| Bass SVT | Ampeg SVT 6x10 | Compresseur → ampli | basse |

Comme le demande la spec du prof (§7.2), ce sont des **modèles en lecture seule** : on les charge,
on les modifie, puis on enregistre *sa* version dans *This browser* ou *My account* ; le preset
d'usine, lui, ne change jamais.

**Explication — comment les sons sont fabriqués** : un preset est l'**état réel** des plugins. Le
générateur (`tools/factory-presets/generate-factory-presets.js`, à lancer dans la console du
navigateur sur la page de l'hôte) suit des « recettes » : il charge le modèle d'usine, insère les
pédales du catalogue, règle leurs boutons, puis **capture** le son exactement comme le bouton *Save*.
Le résultat (`presets/factoryPresets.js`) ne contient que des **références d'usine** (identifiant +
hash des fichiers livrés), jamais les données. Pour changer un son : modifier la recette, relancer.

**Explication — égaliser les volumes** : sans écouter, on peut **mesurer**. Un signal test (dent de
scie à 220 Hz) traverse chaque preset et on mesure le niveau de sortie (RMS). Au départ : de −7,5 dB
(Fuzz) à −26,1 dB (Bass), soit 18,6 dB d'écart (on sursaute en changeant de preset). Avec le gain de
sortie de l'ampli dans chaque recette : de −15,5 à −19,4 dB (3,9 dB d'écart, les clairs un peu
plus bas que les sons saturés, comme sur un vrai ampli).

**Problèmes rencontrés**
1. *URL de la machine dans les presets* : l'état des plugins contient une `imageUrl` absolue
   (`http://localhost…`) pour la pochette. Elle est retirée ; un garde-fou refuse toute URL propre à la
   machine. Les liens **publics** d'attribution (page TONE3000, créateur) sont gardés (crédit/licence).
2. *Réverbes sans réglage dry/wet* (`greyhole`, `kbverb`) : risque de noyer le son direct → les sons
   d'usine utilisent le SmoothDelay, qui a un vrai bouton *Dry/Wet*.
3. *Le limiteur anti force brute* a bloqué un test de bout en bout de la mission 5 qui créait des
   comptes sans passer par l'outil de test → remise à zéro exposée aux tests (preuve que la
   protection marche).

**Relecture de code (`/code-review`)** : 6 points traités.
1. Un catalogue d'usine invalide aurait fait planter tout l'hôte → **chargement à la demande** : seule
   l'erreur de l'onglet Factory s'affiche (test ajouté).
2. Le curseur allait dans un champ masqué à l'ouverture de l'onglet Factory → il va dans le filtre.
3. Les 116 Ko du catalogue étaient chargés au démarrage → chargés à la première ouverture de l'onglet.
4. L'adresse des modules NAM/Cabinet (`../plugins/…`) dépend du mode (source ou dist) → retirée de
   **tous** les presets ; l'hôte retrouve ces modules par leur rôle (test ajouté, presets existants
   nettoyés à la lecture).
5. et 6. `SECURITE.md` et `SUIVI.md` complétés (mesures 46 à 48, ce journal).

**Vérifié dans le navigateur** : les 7 sons se chargent sans avertissement, avec la bonne chaîne et
les bons réglages ; niveaux mesurés ; catalogue non chargé au démarrage puis chargé à l'ouverture ;
un son d'usine enregistré comme preset perso puis rechargé à l'identique.

**Résultats** : hôte **219/219** · backend **35/35**.

**Comment tester soi-même** : *Presets* → onglet **Factory** → *Load* sur chaque son ; tourner un
bouton, aller dans *This browser*, *Save* : le son est à toi, le preset d'usine n'a pas changé.

### Mission 7 — Finitions (`feature/finitions`, 2026-10-10)

**Fait** : nettoyage du code avec `/simplify`, vérification complète, captures d'écran et
[`REPORT.md`](REPORT.md) final (le rendu pour le prof).

**`/simplify`** : quatre relectures en parallèle sur tout le code ajouté par le projet
(`main...develop`) — **réutilisation** (code qui refait ce qui existe déjà), **simplification**
(complexité inutile, code mort), **efficacité** (travail gaspillé) et **altitude** (corriger la cause
plutôt que le symptôme). Environ 30 remarques, souvent les mêmes vues sous plusieurs angles.

**Ce qui a été appliqué**

| Thème | Avant | Après |
|---|---|---|
| Règle de la description | Vérifiée à 4 endroits (dont une limite « 500 » écrite en dur côté serveur) | `normalizeDescription()` dans `PresetFormat.js`, utilisée partout |
| Encodage des assets (fichier exporté / API) | Écrit deux fois | `encodeAsset` / `decodeAsset` dans `PresetFile.js` |
| Règles pseudo / limites / hash | Messages et nombres recopiés côté serveur | Importés de `accountRules.js`, `PresetFormat.js`, `PresetAssets.js` |
| Code mort | `rename`, `setVisibility`, `available`, `kind`… jamais appelés | Supprimés (les tests passent par `update`) |
| Lecture seule | Liste de noms de sources (`'public'`, `'factory'`) testée à ~20 endroits | **Capacité** du stockage (`readOnly`) ; un seul `setStorage(source, storage)` |
| Chargement d'un preset | Écrit deux fois (Presets et Explore) | Une seule méthode partagée ; pastilles de tags partagées (`tagList`) |
| Validation serveur | Un « faux preset » de substitution pour réutiliser la validation | Validation **champ par champ** avec les fonctions partagées |
| Accès aux assets | Règle écrite deux fois (HEAD et GET) | **Une seule** (`usableHashes`) |
| Propriété des assets | `uploadedBy` **et** `owners` vérifiés partout | `owners` seulement (index utilisé par le quota) + migration au démarrage |
| Efficacité | Capture complète du rack à chaque touche tapée dans une fenêtre ; 2ᵉ capture après chaque enregistrement ; modèles/IR d'usine retéléchargés à chaque chargement ; chargements en série ; asset partagé relu pour chaque preset copié ; ménage qui retardait le démarrage | Frappe dans les fenêtres ignorée ; capture réutilisée ; cache des assets d'usine ; chargements en parallèle ; un asset partagé lu une fois ; ménage après l'ouverture du port + index |

**Ce qui n'a pas été appliqué (et pourquoi)**
- Retirer les `try/catch` des routes (Express 5 les gère) : le TP enseigne explicitement ce modèle
  (`best-practices.md`), on garde la cohérence avec le cours.
- Sortir le câblage de `main.js` dans un module et ne plus tester son texte exact : changement plus
  large que le nettoyage ; noté dans les perspectives.
- Désactiver les contrôles avec un `<fieldset>` : changerait la structure HTML des fenêtres, gain faible.
- Mettre en cache les assets en ligne dans IndexedDB : contradictoire avec l'isolation entre comptes
  (cache vidé à chaque changement d'utilisateur, mesure de sécurité n° 36).

**Problèmes attrapés par les tests pendant le nettoyage**
1. Un nouveau test de la migration a montré qu'un **ancien asset sans le champ `owners`** faisait
   planter la vérification d'accès (erreur 500) → corrigé.
2. Le même test a révélé que la migration utilisait une mise à jour « pipeline » que **Mongoose 9
   refuse sans l'option `updatePipeline`** : **le serveur n'aurait pas démarré** → corrigé, et le
   démarrage réel du serveur a été vérifié.

**Rapport final** : `REPORT.md` contient l'objectif, les fonctionnalités, **5 captures d'écran**
(`docs/screenshots/projet/`), les choix techniques, la sécurité, l'architecture, le découpage, les
tests, **l'utilisation de l'IA** (ce que l'IA a fait, ce que l'étudiant a décidé, ses limites) et les
limites/perspectives.

**Résultats** : hôte **222/222** · backend **37/37** · parcours complet vérifié dans le navigateur
(usine, navigateur, compte, copie, preset public rechargé à l'identique, Explore en invité, lecture
seule).

### Correctif — « Copy to account » sur les presets d'usine (`feature/fix-copie-usine`, 2026-10-09)

**Le bug** : une fois connecté, l'onglet **Factory** affichait un bouton *Copy to account* sous
chaque preset d'usine. Ce bouton ne marchait pas : `copyToAccount` lit les presets dans le
**stockage du navigateur**, alors que les presets d'usine viennent du catalogue `factoryPresets.js`.
Rien n'était copié. La condition d'affichage (`!online && connecté`) avait été écrite avant
l'arrivée de l'onglet Factory, qui n'est pas « en ligne » mais n'est pas non plus le navigateur.

**Choix** (option 1, validée par l'utilisateur) : **masquer** le bouton sur Factory plutôt que de le
faire marcher. Pour garder un son d'usine, on fait déjà *Load* puis *Save* (dans *This browser*) ou
*Save as* (dans *My account*) : copier serait un doublon.

**Correction à la racine** : la liste des boutons de chaque onglet est décidée par **une seule
fonction pure**, `presetActions({source, readOnly, signedIn})` dans `presetText.js` :

| Onglet | Boutons |
|---|---|
| Factory (lecture seule) | Load |
| This browser, non connecté | Load, Rename, Export, Delete |
| This browser, connecté | Load, Rename, **Copy to account**, Export, Delete |
| My account | Load, Rename, Make public/private, Export, Delete |

`PresetView.renderItem` ne fait plus que `actions.has('copy') ? bouton : null`. Avant, chaque
bouton avait sa propre condition (`factory ? null : …`, `online ? … : null`…), et c'est leur
mélange qui avait laissé passer le cas Factory.

**Fichiers** : `presets/presetText.js` (nouvelle fonction), `presets/PresetView.js` (utilise la
fonction), `tests/phase5/factory-presets.test.mjs` (nouveau test « buttons shown for each tab »).

**Problème rencontré** : en réécrivant les conditions, trois boutons ont perdu leur `: null` final
→ erreur de syntaxe. Elle a été attrapée tout de suite par un test qui importe `PresetView.js`.

**Comment tester soi-même** : se connecter, ouvrir *Presets* → onglet **Factory** : seul *Load*
apparaît. Onglet **This browser** : *Copy to account* est là quand on est connecté, et disparaît
après la déconnexion.

**Résultats** : hôte **223/223** · vérifié dans le navigateur (les trois cas du tableau ci-dessus).

### Mission 8 — Refonte de l'interface (`feature/interface-design`, à partir du 2026-10-09)

**Demande** : une appli « très belle, la plus ergonomique », **compréhensible**, **traduite (FR/EN)**,
avec un **thème rock mais lisible**, qui reprend **toutes** les fonctionnalités existantes.
`develop` a d'abord été fusionnée dans `main` (accord explicite de l'étudiant, commit `5d9fc7e`).

**Choix validés** : français + anglais (langue du navigateur par défaut, choix mémorisé) ;
refonte complète de la mise en page ; **maquette HTML avant de coder**.

**Avancement**

| Étape | Contenu | État |
|---|---|---|
| 0 | Branche, inventaire de l'interface, plan | ✅ |
| 1 | Maquette HTML avec 3 ambiances rock (`docs/maquette/`) → choix de l'étudiant | ✅ choix : **Tolex & Lampes** |
| 2 | Thème : design tokens (`ui/theme.css`), polices, réécriture des CSS | ✅ |
| 3 | Internationalisation : `ui/i18n.js`, `ui/locales/{en,fr}.js`, codes d'erreur du serveur, tests | ✅ |
| 4 | Nouvelle mise en page, guide de démarrage, confirmations thémées, accessibilité, fond animé Butterchurn (option) | ✅ |
| 5 | Traduction de tous les textes de l'hôte, retraduction en direct, codes des `PresetError` | ✅ |
| 6 | Audit accessibilité, relecture des textes, parcours FR/EN, `/code-review`, `/simplify` | ⏳ |
| 7 | SUIVI, REPORT, SECURITE, merge dans `develop` | ⏳ |

**Inventaire de départ** (fait avant de coder, pour ne perdre aucune fonctionnalité) :
- environ **600 textes anglais** répartis dans environ 25 fichiers, sans aucune i18n ;
- thème violet, environ 275 couleurs écrites en dur, textes de 7 à 10 px par endroits ;
- 5 `confirm()` natifs du navigateur (impossibles à styler ou traduire) dans `PresetView.js` ;
- `FxRackView.js` retrouve des panneaux **par le texte** de leur `aria-label` (« Chain A input ») :
  la traduction le casserait, il faudra passer par des classes ;
- le script de build réécrit `discoverFiles` de `main.js` avec des textes anglais en dur.

**Limite importante** : les interfaces **des plugins** (sélecteur de modèle NAM, IR du Cabinet,
pédales, accordeur) font partie du code des plugins, qu'on ne touche pas. Elles restent en anglais ;
l'hôte n'habille que leur **cadre** et les variables de couleur qu'elles exposent
(`--nam-accent`, `--cab-accent`).

**Outils** : les skills frontend-design, Design et Axe sont maintenant installés. Le serveur MCP
d'Axe ne se connecte pas encore (« Connection closed ») : l'audit est donc lancé avec
**axe-core** (la même bibliothèque, version 4.10.2) chargé directement dans le navigateur intégré.
La vérification des traductions se fera **par des tests** (parité des clés FR/EN, paramètres identiques).

#### Étape 1 : la maquette (2026-10-09)

**Fichiers** : `docs/maquette/index.html` (HTML + CSS autonomes, **non copiés dans la dist**),
`docs/maquette/img/` (3 vignettes **copiées** depuis `wamPlugins/`, les originaux ne sont pas modifiés),
`docs/maquette/captures/` (une capture par ambiance, en 1366 px).

**Comment l'ouvrir** : servir le dossier `docs/maquette/` (par exemple Live Server de VS Code)
puis choisir l'ambiance dans la barre du haut, ou ajouter `#tolex`, `#flight` ou `#scene` à l'URL.
Le bouton « Complet » affiche la chaîne B ; les onglets Presets se parcourent aux flèches.

**Principe** : le **même HTML** pour les 3 ambiances. Seul l'attribut `data-theme` de `<body>` change,
et il active un jeu de **design tokens** (variables CSS : couleurs, polices, textures, rayons).
C'est exactement le mécanisme prévu pour `ui/theme.css` à l'étape 2, donc la variante choisie
(ou un mélange) se reportera telle quelle.

| Ambiance | Matières | Accent | Polices (titres / texte) |
|---|---|---|---|
| 1. Tolex & Lampes | tolex texturé, liseré crème, plaques en métal brossé | orange lampe `#ff9440` | Oswald + logo Yellowtail / Barlow |
| 2. Flight case | ABS noir, profilés alu, coins rivetés, noms sur gaffer | jaune `#ffd21f` | Saira Stencil / Barlow Semi Condensed, gaffer en Permanent Marker |
| 3. Scène | noir profond, projecteurs rouge et ambre, halos, VU à LED | ambre `#ffb21e` + rouge | Anton / Archivo |

**Écrans montrés** : header en 3 zones (marque, carte du signal + preset « • modifié », actions
Presets / Accordeur / Compte / Débutant-Complet / FR-EN), guide de démarrage en 3 étapes,
rack A (et B en mode complet) avec les états Actif / Bypass / Clip, notifications (succès, erreur),
dialog Presets (onglet « Mon compte ») et dialog Compte (connexion avec message d'erreur).

**Exigence rappelée par l'étudiant pendant l'étape** : *les plugins gardent leur apparence d'origine*.
Les cartes affichent donc les **vraies vignettes** (Chorus, Smooth Delay, KB Verb), ou la vignette
générée par l'hôte (`fallbackThumbnail()`, mêmes initiales « FD », « CV ») pour NAM et Baffle,
**sans filtre, ni teinte, ni opacité** selon l'ambiance. Le thème n'habille que le **cadre** de la carte
(bordure, pastille d'état, halo autour). Le bypass se lit grâce à la LED grise et au libellé, pas en
modifiant l'image. Aucun fichier de `src/` ni de `wamPlugins/` n'est modifié.

**Règles de lisibilité appliquées** : police d'affichage seulement pour les titres, texte en 15-16 px,
jamais sous 12 px ; cibles cliquables de 32 px minimum ; focus clavier visible ; `prefers-reduced-motion` respecté ;
couleurs d'état distinctes (vert actif, gris bypass, rouge clip, rouge clair erreur, accent = action principale).

**Polices** : pour la comparaison, la maquette les charge depuis Google Fonts. Dans l'appli elles
seront **auto-hébergées** dans `ui/fonts/` (étape 2, téléchargement après accord).

**Vérifications** :
- **axe-core 4.10.2** (règles WCAG 2.0/2.1 A et AA + bonnes pratiques) sur les 3 ambiances × les 2 modes :
  **0 violation**. Le premier passage en avait relevé 3, corrigées : contraste du badge « Clip »
  (3,1:1 → texte sombre, plus de 7:1), absence de `<main>`, absence de `<h1>` ;
- pas de défilement horizontal en 1366 px ni en 375 px (mobile : le rack passe en colonne) ;
- onglets Presets : les flèches gauche/droite déplacent la sélection et le focus.

**Choix de l'étudiant (2026-10-09)** : **Tolex & Lampes**. Il demande aussi s'il est possible d'ajouter une option « fond Butterchurn » (visualiseur audio façon Milkdrop) : **accepté** et ajouté au plan, à l'étape 4 : option désactivée par défaut, branchée en lecture seule sur la sortie de l'hôte, derrière la texture et assombrie (contraste inchangé), presets calmes uniquement, coupée si « réduire les animations », 30 images/s max, chargée seulement à l'activation, Butterchurn hébergé dans le projet (`ui/vendor/butterchurn/`).

**Rappel de l'étudiant** : il n'y a **qu'un seul thème, Tolex & Lampes**. Pas de sélecteur d'ambiance dans l'appli ;
la seule option visuelle sera le bouton « fond animé » Butterchurn (étape 4).

#### Étape 2 : le thème Tolex (2026-10-09)

**Principe : les design tokens.** Toutes les couleurs, polices, rayons et ombres sont des **variables CSS**
déclarées une seule fois dans `examples/wam/ui/theme.css` (`--bg`, `--panel`, `--surface-2`, `--text`,
`--text-muted`, `--accent`, `--ok`, `--clip`, `--error`, `--font-title`…). Les autres feuilles ne font que
les utiliser : `color: var(--text-muted)`. Pour changer une couleur, on modifie une seule ligne.

**Fichiers**
- `ui/theme.css` (nouveau) : tokens Tolex, `@font-face` des polices.
- `ui/fonts/` (nouveau) : Barlow (texte), Oswald (titres), Yellowtail (logo), en woff2, 130 Ko,
  **téléchargées avec l'accord de l'étudiant** depuis Google Fonts, avec leurs licences (OFL, Apache 2.0).
  L'appli n'appelle jamais Google à l'exécution.
- `host.css`, `fx-chain.css`, `presets/presets.css`, `account/account.css` : réécrits sur les tokens. La mise en page
  ne change pas encore (étape 4). CSS mort supprimé (`.rack-grid`, `.rack-slot`, `.rack-connector`, `.host-dot.rose`).
- `backing-track-player.css` : c'est un composant **de l'hôte**, pas un plugin. Chaque couleur devient
  `var(--token, ancienne valeur)` : thémé dans l'appli, identique à avant sur sa page de validation autonome.
  La couleur de la forme d'onde est lue dans `--bt-wave` (1 ligne de `BackingTrackPlayerElement.js`).
- `index.html` : charge `ui/theme.css` avant les autres feuilles.
- `tools/build-static-dist.mjs` : vérifie que `ui/theme.css` et les 6 polices sont dans la dist.
- `.gitattributes` : `*.woff2` marqué binaire.

**Les plugins gardent leur apparence : comment c'est garanti.** Problème découvert en cours de route :
les règles globales de l'hôte (`button { … }`, `select { … }`) s'appliquaient aussi aux interfaces des plugins
affichées dans l'éditeur et l'accordeur. Les changer aurait recoloré les boutons des plugins qui n'ont pas leur
propre style. Solution :
1. les styles de base de l'hôte sont écrits `:where(button):where(:not(.fx-editor-mount *, .tuner-mount *))` :
   ils **excluent** les zones des plugins, et `:where()` leur donne une spécificité nulle ;
2. dans `.fx-editor-mount` et `.tuner-mount`, l'hôte **fige l'ancien environnement** (police Inter, couleur
   héritée, anciens styles de base des boutons) ;
3. on ne redéfinit ni `--nam-accent` ni `--cab-accent`, et la vignette d'une carte n'est plus jamais
   filtrée : avant, une carte en bypass avait son image grisée (`opacity .45`, `saturate .3`). Maintenant c'est le
   **cadre** qui devient gris et en pointillés, l'image du plugin reste intacte ;
4. le cadre des dialogs garde une bordure transparente de 1 px, pour que l'interface du plugin ait au pixel près
   la même largeur qu'avant.

**Vérification « avant / après » des plugins** (navigateur, dist, fenêtre de 1366 px) : pour chaque interface
ouverte, on relève 23 propriétés calculées (couleurs, polices, tailles, bordures, ombres, largeur, hauteur) de
**chaque élément**, shadow DOM compris, d'abord avec le nouveau CSS, puis en rechargeant l'ancien CSS (celui du
commit précédent). Résultat : **0 différence** sur NAM (872 éléments), Cabinet (770), pédale Chorus (37)
et accordeur (26).

**Tests** : `tests/phase6/theme.test.mjs` (7 tests, ajoutés à `npm test`) :
- `theme.css` est chargé avant les autres feuilles ;
- **contraste WCAG AA calculé** (4,5:1) pour chaque couleur de texte sur chaque surface, pour le texte posé sur
  l'accent, le vert et le rouge, et pour le texte gravé sur chaque teinte de la plaque en métal brossé ;
- pas de couleur en dur dans les feuilles de l'hôte (sauf le cadran crème du VU et les faders, listés) ;
- pas de texte sous 12 px dans `host.css`, Presets et Compte (le rack sera traité à l'étape 4) ;
- polices auto-hébergées (aucune URL externe) et licences présentes ;
- plugins protégés : variables non redéfinies, aucune règle de filtre ou d'opacité sur `.fx-photo img`,
  styles de base excluant les zones des plugins, pas de sélecteur universel dans le thème ;
- CSS mort supprimé.

**Résultats** : suite de l'hôte **230/230** (dont les 7 nouveaux) ; `npm run dist` OK ; axe-core 4.10.2 sur la dist
(rack, dialog Presets, dialog Compte) : **0 violation** WCAG A/AA ; aucune erreur dans la console.
Captures : `docs/screenshots/mission8/`.

#### Étape 3 : l'infrastructure de traduction (2026-10-09)

**Principe.** Le code n'écrit plus un texte affiché en dur : il demande `t('header.tuner')`, et le module
`ui/i18n.js` renvoie « Tuner » ou « Accordeur » selon la langue choisie. Les textes vivent dans deux
**dictionnaires** : `ui/locales/en.js` et `ui/locales/fr.js`, avec exactement les mêmes clés.

**Fichiers**
- `ui/i18n.js` (nouveau), sans aucune bibliothèque :
  - `t(clé, paramètres)` remplace `{status}`, `{min}`… dans le texte ; une clé absente en français
    retombe sur l'anglais, puis sur la clé elle-même (un oubli se voit au lieu de laisser un trou) ;
  - **pluriels** avec `Intl.PluralRules` : en français 0 et 1 sont au singulier (« 0 preset »), en anglais
    seul 1 l'est (« 0 presets ») ;
  - `formatDate` / `formatNumber` : « 9 octobre 2026 », « 1 234,5 » en français ;
  - `setLanguage` met à jour `<html lang>` (utile aux lecteurs d'écran) et prévient les vues abonnées
    avec `onLanguageChange`. On n'utilise **pas** l'événement `languagechange` de `window` prévu au plan :
    le navigateur l'émet déjà quand la langue du système change, les deux se mélangeraient ;
  - langue de départ : `?lang=fr` dans l'URL, sinon le choix mémorisé (`localStorage`, clé `nam-a2-lang`),
    sinon la langue du navigateur, sinon l'anglais ;
  - `applyTranslations()` remplit le HTML statique marqué `data-i18n`, `data-i18n-title`,
    `data-i18n-aria-label`, `data-i18n-placeholder` ;
  - le module ne touche pas au navigateur au chargement : il s'importe dans Node pour les tests.
- `ui/LanguageSwitch.js` (nouveau) + `index.html` : boutons **FR | EN** dans le header
  (`aria-pressed`, infobulle traduite). Le header du rack (« Chaîne du signal », « Rack d'ampli »,
  « Accordeur », « Presets ») est déjà traduit.
- **Codes d'erreur du serveur.** Avant, l'API renvoyait `{ message }` en anglais, affiché tel quel. Maintenant
  `{ message, code, params? }` : `message` reste en anglais (rétrocompatible, lisible avec curl), et `code`
  est un identifiant stable (`auth_bad_credentials`, `asset_quota`…) que l'interface traduit. 36 codes,
  déclarés dans `server/src/errorCodes.js` ; `params` transporte les valeurs à insérer (`{min, max}` du mot de
  passe, `{max}` du quota…). Fichiers : `auth.js` (`HttpError`), `rateLimit.js`, `validation.js`,
  `routes/*.js`, et le gestionnaire central de `app.js` qui donne aussi un code aux erreurs Mongoose
  (validation, `CastError`, doublon 11000) et à toute erreur 500. Documenté dans `server/API_CONTRACT.md`.
- `account/ApiClient.js` : si le code est connu, message traduit ; sinon le `message` du serveur (un ancien
  backend reste donc compatible) ; « non connecté », « serveur injoignable », « session expirée » traduits.
- `tools/build-static-dist.mjs` : vérifie que les 4 nouveaux fichiers sont dans la dist.

**Écart au plan (assumé).** L'étape 3 pose l'infrastructure. Les vues (Presets, Explorer, Compte, chaîne
d'effets, rack) seront traduites **et** abonnées au changement de langue à l'étape 5 : les abonner maintenant
ne servirait à rien tant que leurs textes sont en dur. Les erreurs locales des presets (`PresetError`)
recevront aussi leurs codes à l'étape 5.

**Tests**
- `tests/phase6/i18n.test.mjs` (12 tests) : import sans DOM ; **mêmes clés en FR et EN** ; mêmes paramètres
  `{x}` dans les deux langues et aucune valeur vide ; **chaque `t('…')` du code et chaque `data-i18n` du HTML
  existe** dans `en.js` (scan de `examples/wam`, plugins exclus) ; chaque code du serveur a sa traduction EN et FR ;
  interpolation, dates et nombres ; pluriels ; repli ; détection de la langue ; abonnements ; `applyTranslations` ;
  messages traduits par `ApiClient`.
- `server/test/error-codes.test.js` (6 tests) : chaque code utilisé dans les sources du serveur est déclaré ;
  vraies réponses HTTP (route inconnue, JSON invalide, identifiant mal formé, chaque règle d'inscription
  avec `{min, max}` pour le mot de passe, pseudo/e-mail déjà pris, mauvais identifiants, jeton absent ou invalide,
  limiteur de tentatives, preset et asset invalides).
- **Navigateur** (dist + backend lancé sur une base MongoDB **locale temporaire**, jamais Atlas) : clic FR → header
  traduit, `<html lang="fr">`, `aria-pressed` à jour ; le choix survit au rechargement ; `?lang=en` l'emporte
  sans écraser le choix mémorisé ; vraie connexion ratée → « E-mail ou mot de passe incorrect. » en français,
  « Incorrect email or password. » en anglais ; pseudo trop court → « Pseudo : 3 à 24 caractères… ».

**Résultats** : hôte **242/242**, serveur **43/43**, `npm run dist` OK.

#### Étape 4 : mise en page et ergonomie (2026-10-10)

L'étape est découpée en trois commits : **4a** confirmations et accessibilité, **4b** nouvelle mise en
page (header, guide, notifications, responsive), **4c** fond animé Butterchurn.

##### 4a : confirmations thémées et accessibilité

**Fenêtre de confirmation** (`ui/confirmDialog.js`, nouveau). Avant, 5 actions de la fenêtre Presets
utilisaient `confirm()` du navigateur : une boîte grise, impossible à habiller, et toujours dans la langue du
système. Maintenant :

```js
if (!await confirmDialog({title: 'Supprimer « Lead » ?', message: '…', confirmLabel: 'Supprimer', danger: true})) return;
```

- `confirmDialog` renvoie une **promesse** (true / false) : le code attend la réponse avec `await`, comme avec
  `confirm()`, sans bloquer la page ni le son ;
- une seule fenêtre `<dialog>`, réutilisée ; le focus va sur **Annuler** (le choix sans risque) et revient
  ensuite sur le bouton qui l'a ouverte ; Échap = Annuler ; une action destructrice a un bouton rouge ;
- les textes sont traduits (`presets.confirm.*`, `chain.confirmRemove`) : ces confirmations étant réécrites,
  elles sont traduites tout de suite plutôt qu'à l'étape 5 ;
- la suppression d'un plugin (`FxChainView`) utilise la même fenêtre (elle avait sa propre copie).

**Accessibilité**
- L'éditeur de plugin, le menu d'ajout et la fenêtre de routage A → B ont un titre annoncé par les lecteurs
  d'écran (`aria-labelledby`). Les identifiants dépendent de la chaîne (A ou B) pour ne jamais être en double.
- `ui/tabs.js` (nouveau) : onglets Presets et Compte au **clavier** (motif WAI-ARIA « Tabs ») : flèches ← →,
  Début / Fin, un seul onglet atteignable avec Tab, onglets désactivés sautés (« Mon compte » sans connexion),
  zone reliée à son onglet (`role=tabpanel`, `aria-controls`, `aria-labelledby`).
- **Focus conservé** dans la fenêtre Presets : pendant une action, ses boutons sont désactivés et le navigateur
  renvoyait le focus au début de la page. Il revient maintenant sur le bouton utilisé ; après une suppression,
  il va au preset suivant de la liste.

**Préparer la traduction.** `FxRackView` retrouvait les panneaux d'entrée / sortie par leur texte
(`[aria-label="Chain A input"]`) et `PresetView` son bouton de fermeture par `[aria-label="Close presets"]` :
une fois traduits, ces textes auraient cassé le rack. Ils sont retrouvés par une **classe** (`.fx-input-strip`,
`.fx-output-strip`) ou une référence directe ; un test l'interdit désormais partout.

**Tests**
- `tests/phase6/confirm-dialog.test.mjs` (6 tests) avec `tests/phase6/fakeDom.mjs`, un mini DOM écrit pour
  l'occasion (pas de dépendance) : réponse oui / non, focus, Échap, une seconde demande annule la première,
  textes traduits, texte jamais interprété comme du HTML ; **plus aucun `confirm()`** dans l'hôte et les 5
  confirmations présentes dans les deux dictionnaires ; onglets (flèches, Début / Fin, désactivés, ARIA).
- `tests/phase6/layout.test.mjs` (3 tests) : aucune recherche d'élément par son texte, titres des fenêtres,
  onglets accessibles.
- Navigateur (dist) : retrait d'un plugin (Annuler → focus rendu, carte gardée), onglets au clavier, preset
  enregistré puis supprimé en FR et en EN via la nouvelle fenêtre.

**Résultats 4a** : hôte **251/251**.

##### 4b : nouvelle mise en page, guide, notifications

**Header en trois zones** (`index.html`, `host.css` réécrit) :
- **marque** à gauche (« NAM A2 » + sous-titre) ;
- **au centre, ce qu'on entend** : la chaîne du signal (entrée → ampli → baffle → sortie) et le **preset
  chargé** avec « • modifié » s'il a changé. Avant, le nom du preset était serré dans le bouton Presets et
  disparaissait sur petit écran ;
- **actions** à droite : Presets, Accordeur, Compte, mode, langue.

**Panneau « Source audio »** : la colonne de gauche devient un tiroir avec un vrai titre, un bouton ×
et Échap pour le fermer, et deux cartes **Entrée** / **Sortie**. Le bouton qui l'ouvre affiche son texte
(« Source audio ») au lieu d'une simple icône.

**Barre d'outils du rack** (`#rackToolbar`) : Source audio, Activer l'entrée live, 1 / 2 chaînes et les
périphériques (mode complet), l'astuce « glisser une carte » et le bouton **? Raccourcis**. `FxRackView`
s'y insère s'il la trouve (sinon il garde son ancien comportement : la page de labo n'a pas de barre).

**Guide de démarrage** (`ui/GettingStarted.js`, nouveau) : au premier lancement, trois étapes sous le
header : 1. choisir une source, 2. activer l'entrée live, 3. charger un preset d'usine. Chaque étape est un
bouton qui **fait l'action** (ouvre le panneau, active l'entrée, ouvre les presets d'usine) ; elle n'est
cochée que quand l'action a **vraiment** eu lieu (`main.js` appelle `guide.complete('live')` quand l'entrée
démarre, etc.). L'état est gardé dans `localStorage` (`nam-a2-guide`) ; une fois tout fait, le guide ne
revient plus, mais on peut le rouvrir depuis l'aide des raccourcis. La partie « calcul » (`guideModel`) est
une fonction pure, testée sans navigateur.

**Notifications** (`ui/toast.js`, nouveau) : les messages (« Preset chargé », erreurs…) apparaissent en
bas de l'écran. Une information disparaît après 4,5 s ; une **erreur reste** jusqu'à ce qu'on la ferme ;
3 au plus, un message répété est relancé au lieu d'être empilé. Les lecteurs d'écran continuent de lire
`#hostStatus` (`role=status`, caché visuellement) : la zone des toasts n'est pas « live », sinon chaque
message serait annoncé deux fois.

**Aide des raccourcis** (`ui/ShortcutsHelp.js`, nouveau) : touche **?** ou bouton « ? Raccourcis ». Liste
les raccourcis qui existaient déjà (Alt + ← / → pour déplacer une carte, flèches dans les onglets, Échap,
Début pour recentrer un panoramique). La touche est ignorée quand on écrit dans un champ et dans les
interfaces des plugins, qui gardent leurs propres raccourcis.

**Lisibilité du rack** : plus aucun texte sous 12 px dans `fx-chain.css` et le lecteur (avant : 7 à 11 px).
Les rangées passent de 225 à 240 px pour garder la même place aux contrôles. Seule exception : les
graduations du VU-mètre, du texte SVG décoratif (`aria-hidden`) dont la taille est en unités du dessin.

**Responsive** : header sur 3 colonnes, 2 sous 1180 px, 1 sous 720 px ; sous 560 px, l'entrée et la
sortie se placent côte à côte au-dessus des cartes. Aucun défilement horizontal à 375, 1024 et 1366 px.

**Bugs trouvés en vérifiant dans le navigateur**
- L'étape « preset » du guide ne faisait rien : `presetManager.setSource()` ne renvoie pas toujours une
  promesse, et `.catch()` dessus plantait. Corrigé avec `try { await … }` ; un test interdit le motif.
- Le nom du preset était invisible dans la nouvelle ligne : d'anciennes règles de `presets.css` (prévues
  pour le bouton Presets) le limitaient à 160 px et le cachaient sous 720 px. Supprimées.

**Les plugins ne changent pas** : toutes les nouvelles règles visent des classes de l'hôte ; les styles
de base (`button`, `kbd`…) excluent toujours `.fx-editor-mount` et `.tuner-mount`.

**Tests**
- `tests/phase6/host-ui.test.mjs` (7 tests) : toasts (information qui disparaît, erreur qui reste, limite
  de 3, pas de doublon, texte jamais interprété comme du HTML) ; guide (modèle pur, stockage bloqué ou
  corrompu, bouton = action sans cocher, `complete()` mémorisé, re-rendu au changement de langue, masqué une
  fois tout fait puis réouvrable) ; raccourcis (touche ignorée pendant la saisie et dans les plugins,
  fenêtre traduite, focus rendu au bouton).
- `layout.test.mjs` (+2) : header en trois zones, **aucun ancien identifiant perdu** ni en double, guide
  relié aux vraies actions, nouveaux fichiers dans la dist.
- `theme.test.mjs` : la règle « pas de texte sous 12 px » couvre maintenant `fx-chain.css` et le lecteur.
- `fakeDom.mjs` : `replaceChildren`, `querySelector` simple, événements du document, nœuds texte.
- Navigateur (dist, FR) : guide complet (panneau ouvert puis Échap → focus rendu au bouton, presets d'usine
  ouverts, preset chargé → étape cochée et nom affiché), touche ? et « Revoir le guide », toast d'un
  changement de source, mode complet avec 2 chaînes, aucune erreur console.

**Résultats 4b** : hôte **260/260**, serveur **43/43**.

##### 4c : fond animé Butterchurn (option)

Le bouton **Fond animé** du header affiche derrière l'interface un visualiseur
[Butterchurn](https://github.com/jberg/butterchurn) (le Milkdrop de Winamp, en WebGL) qui réagit au son.
Toutes les conditions de l'étape 1 sont respectées :

| Exigence | Comment |
|---|---|
| Désactivé par défaut | `aria-pressed="false"` ; le choix est mémorisé (`nam-a2-visualizer`) |
| Chargé seulement à l'activation | les deux scripts (≈ 850 Ko) sont ajoutés à la page au premier clic, puis réutilisés |
| Hébergé dans le projet | `ui/vendor/butterchurn/` : fichiers npm **non modifiés**, licences MIT, empreintes SHA-256 dans le README (vérifiées par un test) ; `-text` dans `.gitattributes` pour que Git ne change aucun octet |
| Lecture seule sur la sortie | `connectAudio(backingMix.output)` : Butterchurn relie ce nœud à son analyseur, qui ne va nulle part. Le son n'est pas modifié (on visualise ampli + backing track, c'est-à-dire ce qu'on entend) |
| Discret, contraste inchangé | calque `position: fixed` derrière la page, voilé par la texture + le tolex à 70 % ; les panneaux gardent leur fond |
| Presets calmes | 8 presets choisis dans le pack (lents, sombres, sans flash), un nouveau toutes les 45 s avec un fondu |
| Léger | 30 images/s au plus, demi-résolution, pause quand l'onglet est caché ; à l'arrêt, contexte WebGL libéré tout de suite |
| Réduire les animations | si le système le demande, le bouton est désactivé avec une explication, et le fond s'arrête s'il tournait |
| Pas de WebGL 2 | vérifié **avant** de télécharger quoi que ce soit ; notification d'erreur traduite |

Les plugins ne sont pas touchés : le calque est sous toute la page, sans filtre sur leurs interfaces.

**Tests** : `tests/phase6/visualizer.test.mjs` (8 tests) avec une fenêtre et un Butterchurn simulés :
rien de téléchargé avant le clic, branchement de la sortie seulement, demi-résolution, calque `aria-hidden`,
jamais le preset « strobe » glissé dans le faux pack, 3 images dessinées sur 5 à 60 Hz, arrêt complet
(débranché, calque retiré, contexte WebGL libéré), animations réduites, pas de WebGL 2, choix mémorisé,
empreintes des fichiers vendor, aucune URL externe. Un test de mutation (garde « animations réduites »
retirée) fait bien échouer la suite.
**Navigateur** : activé puis désactivé puis réactivé (scripts chargés une seule fois, un seul calque),
capture à 1366 px, `npm run dist` (fichiers identiques octet pour octet dans la dist), aucune erreur console.

**Résultats 4c** : hôte **268/268**, serveur **43/43**.

#### Étape 5 : toute l'interface en français et en anglais (2026-10-10)

Tous les textes de l'hôte passent maintenant par `t()` : fenêtres Presets / Explorer / Compte /
Accordeur, rack (bandes A et B, routage A → B), cartes d'effets et leur éditeur, menu d'ajout,
lecteur de backing tracks, panneau Source audio, messages et notifications. **Changer de langue
retraduit tout en direct**, fenêtres ouvertes comprises, sans recharger la page ni effacer ce qui
est tapé dans les champs.

**Comment ça marche**

| Mécanisme | Rôle |
|---|---|
| `data-i18n` + `data-i18n-params` (JSON) | un texte « à trous » garde ses paramètres : `ENTRÉE · {lane}` reste « ENTRÉE · B » après un changement de langue |
| `localize(élément, {text, title, ariaLabel, placeholder}, params)` | traduit un élément créé en JavaScript **et** le marque pour `applyTranslations` |
| `onLanguageChange` dans chaque vue | ce qui est calculé (listes, statuts, compteurs, dB) est recalculé ; les statuts sont gardés sous forme de fonction (`setStatus(() => t(…))`) pour être retraduits |
| `formatDb()` | « −12,0 dB » / « -12.0 dB » selon la langue (formateur mis en cache : il sert aussi aux vumètres) |
| `ui/hostMessages.js` | le code du moteur (FxChain, SourceManager, OutputDeviceManager, BackingTrack…) **n'est pas modifié** : ses messages anglais connus sont traduits à l'affichage (`localizeMessage`, table + motifs) |
| `PresetError(message, code, params)` | le message reste anglais (serveur, tests du prof) ; `errorText()` affiche `errors.preset.<code>` |
| `detailCode` (serveur) | un preset refusé par le serveur renvoie aussi le code de l'erreur : le détail s'affiche traduit |
| `NotAllowedError` | le refus d'accès au micro est traduit d'après le nom de l'erreur (le texte du navigateur varie) |

**Ce qui reste volontairement en anglais** : les messages des `PresetError` et du serveur (contrat
d'API, tests), la page de test des effets `fx-test/` (outil de développement), les noms des sons,
plugins et tags. Dans `index.html`, les textes exigés par les tests du prof (« Enable live input »,
« Automated test results », `opened with <code>?auto=1</code>`, « Sign in ») restent écrits en
anglais : c'est le JavaScript qui les traduit au chargement.

La bande B est une copie de la bande A : ses textes sont reposés avec `{lane: 'B'}` après la copie
(l'ancien code préfixait « Chain B » aux libellés anglais). Les descriptions des 7 presets d'usine
sont traduites (`presets.factory.<id>`).

**Tests** : `tests/phase6/host-i18n.test.mjs` (12 tests) : chaque message traduit par `hostMessages`
existe vraiment dans le code ; chaque `new PresetError(…)` a un code traduit en EN et FR ; aucune vue
n'écrit de texte anglais en dur ; les clés posées par `localize` existent ; chaque vue s'abonne au
changement de langue ; résumé de preset et dB en français ; `detailCode` du serveur. Contre-épreuve :
un `PresetError` sans code ou un texte en dur remis dans l'accordeur font échouer la suite. Serveur :
`error-codes.test.js` vérifie `detailCode`.
**Navigateur** (dist) : chargement en FR, bascule FR ↔ EN avec le mode complet (bandes A et B,
bouton 1 / 2 chaînes, routage), fenêtre Presets ouverte (onglets, description d'usine, statut
« « Clean Deluxe » chargé. » → « Loaded “Clean Deluxe”. »), Compte (onglet Créer un compte, aide du
pseudo), Accordeur, lecteur de backing tracks ; aucune nouvelle erreur console.

**Résultats 5** : hôte **279/279**, serveur **43/43**.

#### Étape 6 : accessibilité, textes, parcours complet (2026-10-10)

**Audit automatique (axe-core 4.10, règles WCAG 2.0/2.1 A et AA + bonnes pratiques)**, lancé sur
la dist dans le navigateur, en FR puis en EN, dans tous les états : page, panneau Source, mode
complet A + B, fenêtre de routage, Presets (usine / navigateur / explorer), Compte (connexion /
création), raccourcis, éditeur d'effet, menu d'ajout. Corrections :

| Règle axe | Problème | Correction |
|---|---|---|
| landmark-complementary-is-top-level | `<aside>` (bandes Entrée/Sortie, côtés de l'éditeur) dans `<main>` | `<section>` / `<div>` |
| landmark-unique / landmark-no-duplicate-main | le lecteur de backing tracks avait son propre `<main>` et `<aside>` | `<div class="track-main">` / `<div class="library">` (CSS adapté) |
| image-redundant-alt | photo d'une carte : alt = nom déjà écrit dessous | `alt=''` (le bouton garde « Ouvrir {nom} ») |
| aria-required-attr | vumètres fins sans `aria-valuenow` avant la 1re image | valeur initiale −60 |
| button-name | étiquette de dérivation vide visible avant le 1er rendu | cachée dès la création |
| region | notifications hors de toute zone repère | `<section aria-label="Notifications">` (traduit) |
| aria-allowed-role | `role=tabpanel` posé sur un `<form>` | le formulaire est enveloppé dans un `<div id="accountTabPanel">` |

Résultat : **0 violation côté hôte** partout. **Limite connue** : axe signale encore des contrastes
faibles dans les interfaces des plugins (éditeur NAM `.eq-value` 4,43 : 1, `.eq-hint` 3,63 : 1 ;
accordeur wasabi `#pitch_unit` 1,61 : 1, `tabindex` > 0) ; le code des plugins est intouchable,
c'est donc documenté et non corrigé.

**Clavier** : parcours réel à la touche Tab : en-tête → guide → barre d'outils → bande d'entrée →
cartes (+, bypass, retirer, photo) → bande de sortie → lecteur ; l'ordre est logique et chaque
contrôle a un contour de focus visible (orange).

**Mise en page** : à 1366 px, avec 2 modules, la carte de la chaîne dans l'en-tête faisait passer
« SORTIE » à la ligne ; elle passe maintenant sous le logo jusqu'à 1600 px (avant : 1180 px).
Captures FR/EN à 1440 px et 375 px dans `docs/screenshots/interface/` (pas de défilement horizontal
à 375 px). Le gain d'entrée s'affiche au format de la langue dès le chargement (« 0,0 dB »).

**Textes (relecture ux-copy)** : « Se connecter » au lieu de « Connexion » (le même texte sert
d'onglet et de bouton d'envoi), « En bypass » / « Activer ou mettre en bypass » au lieu de
« Bypassé », « Copier sur mon compte » / « Copy to my account » (aligné sur la version avec le nom).
Gardés volontairement : « Réinit. » (boutons étroits ; leur nom accessible est complet),
« Backing tracks » (terme d'usage chez les guitaristes), « Retirer » un plugin de la chaîne vs
« Supprimer » un preset (le plugin n'est pas détruit, le preset si).

**Revue de code / simplification** : 5 remarques mineures ; appliquée : le formatage du gain
d'entrée, répété 4 fois dans `main.js`, passe par `showSourceTrim()`. Les autres sont des choix
assumés (point de rupture validé par les captures, tests du même style que le reste de phase6).

**Tests** : `tests/phase6/host-a11y.test.mjs` (6 tests) fige chaque correction ci-dessus
(contre-épreuve : la zone de notifications remise en `<div>` fait échouer la suite).

**Résultats 6** : hôte **285/285**, serveur **43/43**.

#### Chasse aux bugs (fin de l'étape 6, 2026-10-10)

Sondes dans le navigateur (dist) : bascule FR ↔ EN répétée avec fenêtres ouvertes, mode complet à
375 px, raccourcis clavier dans les champs, `?lang=` invalide, erreurs console. Trois bugs trouvés
et corrigés :

| Bug | Cause | Correction | Test |
|---|---|---|---|
| Le « + » avant une carte, la poubelle et la fenêtre « Retirer … ? » disaient « NeuralWAMp Amp Sim » alors que la carte affiche le modèle chargé (« Bogner Uberschall… ») | ces libellés utilisaient le nom du plugin, la légende le titre du modèle | `FxChainView.displayName()` : un seul calcul du nom, utilisé par la légende, le « + », la poubelle et la confirmation | `host-a11y.test.mjs` |
| Après un changement de langue, le statut lu par les lecteurs d'écran (`#hostStatus`) restait dans l'ancienne langue | `message()` recevait un texte déjà traduit | `message()` accepte une fonction (`() => t(…)`), gardée et rappelée par `relabelHost()` (même principe que les vues) | `host-i18n.test.mjs` |
| Taper « ? » dans le champ « Filtrer les morceaux » du lecteur ouvrait l'aide des raccourcis et le caractère était perdu | le lecteur est dans un shadow DOM : vu du document, `event.target` est l'élément `<backing-track-player>`, pas le champ | `isHelpKey` regarde tout `event.composedPath()` (marche aussi pour les GUI de plugins) | `host-ui.test.mjs` (contre-épreuve : échoue sans la correction) |

Vérifié sans problème : pas de défilement horizontal à 375 px en mode complet (2 chaînes) ;
fenêtre Presets retraduite entièrement quand elle est ouverte ; `?lang=de"><b>x` ignoré (langue
enregistrée gardée, rien d'injecté) ; seule erreur console : le serveur de comptes éteint pendant
le test (attendu).

**Résultats** : hôte **286/286**, serveur **43/43**.

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
