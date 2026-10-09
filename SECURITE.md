# Sécurité — toutes les mesures du projet

> Récapitulatif de **chaque mesure de sécurité** mise en place dans le projet (hôte + serveur), avec
> *où* elle est implémentée, *pourquoi*, et le *test* qui la vérifie. Les décisions détaillées sont
> dans le journal [`SUIVI.md`](SUIVI.md) (missions 2 à 5 et « Revue de sécurité »).
>
> Légende des origines : **M2…M5** = mission où la mesure a été ajoutée ; **CR** = corrigé après une
> relecture de code (`/code-review`) ; **RS** = revue de sécurité ; **E2E** = trouvé par un test de
> bout en bout.

## 1. Comptes et mots de passe

| # | Mesure | Où | Pourquoi | Test | Origine |
|---|---|---|---|---|---|
| 1 | Mots de passe **hachés avec bcrypt** (coût 10), jamais stockés en clair | `server/src/models/User.js` (hook `pre('validate')`) | Une fuite de la base ne révèle pas les mots de passe | `server/test/auth.test.js` | M2 |
| 2 | Le hash n'est **jamais renvoyé** (`select: false`, `toPrivate()` / `toPublic()`) | `User.js` | Pas de fuite par l'API | `auth.test.js` (« sans hash de mot de passe ») | M2 |
| 3 | Mot de passe : **8 caractères minimum, 72 octets maximum** | `examples/wam/account/accountRules.js` (partagé client/serveur), `server/src/routes/auth.js` | bcrypt **ignore tout ce qui dépasse 72 octets** : au-delà, n'importe quelle fin était acceptée (vérifié par l'expérience) | `auth.test.js` (73 octets refusé, « é » compté 2 octets) | RS |
| 4 | Même message **et même durée** de réponse à la connexion, que l'email existe ou non (calcul bcrypt factice) | `routes/auth.js` (`DUMMY_HASH`) | Empêche de découvrir quels emails ont un compte (énumération) | `auth.test.js` (même message) | M2 + CR |
| 5 | **Limite de tentatives** : 10 connexions / 15 min et 5 inscriptions / heure par adresse IP → `429` + `Retry-After` | `server/src/rateLimit.js`, `routes/auth.js` | Freine la force brute sur les mots de passe et la création de comptes en masse | `auth.test.js` (11ᵉ connexion → 429, 6ᵉ inscription → 429) | RS |
| 6 | **Email privé**, **pseudo public** : seuls `id` + `username` sont visibles des autres | `User.js` (`toPublic`), `routes/presets.js` (`card`) | Protéger l'adresse email des utilisateurs | `presets.test.js` (« l'email n'est jamais exposé ») | M2 |
| 7 | Pseudo unique **sans tenir compte de la casse** (`usernameKey`) | `User.js` | Empêche l'usurpation « Jimi » / « jimi » | `auth.test.js` | M2 |
| 8 | Le **compte démo** (mot de passe public) n'est **jamais créé en production** ; son indice n'apparaît qu'avec une API locale | `server/src/server.js`, `AccountView.js` | Sinon n'importe qui pourrait publier sous ce compte sur un serveur en ligne | revue manuelle | RS |

## 2. Jetons de session (JWT)

| # | Mesure | Où | Pourquoi | Test | Origine |
|---|---|---|---|---|---|
| 9 | JWT **signé** avec un secret de 48 octets aléatoires, stocké **uniquement** dans `server/.env` | `server/src/auth.js`, `.env` (non versionné) | Seul le serveur peut créer des jetons valides | — | M2 |
| 10 | Le serveur **refuse de démarrer sans `JWT_SECRET`** (plus de secret par défaut dans le code) | `auth.js`, `server.js` | Un secret écrit dans le code permettrait à n'importe qui de forger des jetons | — | CR |
| 11 | Algorithme **HS256 imposé** à la signature et à la vérification | `auth.js` | Défense en profondeur contre les jetons signés autrement | `auth.test.js` (jeton HS512 refusé) | RS |
| 12 | Le jeton ne contient **que l'identifiant** (`sub`), jamais l'email ni le mot de passe ; **expire après 12 h** | `auth.js` | Un JWT est signé mais **lisible** par le client | — | M2 |
| 13 | Un jeton expiré/invalide sur une route **publique** est ignoré (visiteur), pas une erreur | `auth.js` (`optionalAuth`) | Un vieux jeton ne doit pas bloquer la lecture de contenus publics | `auth.test.js` | CR |
| 14 | Côté navigateur : expiration lue dans le jeton au chargement, **déconnexion automatique sur 401**, réponse tardive ignorée si l'on s'est déconnecté entre-temps | `examples/wam/account/ApiClient.js` | Pas de session « fantôme » sans jeton | `tests/phase5/api-client.test.mjs` | M3 + CR |
| 15 | Le **mot de passe n'est jamais stocké** dans le navigateur (seulement jeton + profil) | `ApiClient.js` | — | `account-host-integration.test.mjs` | M3 |

