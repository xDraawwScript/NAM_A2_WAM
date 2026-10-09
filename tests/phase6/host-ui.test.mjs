// Mission 8, étape 4b : notifications (ui/toast.js), guide de démarrage (ui/GettingStarted.js)
// et aide des raccourcis (ui/ShortcutsHelp.js).
import test from 'node:test';
import assert from 'node:assert/strict';
import {createFakeDocument, FakeEvent} from './fakeDom.mjs';

const {createToaster, TOAST_LIMIT, TOAST_INFO_MS} = await import('../../examples/wam/ui/toast.js');
const {GettingStarted, guideModel, readGuideState, writeGuideState, GUIDE_STORAGE_KEY} = await import('../../examples/wam/ui/GettingStarted.js');
const {isTypingTarget, isHelpKey, mountShortcutsHelp, SHORTCUTS} = await import('../../examples/wam/ui/ShortcutsHelp.js');
const {setLanguage, hasKey} = await import('../../examples/wam/ui/i18n.js');

test.afterEach(() => setLanguage('en'));

/** Minuteurs manuels : on décide quand ils se déclenchent. */
function fakeTimers() {
  const pending = new Map();
  let next = 1;
  return {
    setTimer: (fn, ms) => { const id = next++; pending.set(id, {fn, ms}); return id; },
    clearTimer: (id) => pending.delete(id),
    fire() { const all = [...pending.values()]; pending.clear(); all.forEach(({fn}) => fn()); },
    pending,
  };
}

function memoryStorage(initial = {}) {
  const data = new Map(Object.entries(initial));
  return {getItem: (key) => data.get(key) ?? null, setItem: (key, value) => data.set(key, String(value)), data};
}

test('toast : une information disparaît seule, une erreur reste jusqu\'à sa fermeture', () => {
  const doc = createFakeDocument();
  const timers = fakeTimers();
  const toaster = createToaster({document: doc, ...timers});
  const info = toaster.show('Preset loaded');
  const error = toaster.show('Server unreachable', {error: true});
  assert.equal(info.node.className, 'host-toast');
  assert.equal(error.node.className, 'host-toast is-error');
  assert.equal(timers.pending.size, 1, 'seule l\'information a un minuteur');
  assert.equal([...timers.pending.values()][0].ms, TOAST_INFO_MS);
  timers.fire();
  assert.deepEqual(toaster.toasts.map((toast) => toast.text), ['Server unreachable']);
  assert.equal(info.node.isConnected, false);
  // Le bouton × ferme l'erreur ; son nom accessible est traduit.
  const close = error.node.find((node) => node.tagName === 'BUTTON');
  assert.equal(close.getAttribute('aria-label'), 'Close the notification');
  close.click();
  assert.equal(toaster.toasts.length, 0);
});

test('toast : le texte passe par textContent, 3 au plus, un message répété n\'est pas empilé', () => {
  const doc = createFakeDocument();
  const toaster = createToaster({document: doc, ...fakeTimers()});
  const evil = toaster.show('<img src=x onerror=alert(1)>');
  assert.equal(evil.node.find((node) => node.tagName === 'P').textContent, '<img src=x onerror=alert(1)>');
  for (const text of ['a', 'b', 'c', 'b']) toaster.show(text);
  assert.equal(toaster.toasts.length, TOAST_LIMIT);
  assert.deepEqual(toaster.toasts.map((toast) => toast.text), ['a', 'b', 'c'], 'le plus ancien est retiré, « b » n\'est pas doublé');
  assert.equal(doc.body.querySelector('.host-toasts').children.length, TOAST_LIMIT);
  assert.equal(toaster.show(''), null, 'message vide : rien');
});

test('guide : modèle pur (étape en cours = première non faite)', () => {
  assert.deepEqual(guideModel([]).steps.map((step) => [step.id, step.current]), [['source', true], ['live', false], ['preset', false]]);
  const model = guideModel(['source', 'preset']);
  assert.deepEqual(model.steps.map((step) => step.done), [true, false, true]);
  assert.equal(model.steps.find((step) => step.current).id, 'live');
  assert.equal(guideModel(['preset', 'live', 'source']).allDone, true);
});

test('guide : stockage absent, bloqué ou corrompu donne un guide neuf ; étapes inconnues ignorées', () => {
  assert.deepEqual(readGuideState(null), {hidden: false, done: []});
  assert.deepEqual(readGuideState({getItem() { throw new Error('blocked'); }}), {hidden: false, done: []});
  assert.deepEqual(readGuideState(memoryStorage({[GUIDE_STORAGE_KEY]: '{oops'})), {hidden: false, done: []});
  assert.deepEqual(readGuideState(memoryStorage({[GUIDE_STORAGE_KEY]: '{"done":["live","hack","live"],"hidden":"yes"}'})), {hidden: false, done: ['live']});
  assert.doesNotThrow(() => writeGuideState({setItem() { throw new Error('quota'); }}, {hidden: true, done: []}));
});

