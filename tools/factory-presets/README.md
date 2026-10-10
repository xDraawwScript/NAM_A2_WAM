# Presets d'usine : générateur et laboratoire de mesure

Les presets d'usine (`examples/wam/presets/factoryPresets.js`) ne s'écrivent pas à la main : ce sont
des états RÉELS des plugins, construits et capturés dans le navigateur.

| Fichier | Rôle |
|---|---|
| `generate-factory-presets.js` | `RECIPES` (une recette = modèle NAM d'usine + réglages de l'ampli + pédales), `applyRecipe(recipe)` (construit le son sur la chaîne A) et `generateFactoryPresets()` (construit, capture et renvoie le texte du fichier). |
| `tone-lab.js` | Mesure un son avec un signal de test (dent de scie à 73 Hz, la sortie générale est coupée pendant la mesure) : niveau, compression (= gain), équilibre grave/médium/aigu, fréquence dominante. |

## Utilisation

1. `npm run dist` (ou une dist déjà construite), copier les deux fichiers à la racine de
   `dist/NAM_A2_WAM/`, ouvrir la dist (`http://localhost:5181/`) et attendre que le rack soit prêt.
2. Dans la console :

```js
const lab = await import('./tone-lab.js');
lab.runBatch(['[AMP] JCM800-2203-MODIFIED-HI Bad Boys - SM57']);    // profil d'une capture
lab.runBatch(['monster', 'high-gain-5150'], lab.measureRecipe);      // son exact d'une recette
lab.format(lab.batch.results);                                       // quand lab.batch.done
const g = await import('./generate-factory-presets.js');
copy(await g.generateFactoryPresets());                              // → factoryPresets.js
```

3. Supprimer les deux copies de la dist (ou relancer `npm run dist`).

## Lire les mesures

- `rms` : niveau. Avec ce signal, les sons saturés sont réglés vers −15,5 dB (5150, Fuzz, sons de
  morceaux), un solo 1 à 2 dB au-dessus ; on ajuste `outputGain` de la recette.
- `gain a/b` : compression quand l'attaque baisse de 12 dB : ≈ 0 son clair, ≈ 12 saturation totale.
- `low / lm / pres / fizz` : énergie relative au médium (800-2000 Hz). Valeurs comparatives.
- `loudestHz` : vérifie un pitch shifter (73,4 Hz × 4 = 293,7 Hz pour +2 octaves).

## Pièges connus

- Un appel de console de plus de 45 s est coupé par l'outil d'automatisation : utiliser `runBatch`
  et relire `lab.batch`, recharger la page entre deux séries.
- Au rechargement, la page restaure la dernière session : `applyRecipe` repart donc des valeurs
  PAR DÉFAUT de l'ampli (et retire les pédales) avant d'appliquer la recette.
- Les identifiants des pédales dans un preset sont aléatoires : régénérer change ces identifiants
  même si le son est identique. Pour ajouter des presets sans bruit dans le diff, vérifier que les
  anciens ne diffèrent que par ces identifiants, puis n'ajouter que les nouveaux.
- `tests/phase5/factory-presets.test.mjs` vérifie que le fichier correspond aux recettes (ids, noms,
  descriptions, tags) et que chaque description est traduite (`presets.factory.<id>`).
