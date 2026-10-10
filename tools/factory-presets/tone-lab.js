// Laboratoire de mesure des sons (presets d'usine) — à importer dans la console du navigateur, sur
// la page de l'hôte (dist), une fois le rack prêt :
//
//   const lab = await import('./tone-lab.js');      // après copie du fichier à la racine de la dist
//   await lab.profile('[AMP] JCM800-2203-MODIFIED-HI All-In - SM57');
//
// Pourquoi : on ne peut pas « écouter » un preset depuis un script. On le MESURE avec un signal de
// test qui ressemble à une corde grave de guitare (dent de scie filtrée comme un micro, 73 Hz = ré
// grave du drop D), injecté à l'entrée de la chaîne A ; on lit la sortie de la chaîne avec un
// analyseur. La sortie générale est coupée pendant la mesure (aucun son dans les enceintes).
//
// Ce qu'on en tire :
//   - rms        : niveau de sortie (dBFS) → égaliser les volumes entre presets ;
//   - compHi/Lo  : compression en dB quand l'entrée baisse de 12 dB (fort → moyen, moyen → faible).
//                  ≈ 0 : son clair qui suit le jeu ; ≈ 12 : saturation totale (la sortie ne bouge
//                  plus). C'est une mesure du GAIN de l'ampli ;
//   - tilt       : énergie par bande (dB) relative au médium 800-2000 Hz : low (60-250), lowmid
//                  (250-800), presence (2-5 kHz), fizz (5-10 kHz). Compare l'équilibre des sons.
// Les valeurs sont COMPARATIVES (mêmes signal et réglages pour tous), pas des vérités absolues.

const debug = () => {
  const value = globalThis.phase3Debug;
  if (!value?.chain) throw new Error('Open the host page and wait until the rack is ready');
  return value;
};
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/** Coupe (true) ou rétablit (false) la sortie générale de l'hôte, à son volume d'avant la coupure. */
let volumeBeforeMute = null;
export function muteOutput(on) {
  const gain = debug().backingMix.output.gain;
  if (on) { volumeBeforeMute ??= gain.value; gain.value = 0; }
  else { gain.value = volumeBeforeMute ?? 1; volumeBeforeMute = null; }
}

/** Mesure la chaîne A avec le signal de test, au niveau `level` (dBFS RMS approximatif). */
export async function measure({level = -18, freq = 73.42, seconds = 1, cutoff = 3000} = {}) {
  const {context: ctx, chain} = debug();
  muteOutput(true);
  const osc = new OscillatorNode(ctx, {type: 'sawtooth', frequency: freq});
  const lowpass = new BiquadFilterNode(ctx, {type: 'lowpass', frequency: cutoff, Q: 0.7});
  const gain = new GainNode(ctx, {gain: Math.pow(10, level / 20) / 0.577}); // RMS d'une dent de scie = 0,577
  const analyser = new AnalyserNode(ctx, {fftSize: 16384, smoothingTimeConstant: 0});
  osc.connect(lowpass).connect(gain).connect(chain.input);
  chain.output.connect(analyser);
  osc.start();
  try {
    await sleep(450);
    const size = analyser.fftSize, time = new Float32Array(size), spectrum = new Float32Array(analyser.frequencyBinCount);
    const energy = new Float64Array(analyser.frequencyBinCount);
    let sum = 0, count = 0, peak = 0;
    const frames = Math.max(3, Math.round(seconds * ctx.sampleRate / size));
    for (let frame = 0; frame < frames; frame++) {
      await sleep(size / ctx.sampleRate * 1000);
      analyser.getFloatTimeDomainData(time);
      for (const sample of time) { sum += sample * sample; count++; peak = Math.max(peak, Math.abs(sample)); }
      analyser.getFloatFrequencyData(spectrum);
      for (let bin = 0; bin < spectrum.length; bin++) energy[bin] += Math.pow(10, spectrum[bin] / 10) / frames;
    }
    const hz = ctx.sampleRate / size;
    const band = (from, to) => {
      let total = 0;
      for (let bin = Math.ceil(from / hz); bin <= Math.floor(to / hz); bin++) total += energy[bin];
      return 10 * Math.log10(total + 1e-20);
    };
    const bands = {low: band(60, 250), lowmid: band(250, 800), mid: band(800, 2000), presence: band(2000, 5000), fizz: band(5000, 10000)};
    const tilt = Object.fromEntries(Object.entries(bands).map(([name, value]) => [name, Number((value - bands.mid).toFixed(1))]));
    // Fréquence la plus forte (vérifie un pitch shifter : 73,4 Hz × 4 = 293,7 Hz pour +2 octaves).
    let loudest = 1;
    for (let bin = 2; bin < energy.length; bin++) if (energy[bin] > energy[loudest]) loudest = bin;
    return {rms: Number((10 * Math.log10(sum / count)).toFixed(1)), peak: Number((20 * Math.log10(peak)).toFixed(1)), tilt, loudestHz: Math.round(loudest * hz)};
  } finally {
    osc.stop(); osc.disconnect(); lowpass.disconnect(); gain.disconnect(); chain.output.disconnect(analyser);
    await sleep(250);
    muteOutput(false);
  }
}

