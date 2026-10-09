// Fenêtre « Presets » de l'hôte (missions 1, 4, 5 et 6).
// Quatre onglets : « Factory » (sons d'usine, lecture seule), « This browser » (presets dans
// IndexedDB, mode invité), « My account » (presets en ligne, une fois connecté) et « Explore »
// (presets publics, voir ExplorePanel.js). Même principe que TunerView.js : un <dialog> créé en
// JavaScript, ouvert par un bouton du header. Les textes venant de l'utilisateur (noms, tags…) sont
// toujours insérés avec textContent (via el), jamais avec innerHTML : pas d'injection de HTML.

import {presetFileName} from './PresetFile.js';
import {el} from '../ui/el.js';
import {describe, formatDate, tagList, presetActions} from './presetText.js';
import {ExplorePanel} from './ExplorePanel.js';
import {confirmDialog} from '../ui/confirmDialog.js';
import {t, localize, applyTranslations, onLanguageChange} from '../ui/i18n.js';
import {errorText} from '../ui/hostMessages.js';
import {bindTabKeys, syncTabs} from '../ui/tabs.js';

/**
 * Un preset du navigateur est considéré « déjà copié » si le compte contient un preset de même nom
 * et de même résumé (ampli, cabinet, pédales). Évite de recopier (et dupliquer) les mêmes presets.
 */
export const copyKey = (preset) => `${preset.name}\u0000${JSON.stringify(preset.summary ?? {})}`;
export function pendingCopies(browserPresets, accountPresets) {
  const online = new Set(accountPresets.map(copyKey));
  return browserPresets.filter((preset) => !online.has(copyKey(preset)));
}

/** Description d'un preset d'usine dans la langue choisie (clé presets.factory.<slug>), sinon celle du fichier. */
export function factoryDescription(preset) {
  const key = `presets.factory.${String(preset.id).replace(/^factory:/u, '')}`;
  const text = t(key);
  return text === key ? preset.description : text;
}

export class PresetView {
  constructor({manager, button, label, message = () => {}, accountUser = () => null}) {
    const accountName = () => accountUser()?.username || null;
    Object.assign(this, {manager, button, label, message, accountName});
    this.presets = [];
    this.pending = [];   // presets du navigateur pas encore copiés sur le compte
    this.filter = '';
    this.renaming = null;
    this.listSource = null;
    this.listRequest = 0;
    this.explore = new ExplorePanel({manager, accountUser, setStatus: (text, error) => this.setStatus(text, error), loadPreset: (preset, source) => this.load(preset, source)});
    this.build();
    button.setAttribute('aria-controls', this.dialog.id);
    button.setAttribute('aria-expanded', 'false');
    button.disabled = false;
    button.onclick = () => this.open();
    manager.addEventListener('change', () => {
      this.renderCurrent();
      // Connexion / déconnexion / changement d'onglet : on recharge la liste affichée.
      if (this.dialog.open && this.listSource !== this.manager.source) this.refresh();
    });
    this.renderCurrent();
    // Changement de langue : textes fixes (data-i18n), puis tout ce qui est calculé (liste, statut…).
    onLanguageChange(() => {
      applyTranslations(this.dialog);
      this.renderCurrent();
      if (this.listSource) this.renderList();
      this.renderStatus();
      this.explore.relabel();
    });
  }

