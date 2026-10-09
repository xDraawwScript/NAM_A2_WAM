// Onglets accessibles (motif WAI-ARIA « Tabs »), partagés par les fenêtres Presets et Compte.
// - Un seul onglet est atteignable avec Tab (celui qui est sélectionné) ; les flèches ← → passent
//   à l'onglet voisin, Début / Fin au premier / dernier, en sautant les onglets désactivés.
// - L'onglet atteint est activé tout de suite (son clic est simulé).
// - Chaque onglet indique la zone qu'il contrôle (aria-controls) et la zone indique son onglet
//   (role=tabpanel + aria-labelledby) : un lecteur d'écran annonce « onglet 2 sur 4 ».

/**
 * Index de l'onglet à atteindre avec la touche `key`, ou -1 si la touche ne concerne pas les onglets.
 * Fonction pure : `disabled` est la liste des onglets désactivés (true / false), dans l'ordre.
 */
export function nextTabIndex(disabled, current, key) {
  const count = disabled.length;
  const enabled = (index) => !disabled[index];
  if (!count || !disabled.some((value) => !value)) return -1;
  const scan = (start, step) => {
    for (let index = start, seen = 0; seen < count; index = (index + step + count) % count, seen += 1) if (enabled(index)) return index;
    return -1;
  };
  if (key === 'ArrowRight') return scan((current + 1) % count, 1);
  if (key === 'ArrowLeft') return scan((current - 1 + count) % count, -1);
  if (key === 'Home') return scan(0, 1);
  if (key === 'End') return scan(count - 1, -1);
  return -1;
}

/** Met à jour les attributs ARIA : `selected` est l'onglet actif, `panelFor(tab)` sa zone. */
export function syncTabs(tabs, selected, panelFor) {
  for (const tab of tabs) {
    const active = tab === selected;
    const panel = panelFor(tab);
    tab.setAttribute('aria-selected', String(active));
    tab.tabIndex = active ? 0 : -1;
    if (panel?.id) tab.setAttribute('aria-controls', panel.id);
    if (active && panel) {
      panel.setAttribute('role', 'tabpanel');
      if (tab.id) panel.setAttribute('aria-labelledby', tab.id);
    }
  }
  // Aucun onglet sélectionné atteignable (désactivé…) : le premier onglet utilisable le devient.
  if (!tabs.some((tab) => tab.tabIndex === 0 && !tab.disabled)) {
    const first = tabs.find((tab) => !tab.disabled);
    if (first) first.tabIndex = 0;
  }
}

/** Navigation au clavier dans un role=tablist. `tabs()` renvoie les onglets actuels (ils peuvent être recréés). */
export function bindTabKeys(tablist, tabs = () => [...tablist.querySelectorAll('[role="tab"]')]) {
  tablist.addEventListener('keydown', (event) => {
    const list = tabs();
    const current = list.indexOf(event.target);
    if (current < 0) return;
    const target = nextTabIndex(list.map((tab) => tab.disabled), current, event.key);
    if (target < 0) return;
    event.preventDefault();
    list[target].focus();
    list[target].click();
  });
}