## 3. Autorisations (qui a le droit de faire quoi)

| # | Mesure | Où | Pourquoi | Test | Origine |
|---|---|---|---|---|---|
| 16 | Toutes les requêtes sur un preset filtrent par **propriétaire** (`ownerId`) | `server/src/routes/presets.js` | Impossible de lire/modifier/supprimer le preset d'un autre (IDOR) | `presets.test.js` | M2 |
| 17 | Un preset privé d'un autre répond **404, pas 403** | `routes/presets.js` | On ne révèle même pas qu'il existe | `presets.test.js` | M2 |
| 18 | Les presets **publics des autres sont en lecture seule** (serveur : routes filtrées ; client : `writableStorage()` refuse la source « public ») | `routes/presets.js`, `presets/PresetManager.js` | On peut essayer et copier, jamais modifier le travail d'un autre | `preset-manager.test.mjs`, `host-integration.test.js` | M5 |
| 19 | **Assets (modèles/IR)** : lisibles seulement par leurs propriétaires, ou s'ils servent à un preset public / à un de mes presets — **une seule règle** (`usableHashes`) pour `HEAD`, `GET` et l'enregistrement d'un preset | `routes/assets.js` (`usableHashes`) | Un modèle privé reste privé ; une règle unique ne peut pas diverger | `assets.test.js` | M2 + CR + /simplify |
| 20 | **Connaître le hash ne suffit pas** : pour utiliser un asset privé d'un autre, il faut **envoyer son contenu** (preuve de possession) | `routes/assets.js`, `models/Asset.js` (`owners`) | Sinon on pourrait s'approprier un modèle privé à partir de son seul hash | `assets.test.js` | CR + E2E |
| 21 | `HEAD /assets/:hash` ne répond « existe » que si l'utilisateur peut **déjà** l'utiliser | `routes/assets.js` | Ne pas révéler l'existence d'un asset privé | `assets.test.js` | M4 |

## 4. Données envoyées par le navigateur (« ne jamais faire confiance au client »)

| # | Mesure | Où | Pourquoi | Test | Origine |
|---|---|---|---|---|---|
| 22 | Le serveur **recalcule le SHA-256** de chaque asset et refuse un contenu falsifié | `routes/assets.js` | Un client ne peut pas envoyer un fichier sous le hash d'un autre | `assets.test.js` | M2 |
| 23 | Validation des presets avec **les mêmes règles que le navigateur** (`PresetFormat.js` partagé) : nom, tags, structure du rack, identifiants uniques | `server/src/validation.js` | Une seule définition, pas d'écart client/serveur | `presets.test.js`, `preset-format.test.mjs` | M2 |
| 24 | Un preset ne peut **pas embarquer** le modèle ou l'IR (seulement des références) ; rack ≤ 256 Ko | `validation.js` | Empêche les documents géants dans la base | `presets.test.js` | M2 |
| 25 | **Injection NoSQL** évitée : entrées converties en chaînes, identifiants MongoDB validés avant requête | `routes/*.js`, `validation.js` (`assertObjectId`) | Un objet `{"$gt": ""}` à la place d'un email ne passe pas | `presets.test.js` (id invalide → 404) | M2 |
| 26 | **Injection d'expression régulière** évitée : la recherche est **échappée** et limitée à 60 caractères | `validation.js` (`escapeRegex`) | `.*` ne doit pas tout renvoyer ni ralentir la base | `presets.test.js` (`.*` → 0 résultat) | M2 |
| 27 | Pagination bornée (`limit` ≤ 50) | `validation.js` | Pas de requête qui renvoie toute la base | — | M2 |
| 28 | Fichiers importés : **JSON vérifié** et **hash de chaque asset recalculé** ; fichier modifié/corrompu refusé | `examples/wam/presets/PresetFile.js` | Un fichier piégé ne peut pas injecter un autre modèle | `preset-file.test.mjs` | M1 |
| 29 | Chemins d'assets d'usine : `..` et chemins vides **refusés** (pas de « path traversal ») | `presets/PresetAssets.js` (`factoryAssetUrl`) | On ne sort pas du dossier des modèles | `preset-assets.test.mjs` | M1 |
| 30 | Nom des fichiers exportés **assaini** | `PresetFile.js` (`presetFileName`) | Pas de caractères dangereux dans un nom de fichier | `preset-file.test.mjs` | M1 |