  build() {
    this.status = el('p', {class: 'presets-status', role: 'status', 'aria-live': 'polite'});
    this.currentName = el('strong');
    this.currentWhere = el('span', {class: 'presets-where'});
    this.modified = localize(el('span', {class: 'presets-modified', hidden: true}), {text: 'presets.modified'});
    this.tabFactory = localize(el('button', {type: 'button', role: 'tab', id: 'presetsTabFactory', class: 'presets-tab', onclick: () => this.switchSource('factory')}), {text: 'presets.tabs.factory', title: 'presets.tabs.factoryTitle'});
    this.tabBrowser = localize(el('button', {type: 'button', role: 'tab', id: 'presetsTabBrowser', class: 'presets-tab', onclick: () => this.switchSource('browser')}), {text: 'presets.tabs.browser'});
    this.tabAccount = el('button', {type: 'button', role: 'tab', id: 'presetsTabAccount', class: 'presets-tab', onclick: () => this.switchSource('account')});
    this.tabExplore = localize(el('button', {type: 'button', role: 'tab', id: 'presetsTabExplore', class: 'presets-tab', onclick: () => this.switchSource('public')}), {text: 'presets.tabs.explore', title: 'presets.tabs.exploreTitle'});
    this.nameInput = localize(el('input', {name: 'name', type: 'text', maxlength: '80', required: true, autocomplete: 'off'}), {placeholder: 'presets.form.name', ariaLabel: 'presets.form.name'});
    this.tagsInput = localize(el('input', {name: 'tags', type: 'text', maxlength: '200', autocomplete: 'off'}), {placeholder: 'presets.form.tagsPlaceholder', ariaLabel: 'presets.form.tags'});
    this.publicInput = el('input', {type: 'checkbox', name: 'public'});
    this.publicRow = el('label', {class: 'presets-public'}, this.publicInput, ' ', localize(el('span'), {text: 'presets.form.public'}));
    this.saveButton = el('button', {type: 'submit', class: 'presets-primary', text: t('presets.form.saveBrowser')});
    this.overwriteButton = el('button', {type: 'button', class: 'presets-overwrite', hidden: true, onclick: () => this.overwrite()});
    this.saveForm = el('form', {class: 'presets-save', onsubmit: (event) => { event.preventDefault(); this.saveAs(); }},
      this.nameInput, this.tagsInput, this.publicRow,
      el('div', {class: 'presets-save-actions'}, this.saveButton, this.overwriteButton));
    this.copyAllButton = el('button', {type: 'button', class: 'presets-primary', onclick: () => this.copyAllToAccount()});
    this.migration = el('div', {class: 'presets-migration', hidden: true},
      el('span', {class: 'presets-migration-text'}), this.copyAllButton);
    this.search = localize(el('input', {type: 'search', oninput: () => { this.filter = this.search.value; this.renderList(); }}), {ariaLabel: 'presets.filterLabel'});
    this.fileInput = el('input', {type: 'file', accept: '.json,application/json', hidden: true, onchange: () => this.importSelected()});
    this.list = localize(el('ul', {class: 'presets-list'}), {ariaLabel: 'presets.listLabel'});
    this.note = el('p', {class: 'host-help presets-note'});
    // « Mes presets » (navigateur / compte) ; masqué dans l'onglet Explore, qui a sa propre section.
    this.importButton = localize(el('button', {type: 'button', onclick: () => this.fileInput.click()}), {text: 'presets.import'});
    this.mine = el('div', {class: 'presets-mine', id: 'presetsPanelMine'}, this.saveForm, this.migration,
      el('div', {class: 'presets-toolbar'}, this.search, this.importButton, this.fileInput),
      this.list);
    this.explore.root.id = 'presetsPanelExplore';
    this.closeButton = localize(el('button', {type: 'button', class: 'presets-close', text: '×', onclick: () => this.close()}), {ariaLabel: 'presets.close'});
    this.tablist = localize(el('div', {class: 'presets-tabs', role: 'tablist'}, this.tabFactory, this.tabBrowser, this.tabAccount, this.tabExplore), {ariaLabel: 'presets.tabs.label'});
    bindTabKeys(this.tablist);
    this.dialog = el('dialog', {class: 'host-presets', id: 'presetsDialog', 'aria-labelledby': 'presetsTitle'},
      el('header', {}, localize(el('strong', {id: 'presetsTitle'}), {text: 'presets.title'}), this.closeButton),
      el('p', {class: 'presets-current'}, localize(el('span'), {text: 'presets.current'}), ' ', this.currentName, ' ', this.currentWhere, ' ', this.modified),
      this.tablist,
      this.mine,
      this.explore.root,
      this.status,
      this.note);
    this.dialog.addEventListener('close', () => this.button.setAttribute('aria-expanded', 'false'));
    document.body.append(this.dialog);
  }

