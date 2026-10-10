// Générateur des presets d'usine (mission 6) — module à importer dans la console du navigateur
// (F12), sur la page de l'hôte (dist/NAM_A2_WAM/index.html), une fois le rack prêt :
//
//   1. copier ce fichier (et tone-lab.js pour mesurer) à la racine de dist/NAM_A2_WAM/ ;
//   2. const g = await import('./generate-factory-presets.js');
//   3. copy(await g.generateFactoryPresets());   → coller dans examples/wam/presets/factoryPresets.js
//
// `applyRecipe(recipe)` construit un son sans le capturer : tone-lab.js s'en sert pour MESURER le
// son exact que le générateur enregistrera (niveau, gain, équilibre) avant de le figer.
//
// Pourquoi dans le navigateur : un preset est l'état RÉEL des plugins (getState()). On construit
// donc chaque son avec les vrais plugins (modèle NAM d'usine, pédales du catalogue, réglages), puis
// on le capture exactement comme le bouton « Save » (PresetManager.capture). Résultat : des presets
// qui ne contiennent que des RÉFÉRENCES d'usine (aucun modèle/IR recopié), conformes à la spec
// (SPECIFICATION_FX_CHAIN.md §7.2 : références portables, pas d'URL propre au développeur).
//
// Sortie : le texte de examples/wam/presets/factoryPresets.js (copié dans le presse-papiers avec
// copy(...) dans la console, ou renvoyé comme résultat). Les recettes ci-dessous sont modifiables.

