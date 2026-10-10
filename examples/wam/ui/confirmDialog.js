// Fenêtre de confirmation de l'hôte (mission 8, étape 4) : remplace confirm() du navigateur,
// impossible à habiller et toujours dans la langue du navigateur.
//
//   if (!await confirmDialog({title: 'Supprimer « Lead » ?', message: '…', confirmLabel: 'Supprimer', danger: true})) return;
//
// - Une seule fenêtre <dialog>, créée au premier appel et réutilisée.
// - Le focus va sur « Annuler » (le choix sans risque), puis revient sur l'élément qui avait le
//   focus avant l'ouverture. Échap = Annuler.
// - Les textes passent par textContent : un nom de preset contenant du HTML s'affiche tel quel.
// - Si une confirmation est demandée alors qu'une autre est ouverte, la première est annulée.

import {t} from './i18n.js';

let view = null;
let pending = null;

function build(doc) {
  const dialog = doc.createElement('dialog');
  dialog.className = 'fx-confirm host-confirm';
  dialog.setAttribute('aria-labelledby', 'hostConfirmTitle');
  dialog.setAttribute('aria-describedby', 'hostConfirmMessage');
  const title = doc.createElement('h3');
  title.id = 'hostConfirmTitle';
  const message = doc.createElement('p');
  message.id = 'hostConfirmMessage';
  const actions = doc.createElement('div');
  actions.className = 'host-confirm-actions';
  const cancel = doc.createElement('button');
  cancel.type = 'button';
  const confirm = doc.createElement('button');
  confirm.type = 'button';
  actions.append(cancel, confirm);
  dialog.append(title, message, actions);
  doc.body.append(dialog);
  cancel.addEventListener('click', () => finish(false));
  confirm.addEventListener('click', () => finish(true));
  // Échap : le navigateur émet « cancel » ; on le transforme en réponse « non ».
  dialog.addEventListener('cancel', (event) => { event.preventDefault(); finish(false); });
  return {doc, dialog, title, message, cancel, confirm};
}

function finish(answer) {
  if (!pending) return;
  const {resolve, returnFocus} = pending;
  pending = null;
  if (view.dialog.open) view.dialog.close();
  if (returnFocus?.isConnected !== false) returnFocus?.focus?.();
  resolve(answer);
}

/**
 * Demande une confirmation. Renvoie une promesse : true si l'utilisateur confirme, false sinon.
 * @param {{title: string, message?: string, confirmLabel?: string, cancelLabel?: string, danger?: boolean, document?: Document}} options
 */
export function confirmDialog({title, message = '', confirmLabel = t('confirm.ok'), cancelLabel = t('confirm.cancel'), danger = false, document: doc = globalThis.document} = {}) {
  if (!doc) return Promise.resolve(false);
  if (!view || view.doc !== doc) view = build(doc);
  if (pending) finish(false);
  view.title.textContent = title;
  view.message.textContent = message;
  view.message.hidden = !message;
  view.cancel.textContent = cancelLabel;
  view.confirm.textContent = confirmLabel;
  view.confirm.className = danger ? 'fx-confirm-delete' : 'host-confirm-primary';
  return new Promise((resolve) => {
    pending = {resolve, returnFocus: doc.activeElement};
    view.dialog.showModal();
    view.cancel.focus();
  });
}

/** État interne, pour les tests uniquement. */
export const _confirmState = () => ({view, pending});
