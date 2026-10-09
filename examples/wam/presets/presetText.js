// Textes d'affichage partagés par PresetView (mes presets) et ExplorePanel (presets publics).

import {el} from '../ui/el.js';
import {t, formatDate as formatLocalDate} from '../ui/i18n.js';

/**
 * Boutons d'un preset dans la liste « mes presets », selon l'onglet (fonction pure, testée).
 *   - lecture seule (usine) : seulement Load ;
 *   - compte : Rename, Make public/private, Export, Delete ;
 *   - navigateur : Rename, Copy to account (si connecté), Export, Delete.
 */
export function presetActions({source, readOnly = false, signedIn = false}) {
  if (readOnly) return ['load'];
  const online = source === 'account';
  return ['load', 'rename', online && 'visibility', !online && signedIn && 'copy', 'export', 'delete'].filter(Boolean);
}

/** Les tags d'un preset sous forme de pastilles (null s'il n'y en a pas). */
export const tagList = (tags = []) => (tags.length ? el('span', {class: 'presets-tags'}, ...tags.map((tag) => el('span', {class: 'presets-tag', text: tag}))) : null);

export const formatDate = (iso) => formatLocalDate(iso, {dateStyle: 'medium', timeStyle: 'short'});

/** Résumé d'une ligne : « Amp: … · Cab: … · 2 effects: BigMuff, Delay · Chains A + B ». */
export const describe = (summary = {}) => [
  summary.amp && t('presets.summary.amp', {name: summary.amp}),
  summary.cabinet && t('presets.summary.cab', {name: summary.cabinet}),
  summary.effects?.length ? t('presets.summary.effects', {count: summary.effects.length, list: summary.effects.join(', ')}) : t('presets.summary.noEffect'),
  summary.chains === 2 && t('presets.summary.chains'),
].filter(Boolean).join(' · ');

/** Ordre du signal d'une chaîne : « BigMuff → Twin Clean → V30 » (les modules bypassés entre parenthèses). */
export const signalPath = (chain = []) => chain.map((item) => (item.bypass ? `(${item.name})` : item.name)).join(' → ');
