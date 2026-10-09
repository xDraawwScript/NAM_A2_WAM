// Fenêtre « Presets » de l'hôte (missions 1, 4, 5 et 6).
// Quatre onglets : « Factory » (sons d'usine, lecture seule), « This browser » (presets dans
// IndexedDB, mode invité), « My account » (presets en ligne, une fois connecté) et « Explore »
// (presets publics, voir ExplorePanel.js). Même principe que TunerView.js : un <dialog> créé en
// JavaScript, ouvert par un bouton du header. Les textes venant de l'utilisateur (noms, tags…) sont
// toujours insérés avec textContent (via el), jamais avec innerHTML : pas d'injection de HTML.

import {presetFileName} from './PresetFile.js';
import {el} from '../ui/el.js';
import {describe, formatDate} from './presetText.js';
import {ExplorePanel} from './ExplorePanel.js';

/**
 * Un preset du navigateur est considéré « déjà copié » si le compte contient un preset de même nom
 * et de même résumé (ampli, cabinet, pédales). Évite de recopier (et dupliquer) les mêmes presets.
 */
export const copyKey = (preset) => `${preset.name}\u0000${JSON.stringify(preset.summary ?? {})}`;
export function pendingCopies(browserPresets, accountPresets) {
  const online = new Set(accountPresets.map(copyKey));
  return browserPresets.filter((preset) => !online.has(copyKey(preset)));
}