  async open() {
    this.button.setAttribute('aria-expanded', 'true');
    if (!this.dialog.open) this.dialog.showModal();
    this.setStatus('');
    await this.refresh();
    const source = this.manager.source;
    (source === 'public' ? this.explore.searchInput : source === 'factory' ? this.search : this.nameInput).focus();
  }

  close() { this.dialog.close(); this.button.focus(); }

  /** `text` peut être une fonction : le statut est alors recalculé (retraduit) au changement de langue. */
  setStatus(text, error = false) {
    this.statusText = text;
    this.status.classList.toggle('error', error);
    this.renderStatus();
  }

  renderStatus() { this.status.textContent = typeof this.statusText === 'function' ? this.statusText() : this.statusText ?? ''; }

  /** Exécute une action en affichant ses erreurs dans la fenêtre plutôt que de planter. */
  async run(action, success) {
    try {
      const result = await action();
      if (success) this.setStatus(typeof success === 'function' ? () => success(result) : success);
      return result;
    } catch (error) {
      this.setStatus(() => errorText(error), true);
      return null;
    }
  }

  switchSource(source) {
    if (source === this.manager.source) return;
    this.renaming = null;
    this.setStatus('');
    this.run(() => this.manager.setSource(source));
  }

  /**
   * Recharge la liste de l'onglet affiché. Une réponse arrivée après un changement d'onglet est
   * ignorée (compteur `listRequest`) : la liste affichée correspond toujours à l'onglet actif.
   */
  async refresh() {
    const source = this.manager.source;
    const request = ++this.listRequest;
    this.listSource = source;
    this.renderCurrent();
    if (source === 'public') { await this.explore.refresh(); return; }
    if (this.list.childElementCount === 0 || this.list.dataset.source !== source) this.list.replaceChildren(el('li', {class: 'presets-empty', text: t('common.loading')}));
    const [presets, browserPresets] = await Promise.all([
      this.run(() => this.manager.list(source)),
      source === 'account' ? this.manager.list('browser').catch(() => []) : Promise.resolve(null),
    ]);
    if (request !== this.listRequest) return;
    this.list.dataset.source = source;
    this.presets = presets || [];
    this.pending = browserPresets && presets ? pendingCopies(browserPresets, presets) : [];
    this.renderCurrent();
    this.renderList();
  }

