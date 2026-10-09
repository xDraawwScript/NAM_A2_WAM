// Mission 8, étape 4c : fond animé Butterchurn (ui/VisualizerBackground.js), optionnel.
import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFile} from 'node:fs/promises';
import {join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {createFakeDocument} from './fakeDom.mjs';

const {VisualizerBackground, CALM_PRESETS, calmPresetNames, nextPresetName, frameDue, readVisualizerChoice, VISUALIZER_STORAGE_KEY, RESOLUTION} =
  await import('../../examples/wam/ui/VisualizerBackground.js');
const {setLanguage} = await import('../../examples/wam/ui/i18n.js');
const ROOT = fileURLToPath(new URL('../../', import.meta.url));
const VENDOR = join(ROOT, 'examples/wam/ui/vendor/butterchurn');

test.afterEach(() => setLanguage('en'));

/** Fenêtre simulée : Butterchurn factice (déjà « chargé »), WebGL 2 au choix, animations réduites au choix. */
function setup({webgl = true, reduce = false, stored = null} = {}) {
  const doc = createFakeDocument();
  doc.head = doc.createElement('head');
  doc.hidden = false;
  doc.removeEventListener = () => {};
  const loaded = [];
  // Les deux scripts du dossier vendor sont considérés comme déjà chargés ; on note qui les demande.
  doc.querySelector = (selector) => { loaded.push(selector); return {dataset: {loaded: 'true'}}; };
  const lost = [];
  const create = doc.createElement;
  doc.createElement = (tag) => {
    const node = create(tag);
    if (tag === 'canvas') node.getContext = (type) => (webgl && type === 'webgl2' ? {getExtension: () => ({loseContext: () => lost.push(node)})} : null);
    return node;
  };
  const viz = {connected: [], disconnected: [], presets: [], renders: 0, sizes: []};
  const visualizer = {
    connectAudio: (node) => viz.connected.push(node),
    disconnectAudio: (node) => viz.disconnected.push(node),
    loadPreset: (preset, blend) => viz.presets.push({preset, blend}),
    render: () => { viz.renders += 1; },
    setRendererSize: (w, h) => viz.sizes.push([w, h]),
  };
  const presets = Object.fromEntries([...CALM_PRESETS.slice(0, 3), 'Loud strobe'].map((name) => [name, {name}]));
  const listeners = new Map();
  const motion = {matches: reduce, addEventListener: (type, fn) => listeners.set('motion', fn)};
  const frames = new Map();
  let frameId = 0;
  const storage = new Map(stored ? [[VISUALIZER_STORAGE_KEY, stored]] : []);
  const win = {
    document: doc, innerWidth: 1000, innerHeight: 600,
    matchMedia: () => motion,
    localStorage: {getItem: (key) => storage.get(key) ?? null, setItem: (key, value) => storage.set(key, value)},
    butterchurn: {default: {createVisualizer: (context, canvas, options) => { viz.created = {context, canvas, options}; return visualizer; }}},
    butterchurnPresets: {getPresets: () => presets},
    setInterval: () => 7, clearInterval: () => {},
    requestAnimationFrame: (fn) => { frames.set(++frameId, fn); return frameId; },
    cancelAnimationFrame: (id) => frames.delete(id),
    addEventListener: () => {}, removeEventListener: () => {},
  };
  const runFrame = (now) => { const [[id, fn]] = frames; frames.delete(id); fn(now); };
  const button = doc.createElement('button');
  doc.body.append(button);
  const notes = [];
  const source = {name: 'host output'};
  const context = {name: 'audio context'};
  const make = () => new VisualizerBackground({button, context, source, window: win, storage: win.localStorage, notify: (text, error) => notes.push({text, error}), baseUrl: 'http://host/ui/VisualizerBackground.js'});
  return {doc, win, button, viz, lost, loaded, storage, frames, runFrame, notes, source, context, motion, listeners, make};
}

test('fonctions pures : presets calmes présents, preset suivant différent, 30 images/s au plus', () => {
  assert.deepEqual(calmPresetNames({[CALM_PRESETS[2]]: {}, 'Loud strobe': {}, [CALM_PRESETS[0]]: {}}), [CALM_PRESETS[0], CALM_PRESETS[2]], 'ordre de la liste, strobe ignoré');
  assert.deepEqual(calmPresetNames(null), []);
  for (let i = 0; i < 20; i++) assert.notEqual(nextPresetName(['a', 'b', 'c'], 'b'), 'b');
  assert.equal(nextPresetName(['a'], 'a'), 'a');
  assert.equal(nextPresetName([], null), null);
  assert.equal(frameDue(100, 84), false, '60 Hz : une image sur deux');
  assert.equal(frameDue(100, 66.6), true);
  assert.equal(readVisualizerChoice({getItem() { throw new Error('blocked'); }}), false);
});

test('désactivé par défaut : rien n\'est téléchargé tant qu\'on n\'a pas cliqué', () => {
  const s = setup();
  s.make();
  assert.equal(s.button.getAttribute('aria-pressed'), 'false');
  assert.equal(s.button.disabled, false);
  assert.equal(s.button.title, 'Show an animated background that reacts to the sound');
  assert.deepEqual(s.loaded, [], 'aucun script demandé');
  assert.equal(s.viz.created, undefined);
});

test('activation : lecture seule de la sortie, demi-résolution, calque décoratif, 30 images/s', async () => {
  const s = setup();
  const background = s.make();
  s.button.click();
  await background.starting;
  assert.equal(background.on, true);
  assert.equal(s.button.getAttribute('aria-pressed'), 'true');
  assert.equal(s.storage.get(VISUALIZER_STORAGE_KEY), 'on');
  assert.equal(s.loaded.length, 2, 'butterchurn + presets');
  assert.ok(s.loaded.every((selector) => selector.includes('http://host/ui/vendor/butterchurn/')), 'hébergé dans le projet');
  // Butterchurn reçoit la sortie de l'hôte : c'est lui qui s'y branche (analyseur), rien n'est relié à la sortie audio.
  assert.deepEqual(s.viz.connected, [s.source]);
  assert.equal(s.viz.created.context, s.context);
  assert.deepEqual([s.viz.created.canvas.width, s.viz.created.canvas.height], [1000 * RESOLUTION, 600 * RESOLUTION]);
  const layer = s.doc.body.children[0];
  assert.equal(layer.className, 'host-visualizer', 'calque placé avant le reste de la page');
  assert.equal(layer.getAttribute('aria-hidden'), 'true');
  assert.equal(s.viz.presets.length, 1);
  assert.ok(CALM_PRESETS.includes(s.viz.presets[0].preset.name), 'jamais le strobe');
  assert.equal(s.viz.presets[0].blend, 0);
  for (const now of [100, 116, 133, 150, 166]) s.runFrame(now);
  assert.equal(s.viz.renders, 3, '5 images à 60 Hz → 3 dessinées');
});

test('désactivation : débranché, calque retiré, carte graphique libérée, choix mémorisé', async () => {
  const s = setup();
  const background = s.make();
  await background.start({remember: true});
  const canvas = s.viz.created.canvas;
  s.button.click();
  assert.equal(background.on, false);
  assert.deepEqual(s.viz.disconnected, [s.source]);
  assert.equal(s.doc.body.children.some((node) => node.className === 'host-visualizer'), false);
  assert.ok(s.lost.includes(canvas), 'contexte WebGL perdu volontairement');
  assert.equal(s.frames.size, 0, 'plus d\'animation');
  assert.equal(s.storage.get(VISUALIZER_STORAGE_KEY), 'off');
  assert.equal(s.button.title, 'Show an animated background that reacts to the sound');
});

test('« réduire les animations » : bouton désactivé et expliqué, fond coupé s\'il tournait', async () => {
  const reduced = setup({reduce: true, stored: 'on'});
  const background = reduced.make();
  assert.equal(reduced.button.disabled, true);
  assert.equal(reduced.button.title, 'Animated background unavailable: your system asks to reduce motion');
  await background.start({remember: true});
  assert.equal(background.on, false, 'même un choix mémorisé ne relance pas le fond');
  assert.deepEqual(reduced.loaded, []);

  const s = setup();
  const running = s.make();
  await running.start();
  s.motion.matches = true;
  s.listeners.get('motion')();
  assert.equal(running.on, false);
  assert.equal(s.button.disabled, true);
  setLanguage('fr');
  assert.equal(s.button.title, 'Fond animé indisponible : votre système demande de réduire les animations');
});

test('sans WebGL 2 : message d\'erreur traduit, rien n\'est téléchargé, bouton relâché', async () => {
  setLanguage('fr');
  const s = setup({webgl: false});
  const background = s.make();
  s.button.click();
  await background.starting?.catch(() => {});
  assert.equal(background.on, false);
  assert.equal(s.button.getAttribute('aria-pressed'), 'false');
  assert.deepEqual(s.loaded, []);
  assert.deepEqual(s.notes, [{text: 'Le fond animé ne peut pas démarrer sur ce navigateur (WebGL 2 nécessaire).', error: true}]);
  assert.equal(s.storage.get(VISUALIZER_STORAGE_KEY), 'off');
});

test('choix mémorisé « on » : le fond revient au lancement suivant', async () => {
  const s = setup({stored: 'on'});
  const background = s.make();
  await background.starting;
  assert.equal(background.on, true);
});

test('Butterchurn est hébergé tel quel, avec ses licences, et copié dans la dist', async () => {
  const readme = await readFile(join(VENDOR, 'README.md'), 'utf8');
  for (const file of ['butterchurn.min.js', 'butterchurnPresets.min.js']) {
    const hash = createHash('sha256').update(await readFile(join(VENDOR, file))).digest('hex');
    assert.match(readme, new RegExp(`\`${file}\`[^\\n]*\`${hash}\``, 'u'), `${file} : empreinte du README`);
  }
  for (const license of ['LICENSE-butterchurn.txt', 'LICENSE-butterchurn-presets.txt']) assert.match(await readFile(join(VENDOR, license), 'utf8'), /MIT License/u);
  assert.match(await readFile(join(ROOT, '.gitattributes'), 'utf8'), /^examples\/wam\/ui\/vendor\/\*\* -text$/mu);
  const build = await readFile(join(ROOT, 'tools/build-static-dist.mjs'), 'utf8');
  for (const file of ['ui/VisualizerBackground.js', 'ui/vendor/butterchurn/butterchurn.min.js', 'ui/vendor/butterchurn/butterchurnPresets.min.js']) assert.ok(build.includes(`'${file}'`), file);
  // Aucun CDN : le module ne charge que des fichiers du projet.
  const source = await readFile(join(ROOT, 'examples/wam/ui/VisualizerBackground.js'), 'utf8');
  assert.doesNotMatch(source, /https?:\/\//u);
  assert.match(await readFile(join(ROOT, 'examples/wam/index.html'), 'utf8'), /id="visualizerButton"[^>]*aria-pressed="false"/u);
});