## 5. Déni de service et volumes

| # | Mesure | Où | Pourquoi | Test | Origine |
|---|---|---|---|---|---|
| 31 | Corps JSON limités : **1 Mo** en général, **12 Mo** pour les assets | `server/src/app.js`, `routes/assets.js` | Pas de requête géante | — | M2 |
| 32 | Le corps de 12 Mo n'est lu **qu'après la vérification du jeton** | `routes/assets.js` | Un anonyme ne peut pas faire lire 12 Mo au serveur | `assets.test.js` | CR |
| 33 | Asset ≤ 8 Mo, **quota de 200 Mo par utilisateur** | `routes/assets.js` | Pas de remplissage de la base (Atlas gratuit = 512 Mo) | — | CR |
| 34 | Assets jamais utilisés **supprimés après 24 h** ; assets plus utilisés supprimés avec le dernier preset | `routes/assets.js`, `server.js` | Pas d'accumulation de fichiers orphelins | `assets.test.js` | M2 + CR |

## 6. Navigateur (XSS, cache, appareils)

| # | Mesure | Où | Pourquoi | Test | Origine |
|---|---|---|---|---|---|
| 35 | **Aucun `innerHTML`** avec des données utilisateur : tout passe par `textContent` (`el()`) | `examples/wam/ui/el.js`, toutes les vues | Un nom de preset contenant `<script>` s'affiche tel quel (pas de XSS) | `preset-host-integration`, `account-host-integration` | M1 |
| 36 | Cache mémoire des modèles **vidé à chaque connexion/déconnexion**, limité à 16 | `presets/RemotePresetStorage.js`, `main.js` | Un autre utilisateur du même onglet ne réutilise pas les modèles privés du précédent | `remote-preset-storage.test.mjs` | CR |
| 37 | Un preset ne contient **ni jeton, ni identifiant de carte son, ni gain d'entrée** ; le charger **n'active jamais le micro** | `PresetFormat.js`, `PresetManager.js` | Exigence de la spec du prof (§7.2) ; vie privée | `preset-host-integration.test.mjs` | M1 |
| 38 | Les modules presets/comptes **n'importent jamais le code des plugins** et ne touchent pas aux appareils audio | — | Respect de la consigne + surface d'attaque réduite | tests d'intégration | M1 |
| 39 | Confirmation avant les actions irréversibles (supprimer) ou visibles par tous (rendre public, avec rappel que seul le pseudo est montré) | `PresetView.js` | Éviter les erreurs de manipulation | vérifié dans le navigateur | M1 + M4 |
| 46 | **Presets d'usine** : catalogue validé (format, identifiants `factory:`, **références d'usine uniquement**), figé (`Object.freeze`) et toujours renvoyé en **copie** ; **lecture seule** (aucune écriture possible) | `presets/FactoryPresetStorage.js`, `PresetManager.writableStorage()` | Un son livré avec l'appli ne peut ni être altéré ni pointer vers un fichier extérieur | `factory-presets.test.mjs` | M6 |
| 47 | Presets d'usine **portables** : aucune URL propre à la machine (`localhost`, origine de la page), contrôlée à la génération et par un test ; seuls les liens publics d'attribution (TONE3000, créateur) sont gardés | `tools/factory-presets/generate-factory-presets.js` | Spec §7.2 : pas d'URL propre au développeur ; crédit des captures conservé | `factory-presets.test.mjs` | M6 |
| 49 | Les droits sur un asset ne se lisent que dans `owners` ; les anciens assets sont **migrés au démarrage** (leur premier envoyeur devient propriétaire), sans planter sur un asset sans ce champ | `routes/assets.js` (`migrateAssetOwners`), `server.js` | Une seule source de vérité pour la propriété ; la migration a révélé une option Mongoose manquante qui aurait empêché le serveur de démarrer | `assets.test.js` (migration) | /simplify |
| 48 | Un catalogue d'usine invalide ne fait échouer **que l'onglet Factory** (chargement à la demande), jamais l'hôte audio | `FactoryPresetStorage.js`, `main.js` | Disponibilité : une erreur de données ne coupe pas le son | `factory-presets.test.mjs` | CR |

## 7. Serveur et secrets

