# REPORT — Hôte NAM A2 WAM : utilisateurs, connexions et presets

> Mini-projet TP4 — Technos Web, M1 MIAGE 2026-2027.
> Fork : https://github.com/xDraawwScript/NAM_A2_WAM — projet d'origine : https://github.com/micbuffa/NAM_A2_WAM
>
> *Document en cours de rédaction. Il est complété à la fin de chaque mission à partir du journal
> détaillé [`SUIVI.md`](SUIVI.md).*

## 1. Objectif

Améliorer l'hôte Web Audio Modules du projet NAM A2 WAM (ampli à réseau de neurones, simulation de
haut-parleur et pédales d'effets) pour gérer des **comptes utilisateurs**, des **connexions** et la
**sauvegarde / le chargement de presets**, **sans modifier le code des plugins** : les états sont
capturés et restaurés uniquement par les méthodes WAM `getState()` / `setState()`.

## 2. Fonctionnalités

| Fonctionnalité | État |
|---|---|
| Presets locaux (navigateur, IndexedDB) : enregistrer, charger, renommer, mettre à jour, supprimer, indicateur « modifié » | ✅ |
| Import / export d'un preset en fichier `.json` | ✅ |
| Modèles et IR partagés entre presets (adressés par hash) | ✅ |
| Comptes : inscription, connexion, déconnexion, profil (JWT) | ✅ |
| Presets en ligne, privés ou publics | ⏳ |
| Explorer les presets publics : récents, recherche, copie | ⏳ |
| Presets d'usine (lecture seule) | ⏳ |

## 3. Interface utilisateur

*À compléter (captures d'écran).* Deux boutons dans l'en-tête du rack — **Compte** et **Presets** —
ouvrent des fenêtres de dialogue ; la fenêtre Presets comporte les onglets *Mes presets* et
*Explorer*.

## 4. Choix techniques

*À compléter.* Résumé des décisions :
- hôte en JavaScript vanilla (modules ES), cohérent avec le code existant ;
- format de preset versionné `{format: 'nam-a2-preset', version, rack, backingTrack?}` ;
- stockage local IndexedDB derrière un adaptateur commun au stockage distant ;
- modèles `.nam` et IR référencés par leur hash SHA-256 (manifestes d'usine ou magasin d'assets) ;
- backend Express 5 + Mongoose + MongoDB Atlas, authentification JWT, mots de passe bcrypt ;
- conformité à `SPECIFICATION_FX_CHAIN.md` §7.2 (spec du projet d'origine).

## 5. Architecture

```
Navigateur (hôte WAM, examples/wam)                Serveur (server/, Node + Express)        MongoDB
  FxRack.getState()/setState()                        /api/auth/*   comptes (JWT, bcrypt)     users
  presets/ : format, assets par hash,  ── HTTP+JWT ──► /api/presets  presets privés/publics ─► presets
            IndexedDB (mode invité)                   /api/assets   modèles/IR par SHA-256    assets
```
Détail des routes : [`server/API_CONTRACT.md`](server/API_CONTRACT.md). Le format d'un preset est défini
une seule fois (`examples/wam/presets/PresetFormat.js`) et utilisé par le navigateur et le serveur.

## 6. Découpage du travail

| # | Mission | Branche |
|---|---|---|
| 0 | Organisation | `feature/organisation` |
| 1 | Format de preset, assets par hash, presets locaux | `feature/presets-locaux` |
| 2 | Backend presets + assets | `feature/backend-presets` |
| 3 | Comptes dans l'hôte | `feature/comptes` |
| 4 | Presets en ligne | `feature/presets-en-ligne` |
| 5 | Explorer les presets publics | `feature/explorer-public` |
| 6 | Presets d'usine | `feature/presets-usine` |
| 7 | Finitions et relectures | `feature/finitions` |

## 7. Tests

| Suite | Commande | Résultat |
|---|---|---|
| Hôte (existants, projet d'origine) | `npm test` | 146 / 146 ✅ (avant modifications) |
| Hôte (nouveaux, `tests/phase5/`) | `npm test` | 44 / 44 ✅ (missions 1 et 3) — total 190 / 190 |
| Backend (`server/test/`) | `cd server && npm test` | 24 / 24 ✅ (mission 2, MongoDB en mémoire) |

## 8. Utilisation de l'assistant IA

*À compléter : comment l'IA a été utilisée (analyse du projet, installation de la chaîne de
compilation, conception, code, tests, relectures).*

## 9. Limites et perspectives

*À compléter.*
