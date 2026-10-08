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
| Git | Une branche `feature/...` par mission, commit + push auto, merge dans `main` sur accord | Historique lisible sur GitHub. |
| MCP | Aucun serveur MCP supplémentaire | Pas nécessaire ; on vérifie via les tests, l'API et le navigateur intégré. |
| Skills | Navigateur intégré (vérifs visuelles), `/code-review`, `/security-review`, `/simplify` | Vérifier l'UI réelle et relire le code sécurité (JWT, droits). |

---

## 2. Tableau d'avancement

Légende : ✅ fait · 🔄 en cours · ⏳ à faire

| # | Mission (branche) | État | Date | Commit |
|---|---|---|---|---|
| — | Installation, build, fork (avant le plan) | ✅ | 2026-10-08 | — |
| 0 | Organisation (`feature/organisation`) | ✅ | 2026-10-08 | voir `git log feature/organisation` |
| 1 | Format + presets locaux IndexedDB + assets par hash (`feature/presets-locaux`) | ⏳ | | |
| 2 | Backend presets + assets (`feature/backend-presets`) | ⏳ | | |
| 3 | Comptes dans l'hôte (`feature/comptes`) | ⏳ | | |
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

**Comment vérifier** : `git status` propre après commit ; `CLAUDE.md` et `SUIVI.md` lisibles sur
GitHub dans la branche `feature/organisation`.

---

## 5. Mémo pratique

| Je veux… | Commande / action |
|---|---|
| Recompiler la dist | double-clic `build.bat` (ou `wsl bash -lc "cd /mnt/c/Users/NITRO/Projects/NAM_A2_WAM && npm run dist"`) |
| Lancer les tests de l'hôte | `.\build.bat test` |
| Voir l'appli | VS Code → clic droit `dist/NAM_A2_WAM/index.html` → *Open with Live Server* |
| Récupérer les mises à jour du prof | `git pull upstream main` |
| Lancer le backend | *(mission 2)* |
| Comptes de test | *(mission 2)* |

---

## 6. Reste à faire / idées

- Missions 1 à 7 (voir tableau).
- Idées hors périmètre : amis et partage privé, presets favoris, notes/likes, aperçu audio d'un
  preset, déploiement en ligne (backend + dist).