  renderCurrent() {
    const {current, dirty, busy, source} = this.manager;
    const account = Boolean(this.manager.storages.account);
    const username = this.accountName();
    this.currentName.textContent = current?.name || t('presets.none');
    this.currentWhere.textContent = current ? t(`presets.where.${['account', 'public', 'factory'].includes(current.source) ? current.source : 'browser'}`) : '';
    this.modified.hidden = !(current && dirty);
    // Un preset d'usine ou public d'un autre ne s'écrase pas : on l'enregistre comme nouveau preset.
    this.overwriteButton.hidden = !current || Boolean(this.manager.storages[current.source]?.readOnly);
    const readOnly = Boolean(this.manager.storage?.readOnly);
    this.saveForm.hidden = readOnly;
    this.importButton.hidden = readOnly;
    this.search.placeholder = t(readOnly ? 'presets.filterFactory' : 'presets.filterMine');
    this.overwriteButton.textContent = current ? t('presets.form.update', {name: current.name}) : '';
    if (this.label) {
      // Header : « Preset : Ambient Clean • modifié » (ligne #presetLine, masquée sans preset).
      const line = this.label.closest('.host-preset-line');
      this.label.textContent = current ? `${current.name}${dirty && !line ? ' •' : ''}` : '';
      if (line) {
        line.hidden = !current;
        line.classList.toggle('is-dirty', Boolean(current && dirty));
      }
    }
    this.mine.hidden = source === 'public';
    this.explore.root.hidden = source !== 'public';
    const tabs = [[this.tabFactory, 'factory'], [this.tabBrowser, 'browser'], [this.tabAccount, 'account'], [this.tabExplore, 'public']];
    for (const [tab, value] of tabs) tab.classList.toggle('active', source === value);
    this.tabAccount.textContent = account ? (username ? t('presets.tabs.accountUser', {name: username}) : t('presets.tabs.account')) : t('presets.tabs.accountSignIn');
    this.tabAccount.title = t(account ? 'presets.tabs.accountTitle' : 'presets.tabs.accountSignInTitle');
    this.publicRow.hidden = source !== 'account';
    this.saveButton.textContent = t(source === 'account' ? 'presets.form.saveAccount' : 'presets.form.saveBrowser');
    this.note.textContent = t(`presets.notes.${source}`);
    const count = this.pending.length;
    const migrate = source === 'account' && count > 0;
    this.migration.hidden = !migrate;
    if (migrate) {
      this.migration.querySelector('.presets-migration-text').textContent = t('presets.migration.text', {count});
      this.copyAllButton.textContent = t('presets.migration.button', {count});
    }
    this.dialog.classList.toggle('busy', busy);
    // Un bouton désactivé perd le focus (il retombe sur la page) : on le note pendant l'action et
    // on le rend à la fin, sinon un utilisateur au clavier doit tout reparcourir depuis le début.
    const focused = document.activeElement;
    if (busy && focused !== this.dialog && this.dialog.contains(focused)) this.restoreFocus = focused;
    for (const control of this.dialog.querySelectorAll('button, input')) {
      // L'onglet Explore gère lui-même l'état de ses boutons (copie impossible sans compte…).
      if (control === this.closeButton || this.explore.root.contains(control)) continue;
      control.disabled = busy || (control === this.tabAccount && !account) || (control === this.tabExplore && !this.manager.storages.public) || (control === this.tabFactory && !this.manager.storages.factory);
    }
    // Après les « disabled » : un onglet désactivé ne doit pas rester le seul atteignable au clavier.
    syncTabs(tabs.map(([tab]) => tab), tabs.find(([, value]) => value === source)?.[0], (tab) => (tab === this.tabExplore ? this.explore.root : this.mine));
    if (!busy && this.restoreFocus) {
      const target = this.restoreFocus;
      this.restoreFocus = null;
      const lost = !document.activeElement || document.activeElement === document.body || document.activeElement === this.dialog;
      if (lost && this.dialog.open && target.isConnected && !target.disabled && !target.closest('[hidden]')) target.focus();
    }
  }

  renderList() {
    const query = this.filter.trim().toLocaleLowerCase('en-US');
    const visible = this.presets.filter((preset) => !query || [preset.name, ...(preset.tags || []), describe(preset.summary)].join(' ').toLocaleLowerCase('en-US').includes(query));
    if (!visible.length) {
      const empty = this.presets.length ? 'filter' : this.manager.source === 'account' ? 'account' : 'browser';
      this.list.replaceChildren(el('li', {class: 'presets-empty', text: t(`presets.empty.${empty}`)}));
      return;
    }
    this.list.replaceChildren(...visible.map((preset) => this.renderItem(preset)));
  }

