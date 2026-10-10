// Fond animé optionnel (mission 8, étape 4c) : un visualiseur Butterchurn (façon Milkdrop) qui réagit
// au son, derrière l'interface. Bouton « Fond animé » du header.
//
// - Désactivé par défaut. Butterchurn (≈ 850 Ko, ui/vendor/butterchurn/) n'est téléchargé qu'au
//   premier clic : sans activation, la page ne charge rien de plus.
// - Lecture seule : Butterchurn branche la sortie de l'hôte sur son propre analyseur, qui n'est relié
//   à rien d'autre. Le son n'est jamais modifié.
// - Discret : seulement des presets calmes, image derrière la texture et assombrie (les panneaux gardent
//   leur fond : le contraste du texte ne change pas), 30 images/s au plus, demi-résolution, pause
//   quand l'onglet est caché.
// - Coupé si le système demande de réduire les animations (prefers-reduced-motion) : le bouton est
//   alors désactivé et explique pourquoi.
// - Le choix est mémorisé (localStorage) ; il ne relance rien tant que l'utilisateur n'a pas activé
//   le fond lui-même.

import {t, onLanguageChange} from './i18n.js';

export const VISUALIZER_STORAGE_KEY = 'nam-a2-visualizer';
export const FRAME_MS = 1000 / 30;
export const RESOLUTION = 0.5;
export const BLEND_SECONDS = 2.7;
/** Presets lents et sombres du pack de base (pas de flashs ni de couleurs saturées). */
export const CALM_PRESETS = Object.freeze([
  'Flexi - alien fish pond',
  'martin - castle in the air',
  'martin - frosty caves 2',
  'Geiss - Cauldron - painterly 2 (saturation remix)',
  'Flexi + Martin - astral projection',
  'martin - stormy sea (2010 update)',
  '_Geiss - Desert Rose 2',
  'Zylot - Star Ornament',
]);
const VENDOR = ['vendor/butterchurn/butterchurn.min.js', 'vendor/butterchurn/butterchurnPresets.min.js'];

/** Presets calmes réellement présents dans le pack (un nom absent est ignoré, jamais une erreur). */
export function calmPresetNames(available) {
  return CALM_PRESETS.filter((name) => Object.hasOwn(available ?? {}, name));
}

/** Preset suivant, différent du précédent quand c'est possible. */
export function nextPresetName(names, previous, random = Math.random) {
  const choices = names.length > 1 ? names.filter((name) => name !== previous) : names;
  return choices[Math.floor(random() * choices.length)] ?? null;
}

/** Vrai quand assez de temps est passé pour dessiner une nouvelle image (30 images/s au plus). */
export function frameDue(now, last) {
  return now - last >= FRAME_MS - 1;
}

export function readVisualizerChoice(storage) {
  try { return storage?.getItem(VISUALIZER_STORAGE_KEY) === 'on'; } catch { return false; }
}

function writeVisualizerChoice(storage, on) {
  try { storage?.setItem(VISUALIZER_STORAGE_KEY, on ? 'on' : 'off'); } catch { /* stockage indisponible : choix non mémorisé */ }
}

/** Charge un script classique (UMD) une seule fois. */
function loadScript(doc, url) {
  const existing = doc.querySelector(`script[data-vendor="${url}"]`);
  if (existing?.dataset.loaded === 'true') return Promise.resolve();
  return new Promise((resolve, reject) => {
    const script = existing ?? doc.createElement('script');
    script.addEventListener('load', () => { script.dataset.loaded = 'true'; resolve(); }, {once: true});
    script.addEventListener('error', () => reject(new Error(`cannot load ${url}`)), {once: true});
    if (!existing) {
      script.src = url;
      script.dataset.vendor = url;
      doc.head.append(script);
    }
  });
}

export class VisualizerBackground {
  /**
   * @param {{button: HTMLButtonElement, context: AudioContext, source: AudioNode, notify?: (text: string, error?: boolean) => void,
   *   window?: Window, storage?: Storage, baseUrl?: string | URL}} options
   */
  constructor({button, context, source, notify = () => {}, window: win = globalThis.window, storage = safeStorage(win), baseUrl = import.meta.url}) {
    Object.assign(this, {button, context, source, notify, win, storage, baseUrl});
    this.doc = win.document;
    this.on = false;
    this.starting = null;
    this.visualizer = null;
    this.frame = 0;
    this.lastFrame = 0;
    this.motion = win.matchMedia?.('(prefers-reduced-motion: reduce)') ?? {matches: false, addEventListener() {}};
    this.motion.addEventListener('change', () => { if (this.motion.matches) this.stop(); this.render(); });
    this.onResize = () => this.resize();
    this.onVisibility = () => { if (this.doc.hidden) this.cancelFrame(); else this.requestFrame(); };
    // Un échec est déjà signalé par notify() : rien d'autre à faire ici.
    button.addEventListener('click', () => (this.on ? this.stop({remember: true}) : this.start({remember: true}).catch(() => {})));
    onLanguageChange(() => this.render());
    this.render();
    // Fond activé la dernière fois : on le relance (Butterchurn est déjà en cache du navigateur).
    if (readVisualizerChoice(storage) && !this.motion.matches) this.start().catch(() => {});
  }

