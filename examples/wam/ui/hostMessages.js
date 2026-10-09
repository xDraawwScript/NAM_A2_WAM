// Traduction des messages d'erreur du moteur audio (mission 8, étape 5).
//
// FxChain, FxRack, SourceManager, OutputDeviceManager, le lecteur de backing tracks… lèvent des
// erreurs en anglais. Ce code (et ses tests) vient du projet de départ : on ne le modifie pas pour
// la traduction. À la place, les messages qui peuvent atteindre l'utilisateur sont listés ici avec
// leur clé ; message() de main.js et les vues passent le texte par localizeMessage().
//
// Un message inconnu reste tel quel (en anglais) : rien n'est perdu. Un test vérifie que chaque
// message listé existe vraiment dans le code, pour que cette table ne devienne pas fausse en silence.

import {t, hasKey} from './i18n.js';

/** Messages fixes : texte anglais exact → clé. */
export const KNOWN_MESSAGES = Object.freeze({
  'Show chain B first': 'engine.showChainB',
  'Enable live input and select an available channel for B, or route A to B': 'engine.chainBInput',
  'Plugin did not provide an editor': 'engine.noEditor',
  'Instance removed while editor was opening': 'engine.instanceRemoved',
  'Plugin instance no longer exists': 'engine.instanceGone',
  'Plugin absent from catalogue': 'engine.notInCatalogue',
  'Unavailable plugin; its saved state is retained': 'engine.unavailablePlugin',
  'Track missing from library; select it again': 'engine.trackMissing',
  'Input channel unavailable': 'engine.channelUnavailable',
  'The browser closed the audio engine. Reload the page to restart audio.': 'engine.contextClosed',
  'Audio is interrupted. Reconnect an output and click Recover audio.': 'engine.interrupted',
  'Tuner is unavailable in the plugin catalogue': 'engine.noTuner',
  'The tuner has no GUI': 'engine.tunerNoGui',
  'AudioWorklet unavailable': 'engine.noWorklet',
  'Select a loop at least 20 ms long': 'engine.loopTooShort',
  'Time stretch unavailable': 'engine.noStretch',
  'Select the same local backing file again to restore its settings': 'engine.reselectLocalFile',
  'Invalid backing track catalogue': 'engine.badCatalogue',
  'IndexedDB is not available in this browser': 'engine.noIndexedDb',
  'Preset database is blocked by another tab': 'engine.dbBlocked',
  // Bouton « Enable live input » : main.js garde ces textes anglais (vérifiés par les tests).
  'Enable live input': 'live.enable',
  'Disable live input': 'live.disable',
});

/** Messages avec une partie variable : motif → clé + noms des paramètres capturés. */
export const KNOWN_PATTERNS = Object.freeze([
  [/^Browser opened a different audio input \(requested (.+), received (.+)\)$/u, 'engine.wrongDevice', ['requested', 'received']],
  [/^Backing track catalogue: HTTP (\d+)$/u, 'engine.catalogueHttp', ['status']],
  [/^Plugin catalogue fetch failed \((\d+)\): (.+)$/u, 'engine.pluginCatalogueHttp', ['status', 'url']],
]);

/** Texte dans la langue courante si le message est connu, sinon le texte d'origine. */
export function localizeMessage(text) {
  const message = String(text ?? '');
  const key = KNOWN_MESSAGES[message];
  if (key && hasKey(key)) return t(key);
  for (const [pattern, patternKey, names] of KNOWN_PATTERNS) {
    const match = pattern.exec(message);
    if (match && hasKey(patternKey)) return t(patternKey, Object.fromEntries(names.map((name, index) => [name, match[index + 1] ?? ''])));
  }
  return message;
}

/** Message d'une erreur : code traduit (PresetError), sinon message connu, sinon tel quel. */
export function errorText(error) {
  if (error?.code && hasKey(`errors.preset.${error.code}`)) return t(`errors.preset.${error.code}`, error.params ?? {});
  // Refus d'accès au micro : le texte du navigateur varie (« Permission denied »…), son nom non.
  if (error?.name === 'NotAllowedError') return t('engine.permissionDenied');
  return localizeMessage(error?.message ?? error);
}
