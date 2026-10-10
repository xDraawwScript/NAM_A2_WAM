// Aide des raccourcis clavier (mission 8, étape 4) : bouton « ? Raccourcis » de la barre d'outils,
// ou touche « ? » n'importe où dans la page.
//
// La touche « ? » est ignorée quand on écrit (champ texte, liste…), quand une fenêtre est déjà
// ouverte, et dans les interfaces des plugins, qui gardent leurs propres raccourcis.

import {t, onLanguageChange} from './i18n.js';

/** Raccourcis existants de l'hôte : touches + clé du texte dans les dictionnaires. */
export const SHORTCUTS = Object.freeze([
  {keys: ['?'], text: 'shortcuts.help'},
  {keys: ['Alt', '←', '→'], text: 'shortcuts.moveCard'},
  {keys: ['←', '→'], text: 'shortcuts.tabs'},
  {keys: ['shortcuts.keys.escape'], text: 'shortcuts.escape'},
  {keys: ['shortcuts.keys.home'], text: 'shortcuts.pan'},
]);

/** Vrai si la touche doit aller à l'élément (saisie de texte, plugin) et non à l'aide. */
export function isTypingTarget(target) {
  if (!target || typeof target.closest !== 'function') return false;
  if (target.closest('.fx-editor-mount, .tuner-mount')) return true;
  if (target.isContentEditable) return true;
  const tag = String(target.tagName || '').toLowerCase();
  if (tag === 'textarea' || tag === 'select') return true;
  if (tag !== 'input') return false;
  return !['button', 'checkbox', 'radio', 'range', 'submit', 'reset', 'color', 'file'].includes(String(target.type || 'text').toLowerCase());
}

/** La touche « ? » ouvre l'aide (Maj + , sur un clavier AZERTY, Maj + / sur un QWERTY : seul event.key compte). */
export function isHelpKey(event) {
  // Dans un shadow DOM (lecteur de backing tracks, GUI d'un plugin), event.target vu du document est
  // l'hôte : on regarde tout le chemin de l'événement pour trouver le vrai champ de saisie.
  const path = event.composedPath?.() ?? [];
  return event.key === '?' && !event.ctrlKey && !event.metaKey && !event.altKey && ![event.target, ...path].some(isTypingTarget);
}

export function mountShortcutsHelp({button, onShowGuide, document: doc = globalThis.document}) {
  const dialog = doc.createElement('dialog');
  dialog.className = 'fx-confirm host-shortcuts';
  dialog.setAttribute('aria-labelledby', 'shortcutsTitle');
  doc.body.append(dialog);
  const render = () => {
    const make = (tag, className, text) => { const node = doc.createElement(tag); if (className) node.className = className; if (text != null) node.textContent = text; return node; };
    const title = make('h3', '', t('shortcuts.title'));
    title.id = 'shortcutsTitle';
    const list = make('dl', 'host-shortcuts-list');
    for (const shortcut of SHORTCUTS) {
      const keys = make('dt');
      shortcut.keys.forEach((key, index) => {
        if (index) keys.append(' ');
        keys.append(make('kbd', '', key.startsWith('shortcuts.') ? t(key) : key));
      });
      list.append(keys, make('dd', '', t(shortcut.text)));
    }
    const actions = make('div', 'host-confirm-actions');
    const guide = make('button', '', t('shortcuts.showGuide'));
    guide.type = 'button';
    guide.addEventListener('click', () => { dialog.close(); onShowGuide?.(); });
    const close = make('button', 'host-confirm-primary', t('shortcuts.close'));
    close.type = 'button';
    close.addEventListener('click', () => dialog.close());
    actions.append(guide, close);
    dialog.replaceChildren(title, list, actions);
  };
  const open = () => {
    if (dialog.open) return;
    render();
    dialog.showModal();
    dialog.querySelector('.host-confirm-primary')?.focus();
  };
  dialog.addEventListener('close', () => button?.focus());
  onLanguageChange(() => { if (dialog.open) render(); });
  if (button) button.addEventListener('click', open);
  doc.addEventListener('keydown', (event) => {
    if (!isHelpKey(event) || doc.querySelector('dialog[open]')) return;
    event.preventDefault();
    open();
  });
  return {open, dialog};
}