| # | Mesure | Où | Pourquoi | Origine |
|---|---|---|---|---|
| 40 | **CORS** limité aux origines de Live Server (liste blanche), méthodes et en-têtes restreints | `server/src/app.js`, `CORS_ORIGINS` | Un autre site ne peut pas appeler l'API depuis le navigateur de l'utilisateur | M2 |
| 41 | Erreurs 500 **sans détail** pour le client (détail seulement dans les logs) ; messages Mongoose nettoyés | `app.js` | Pas de fuite d'informations internes | M2 + CR |
| 42 | En-tête `X-Powered-By` désactivé | `app.js` | Ne pas annoncer la techno du serveur | M2 |
| 43 | Les logs ne contiennent **jamais** de mot de passe ni de jeton | `routes/*.js`, `auth.js` | Les logs ne doivent pas devenir une fuite | M2 |
| 44 | `server/.env` **ignoré par Git**, `.env.example` fourni ; `config.js` (public) ne contient aucun secret | `.gitignore`, `config.js` | Aucun secret dans le dépôt GitHub | M0 + M3 (test « no secret in config.js ») |
| 45 | Assets servis avec `Cache-Control: private` | `routes/assets.js` | Pas de mise en cache par un proxy partagé | M2 |
| 50 | Codes d'erreur stables : une erreur 500 ne renvoie que `{ message: "Internal server error", code: "internal" }` (jamais de `params`) ; les `params` ne contiennent que des limites publiques (`min`, `max`, `count`) ou le message du validateur, déjà visible avant | `errorCodes.js`, `app.js` | Traduire les erreurs sans exposer plus d'informations qu'avant | M8 |
| 51 | Fenêtre de confirmation de l'hôte : titre, message et boutons insérés avec `textContent`, jamais `innerHTML` (un nom de preset contenant du HTML s'affiche tel quel) ; focus par défaut sur « Annuler » pour qu'une action destructrice ne parte pas d'un appui sur Entrée | `ui/confirmDialog.js` | Pas d'injection de HTML via les noms de presets ou les traductions ; pas de suppression accidentelle | `confirm-dialog.test.mjs` (« jamais interprété comme du HTML », focus) | M8 |
| 52 | Notifications, guide et aide des raccourcis construits avec `textContent` (un message d'erreur du serveur ou un nom de preset s'affiche tel quel) ; l'état du guide lu dans `localStorage` est filtré (seules les 3 étapes connues sont gardées, JSON corrompu ou stockage bloqué = guide neuf) | `ui/toast.js`, `ui/GettingStarted.js`, `ui/ShortcutsHelp.js` | Pas d'injection de HTML ; une valeur modifiée à la main dans le stockage ne casse pas la page | `host-ui.test.mjs` (texte HTML affiché tel quel, stockage bloqué ou corrompu, étapes inconnues ignorées) | M8 |
| 53 | Code tiers Butterchurn hébergé dans le projet (aucun CDN), fichiers npm non modifiés avec empreintes SHA-256 vérifiées, Git en `-text` sur `ui/vendor/` ; chargé seulement si l'utilisateur active le fond. Butterchurn compile les équations des presets avec `new Function` : seuls les presets du pack livré avec l'appli sont utilisés (jamais un preset venant du réseau ou d'un utilisateur). Branchement audio en lecture seule (analyseur sans sortie) | `ui/VisualizerBackground.js`, `ui/vendor/butterchurn/` | Pas de dépendance à un serveur tiers ni de code modifié en douce ; aucun code arbitraire exécuté ; le son n'est jamais altéré | `visualizer.test.mjs` (empreintes, aucune URL externe, rien de chargé avant le clic, seule la sortie est branchée) | M8 |

## 8. Limites connues (assumées et documentées)

- **Jeton dans le `localStorage`** : un script injecté pourrait le lire. Atténué par l'absence de
  HTML utilisateur interprété et l'expiration à 12 h ; un cookie `HttpOnly` serait plus sûr mais
  demanderait de servir la page et l'API depuis la même origine.
- **Limiteur en mémoire** : valable pour un seul serveur ; à plusieurs, il faudrait un stockage
  partagé (Redis…).
- **HTTP en développement** : un déploiement réel devra passer en **HTTPS** (sinon jeton et mot de
  passe circulent en clair).
- L'inscription révèle si un email est déjà utilisé (`409`), comme la plupart des sites.
- Pas encore de vérification d'email, de réinitialisation du mot de passe, ni de suppression de compte.
- Un modèle `.nam` public est analysé par le moteur WebAssembly du plugin (code du prof, non
  modifiable) : il s'exécute dans le bac à sable du navigateur.