// Niveaux : `outputGain` (gain de sortie de l'ampli, en dB) égalise le volume entre les presets
// (mesuré avec tone-lab.js : sons saturés vers −15,5 dB RMS comme le 5150, solo 1 à 2 dB au-dessus),
// pour qu'on ne sursaute pas en passant d'un preset à l'autre.
export const RECIPES = [
  {
    id: 'clean-deluxe', name: 'Clean Deluxe', tags: ['clean', 'fender', 'jazz'],
    description: 'Sparkling Fender Deluxe Reverb clean tone. A good starting point for chords and jazz.',
    model: 'factory:tone3000/amalgamaudio/Fender Deluxe Reverb Reissue Iconic Clean A2--t69174/captures/FNDR BFDRI VB Clean BAL2 CAB--m556392.nam',
    nam: {treble: 6, middle: 5, bass: 5, outputGain: 3},
    pedals: [],
  },
  {
    id: 'ambient-clean', name: 'Ambient Clean', tags: ['ambient', 'clean', 'chorus', 'delay'],
    description: 'Clean Deluxe with a slow chorus and a long, soft delay for ambient textures and arpeggios.',
    model: 'factory:tone3000/amalgamaudio/Fender Deluxe Reverb Reissue Iconic Clean A2--t69174/captures/FNDR BFDRI VB Clean BAL2 CAB--m556392.nam',
    nam: {treble: 5.5, middle: 4.5, bass: 5, outputGain: 7},
    pedals: [
      {uri: './WAMChorusMB/index.js', where: 'end', values: {'/Chorus/chorus/depth': 0.05, '/Chorus/chorus/freq': 0.8, '/Chorus/chorus/level': 0.5}},
      {uri: './SmoothDelay/index.js', where: 'end', values: {'/smoothDelay/Delay': 380, '/smoothDelay/Feedback': 40, '/smoothDelay/Dry/Wet': 0.3}},
    ],
  },
  {
    id: 'crunch-jcm800', name: 'Crunch JCM800', tags: ['crunch', 'rock', 'marshall'],
    description: 'Marshall JCM800 pushed by a Tube Screamer: classic rock rhythm crunch.',
    model: 'factory:tone3000/2dor/Marshall JCM800 2203 Modified (EL34) community pack--t44209/captures/[AMP] JCM800-2203-MODIFIED-HI All-In - SM57--m567087.nam',
    nam: {treble: 6, middle: 6, bass: 5},
    pedals: [
      {uri: './TS9_OverdriveFaustGenerated/index.js', where: 'before-amp', values: {'/TS9_OverdriveFaustGenerated/TubeScreamer/drive': 0.25, '/TS9_OverdriveFaustGenerated/TubeScreamer/level': -12, '/TS9_OverdriveFaustGenerated/TubeScreamer/tone': 450}},
    ],
  },
  {
    id: 'lead-soldano', name: 'Lead Soldano', tags: ['lead', 'solo', 'delay'],
    description: 'Soldano SLO-100 overdrive channel with a touch of delay for singing solos.',
    model: 'factory:tone3000/2dor/Soldano SLO 100 (6L6) community pack--t46269/captures/[AMP] SLO100-OVD The King - BLEND #1--m569139.nam',
    nam: {treble: 5.5, middle: 6.5, bass: 5, outputGain: -2},
    pedals: [
      {uri: './SmoothDelay/index.js', where: 'end', values: {'/smoothDelay/Delay': 420, '/smoothDelay/Feedback': 25, '/smoothDelay/Dry/Wet': 0.22}},
    ],
  },
  {
    id: 'high-gain-5150', name: 'High Gain 5150', tags: ['metal', 'high gain', 'rhythm'],
    description: 'Peavey 5150 boosted by a Maxon overdrive into a Mesa 4x12, with the noise gate on: tight metal rhythm.',
    model: 'factory:tone3000/jpisoutoftune/Full Rig Peavey 5150 + Mesa 4x12--t32868/captures/Full Rig Peavey 5150 Maxon Mesa OS SM57 - jp_is_out_of_tune--m418388.nam',
    nam: {treble: 5.5, middle: 6, bass: 5.5, noiseEnabled: 1, noise: -55, outputGain: -2.5},
    pedals: [],
  },
  {
    id: 'fuzz-muff', name: 'Fuzz Muff', tags: ['fuzz', 'stoner', 'big muff'],
    description: 'Big Muff fuzz into a clean Fender: thick, sustaining fuzz for riffs and leads.',
    model: 'factory:tone3000/amalgamaudio/Fender Deluxe Reverb Reissue Iconic Clean A2--t69174/captures/FNDR BFDRI VB Clean BAL2 CAB--m556392.nam',
    nam: {treble: 5, middle: 5.5, bass: 5, outputGain: -8},
    pedals: [
      {uri: './BigMuff/index.js', where: 'before-amp', values: {'/BigMuff/Drive': 55, '/BigMuff/Tone': 0.45, '/BigMuff/Output': 85}},
    ],
  },
  {
    id: 'bass-svt', name: 'Bass SVT', tags: ['bass', 'ampeg', 'compressor'],
    description: 'Ampeg SVT with a 6x10 cabinet and a gentle compressor: round, punchy bass tone.',
    model: 'factory:tone3000/tone3000/Ampeg SVT Classic with 6x10--t28202/captures/Ampeg SVT - MD 421--m379985.nam',
    nam: {treble: 5, middle: 5, bass: 6, outputGain: 9},
    pedals: [
      {uri: './CompressorGuitarix/index.js', where: 'before-amp', values: {'/CompressorGuitarix/Ratio': 4, '/CompressorGuitarix/Threshold': -24, '/CompressorGuitarix/3-gain/Makeup_Gain': 4, '/CompressorGuitarix/Attack': 0.01, '/CompressorGuitarix/Release': 0.2}},
    ],
  },
  // --- Sons de morceaux (2026-10-10) : matériel des guitaristes documenté, captures choisies en
  // MESURANT gain et équilibre avec tone-lab.js (détails et sources dans SUIVI.md). ---
  {
    // Tom Morello : Marshall JCM800 2205, canal saturé seulement, « Bass 10, Middle 10, Gain 9 »,
    // aucune pédale de distorsion, enregistrement très sec. Accordage drop D.
    id: 'killing-in-the-name', name: 'Killing in the Name', tags: ['rage against the machine', 'riff', 'marshall', 'drop d'],
    description: 'Inspired by Tom Morello on "Killing in the Name": Marshall JCM800 lead channel with bass and mids up, no pedal, totally dry. Drop D tuning; roll back the guitar volume for cleaner parts.',
    model: 'factory:tone3000/2dor/Marshall JCM800 2203 Modified (EL34) community pack--t44209/captures/[AMP] JCM800-2203-MODIFIED-HI Bad Boys - SM57--m567072.nam',
    nam: {bass: 6.5, middle: 7, treble: 6, noiseEnabled: 1, noise: -65, outputGain: -3},
    pedals: [],
  },
  {
    // Le solo : DigiTech Whammy à +2 octaves, branché dans la boucle d'effets (après le préampli).
    // Le pitch shifter du catalogue monte de 12 demi-tons au plus : deux en série = +24. Fenêtre de
    // 150 ms : mesurée la seule propre (98-100 % de l'énergie sur les vraies harmoniques ; 50 ms par
    // défaut = 11 %, son qui « chevrote »).
    id: 'killing-in-the-name-solo', name: 'Killing in the Name (Solo)', tags: ['rage against the machine', 'solo', 'whammy', 'drop d'],
    description: 'The "Killing in the Name" solo: the same JCM800 with two pitch shifters at +12 semitones after the amp, like Morello\'s Whammy set two octaves up in the effects loop. Play single notes.',
    model: 'factory:tone3000/2dor/Marshall JCM800 2203 Modified (EL34) community pack--t44209/captures/[AMP] JCM800-2203-MODIFIED-HI Bad Boys - SM57--m567072.nam',
    nam: {inputGain: 3, bass: 6, middle: 7, treble: 6, noiseEnabled: 1, noise: -65, outputGain: -1.2},
    pedals: [
      {uri: './DualPitchShifter/index.js', where: 'end', values: {'/DualPitchShifter/ShiftL': 12, '/DualPitchShifter/ShiftR': 12, '/DualPitchShifter/Mix': 1, '/DualPitchShifter/WindowSize': 150}},
      {uri: './DualPitchShifter/index.js', where: 'end', values: {'/DualPitchShifter/ShiftL': 12, '/DualPitchShifter/ShiftR': 12, '/DualPitchShifter/Mix': 1, '/DualPitchShifter/WindowSize': 150}},
    ],
  },
  {
    // Stephen Carpenter, Around the Fur : préampli saturé dans des Marshall 4x12. Graves et
    // bas-médiums épais, médiums gardés (la lourdeur vient du grave et de l'attaque, pas d'un gain
    // excessif). Accordage drop C#.
    id: 'my-own-summer', name: 'My Own Summer', tags: ['deftones', 'riff', 'nu metal', 'drop c#'],
    description: 'Inspired by Stephen Carpenter on "My Own Summer (Shove It)": a thick, saturated wall of guitar through a Marshall 4x12, deep lows with the mids kept. Drop C# tuning, palm-muted and played hard.',
    model: 'factory:tone3000/2dor/Bogner Uberschall Rev Blue (E34L)--t80705/captures/[AMP] UBER--m694955.nam',
    nam: {inputGain: -4, bass: 5, middle: 5.5, treble: 5, noiseEnabled: 1, noise: -60, outputGain: -5},
    pedals: [],
  },
  {
    // Skillet, Awake (2009) : Mesa Dual Rectifier poussé par une Tube Screamer (TS9DX) : high gain
    // moderne et serré, noise gate. Accordage drop C. Pas de tête Rectifier dans le catalogue : la
    // Bogner Uberschall (high gain moderne de la même famille) dans un Mesa 4x12, mesurée la plus proche.
    id: 'monster', name: 'Monster', tags: ['skillet', 'riff', 'high gain', 'drop c'],
    description: 'Inspired by Skillet on "Monster": modern, tight high gain, a Tube Screamer pushing a high-gain head into a Mesa 4x12, noise gate on. Drop C tuning, tight palm mutes.',
    model: 'factory:tone3000/2dor/Bogner Uberschall Rev Blue (E34L)--t80705/captures/[AMP] UBER--m689733.nam',
    nam: {bass: 5.5, middle: 5.5, treble: 4.5, noiseEnabled: 1, noise: -55, outputGain: -2},
    pedals: [
      {uri: './TS9_OverdriveFaustGenerated/index.js', where: 'before-amp', values: {'/TS9_OverdriveFaustGenerated/TubeScreamer/drive': 0, '/TS9_OverdriveFaustGenerated/TubeScreamer/level': 0, '/TS9_OverdriveFaustGenerated/TubeScreamer/tone': 500}},
    ],
  },
];

