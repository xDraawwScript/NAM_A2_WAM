// Textes d'affichage partagés par PresetView (mes presets) et ExplorePanel (presets publics).

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