test('guide : les boutons font l\'action, complete() coche et mémorise, masqué une fois tout fait', () => {
  const doc = createFakeDocument();
  const root = doc.createElement('section');
  doc.body.append(root);
  const storage = memoryStorage();
  const calls = [];
  const guide = new GettingStarted({root, storage, actions: {source: () => calls.push('source'), live: () => calls.push('live'), preset: () => calls.push('preset')}});
  const step = (id) => root.find((node) => node.dataset.step === id);
  assert.equal(root.hidden, false);
  assert.equal(step('source').getAttribute('aria-current'), 'step');
  step('preset').click();
  assert.deepEqual(calls, ['preset'], 'un clic lance l\'action, sans cocher l\'étape');
  assert.equal(step('preset').className, 'host-guide-step');
  guide.complete('source');
  guide.complete('source');
  guide.complete('nope');
  assert.deepEqual(JSON.parse(storage.data.get(GUIDE_STORAGE_KEY)).done, ['source']);
  assert.equal(step('source').getAttribute('aria-label'), 'Choose a source (done)');
  assert.equal(step('live').getAttribute('aria-current'), 'step');
  setLanguage('fr');
  assert.equal(step('source').getAttribute('aria-label'), 'Choisir une source (fait)', 're-rendu au changement de langue');
  guide.complete('live');
  guide.complete('preset');
  assert.ok(root.find((node) => node.className === 'host-guide-done'));
  // Lancement suivant : tout est fait, le guide ne s'affiche plus… sauf si on le rouvre.
  const next = new GettingStarted({root, storage, actions: {}});
  assert.equal(root.hidden, true);
  next.show();
  assert.equal(root.hidden, false);
  root.find((node) => node.className === 'host-guide-hide').click();
  assert.equal(root.hidden, true);
  assert.equal(JSON.parse(storage.data.get(GUIDE_STORAGE_KEY)).hidden, true);
});

test('raccourcis : « ? » ignoré pendant la saisie et dans les interfaces des plugins', () => {
  const target = (tagName, extra = {}) => ({tagName, closest: () => null, ...extra});
  assert.equal(isTypingTarget(target('INPUT', {type: 'text'})), true);
  assert.equal(isTypingTarget(target('INPUT', {type: 'search'})), true);
  assert.equal(isTypingTarget(target('INPUT', {type: 'range'})), false);
  assert.equal(isTypingTarget(target('TEXTAREA')), true);
  assert.equal(isTypingTarget(target('SELECT')), true);
  assert.equal(isTypingTarget(target('DIV', {isContentEditable: true})), true);
  assert.equal(isTypingTarget(target('BUTTON')), false);
  assert.equal(isTypingTarget(target('DIV', {closest: (selector) => (selector.includes('.fx-editor-mount') ? {} : null)})), true, 'plugin');
  assert.equal(isTypingTarget(null), false);
  const key = (init) => ({key: '?', ctrlKey: false, metaKey: false, altKey: false, target: target('BUTTON'), ...init});
  assert.equal(isHelpKey(key()), true);
  assert.equal(isHelpKey(key({key: '/'})), false);
  assert.equal(isHelpKey(key({ctrlKey: true})), false);
  assert.equal(isHelpKey(key({target: target('INPUT', {type: 'text'})})), false);
});

test('raccourcis : la fenêtre s\'ouvre avec « ? », liste traduite, focus rendu au bouton', () => {
  const doc = createFakeDocument();
  const button = doc.createElement('button');
  doc.body.append(button);
  let guideShown = 0;
  const {dialog} = mountShortcutsHelp({button, document: doc, onShowGuide: () => { guideShown += 1; }});
  const press = (init) => { const event = new FakeEvent('keydown', {key: '?', target: button, ...init}); doc.dispatchEvent(event); return event; };
  assert.equal(press().defaultPrevented, true);
  assert.equal(dialog.open, true);
  assert.equal(dialog.getAttribute('aria-labelledby'), 'shortcutsTitle');
  assert.equal(dialog.all.filter((node) => node.tagName === 'DT').length, SHORTCUTS.length);
  assert.equal(doc.activeElement.textContent, 'Close');
  assert.equal(press().defaultPrevented, false, 'déjà ouverte : rien');
  dialog.find((node) => node.className === 'host-confirm-primary').click();
  assert.equal(dialog.open, false);
  assert.equal(doc.activeElement, button, 'focus rendu au bouton');
  setLanguage('fr');
  button.click();
  assert.equal(dialog.find((node) => node.tagName === 'H3').textContent, 'Raccourcis clavier');
  assert.ok(dialog.all.some((node) => node.tagName === 'KBD' && node.textContent === 'Échap'));
  dialog.all.filter((node) => node.tagName === 'BUTTON')[0].click();
  assert.equal(guideShown, 1, '« Revoir le guide »');
  for (const {text, keys} of SHORTCUTS) {
    assert.ok(hasKey(text, 'en') && hasKey(text, 'fr'), text);
    for (const k of keys.filter((name) => name.startsWith('shortcuts.'))) assert.ok(hasKey(k, 'fr'), k);
  }
});