  renderItem(preset) {
    const source = this.manager.source;
    const online = source === 'account';
    const factory = Boolean(this.manager.storage?.readOnly);
    const actions = new Set(presetActions({source, readOnly: factory, signedIn: Boolean(this.manager.storages.account)}));
    const isCurrent = this.manager.isCurrent(preset.id, source);
    const title = this.renaming === preset.id
      ? el('form', {class: 'presets-rename', onsubmit: (event) => { event.preventDefault(); this.rename(preset.id, event.target.elements.name.value); }},
        el('input', {name: 'name', type: 'text', maxlength: '80', required: true, value: preset.name, 'aria-label': t('presets.item.newName')}),
        el('button', {type: 'submit', text: t('presets.item.ok')}), el('button', {type: 'button', text: t('presets.item.cancel'), onclick: () => { this.renaming = null; this.renderList(); }}))
      : el('strong', {class: 'presets-name', text: preset.name});
    const badge = online ? el('span', {class: `presets-badge ${preset.visibility === 'public' ? 'public' : 'private'}`, text: t(preset.visibility === 'public' ? 'presets.item.public' : 'presets.item.private')}) : null;
    return el('li', {class: `presets-item${isCurrent ? ' current' : ''}`},
      el('div', {class: 'presets-info'},
        el('div', {class: 'presets-title'}, title, badge),
        factory && preset.description ? el('span', {class: 'presets-description', text: factoryDescription(preset)}) : null,
        el('span', {class: 'presets-summary', text: describe(preset.summary)}),
        tagList(preset.tags),
        factory ? null : el('span', {class: 'presets-date', text: t('presets.item.updated', {date: formatDate(preset.updatedAt)})})),
      el('div', {class: 'presets-actions'},
        el('button', {type: 'button', class: 'presets-primary', text: t('presets.item.load'), 'aria-label': t('presets.item.loadNamed', {name: preset.name}), onclick: () => this.load(preset)}),
        actions.has('rename') ? el('button', {type: 'button', text: t('presets.item.rename'), 'aria-label': t('presets.item.renameNamed', {name: preset.name}), onclick: () => { this.renaming = preset.id; this.renderList(); this.list.querySelector('.presets-rename input')?.select(); }}) : null,
        actions.has('visibility') ? el('button', {type: 'button', text: t(preset.visibility === 'public' ? 'presets.item.makePrivate' : 'presets.item.makePublic'), 'aria-label': t(preset.visibility === 'public' ? 'presets.item.makePrivateNamed' : 'presets.item.makePublicNamed', {name: preset.name}), onclick: () => this.toggleVisibility(preset)}) : null,
        actions.has('copy') ? el('button', {type: 'button', text: t('presets.item.copy'), 'aria-label': t('presets.item.copyNamed', {name: preset.name}), onclick: () => this.copyToAccount([preset.id])}) : null,
        actions.has('export') ? el('button', {type: 'button', text: t('presets.item.export'), 'aria-label': t('presets.item.exportNamed', {name: preset.name}), onclick: () => this.export(preset)}) : null,
        actions.has('delete') ? el('button', {type: 'button', class: 'presets-danger', text: t('presets.item.delete'), 'aria-label': t('presets.item.deleteNamed', {name: preset.name}), onclick: () => this.remove(preset)}) : null));
  }

  /**
   * Confirmation thémée et traduite. `key` regroupe title / message / action dans les dictionnaires
   * (ui/locales) ; `messageKey` permet un message différent selon l'onglet. Supprimer = bouton rouge.
   */
  ask(key, params, messageKey = `${key}.message`) {
    return confirmDialog({title: t(`${key}.title`, params), message: t(messageKey, params), confirmLabel: t(`${key}.action`), danger: key === 'presets.confirm.delete'});
  }

  tags() { return this.tagsInput.value.split(',').map((tag) => tag.trim()).filter(Boolean); }

  async saveAs() {
    const visibility = this.manager.source === 'account' && this.publicInput.checked ? 'public' : 'private';
    const key = this.manager.source !== 'account' ? 'savedBrowser' : visibility === 'public' ? 'savedAccountPublic' : 'savedAccount';
    const saved = await this.run(() => this.manager.saveAs({name: this.nameInput.value, tags: this.tags(), visibility}), (preset) => t(`presets.status.${key}`, {name: preset.name}));
    if (!saved) return;
    this.nameInput.value = '';
    this.tagsInput.value = '';
    this.publicInput.checked = false;
    this.message(t('presets.status.savedToast', {name: saved.name}));
    await this.refresh();
  }

  async overwrite() {
    const current = this.manager.current;
    if (!current || !await this.ask('presets.confirm.overwrite', {name: current.name})) return;
    const saved = await this.run(() => this.manager.overwrite(), (preset) => t('presets.status.updated', {name: preset.name}));
    if (saved) await this.refresh();
  }