  get reducedMotion() { return Boolean(this.motion.matches); }

  render() {
    const {button} = this;
    button.setAttribute('aria-pressed', String(this.on));
    button.disabled = this.reducedMotion;
    button.title = this.reducedMotion ? t('visualizer.reducedMotion') : t(this.on ? 'visualizer.turnOff' : 'visualizer.turnOn');
  }

  async start({remember = false} = {}) {
    if (this.on || this.reducedMotion) return;
    if (this.starting) return this.starting;
    this.starting = this.create().then(() => {
      this.on = true;
      if (remember) writeVisualizerChoice(this.storage, true);
    }).catch((error) => {
      this.destroyVisualizer();
      if (remember) writeVisualizerChoice(this.storage, false);
      this.notify(t('visualizer.unavailable'), true);
      throw error;
    }).finally(() => { this.starting = null; this.render(); });
    return this.starting;
  }

  stop({remember = false} = {}) {
    if (remember) writeVisualizerChoice(this.storage, false);
    if (!this.on) return;
    this.on = false;
    this.destroyVisualizer();
    this.render();
  }

  async create() {
    const {doc, win} = this;
    // WebGL 2 obligatoire : on le vérifie avant de télécharger quoi que ce soit.
    const probe = doc.createElement('canvas');
    const gl = probe.getContext('webgl2');
    if (!gl) throw new Error('WebGL 2 unavailable');
    gl.getExtension('WEBGL_lose_context')?.loseContext();
    for (const path of VENDOR) await loadScript(doc, new URL(path, this.baseUrl).href);
    const butterchurn = win.butterchurn?.default ?? win.butterchurn;
    const pack = win.butterchurnPresets?.default ?? win.butterchurnPresets;
    this.presets = pack.getPresets();
    this.names = calmPresetNames(this.presets);
    if (!butterchurn?.createVisualizer || !this.names.length) throw new Error('Butterchurn unavailable');

    const layer = doc.createElement('div');
    layer.className = 'host-visualizer';
    layer.setAttribute('aria-hidden', 'true');
    const canvas = doc.createElement('canvas');
    layer.append(canvas);
    doc.body.prepend(layer);
    this.layer = layer;
    this.canvas = canvas;
    const {width, height} = this.size();
    Object.assign(canvas, {width, height});
    this.visualizer = butterchurn.createVisualizer(this.context, canvas, {width, height, pixelRatio: 1, textureRatio: 1});
    this.visualizer.connectAudio(this.source);
    this.presetName = null;
    this.nextPreset(0);
    // Un preset différent toutes les 45 s, avec un fondu.
    this.cycle = win.setInterval(() => this.nextPreset(BLEND_SECONDS), 45000);
    win.addEventListener('resize', this.onResize);
    doc.addEventListener('visibilitychange', this.onVisibility);
    this.requestFrame();
  }

  nextPreset(blend) {
    this.presetName = nextPresetName(this.names, this.presetName);
    this.visualizer.loadPreset(this.presets[this.presetName], blend);
  }

  size() {
    return {width: Math.max(1, Math.round(this.win.innerWidth * RESOLUTION)), height: Math.max(1, Math.round(this.win.innerHeight * RESOLUTION))};
  }

  resize() {
    if (!this.visualizer) return;
    const {width, height} = this.size();
    Object.assign(this.canvas, {width, height});
    this.visualizer.setRendererSize(width, height);
  }

  requestFrame() {
    if (!this.visualizer || this.frame || this.doc.hidden) return;
    this.frame = this.win.requestAnimationFrame((now) => {
      this.frame = 0;
      if (!this.visualizer) return;
      if (frameDue(now, this.lastFrame)) {
        this.lastFrame = now;
        this.visualizer.render();
      }
      this.requestFrame();
    });
  }

  cancelFrame() {
    if (this.frame) this.win.cancelAnimationFrame(this.frame);
    this.frame = 0;
  }

  destroyVisualizer() {
    this.cancelFrame();
    if (this.cycle) this.win.clearInterval(this.cycle);
    this.cycle = 0;
    this.win.removeEventListener('resize', this.onResize);
    this.doc.removeEventListener('visibilitychange', this.onVisibility);
    if (this.visualizer) {
      try { this.visualizer.disconnectAudio(this.source); } catch { /* déjà débranché */ }
    }
    // Libère la carte graphique tout de suite, sans attendre le ramasse-miettes.
    this.canvas?.getContext('webgl2')?.getExtension('WEBGL_lose_context')?.loseContext();
    this.layer?.remove();
    Object.assign(this, {visualizer: null, layer: null, canvas: null});
  }
}

function safeStorage(win) {
  try { return win?.localStorage ?? null; } catch { return null; }
}
