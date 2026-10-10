// Guide de démarrage (mission 8, étape 4) : trois étapes affichées sous le header au premier
// lancement : 1. choisir une source, 2. activer l'entrée live, 3. charger un preset d'usine.
//
// - Chaque étape est un bouton qui fait l'action (ouvrir le panneau source, activer l'entrée,
//   ouvrir les presets d'usine). Une étape est cochée quand l'action a vraiment eu lieu : main.js
//   appelle complete('live') quand l'entrée live démarre, etc.
// - Les étapes faites et le choix « Masquer » sont mémorisés (localStorage, clé nam-a2-guide).
//   Une fois les 3 étapes faites, le guide ne revient plus au lancement suivant ; on peut le
//   rouvrir depuis l'aide des raccourcis.
// - guideModel() est une fonction pure (testée sans navigateur).

import {t, onLanguageChange} from './i18n.js';

export const GUIDE_STORAGE_KEY = 'nam-a2-guide';
export const GUIDE_STEPS = Object.freeze(['source', 'live', 'preset']);

/** Lit l'état mémorisé ; un stockage absent, bloqué ou corrompu donne un guide neuf. */
export function readGuideState(storage) {
  try {
    const saved = JSON.parse(storage?.getItem(GUIDE_STORAGE_KEY) ?? 'null');
    const done = Array.isArray(saved?.done) ? saved.done.filter((step) => GUIDE_STEPS.includes(step)) : [];
    return {hidden: saved?.hidden === true, done: [...new Set(done)]};
  } catch {
    return {hidden: false, done: []};
  }
}

export function writeGuideState(storage, state) {
  try { storage?.setItem(GUIDE_STORAGE_KEY, JSON.stringify({hidden: state.hidden, done: state.done})); } catch { /* stockage indisponible : le guide revient au prochain lancement */ }
}

/** Étapes à afficher : faite ou non, et l'étape « en cours » (la première non faite). */
export function guideModel(done) {
  const finished = new Set(done);
  const current = GUIDE_STEPS.find((step) => !finished.has(step)) ?? null;
  return {
    steps: GUIDE_STEPS.map((id, index) => ({id, number: index + 1, done: finished.has(id), current: id === current})),
    allDone: current === null,
  };
}

export class GettingStarted {
  /**
   * @param {{root: HTMLElement, actions: Record<string, () => void>, storage?: Storage}} options
   */
  constructor({root, actions, storage = safeStorage()}) {
    Object.assign(this, {root, actions, storage});
    this.state = readGuideState(storage);
    // Tout est déjà fait : le guide ne s'affiche plus au lancement.
    if (guideModel(this.state.done).allDone) this.state.hidden = true;
    onLanguageChange(() => this.render());
    this.render();
  }

  get visible() { return !this.state.hidden; }

  complete(step) {
    if (!GUIDE_STEPS.includes(step) || this.state.done.includes(step)) return;
    this.state.done.push(step);
    this.save();
    this.render();
  }

  show() { this.state.hidden = false; this.save(); this.render(); this.root.querySelector('button')?.focus(); }

  hide() { this.state.hidden = true; this.save(); this.render(); }

  save() { writeGuideState(this.storage, this.state); }

  render() {
    const doc = this.root.ownerDocument;
    const make = (tag, className, text) => { const node = doc.createElement(tag); if (className) node.className = className; if (text != null) node.textContent = text; return node; };
    const model = guideModel(this.state.done);
    this.root.hidden = this.state.hidden;
    const title = make('h2', 'host-guide-title', t('guide.title'));
    title.id = 'guideTitle';
    const list = make('ol', 'host-guide-steps');
    for (const step of model.steps) {
      const label = t(`guide.steps.${step.id}`);
      const button = make('button', `host-guide-step${step.done ? ' is-done' : ''}${step.current ? ' is-current' : ''}`);
      button.type = 'button';
      button.dataset.step = step.id;
      if (step.current) button.setAttribute('aria-current', 'step');
      if (step.done) button.setAttribute('aria-label', t('guide.stepDone', {label}));
      const badge = make('span', 'host-guide-badge', step.done ? '✓' : String(step.number));
      badge.setAttribute('aria-hidden', 'true');
      button.append(badge, make('span', '', label));
      button.addEventListener('click', () => this.actions[step.id]?.());
      const item = make('li');
      item.append(button);
      list.append(item);
    }
    const hide = make('button', 'host-guide-hide', '×');
    hide.type = 'button';
    hide.setAttribute('aria-label', t('guide.hide'));
    hide.title = t('guide.hide');
    hide.addEventListener('click', () => this.hide());
    const children = [title, list];
    if (model.allDone) children.push(make('p', 'host-guide-done', t('guide.allDone')));
    children.push(hide);
    this.root.replaceChildren(...children);
  }
}

function safeStorage() {
  try { return globalThis.localStorage ?? null; } catch { return null; }
}
