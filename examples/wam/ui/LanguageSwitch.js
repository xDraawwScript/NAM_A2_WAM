// Sélecteur FR | EN du header (mission 8). Le choix est mémorisé (ui/i18n.js, clé nam-a2-lang).
// Les libellés « FR » / « EN » ne se traduisent pas ; l'infobulle et le nom du groupe, si.
import {getLanguage, setLanguage, onLanguageChange, t} from './i18n.js';

export function mountLanguageSwitch(group) {
  if (!group) return () => {};
  const buttons = [...group.querySelectorAll('button[data-lang]')];
  const sync = () => {
    group.setAttribute('aria-label', t('header.language'));
    for (const button of buttons) {
      button.setAttribute('aria-pressed', String(button.dataset.lang === getLanguage()));
      button.title = t(`header.languageTitle.${button.dataset.lang}`);
    }
  };
  for (const button of buttons) button.addEventListener('click', () => setLanguage(button.dataset.lang, {persist: true}));
  sync();
  return onLanguageChange(sync);
}