  /** Charge un preset (tous les onglets, y compris Explore) : confirmation si modifié, état, message. */
  async load(preset, source = this.manager.source) {
    if (this.manager.dirty && !await this.ask('presets.confirm.load', {current: this.manager.current?.name, name: preset.name})) return null;
    const author = preset.author?.username;
    const params = {name: preset.name, author};
    this.setStatus(() => t(author ? 'presets.status.loadingBy' : 'presets.status.loading', params));
    const result = await this.run(() => this.manager.load(preset.id, source));
    if (!result) return null;
    const text = () => (result.warnings.length ? t('presets.status.loadedWarnings', {...params, warnings: result.warnings.join(' ')}) : t(author ? 'presets.status.loadedBy' : 'presets.status.loaded', params));
    this.setStatus(text, result.warnings.length > 0);
    this.message(text(), result.warnings.length > 0);
    this.renderList();
    return result;
  }

  async rename(id, name) {
    const saved = await this.run(() => this.manager.rename(id, name), (preset) => t('presets.status.renamed', {name: preset.name}));
    if (saved) { this.renaming = null; await this.refresh(); }
  }

  async toggleVisibility(preset) {
    const visibility = preset.visibility === 'public' ? 'private' : 'public';
    if (visibility === 'public' && !await this.ask('presets.confirm.makePublic', {name: preset.name})) return;
    const saved = await this.run(() => this.manager.setVisibility(preset.id, visibility), (updated) => t(updated.visibility === 'public' ? 'presets.status.nowPublic' : 'presets.status.nowPrivate', {name: updated.name}));
    if (saved) await this.refresh();
  }

  async copyToAccount(ids) {
    const result = await this.run(() => this.manager.copyToAccount(ids));
    if (!result) return;
    const failed = () => result.failed.map((item) => `${item.name} (${errorText({code: item.code, params: item.params, message: item.error})})`).join(', ');
    this.setStatus(() => [t('presets.status.copied', {count: result.copied.length}), result.failed.length ? t('presets.status.notCopied', {list: failed()}) : ''].filter(Boolean).join(' '), result.failed.length > 0);
    await this.refresh();
  }

  /** Copie seulement les presets du navigateur qui ne sont pas encore sur le compte. */
  async copyAllToAccount() {
    const presets = this.pending;
    if (!presets.length) return;
    if (!await this.ask('presets.confirm.copyAll', {count: presets.length})) return;
    await this.copyToAccount(presets.map((preset) => preset.id));
  }

  async remove(preset) {
    const message = this.manager.source === 'account' ? 'presets.confirm.delete.messageAccount' : 'presets.confirm.delete.messageBrowser';
    if (!await this.ask('presets.confirm.delete', {name: preset.name}, message)) return;
    const index = this.presets.findIndex((item) => item.id === preset.id);
    if (!await this.run(() => this.manager.remove(preset.id).then(() => true), () => t('presets.status.deleted', {name: preset.name}))) return;
    await this.refresh();
    // Le bouton cliqué n'existe plus : le focus va au preset qui a pris sa place (ou au filtre).
    const items = this.list.querySelectorAll('.presets-item');
    (items[Math.min(index, items.length - 1)]?.querySelector('button') || this.search).focus();
  }

  async export(preset) {
    const result = await this.run(() => this.manager.exportFile(preset.id));
    if (!result) return;
    const url = URL.createObjectURL(new Blob([result.text], {type: 'application/json'}));
    const link = el('a', {href: url, download: presetFileName(result.preset)});
    document.body.append(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    this.setStatus(() => (result.warnings.length ? t('presets.status.exportedWarnings', {warnings: result.warnings.join(' ')}) : t('presets.status.exported', {name: preset.name})), result.warnings.length > 0);
  }

  async importSelected() {
    const file = this.fileInput.files?.[0];
    this.fileInput.value = '';
    if (!file) return;
    const result = await this.run(async () => this.manager.importFile(await file.text()));
    if (!result) return;
    const params = {name: result.preset.name, warnings: result.warnings.join(' ')};
    this.setStatus(() => t(result.warnings.length ? 'presets.status.importedWarnings' : 'presets.status.imported', params), result.warnings.length > 0);
    await this.refresh();
  }
}
