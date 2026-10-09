// Onglet « Explore » de la fenêtre Presets (mission 5) : les presets PUBLICS de tous les utilisateurs.
//   - « récemment ajoutés » par défaut (les plus récents d'abord) ;
//   - recherche dans le nom, les tags, l'ampli, le cabinet, les pédales et le pseudo de l'auteur
//     (faite par le serveur, déclenchée 300 ms après la dernière frappe) ;
//   - aperçu : auteur, résumé, et ordre du signal de chaque chaîne (bouton « Details ») ;
//   - « Load » : charge le son (même sans compte) ; « Copy to my presets » : copie privée sur le compte.
// Les presets publics sont en lecture seule : on ne peut ni les renommer ni les écraser.

import {el} from '../ui/el.js';
import {describe, formatDate, signalPath} from './presetText.js';

const PAGE_SIZE = 12;
const SEARCH_DELAY = 300;

export class ExplorePanel {
  constructor({manager, accountUser = () => null, setStatus = () => {}, message = () => {}}) {
    Object.assign(this, {manager, accountUser, setStatus, message});
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
    this.searchInput = el('input', {type: 'search', placeholder: 'Search public presets: name, tag, amp, pedal, author…', 'aria-label': 'Search public presets', maxlength: '60',
      oninput: () => { clearTimeout(this.timer); this.timer = setTimeout(() => this.refresh(), SEARCH_DELAY); }});
    this.info = el('p', {class: 'host-help explore-info', role: 'status'});
    this.list = el('ul', {class: 'presets-list', 'aria-label': 'Public presets'});
    this.more = el('button', {type: 'button', class: 'explore-more', hidden: true, text: 'Load more', onclick: () => this.loadMore()});
    this.root = el('section', {class: 'explore', 'aria-label': 'Explore public presets', hidden: true},
      el('div', {class: 'presets-toolbar'}, this.searchInput), this.info, this.list, this.more);
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
    this.info.textContent = 'Searching…';
    try {
      const result = await this.manager.searchPublic({q: this.query, page: 1, limit: PAGE_SIZE});
      if (search !== this.search) return;
      Object.assign(this, {items: result.items, page: result.page, pages: result.pages, total: result.total});
    } catch (error) {
      if (search !== this.search) return;
      Object.assign(this, {items: [], page: 0, pages: 0, total: 0});
      this.setStatus(error.message, true);
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
      if (search === this.search) this.setStatus(error.message, true);
    } finally {
      this.loadingMore = false;
    }
    this.render();
  }

  render() {
    const query = this.query.trim();
    this.info.textContent = this.total
      ? `${this.total} public preset${this.total > 1 ? 's' : ''}${query ? ` matching “${query}”` : ' — most recent first'}`
      : '';
    this.more.hidden = this.page >= this.pages;
    this.more.disabled = this.loadingMore;
    this.more.textContent = this.loadingMore ? 'Loading…' : 'Load more';
    if (!this.items.length) {
      this.list.replaceChildren(el('li', {class: 'presets-empty', text: query ? `No public preset matches “${query}”.` : 'No public preset yet. Be the first: save a preset to your account and tick “Public”.'}));
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
      el('span', {text: `Chain A: ${signalPath(preset.summary?.chainA) || '—'}`}),
      preset.summary?.chainB?.length ? el('span', {text: `Chain B: ${signalPath(preset.summary.chainB)}`}) : null,
      preset.description ? el('span', {text: preset.description}) : null) : null;
    return el('li', {class: `presets-item${this.manager.isCurrent(preset.id, 'public') ? ' current' : ''}`},
      el('div', {class: 'presets-info'},
        el('div', {class: 'presets-title'}, el('strong', {class: 'presets-name', text: preset.name}), mine ? el('span', {class: 'presets-badge public', text: 'Yours'}) : null),
        el('span', {class: 'explore-author', text: `by ${preset.author?.username || 'unknown'} · ${formatDate(preset.createdAt)}`}),
        el('span', {class: 'presets-summary', text: describe(preset.summary)}),
        preset.tags?.length ? el('span', {class: 'presets-tags'}, ...preset.tags.map((tag) => el('span', {class: 'presets-tag', text: tag}))) : null,
        details),
      el('div', {class: 'presets-actions'},
        el('button', {type: 'button', class: 'presets-primary', text: 'Load', disabled: busy, 'aria-label': `Load ${preset.name}`, onclick: () => this.load(preset)}),
        el('button', {type: 'button', text: open ? 'Hide details' : 'Details', 'aria-expanded': String(open), 'aria-label': `Details of ${preset.name}`, onclick: () => { if (open) this.expanded.delete(preset.id); else this.expanded.add(preset.id); this.render(); }}),
        mine ? null : el('button', {type: 'button', text: 'Copy to my presets', disabled: !signedIn || busy, title: signedIn ? 'Save a private copy on your account' : 'Sign in to copy presets to your account', 'aria-label': `Copy ${preset.name} to my presets`, onclick: () => this.copy(preset)})));
  }

  async load(preset) {
    if (this.manager.dirty && !confirm(`“${this.manager.current?.name}” has unsaved changes. Load “${preset.name}” anyway?`)) return;
    this.setStatus(`Loading “${preset.name}” by ${preset.author?.username || 'unknown'}…`);
    try {
      const {warnings} = await this.manager.load(preset.id, 'public');
      const text = warnings.length ? `Loaded “${preset.name}” with warnings: ${warnings.join(' ')}` : `Loaded “${preset.name}” by ${preset.author?.username || 'unknown'}.`;
      this.setStatus(text, warnings.length > 0);
      this.message(text, warnings.length > 0);
      this.render();
    } catch (error) {
      this.setStatus(error.message, true);
    }
  }

  async copy(preset) {
    try {
      const copy = await this.manager.copyPublic(preset.id);
      this.setStatus(`“${copy.name}” saved (private) in My account. You can now edit it.`);
    } catch (error) {
      this.setStatus(error.message, true);
    }
  }
}
