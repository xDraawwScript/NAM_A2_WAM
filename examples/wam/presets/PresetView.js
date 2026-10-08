// Fenêtre « Presets » de l'hôte (mission 1, mode invité : presets stockés dans ce navigateur).
// Même principe que TunerView.js : un <dialog> créé en JavaScript, ouvert par un bouton du header.
// Les textes venant de l'utilisateur (noms, tags…) sont toujours insérés avec textContent,
// jamais avec innerHTML, pour éviter toute injection de HTML.

import {presetFileName} from './PresetFile.js';

const el = (tag, attributes = {}, ...children) => {
  const node = document.createElement(tag);
  for (const [key, value] of Object.entries(attributes)) {
    if (key === 'class') node.className = value;
    else if (key === 'text') node.textContent = value;
    else if (key.startsWith('on')) node.addEventListener(key.slice(2), value);
    else if (value === true) node.setAttribute(key, '');
    else if (value !== false && value != null) node.setAttribute(key, value);
  }
  node.append(...children.filter(Boolean));
  return node;
};

const formatDate = (iso) => {
  try { return new Date(iso).toLocaleString('en-GB', {dateStyle: 'medium', timeStyle: 'short'}); } catch { return ''; }
};

const describe = (summary = {}) => [
  summary.amp && `Amp: ${summary.amp}`,
  summary.cabinet && `Cab: ${summary.cabinet}`,
  summary.effects?.length ? `${summary.effects.length} effect${summary.effects.length > 1 ? 's' : ''}: ${summary.effects.join(', ')}` : 'No effect',
  summary.chains === 2 && 'Chains A + B',
].filter(Boolean).join(' · ');

export class PresetView {
  constructor({manager, button, label, message = () => {}}) {
    Object.assign(this, {manager, button, label, message});
    this.presets = [];
    this.filter = '';
    this.renaming = null;
    this.build();
    button.setAttribute('aria-controls', this.dialog.id);
    button.setAttribute('aria-expanded', 'false');
    button.disabled = false;
    button.onclick = () => this.open();
    manager.addEventListener('change', () => this.renderCurrent());
    this.renderCurrent();
  }

  build() {
    this.status = el('p', {class: 'presets-status', role: 'status', 'aria-live': 'polite'});
    this.currentName = el('strong', {text: 'None'});
    this.modified = el('span', {class: 'presets-modified', text: '• modified', hidden: true});
    this.nameInput = el('input', {name: 'name', type: 'text', maxlength: '80', required: true, placeholder: 'Preset name', autocomplete: 'off', 'aria-label': 'Preset name'});
    this.tagsInput = el('input', {name: 'tags', type: 'text', maxlength: '200', placeholder: 'Tags, comma separated (optional)', autocomplete: 'off', 'aria-label': 'Tags'});
    this.overwriteButton = el('button', {type: 'button', class: 'presets-overwrite', hidden: true, onclick: () => this.overwrite()});
    this.saveForm = el('form', {class: 'presets-save', onsubmit: (event) => { event.preventDefault(); this.saveAs(); }},
      this.nameInput, this.tagsInput,
      el('div', {class: 'presets-save-actions'}, el('button', {type: 'submit', class: 'presets-primary', text: 'Save as new preset'}), this.overwriteButton));
    this.search = el('input', {type: 'search', placeholder: 'Filter my presets', 'aria-label': 'Filter presets', oninput: () => { this.filter = this.search.value; this.renderList(); }});
    this.fileInput = el('input', {type: 'file', accept: '.json,application/json', hidden: true, onchange: () => this.importSelected()});
    this.list = el('ul', {class: 'presets-list', 'aria-label': 'My presets'});
    this.dialog = el('dialog', {class: 'host-presets', id: 'presetsDialog', 'aria-labelledby': 'presetsTitle'},
      el('header', {}, el('strong', {id: 'presetsTitle', text: 'Presets'}), el('button', {type: 'button', 'aria-label': 'Close presets', text: '×', onclick: () => this.close()})),
      el('p', {class: 'presets-current'}, 'Current sound: ', this.currentName, ' ', this.modified),
      this.saveForm,
      el('div', {class: 'presets-toolbar'}, this.search,
        el('button', {type: 'button', text: 'Import file…', onclick: () => this.fileInput.click()}), this.fileInput),
      this.list,
      this.status,
      el('p', {class: 'host-help presets-note', text: 'Guest mode: presets are stored in this browser only (they can be erased with the browser data and are not shared between devices). Use Export to keep a backup file.'}));
    this.dialog.addEventListener('close', () => this.button.setAttribute('aria-expanded', 'false'));
    document.body.append(this.dialog);
  }