let assets = null;
/** Catalogue des modèles NAM d'usine (models-manifest.json). */
export async function namAssets() {
  if (!assets) assets = (await (await fetch(new URL('models-manifest.json', debug().plugin._descriptorUrl))).json()).assets;
  return assets;
}

/** Charge un modèle NAM d'usine (identifiant, nom affiché ou morceau de chemin), comme le générateur. */
export async function loadModel(match) {
  const {plugin, node} = debug();
  const {factoryAssetUrl} = await import('./presets/PresetAssets.js');
  const list = await namAssets();
  const asset = list.find((item) => item.id === match) || list.find((item) => item.displayName === match) || list.find((item) => item.relativePath.includes(match));
  if (!asset) throw new Error(`Unknown factory model: ${match}`);
  const text = await (await fetch(factoryAssetUrl(new URL('models-manifest.json', plugin._descriptorUrl), 'models', asset.relativePath))).text();
  await node.loadModelText(text, asset.filename, {...asset.provenance, identity: asset.id, source: 'Factory', title: asset.provenance?.title || asset.displayName, gear: asset.provenance?.gear || asset.metadata?.gear_type, imageUrl: ''});
  await sleep(300);
  return asset;
}

/** Règle des paramètres de l'ampli NAM (valeurs réelles : bass 0-10, inputGain en dB…). */
export async function setNam(values) {
  await debug().node.setParameterValues(Object.fromEntries(Object.entries(values).map(([id, value]) => [id, {id, value, normalized: false}])));
}

/** Profil d'un modèle, réglages neutres : niveau, gain (compression) et équilibre. */
export async function profile(match, settings = {}) {
  const asset = await loadModel(match);
  await setNam({inputGain: 0, outputGain: 0, bass: 5, middle: 5, treble: 5, noiseEnabled: 0, ...settings});
  await sleep(200);
  const result = await measureLevels();
  const cabinet = debug().chain.entries.find((entry) => entry.kind === 'cabinet')?.routingStatus || '';
  return {name: asset.displayName, id: asset.id, ...result, cabinet: /active/u.test(cabinet) ? 'IR' : 'bypassed'};
}

/** Mesure à trois niveaux d'attaque (fort, moyen, faible) : niveau, compression, équilibre. */
export async function measureLevels() {
  const strong = await measure({level: -18}), medium = await measure({level: -30}), soft = await measure({level: -42});
  return {rms: strong.rms, compHi: Number((12 - (strong.rms - medium.rms)).toFixed(1)), compLo: Number((12 - (medium.rms - soft.rms)).toFixed(1)), tilt: strong.tilt, loudestHz: strong.loudestHz};
}

/**
 * Mesure le son EXACT d'une recette du générateur (modèle, réglages, pédales) : même fonction
 * `applyRecipe` que la génération. `recipe` : objet recette ou identifiant (ex. 'monster').
 */
let initialState = null;
export async function measureRecipe(recipe) {
  const generator = await import('./generate-factory-presets.js');
  const value = typeof recipe === 'string' ? generator.RECIPES.find((item) => item.id === recipe) : recipe;
  if (!value) throw new Error(`Unknown recipe: ${recipe}`);
  // Comme le générateur : chaque recette part du MÊME état (sinon elle hérite des réglages de la
  // précédente, par exemple son gain de sortie, et les mesures sont fausses).
  initialState ??= await debug().rack.getState();
  await generator.applyRecipe(value, initialState);
  return {name: value.name, ...(await measureLevels()), cabinet: ''};
}

/** Une ligne lisible par résultat. */
export function format(results) {
  return results.map((r) => r.error ? `${r.name}: ${r.error}` : `${r.name.padEnd(56)} rms ${r.rms} | gain ${r.compHi}/${r.compLo} | low ${r.tilt.low} lm ${r.tilt.lowmid} pres ${r.tilt.presence} fizz ${r.tilt.fizz} | ${r.loudestHz} Hz ${r.cabinet}`).join('\n');
}

/** Lance une série de profils en tâche de fond (la console reste libre) : lire `batch.results`. */
export const batch = {results: [], done: true};
export function runBatch(matches, measureOne = profile) {
  Object.assign(batch, {results: [], done: false});
  (async () => {
    for (const match of matches) {
      try { batch.results.push(await measureOne(match)); } catch (error) { batch.results.push({name: String(match), error: error.message}); }
    }
    batch.done = true;
  })();
  return matches.length;
}
