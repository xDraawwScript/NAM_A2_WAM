// Onglet « Explore » de la fenêtre Presets (mission 5) : les presets PUBLICS de tous les utilisateurs.
//   - « récemment ajoutés » par défaut (les plus récents d'abord) ;
//   - recherche dans le nom, les tags, l'ampli, le cabinet, les pédales et le pseudo de l'auteur
//     (faite par le serveur, déclenchée 300 ms après la dernière frappe) ;
//   - aperçu : auteur, résumé, et ordre du signal de chaque chaîne (bouton « Details ») ;
//   - « Load » : charge le son (même sans compte) ; « Copy to my presets » : copie privée sur le compte.
// Les presets publics sont en lecture seule : on ne peut ni les renommer ni les écraser.

import {el} from '../ui/el.js';
import {describe, formatDate, signalPath, tagList} from './presetText.js';
import {t, localize, applyTranslations} from '../ui/i18n.js';
import {errorText} from '../ui/hostMessages.js';

const PAGE_SIZE = 12;
const SEARCH_DELAY = 300;

export class ExplorePanel {
  /** `loadPreset(preset, source)` : le chargement commun de PresetView (confirmation, messages). */
  constructor({manager, accountUser = () => null, setStatus = () => {}, loadPreset}) {
    Object.assign(this, {manager, accountUser, setStatus, loadPreset});
    this.items = [];
    this.page = 0;
    this.pages = 0;
    this.total = 0;
    this.query = '';
    this.search = 0;      // numéro de la dernière recherche lancée
    this.timer = null;
    this.loadingMore = false;
    this.expanded = new Set();
    this.build();
    // Connexion, chargement en cours… : on réaffiche pour mettre à jour l'état des boutons.
    manager.addEventListener('change', () => { if (!this.root.hidden && this.page > 0) this.render(); });
  }

  build() {
    this.searchInput = localize(el('input', {type: 'search', maxlength: '60',
      oninput: () => { clearTimeout(this.timer); this.timer = setTimeout(() => this.refresh(), SEARCH_DELAY); }}), {placeholder: 'presets.explore.search', ariaLabel: 'presets.explore.searchLabel'});
    this.info = el('p', {class: 'host-help explore-info', role: 'status'});
    this.list = localize(el('ul', {class: 'presets-list'}), {ariaLabel: 'presets.explore.list'});
    this.more = el('button', {type: 'button', class: 'explore-more', hidden: true, text: t('presets.explore.more'), onclick: () => this.loadMore()});
    this.root = localize(el('section', {class: 'explore', hidden: true},
      el('div', {class: 'presets-toolbar'}, this.searchInput), this.info, this.list, this.more), {ariaLabel: 'presets.explore.section'});
  }

  /** Changement de langue (appelé par PresetView) : textes fixes et liste affichée. */
  relabel() {
    applyTranslations(this.root);
    if (this.searching) this.info.textContent = t('presets.explore.searching');
    else if (this.page > 0) this.render();
  }

  /**
   * Nouvelle recherche (page 1). Chaque recherche reçoit un numéro : une réponse arrivée après une
   * recherche plus récente est ignorée, et un « Load more » d'une ancienne recherche aussi.
   */
  async refresh() {
    clearTimeout(this.timer);
    this.query = this.searchInput.value;
    this.expanded.clear();
    const search = ++this.search;
    this.searching = true;
    this.info.textContent = t('presets.explore.searching');
    try {
      const result = await this.manager.searchPublic({q: this.query, page: 1, limit: PAGE_SIZE});
      if (search !== this.search) return;
      this.searching = false;
      Object.assign(this, {items: result.items, page: result.page, pages: result.pages, total: result.total});
    } catch (error) {
      if (search !== this.search) return;
      this.searching = false;
      Object.assign(this, {items: [], page: 0, pages: 0, total: 0});
      this.setStatus(() => errorText(error), true);
    }
    this.render();
  }

