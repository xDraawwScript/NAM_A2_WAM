// Générateur des presets d'usine (mission 6) — à exécuter dans la console du navigateur (F12),
// sur la page de l'hôte (dist/NAM_A2_WAM/index.html), une fois le rack prêt.
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
// (mesuré avec un signal test : ≈ −16 dB RMS pour les sons saturés, ≈ −18 dB pour les clairs),
// pour qu'on ne sursaute pas en passant d'un preset à l'autre.
const RECIPES = [
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
];

async function generateFactoryPresets(recipes = RECIPES) {
  const debug = window.phase3Debug;
  if (!debug?.presets) throw new Error('Open the host page and wait until the rack is ready');
  const {presets: manager, chain, rack, node} = debug;
  const {createPreset} = await import('./presets/PresetFormat.js');
  const {factoryAssetUrl} = await import('./presets/PresetAssets.js');
  const settle = () => new Promise((resolve) => setTimeout(resolve, 400));
  const namManifestUrl = new URL('models-manifest.json', debug.plugin._descriptorUrl);
  const namAssets = (await (await fetch(namManifestUrl)).json()).assets;
  const initial = await rack.getState();
  // Un preset d'usine ne doit référencer QUE des assets d'usine : tout asset externe est une erreur.
  const factoryOnly = {putAsset: async (asset) => { throw new Error(`External asset in a factory preset: ${asset.name}`); }};
  const output = [];
  for (const recipe of recipes) {
    await rack.setState(initial);
    for (const entry of [...chain.entries]) if (entry.kind === 'effect') await chain.remove(entry.id);
    const asset = namAssets.find((item) => item.id === recipe.model);
    if (!asset) throw new Error(`Unknown factory model: ${recipe.model}`);
    const text = await (await fetch(factoryAssetUrl(namManifestUrl, 'models', asset.relativePath))).text();
    // Même provenance que le chargement d'usine du plugin, SANS imageUrl (URL absolue de la machine).
    await node.loadModelText(text, asset.filename, {...asset.provenance, identity: asset.id, source: 'Factory', title: asset.provenance?.title || asset.displayName, gear: asset.provenance?.gear || asset.metadata?.gear_type, imageUrl: ''});
    await node.setParameterValues(Object.fromEntries(Object.entries(recipe.nam).map(([id, value]) => [id, {id, value, normalized: false}])));
    for (const pedal of recipe.pedals) {
      const record = chain.registry.records.find((item) => item.catalogue?.uri === pedal.uri);
      if (!record) throw new Error(`Unknown pedal: ${pedal.uri}`);
      const entry = await chain.insert(record, pedal.where === 'before-amp' ? 'nam' : null);
      await entry.plugin.audioNode.setParameterValues(Object.fromEntries(Object.entries(pedal.values).map(([id, value]) => [id, {id, value, normalized: false}])));
    }
    await settle();
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

generateFactoryPresets();
