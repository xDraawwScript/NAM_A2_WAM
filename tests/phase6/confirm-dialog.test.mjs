// Mission 8, étape 4 : fenêtre de confirmation thémée (ui/confirmDialog.js) et onglets accessibles (ui/tabs.js).
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile, readdir} from 'node:fs/promises';
import {join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {createFakeDocument} from './fakeDom.mjs';

const {confirmDialog} = await import('../../examples/wam/ui/confirmDialog.js');
const {nextTabIndex, syncTabs, bindTabKeys} = await import('../../examples/wam/ui/tabs.js');
const {setLanguage} = await import('../../examples/wam/ui/i18n.js');
const ROOT = fileURLToPath(new URL('../../', import.meta.url));

const parts = (doc) => {
  const dialog = doc.body.find((node) => node.tagName === 'DIALOG');
  const buttons = dialog.all.filter((node) => node.tagName === 'BUTTON');
  return {dialog, title: dialog.find((node) => node.tagName === 'H3'), message: dialog.find((node) => node.tagName === 'P'), cancel: buttons[0], confirm: buttons[1]};
};

test.afterEach(() => setLanguage('en'));

test('confirmer renvoie true, annuler renvoie false, et le focus revient où il était', async () => {
  const doc = createFakeDocument();
  const trigger = doc.createElement('button');
  doc.body.append(trigger);
  trigger.focus();
  const answer = confirmDialog({title: 'Delete “Lead”?', message: 'This cannot be undone.', confirmLabel: 'Delete', danger: true, document: doc});
  const {dialog, title, message, cancel, confirm} = parts(doc);
  assert.equal(dialog.open, true);
  assert.equal(doc.activeElement, cancel, 'le focus va sur le choix sans risque');
  assert.equal(title.textContent, 'Delete “Lead”?');
  assert.equal(message.textContent, 'This cannot be undone.');
  assert.equal(confirm.textContent, 'Delete');
  assert.equal(confirm.className, 'fx-confirm-delete', 'action destructrice en rouge');
  assert.equal(dialog.getAttribute('aria-labelledby'), title.id);
  assert.equal(dialog.getAttribute('aria-describedby'), message.id);
  confirm.click();
  assert.equal(await answer, true);
  assert.equal(dialog.open, false);
  assert.equal(doc.activeElement, trigger);

  const second = confirmDialog({title: 'Again?', document: doc});
  assert.equal(parts(doc).message.hidden, true, 'pas de paragraphe vide sans message');
  assert.equal(parts(doc).confirm.className, 'host-confirm-primary');
  parts(doc).cancel.click();
  assert.equal(await second, false);
  assert.equal(doc.body.all.filter((node) => node.tagName === 'DIALOG').length, 1, 'une seule fenêtre, réutilisée');
});

test('Échap répond « non » sans fermer brutalement ; une nouvelle demande annule la précédente', async () => {
  const doc = createFakeDocument();
  const first = confirmDialog({title: 'First?', document: doc});
  parts(doc).dialog.pressEscape();
  assert.equal(await first, false);
  assert.equal(parts(doc).dialog.open, false);

  const older = confirmDialog({title: 'Older?', document: doc});
  const newer = confirmDialog({title: 'Newer?', document: doc});
  assert.equal(await older, false, 'la première demande est annulée, pas oubliée');
  assert.equal(parts(doc).title.textContent, 'Newer?');
  assert.equal(parts(doc).dialog.open, true);
  parts(doc).confirm.click();
  assert.equal(await newer, true);
});

test('textes par défaut traduits, et le texte n\'est jamais interprété comme du HTML', async () => {
  const doc = createFakeDocument();
  setLanguage('fr');
  const answer = confirmDialog({title: '<img src=x onerror=alert(1)>', document: doc});
  const {title, cancel, confirm} = parts(doc);
  assert.equal(cancel.textContent, 'Annuler');
  assert.equal(confirm.textContent, 'OK');
  assert.equal(title.textContent, '<img src=x onerror=alert(1)>');
  assert.equal(title.children.length, 0);
  cancel.click();
  assert.equal(await answer, false);
  assert.equal(await confirmDialog({title: 'No DOM', document: null}), false, 'sans document : réponse « non »');
});

test('plus aucun confirm() du navigateur dans l\'hôte, et chaque confirmation existe dans les dictionnaires', async () => {
  const files = [];
  const walk = async (dir) => {
    for (const entry of await readdir(dir, {withFileTypes: true})) {
      const path = join(dir, entry.name);
      if (entry.isDirectory()) { if (!['wamPlugins', 'node_modules', 'fx-test', 'vendor'].includes(entry.name)) await walk(path); }
      else if (/\.m?js$/u.test(entry.name)) files.push(path);
    }
  };
  await walk(join(ROOT, 'examples/wam'));
  const {hasKey} = await import('../../examples/wam/ui/i18n.js');
  let asked = 0;
  for (const file of files) {
    const source = await readFile(file, 'utf8');
    const code = source.replace(/\/\*[\s\S]*?\*\//gu, '').replace(/(^|[^:])\/\/.*$/gmu, '$1'); // sans les commentaires
    assert.doesNotMatch(code, /(?<![.\w])(?:window\.)?confirm\(/u, `confirm() natif dans ${file}`);
    // this.ask('presets.confirm.delete', …) lit title / message / action sous cette clé.
    for (const [, key] of source.matchAll(/this\.ask\(\s*'([\w.]+)'/gu)) {
      asked += 1;
      for (const lang of ['en', 'fr']) for (const part of ['title', 'action']) assert.ok(hasKey(`${key}.${part}`, lang), `${lang} ${key}.${part}`);
    }
  }
  assert.equal(asked, 5, 'les 5 confirmations de la fenêtre Presets passent par la fenêtre thémée');
});

test('onglets : flèches, Début / Fin, onglets désactivés sautés', () => {
  const none = [false, false, false, false];
  assert.equal(nextTabIndex(none, 0, 'ArrowRight'), 1);
  assert.equal(nextTabIndex(none, 3, 'ArrowRight'), 0, 'boucle à la fin');
  assert.equal(nextTabIndex(none, 0, 'ArrowLeft'), 3, 'boucle au début');
  assert.equal(nextTabIndex(none, 2, 'Home'), 0);
  assert.equal(nextTabIndex(none, 0, 'End'), 3);
  assert.equal(nextTabIndex(none, 0, 'Enter'), -1, 'autre touche : rien');
  const accountOff = [false, false, true, false];
  assert.equal(nextTabIndex(accountOff, 1, 'ArrowRight'), 3, '« Mon compte » désactivé est sauté');
  assert.equal(nextTabIndex(accountOff, 3, 'ArrowLeft'), 1);
  assert.equal(nextTabIndex([false, true, true, true], 0, 'End'), 0);
  assert.equal(nextTabIndex([true, true], 0, 'ArrowRight'), -1, 'tout est désactivé');
  assert.equal(nextTabIndex([], 0, 'ArrowRight'), -1);
});

test('onglets : attributs ARIA et navigation au clavier', () => {
  const doc = createFakeDocument();
  const tablist = doc.createElement('div');
  const panel = doc.createElement('div');
  panel.id = 'panel';
  const tabs = ['a', 'b', 'c'].map((name) => { const tab = doc.createElement('button'); tab.id = `tab-${name}`; tablist.append(tab); return tab; });
  for (const tab of tabs) tab.setAttribute('role', 'tab');
  tablist.querySelectorAll = () => tabs;
  let selected = tabs[0];
  for (const tab of tabs) tab.addEventListener('click', () => { selected = tab; syncTabs(tabs, selected, () => panel); });
  syncTabs(tabs, selected, () => panel);
  assert.deepEqual(tabs.map((tab) => [tab.getAttribute('aria-selected'), tab.tabIndex]), [['true', 0], ['false', -1], ['false', -1]]);
  assert.equal(tabs[1].getAttribute('aria-controls'), 'panel');
  assert.equal(panel.getAttribute('role'), 'tabpanel');
  assert.equal(panel.getAttribute('aria-labelledby'), 'tab-a');

  bindTabKeys(tablist);
  tabs[1].disabled = true;
  tablist.keydown('ArrowRight', tabs[0]);
  assert.equal(selected, tabs[2], 'flèche droite : onglet suivant activé (le désactivé est sauté)');
  assert.equal(doc.activeElement, tabs[2]);
  assert.equal(panel.getAttribute('aria-labelledby'), 'tab-c');

  // L'onglet actif est désactivé (ex. « Explorer » sans serveur) : un autre reste atteignable.
  tabs[2].disabled = true;
  syncTabs(tabs, tabs[2], () => panel);
  assert.equal(tabs[0].tabIndex, 0);
});