const hostDebug = () => {
  const debug = globalThis.phase3Debug;
  if (!debug?.presets) throw new Error('Open the host page and wait until the rack is ready');
  return debug;
};
const settle = () => new Promise((resolve) => setTimeout(resolve, 400));
const values = (object) => Object.fromEntries(Object.entries(object).map(([id, value]) => [id, {id, value, normalized: false}]));

/**
 * Construit le son d'une recette sur la chaîne A, à partir de l'état `initial` du rack : modèle NAM
 * d'usine, réglages de l'ampli, pédales du catalogue (dans l'ordre de la recette).
 */
export async function applyRecipe(recipe, initial) {
  const {chain, rack, node, plugin} = hostDebug();
  const {factoryAssetUrl} = await import('./presets/PresetAssets.js');
  const namManifestUrl = new URL('models-manifest.json', plugin._descriptorUrl);
  const namAssets = (await (await fetch(namManifestUrl)).json()).assets;
  if (initial) await rack.setState(initial);
  for (const entry of [...chain.entries]) if (entry.kind === 'effect') await chain.remove(entry.id);
  const asset = namAssets.find((item) => item.id === recipe.model);
  if (!asset) throw new Error(`Unknown factory model: ${recipe.model}`);
  const text = await (await fetch(factoryAssetUrl(namManifestUrl, 'models', asset.relativePath))).text();
  // Même provenance que le chargement d'usine du plugin, SANS imageUrl (URL absolue de la machine).
  await node.loadModelText(text, asset.filename, {...asset.provenance, identity: asset.id, source: 'Factory', title: asset.provenance?.title || asset.displayName, gear: asset.provenance?.gear || asset.metadata?.gear_type, imageUrl: ''});
  // Réglages = valeurs PAR DÉFAUT de l'ampli + celles de la recette. Sans ça, un réglage absent de la
  // recette garderait la valeur de la page (la session restaurée au rechargement, ou la recette
  // mesurée juste avant) : le preset changerait selon l'état du navigateur.
  const defaults = Object.fromEntries(Object.values(await node.getParameterInfo()).map((info) => [info.id, info.defaultValue]));
  await node.setParameterValues(values({...defaults, ...recipe.nam}));
  for (const pedal of recipe.pedals) {
    const record = chain.registry.records.find((item) => item.catalogue?.uri === pedal.uri);
    if (!record) throw new Error(`Unknown pedal: ${pedal.uri}`);
    const entry = await chain.insert(record, pedal.where === 'before-amp' ? 'nam' : null);
    await entry.plugin.audioNode.setParameterValues(values(pedal.values));
  }
  await settle();
}

