# Butterchurn (fond animé optionnel)

Visualiseur audio WebGL façon Milkdrop, utilisé par `ui/VisualizerBackground.js` pour le bouton
« Fond animé » du header. Hébergé dans le projet (aucun CDN) et chargé **seulement** quand on active
le fond.

Fichiers copiés **sans modification** depuis npm (`npm pack`, dossier `lib/` de chaque paquet) :

| Fichier | Paquet | SHA-256 |
|---|---|---|
| `butterchurn.min.js` | `butterchurn@2.6.7` | `4e67421bc18d48fac4a6ff4e69e2778f770737fbdd4e323438da154085b4818d` |
| `butterchurnPresets.min.js` | `butterchurn-presets@2.4.7` | `136c746836aef6dff8a1f6a93ede48c7bbe4da27d2f44de6b59ebc56ffefca10` |

Licences : MIT, © 2013-2018 Jordan Berg (`LICENSE-butterchurn.txt`, `LICENSE-butterchurn-presets.txt`).
Sources : https://github.com/jberg/butterchurn et https://github.com/jberg/butterchurn-presets.

`.gitattributes` marque ce dossier `-text` : Git ne touche jamais aux octets, les empreintes restent
vérifiables (`sha256sum *.min.js`, testé par `tests/phase6/visualizer.test.mjs`).