  async open() {
    this.button.setAttribute('aria-expanded', 'true');
    if (!this.dialog.open) this.dialog.showModal();
    this.setStatus('');
    await this.refresh();
    this.nameInput.focus();
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

  async refresh() {
    const presets = await this.run(() => this.manager.list());
    if (presets) this.presets = presets;
    this.renderList();
  }

  renderCurrent() {
    const {current, dirty, busy} = this.manager;
    this.currentName.textContent = current?.name || 'None (unsaved)';
    this.modified.hidden = !(current && dirty);
    this.overwriteButton.hidden = !current;
    this.overwriteButton.textContent = current ? `Update “${current.name}”` : '';
    if (this.label) this.label.textContent = current ? `${current.name}${dirty ? ' •' : ''}` : '';
    this.dialog.classList.toggle('busy', busy);
    for (const control of this.dialog.querySelectorAll('button, input')) if (!control.matches('[aria-label="Close presets"]')) control.disabled = busy;
  }

  renderList() {
    const query = this.filter.trim().toLocaleLowerCase('en-US');
    const visible = this.presets.filter((preset) => !query || [preset.name, ...(preset.tags || []), describe(preset.summary)].join(' ').toLocaleLowerCase('en-US').includes(query));
    if (!visible.length) {
      this.list.replaceChildren(el('li', {class: 'presets-empty', text: this.presets.length ? 'No preset matches this filter.' : 'No preset yet. Shape your sound, give it a name and click “Save as new preset”.'}));
      return;
    }
    this.list.replaceChildren(...visible.map((preset) => this.renderItem(preset)));
  }

  renderItem(preset) {
    const isCurrent = this.manager.current?.id === preset.id;
    const title = this.renaming === preset.id
      ? el('form', {class: 'presets-rename', onsubmit: (event) => { event.preventDefault(); this.rename(preset.id, event.target.elements.name.value); }},
        el('input', {name: 'name', type: 'text', maxlength: '80', required: true, value: preset.name, 'aria-label': 'New name'}),
        el('button', {type: 'submit', text: 'OK'}), el('button', {type: 'button', text: 'Cancel', onclick: () => { this.renaming = null; this.renderList(); }}))
      : el('strong', {class: 'presets-name', text: preset.name});
    return el('li', {class: `presets-item${isCurrent ? ' current' : ''}`},
      el('div', {class: 'presets-info'},
        title,
        el('span', {class: 'presets-summary', text: describe(preset.summary)}),
        preset.tags?.length ? el('span', {class: 'presets-tags'}, ...preset.tags.map((tag) => el('span', {class: 'presets-tag', text: tag}))) : null,
        el('span', {class: 'presets-date', text: `Updated ${formatDate(preset.updatedAt)}`})),
      el('div', {class: 'presets-actions'},
        el('button', {type: 'button', class: 'presets-primary', text: 'Load', 'aria-label': `Load ${preset.name}`, onclick: () => this.load(preset)}),
        el('button', {type: 'button', text: 'Rename', 'aria-label': `Rename ${preset.name}`, onclick: () => { this.renaming = preset.id; this.renderList(); this.list.querySelector('.presets-rename input')?.select(); }}),
        el('button', {type: 'button', text: 'Export', 'aria-label': `Export ${preset.name}`, onclick: () => this.export(preset)}),
        el('button', {type: 'button', class: 'presets-danger', text: 'Delete', 'aria-label': `Delete ${preset.name}`, onclick: () => this.remove(preset)})));
  }

  tags() { return this.tagsInput.value.split(',').map((tag) => tag.trim()).filter(Boolean); }

  async saveAs() {
    const saved = await this.run(() => this.manager.saveAs({name: this.nameInput.value, tags: this.tags()}), (preset) => `Saved “${preset.name}”.`);
    if (!saved) return;
    this.nameInput.value = '';
    this.tagsInput.value = '';
    this.message(`Preset saved: ${saved.name}`);
    await this.refresh();
  }

  async overwrite() {
    const current = this.manager.current;
    if (!current || !confirm(`Replace “${current.name}” with the current sound?`)) return;
    const saved = await this.run(() => this.manager.overwrite(current.id), (preset) => `Updated “${preset.name}”.`);
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

  async remove(preset) {
    if (!confirm(`Delete “${preset.name}”? This cannot be undone (export it first to keep a copy).`)) return;
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