export async function generateFactoryPresets(recipes = RECIPES) {
  const {presets: manager, chain, rack} = hostDebug();
  const {createPreset} = await import('./presets/PresetFormat.js');
  const initial = await rack.getState();
  // Un preset d'usine ne doit référencer QUE des assets d'usine : tout asset externe est une erreur.
  const factoryOnly = {putAsset: async (asset) => { throw new Error(`External asset in a factory preset: ${asset.name}`); }};
  const output = [];
  for (const recipe of recipes) {
    await applyRecipe(recipe, initial);
    const {rack: captured} = await manager.capture(factoryOnly);
    // Portabilité (localhost ↔ mainline) : on retire les `imageUrl`, URL absolues calculées à partir
    // de l'adresse de la page. Les liens publics d'attribution (page TONE3000 de la capture, page du
    // créateur) sont gardés : ils sont les mêmes partout et servent au crédit / à la licence.
    const portable = JSON.parse(JSON.stringify(captured, (key, value) => (key === 'imageUrl' ? undefined : value)));
    const local = new RegExp(`${location.origin.replace(/[.*+?^${}()|[\]\\]/gu, '\\$&')}|localhost|127\\.0\\.0\\.1|file:`, 'u');
    if (local.test(JSON.stringify(portable))) throw new Error(`${recipe.name}: machine-specific URL left in the preset`);
    const preset = createPreset({rack: portable, name: recipe.name, description: recipe.description, tags: recipe.tags,
      nameForUri: (uri) => chain.registry.records.find((item) => item.catalogue?.uri === uri)?.name, id: `factory:${recipe.id}`, now: new Date('2026-10-10T00:00:00Z')});
    output.push(preset);
    console.log(`✔ ${recipe.name}`);
  }
  await rack.setState(initial);
  return `// Presets d'usine (mission 6) — GÉNÉRÉ par tools/factory-presets/generate-factory-presets.js,\n// ne pas modifier à la main : changer les recettes et relancer le générateur.\n// Lecture seule : les références de modèles/IR pointent vers les assets d'usine livrés avec l'appli.\nexport const FACTORY_PRESETS = ${JSON.stringify(output, null, 1)};\n`;
}