const NOTES = {
  factory: 'Factory presets are ready-to-play sounds built with the bundled amp models and pedals. They are read-only: load one, tweak it, then open “This browser” or “My account” and click Save to keep your version.',
  browser: 'Guest mode: presets are stored in this browser only (they can be erased with the browser data and are not shared between devices). Use Export to keep a backup file, or sign in to save them online.',
  account: 'Online presets are saved on your account and follow you on every device. Private presets are visible only to you; public presets can be found and copied by everyone.',
  public: 'Public presets shared by all users (only the username of the author is shown). Load one to try it, then copy it to your presets to keep and edit it.',
};

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
    this.explore = new ExplorePanel({manager, accountUser, message, setStatus: (text, error) => this.setStatus(text, error)});
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
  }

  build() {
    this.status = el('p', {class: 'presets-status', role: 'status', 'aria-live': 'polite'});
    this.currentName = el('strong', {text: 'None'});
    this.currentWhere = el('span', {class: 'presets-where'});
    this.modified = el('span', {class: 'presets-modified', text: '• modified', hidden: true});
    this.tabFactory = el('button', {type: 'button', role: 'tab', class: 'presets-tab', text: 'Factory', title: 'Ready-to-play sounds bundled with the app', onclick: () => this.switchSource('factory')});
    this.tabBrowser = el('button', {type: 'button', role: 'tab', class: 'presets-tab', text: 'This browser', onclick: () => this.switchSource('browser')});
    this.tabAccount = el('button', {type: 'button', role: 'tab', class: 'presets-tab', text: 'My account', onclick: () => this.switchSource('account')});
    this.tabExplore = el('button', {type: 'button', role: 'tab', class: 'presets-tab', text: 'Explore', title: 'Public presets shared by everyone', onclick: () => this.switchSource('public')});
    this.nameInput = el('input', {name: 'name', type: 'text', maxlength: '80', required: true, placeholder: 'Preset name', autocomplete: 'off', 'aria-label': 'Preset name'});
    this.tagsInput = el('input', {name: 'tags', type: 'text', maxlength: '200', placeholder: 'Tags, comma separated (optional)', autocomplete: 'off', 'aria-label': 'Tags'});
    this.publicInput = el('input', {type: 'checkbox', name: 'public'});
    this.publicRow = el('label', {class: 'presets-public'}, this.publicInput, ' Public (anyone can find and copy it)');
    this.saveButton = el('button', {type: 'submit', class: 'presets-primary', text: 'Save as new preset'});
    this.overwriteButton = el('button', {type: 'button', class: 'presets-overwrite', hidden: true, onclick: () => this.overwrite()});
    this.saveForm = el('form', {class: 'presets-save', onsubmit: (event) => { event.preventDefault(); this.saveAs(); }},
      this.nameInput, this.tagsInput, this.publicRow,
      el('div', {class: 'presets-save-actions'}, this.saveButton, this.overwriteButton));
    this.copyAllButton = el('button', {type: 'button', class: 'presets-primary', onclick: () => this.copyAllToAccount()});
    this.migration = el('div', {class: 'presets-migration', hidden: true},
      el('span', {class: 'presets-migration-text'}), this.copyAllButton);
    this.search = el('input', {type: 'search', placeholder: 'Filter my presets', 'aria-label': 'Filter presets', oninput: () => { this.filter = this.search.value; this.renderList(); }});
    this.fileInput = el('input', {type: 'file', accept: '.json,application/json', hidden: true, onchange: () => this.importSelected()});
    this.list = el('ul', {class: 'presets-list', 'aria-label': 'My presets'});
    this.note = el('p', {class: 'host-help presets-note'});
    // « Mes presets » (navigateur / compte) ; masqué dans l'onglet Explore, qui a sa propre section.
    this.importButton = el('button', {type: 'button', text: 'Import file…', onclick: () => this.fileInput.click()});
    this.mine = el('div', {class: 'presets-mine'}, this.saveForm, this.migration,
      el('div', {class: 'presets-toolbar'}, this.search, this.importButton, this.fileInput),
      this.list);
    this.dialog = el('dialog', {class: 'host-presets', id: 'presetsDialog', 'aria-labelledby': 'presetsTitle'},
      el('header', {}, el('strong', {id: 'presetsTitle', text: 'Presets'}), el('button', {type: 'button', 'aria-label': 'Close presets', text: '×', onclick: () => this.close()})),
      el('p', {class: 'presets-current'}, 'Current sound: ', this.currentName, ' ', this.currentWhere, ' ', this.modified),
      el('div', {class: 'presets-tabs', role: 'tablist', 'aria-label': 'Where presets are stored'}, this.tabFactory, this.tabBrowser, this.tabAccount, this.tabExplore),
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

  setStatus(text, error = false) {
    this.status.textContent = text;
    this.status.classList.toggle('error', error);
  }

  /** Exécute une action en affichant ses erreurs dans la fenêtre plutôt que de planter. */
  async run(action, success) {
    try {
      const result = await action();
      if (success) this.setStatus(typeof success === 'function' ? success(result) : success);
      return result;
    } catch (error) {
      this.setStatus(error.message, true);
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
    if (this.list.childElementCount === 0 || this.list.dataset.source !== source) this.list.replaceChildren(el('li', {class: 'presets-empty', text: 'Loading…'}));
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
    this.currentName.textContent = current?.name || 'None (unsaved)';
    this.currentWhere.textContent = current ? ({account: '(my account)', public: '(public preset)', factory: '(factory)'}[current.source] || '(this browser)') : '';
    this.modified.hidden = !(current && dirty);
    // Un preset d'usine ou public d'un autre ne s'écrase pas : on l'enregistre comme nouveau preset.
    this.overwriteButton.hidden = !current || ['public', 'factory'].includes(current.source);
    const readOnly = source === 'factory';
    this.saveForm.hidden = readOnly;
    this.importButton.hidden = readOnly;
    this.search.placeholder = readOnly ? 'Filter factory presets' : 'Filter my presets';
    this.overwriteButton.textContent = current ? `Update “${current.name}”` : '';
    if (this.label) this.label.textContent = current ? `${current.name}${dirty ? ' •' : ''}` : '';
    this.mine.hidden = source === 'public';
    this.explore.root.hidden = source !== 'public';
    for (const [tab, value] of [[this.tabFactory, 'factory'], [this.tabBrowser, 'browser'], [this.tabAccount, 'account'], [this.tabExplore, 'public']]) {
      tab.classList.toggle('active', source === value);
      tab.setAttribute('aria-selected', String(source === value));
    }
    this.tabAccount.textContent = account ? `My account${username ? ` (${username})` : ''}` : 'My account (sign in)';
    this.tabAccount.title = account ? 'Presets saved online on your account' : 'Sign in (Account button) to save presets online';
    this.publicRow.hidden = source !== 'account';
    this.saveButton.textContent = source === 'account' ? 'Save to my account' : 'Save in this browser';
    this.note.textContent = NOTES[source];
    const count = this.pending.length;
    const migrate = source === 'account' && count > 0;
    this.migration.hidden = !migrate;
    if (migrate) {
      this.migration.querySelector('.presets-migration-text').textContent = `${count} preset${count > 1 ? 's' : ''} from this browser ${count > 1 ? 'are' : 'is'} not on your account yet.`;
      this.copyAllButton.textContent = count > 1 ? 'Copy them to my account' : 'Copy it to my account';
    }
    this.dialog.classList.toggle('busy', busy);
    for (const control of this.dialog.querySelectorAll('button, input')) {
      // L'onglet Explore gère lui-même l'état de ses boutons (copie impossible sans compte…).
      if (control.matches('[aria-label="Close presets"]') || this.explore.root.contains(control)) continue;
      control.disabled = busy || (control === this.tabAccount && !account) || (control === this.tabExplore && !this.manager.storages.public) || (control === this.tabFactory && !this.manager.storages.factory);
    }
  }

  renderList() {
    const query = this.filter.trim().toLocaleLowerCase('en-US');
    const visible = this.presets.filter((preset) => !query || [preset.name, ...(preset.tags || []), describe(preset.summary)].join(' ').toLocaleLowerCase('en-US').includes(query));
    if (!visible.length) {
      const empty = this.manager.source === 'account'
        ? 'No online preset yet. Shape your sound, give it a name and click “Save to my account”.'
        : 'No preset yet. Shape your sound, give it a name and click “Save in this browser”.';
      this.list.replaceChildren(el('li', {class: 'presets-empty', text: this.presets.length ? 'No preset matches this filter.' : empty}));
      return;
    }
    this.list.replaceChildren(...visible.map((preset) => this.renderItem(preset)));
  }

  renderItem(preset) {
    const source = this.manager.source;
    const online = source === 'account';
    const factory = source === 'factory';
    const isCurrent = this.manager.isCurrent(preset.id, source);
    const title = this.renaming === preset.id
      ? el('form', {class: 'presets-rename', onsubmit: (event) => { event.preventDefault(); this.rename(preset.id, event.target.elements.name.value); }},
        el('input', {name: 'name', type: 'text', maxlength: '80', required: true, value: preset.name, 'aria-label': 'New name'}),
        el('button', {type: 'submit', text: 'OK'}), el('button', {type: 'button', text: 'Cancel', onclick: () => { this.renaming = null; this.renderList(); }}))
      : el('strong', {class: 'presets-name', text: preset.name});
    const badge = online ? el('span', {class: `presets-badge ${preset.visibility === 'public' ? 'public' : 'private'}`, text: preset.visibility === 'public' ? 'Public' : 'Private'}) : null;
    return el('li', {class: `presets-item${isCurrent ? ' current' : ''}`},
      el('div', {class: 'presets-info'},
        el('div', {class: 'presets-title'}, title, badge),
        factory && preset.description ? el('span', {class: 'presets-description', text: preset.description}) : null,
        el('span', {class: 'presets-summary', text: describe(preset.summary)}),
        preset.tags?.length ? el('span', {class: 'presets-tags'}, ...preset.tags.map((tag) => el('span', {class: 'presets-tag', text: tag}))) : null,
        factory ? null : el('span', {class: 'presets-date', text: `Updated ${formatDate(preset.updatedAt)}`})),
      el('div', {class: 'presets-actions'},
        el('button', {type: 'button', class: 'presets-primary', text: 'Load', 'aria-label': `Load ${preset.name}`, onclick: () => this.load(preset)}),
        factory ? null : el('button', {type: 'button', text: 'Rename', 'aria-label': `Rename ${preset.name}`, onclick: () => { this.renaming = preset.id; this.renderList(); this.list.querySelector('.presets-rename input')?.select(); }}),
        online ? el('button', {type: 'button', text: preset.visibility === 'public' ? 'Make private' : 'Make public', 'aria-label': `${preset.visibility === 'public' ? 'Make private' : 'Make public'}: ${preset.name}`, onclick: () => this.toggleVisibility(preset)}) : null,
        !online && this.manager.storages.account ? el('button', {type: 'button', text: 'Copy to account', 'aria-label': `Copy ${preset.name} to my account`, onclick: () => this.copyToAccount([preset.id])}) : null,
        factory ? null : el('button', {type: 'button', text: 'Export', 'aria-label': `Export ${preset.name}`, onclick: () => this.export(preset)}),
        factory ? null : el('button', {type: 'button', class: 'presets-danger', text: 'Delete', 'aria-label': `Delete ${preset.name}`, onclick: () => this.remove(preset)})));
  }

  tags() { return this.tagsInput.value.split(',').map((tag) => tag.trim()).filter(Boolean); }

  async saveAs() {
    const visibility = this.manager.source === 'account' && this.publicInput.checked ? 'public' : 'private';
    const where = this.manager.source === 'account' ? 'on your account' : 'in this browser';
    const saved = await this.run(() => this.manager.saveAs({name: this.nameInput.value, tags: this.tags(), visibility}), (preset) => `Saved “${preset.name}” ${where}${visibility === 'public' ? ' (public)' : ''}.`);
    if (!saved) return;
    this.nameInput.value = '';
    this.tagsInput.value = '';
    this.publicInput.checked = false;
    this.message(`Preset saved: ${saved.name}`);
    await this.refresh();
  }

  async overwrite() {
    const current = this.manager.current;
    if (!current || !confirm(`Replace “${current.name}” with the current sound?`)) return;
    const saved = await this.run(() => this.manager.overwrite(), (preset) => `Updated “${preset.name}”.`);
    if (saved) await this.refresh();
  }

  async load(preset) {
    if (this.manager.dirty && !confirm(`“${this.manager.current?.name}” has unsaved changes. Load “${preset.name}” anyway?`)) return;
    this.setStatus(`Loading “${preset.name}”…`);
    const result = await this.run(() => this.manager.load(preset.id));
    if (!result) return;
    const text = result.warnings.length ? `Loaded “${preset.name}” with warnings: ${result.warnings.join(' ')}` : `Loaded “${preset.name}”.`;
    this.setStatus(text, result.warnings.length > 0);
    this.message(text, result.warnings.length > 0);
    this.renderList();
  }

  async rename(id, name) {
    const saved = await this.run(() => this.manager.rename(id, name), (preset) => `Renamed to “${preset.name}”.`);
    if (saved) { this.renaming = null; await this.refresh(); }
  }

  async toggleVisibility(preset) {
    const visibility = preset.visibility === 'public' ? 'private' : 'public';
    if (visibility === 'public' && !confirm(`Make “${preset.name}” public? Everyone will be able to find it, load it and copy it (your username is shown, never your email).`)) return;
    const saved = await this.run(() => this.manager.setVisibility(preset.id, visibility), (updated) => `“${updated.name}” is now ${updated.visibility}.`);
    if (saved) await this.refresh();
  }

  async copyToAccount(ids) {
    const result = await this.run(() => this.manager.copyToAccount(ids));
    if (!result) return;
    const failed = result.failed.map((item) => `${item.name} (${item.error})`).join(', ');
    this.setStatus(`${result.copied.length} preset${result.copied.length > 1 ? 's' : ''} copied to your account.${failed ? ` Not copied: ${failed}.` : ''}`, result.failed.length > 0);
    await this.refresh();
  }

  /** Copie seulement les presets du navigateur qui ne sont pas encore sur le compte. */
  async copyAllToAccount() {
    const presets = this.pending;
    if (!presets.length) return;
    if (!confirm(`Copy ${presets.length} preset${presets.length > 1 ? 's' : ''} from this browser to your account? They will also stay in this browser.`)) return;
    await this.copyToAccount(presets.map((preset) => preset.id));
  }

  async remove(preset) {
    const where = this.manager.source === 'account' ? 'from your account' : 'from this browser';
    if (!confirm(`Delete “${preset.name}” ${where}? This cannot be undone (export it first to keep a copy).`)) return;
    if (await this.run(() => this.manager.remove(preset.id).then(() => true), `Deleted “${preset.name}”.`)) await this.refresh();
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
    this.setStatus(result.warnings.length ? `Exported with warnings: ${result.warnings.join(' ')}` : `Exported “${preset.name}”.`, result.warnings.length > 0);
  }

  async importSelected() {
    const file = this.fileInput.files?.[0];
    this.fileInput.value = '';
    if (!file) return;
    const result = await this.run(async () => this.manager.importFile(await file.text()));
    if (!result) return;
    this.setStatus(result.warnings.length ? `Imported “${result.preset.name}” with warnings: ${result.warnings.join(' ')}` : `Imported “${result.preset.name}”.`, result.warnings.length > 0);
    await this.refresh();
  }
}