  async loadMore() {
    const search = this.search; // la page suivante n'a de sens que pour CETTE recherche
    this.loadingMore = true;
    this.render();
    try {
      const result = await this.manager.searchPublic({q: this.query, page: this.page + 1, limit: PAGE_SIZE});
      if (search !== this.search) return;
      const known = new Set(this.items.map((item) => item.id));
      this.items.push(...result.items.filter((item) => !known.has(item.id))); // pas de doublon si la liste a bougé
      Object.assign(this, {page: result.page, pages: result.pages, total: result.total});
    } catch (error) {
      if (search === this.search) this.setStatus(() => errorText(error), true);
    } finally {
      this.loadingMore = false;
    }
    this.render();
  }

  render() {
    const query = this.query.trim();
    const total = t('presets.explore.total', {count: this.total});
    this.info.textContent = this.total ? t(query ? 'presets.explore.matching' : 'presets.explore.recent', {total, query}) : '';
    this.more.hidden = this.page >= this.pages;
    this.more.disabled = this.loadingMore;
    this.more.textContent = t(this.loadingMore ? 'common.loading' : 'presets.explore.more');
    if (!this.items.length) {
      this.list.replaceChildren(el('li', {class: 'presets-empty', text: query ? t('presets.explore.noMatch', {query}) : t('presets.explore.none')}));
      return;
    }
    this.list.replaceChildren(...this.items.map((item) => this.renderItem(item)));
  }

  renderItem(preset) {
    const signedIn = Boolean(this.manager.storages.account);
    const busy = this.manager.busy;
    // Comparaison par identifiant (stable), pas par pseudo (qui peut changer).
    const mine = Boolean(preset.author?.id) && preset.author.id === this.accountUser()?.id;
    const open = this.expanded.has(preset.id);
    const details = open ? el('div', {class: 'explore-details'},
      el('span', {text: t('presets.explore.chainA', {path: signalPath(preset.summary?.chainA) || '—'})}),
      preset.summary?.chainB?.length ? el('span', {text: t('presets.explore.chainB', {path: signalPath(preset.summary.chainB)})}) : null,
      preset.description ? el('span', {text: preset.description}) : null) : null;
    return el('li', {class: `presets-item${this.manager.isCurrent(preset.id, 'public') ? ' current' : ''}`},
      el('div', {class: 'presets-info'},
        el('div', {class: 'presets-title'}, el('strong', {class: 'presets-name', text: preset.name}), mine ? el('span', {class: 'presets-badge public', text: t('presets.explore.yours')}) : null),
        el('span', {class: 'explore-author', text: t('presets.explore.by', {author: preset.author?.username || t('presets.explore.unknownAuthor'), date: formatDate(preset.createdAt)})}),
        el('span', {class: 'presets-summary', text: describe(preset.summary)}),
        tagList(preset.tags),
        details),
      el('div', {class: 'presets-actions'},
        el('button', {type: 'button', class: 'presets-primary', text: t('presets.item.load'), disabled: busy, 'aria-label': t('presets.item.loadNamed', {name: preset.name}), onclick: () => this.load(preset)}),
        el('button', {type: 'button', text: t(open ? 'presets.explore.hideDetails' : 'presets.explore.details'), 'aria-expanded': String(open), 'aria-label': t('presets.explore.detailsNamed', {name: preset.name}), onclick: () => { if (open) this.expanded.delete(preset.id); else this.expanded.add(preset.id); this.render(); }}),
        mine ? null : el('button', {type: 'button', text: t('presets.explore.copy'), disabled: !signedIn || busy, title: t(signedIn ? 'presets.explore.copyTitle' : 'presets.explore.copySignIn'), 'aria-label': t('presets.explore.copyNamed', {name: preset.name}), onclick: () => this.copy(preset)})));
  }

  async load(preset) {
    if (await this.loadPreset(preset, 'public')) this.render();
  }

  async copy(preset) {
    try {
      const copy = await this.manager.copyPublic(preset.id);
      this.setStatus(() => t('presets.explore.copied', {name: copy.name}));
    } catch (error) {
      this.setStatus(() => errorText(error), true);
    }
  }
}
