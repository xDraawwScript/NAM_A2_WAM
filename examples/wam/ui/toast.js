// Notifications « toast » de l'hôte (mission 8, étape 4) : les messages (« Preset chargé »,
// « Serveur injoignable »…) s'affichent en bas de l'écran au lieu d'une ligne cachée dans le
// panneau latéral.
//
// - Information : disparaît seule après quelques secondes. Erreur : reste jusqu'à ce qu'on la ferme,
//   pour avoir le temps de la lire.
// - 3 notifications au plus ; le même message répété n'est pas empilé, il est relancé.
// - Les lecteurs d'écran lisent les messages dans #hostStatus (role=status, main.js) : la zone des
//   toasts n'est donc pas une zone « live », sinon chaque message serait annoncé deux fois.
// - Le texte passe par textContent (jamais innerHTML).

import {t} from './i18n.js';

export const TOAST_LIMIT = 3;
export const TOAST_INFO_MS = 4500;

export function createToaster({document: doc = globalThis.document, setTimer = setTimeout, clearTimer = clearTimeout} = {}) {
  let region = null;
  const toasts = [];

  const dismiss = (toast) => {
    const index = toasts.indexOf(toast);
    if (index < 0) return;
    toasts.splice(index, 1);
    clearTimer(toast.timer);
    toast.node.remove();
  };
  const schedule = (toast) => {
    clearTimer(toast.timer);
    toast.timer = toast.error ? null : setTimer(() => dismiss(toast), TOAST_INFO_MS);
  };

  function show(text, {error = false} = {}) {
    if (!doc || !text) return null;
    const same = toasts.find((toast) => toast.text === text && toast.error === error);
    if (same) { schedule(same); return same; }
    if (!region) {
      region = doc.createElement('div');
      region.className = 'host-toasts';
      doc.body.append(region);
    }
    const node = doc.createElement('div');
    node.className = `host-toast${error ? ' is-error' : ''}`;
    const paragraph = doc.createElement('p');
    paragraph.textContent = text;
    const close = doc.createElement('button');
    close.type = 'button';
    close.className = 'host-toast-close';
    close.textContent = '×';
    close.setAttribute('aria-label', t('toast.close'));
    node.append(paragraph, close);
    region.append(node);
    const toast = {text, error, node, timer: null};
    close.addEventListener('click', () => dismiss(toast));
    schedule(toast);
    toasts.push(toast);
    while (toasts.length > TOAST_LIMIT) dismiss(toasts[0]);
    return toast;
  }

  return {show, dismiss, get toasts() { return [...toasts]; }};
}
