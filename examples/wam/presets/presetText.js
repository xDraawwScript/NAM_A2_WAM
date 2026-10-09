// Textes d'affichage partagés par PresetView (mes presets) et ExplorePanel (presets publics).

import {el} from '../ui/el.js';

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

export const formatDate = (iso) => {
  try { return new Date(iso).toLocaleString('en-GB', {dateStyle: 'medium', timeStyle: 'short'}); } catch { return ''; }
};

/** Résumé d'une ligne : « Amp: … · Cab: … · 2 effects: BigMuff, Delay · Chains A + B ». */
export const describe = (summary = {}) => [
  summary.amp && `Amp: ${summary.amp}`,
  summary.cabinet && `Cab: ${summary.cabinet}`,
  summary.effects?.length ? `${summary.effects.length} effect${summary.effects.length > 1 ? 's' : ''}: ${summary.effects.join(', ')}` : 'No effect',
  summary.chains === 2 && 'Chains A + B',
].filter(Boolean).join(' · ');

/** Ordre du signal d'une chaîne : « BigMuff → Twin Clean → V30 » (les modules bypassés entre parenthèses). */
export const signalPath = (chain = []) => chain.map((item) => (item.bypass ? `(${item.name})` : item.name)).join(' → ');
