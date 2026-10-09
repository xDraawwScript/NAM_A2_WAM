// Fenêtre « Account » de l'hôte (mission 3) : connexion, inscription, profil, déconnexion.
// Même principe que TunerView / PresetView : un <dialog> créé en JavaScript, ouvert par un bouton
// du header qui affiche « Sign in » ou le pseudo de l'utilisateur connecté.

import {bindTabKeys, syncTabs} from '../ui/tabs.js';
import {el} from '../ui/el.js';
import {USERNAME_MIN, USERNAME_MAX, USERNAME_CHARS, PASSWORD_MIN, PASSWORD_MAX} from './accountRules.js';
import {t, localize, applyTranslations, onLanguageChange} from '../ui/i18n.js';
import {errorText} from '../ui/hostMessages.js';

const isLocalApi = (url) => { try { return ['localhost', '127.0.0.1', '[::1]'].includes(new URL(url).hostname); } catch { return false; } };

// USERNAME_HINT (accountRules.js) reste en anglais pour le serveur ; l'interface affiche sa traduction.
const usernameHint = () => t('account.usernameHint', {min: USERNAME_MIN, max: USERNAME_MAX});
const usernameInput = {minlength: String(USERNAME_MIN), maxlength: String(USERNAME_MAX), pattern: `[${USERNAME_CHARS}]{${USERNAME_MIN},${USERNAME_MAX}}`, 'data-username-hint': ''};
const passwordInput = {minlength: String(PASSWORD_MIN), maxlength: String(PASSWORD_MAX)};

export class AccountView {
  constructor({api, button, label, message = () => {}}) {
    Object.assign(this, {api, button, label, message});
    this.mode = 'signin'; // onglet affiché quand on n'est pas connecté : 'signin' | 'register'
    this.busy = false;
    this.build();
    button.setAttribute('aria-controls', this.dialog.id);
    button.setAttribute('aria-expanded', 'false');
    button.disabled = false;
    button.onclick = () => this.open();
    api.addEventListener('change', () => this.render());
    api.addEventListener('expired', () => this.message(t('errors.sessionExpired'), true));
    this.render();
    // Changement de langue : on retraduit sur place (ce que l'utilisateur a tapé reste dans les champs).
    onLanguageChange(() => {
      applyTranslations(this.dialog);
      this.renderHints();
      this.renderStatus();
      this.render();
    });
  }

  build() {
    this.status = el('p', {class: 'presets-status', role: 'status', 'aria-live': 'polite'});
    this.body = el('div', {class: 'account-body'});
    this.server = el('p', {class: 'host-help account-server'});
    this.dialog = el('dialog', {class: 'host-presets host-account', id: 'accountDialog', 'aria-labelledby': 'accountTitle'},
      el('header', {}, localize(el('strong', {id: 'accountTitle'}), {text: 'account.title'}), localize(el('button', {type: 'button', text: '×', onclick: () => this.close()}), {ariaLabel: 'account.close'})),
      this.body, this.status, this.server);
    this.dialog.addEventListener('close', () => this.button.setAttribute('aria-expanded', 'false'));
    document.body.append(this.dialog);
  }

  open() {
    this.button.setAttribute('aria-expanded', 'true');
    this.setStatus('');
    if (!this.dialog.open) this.dialog.showModal();
    this.render();
    this.dialog.querySelector('input')?.focus();
  }

  close() { this.dialog.close(); this.button.focus(); }

  /** `text` peut être une fonction : le statut est alors retraduit au changement de langue. */
  setStatus(text, error = false) {
    this.statusText = text;
    this.status.classList.toggle('error', error);
    this.renderStatus();
  }

  renderStatus() { this.status.textContent = typeof this.statusText === 'function' ? this.statusText() : this.statusText ?? ''; }

  /** Règle du pseudo (infobulle des champs + aide sous le champ), dans la langue courante. */
  renderHints() {
    for (const input of this.dialog.querySelectorAll('[data-username-hint]')) input.title = usernameHint();
    for (const help of this.dialog.querySelectorAll('.account-username-help')) help.textContent = t('account.usernameHelp', {hint: usernameHint()});
  }

  /** Exécute une action réseau : bloque les boutons pendant l'appel et affiche l'erreur éventuelle. */
  async run(action, success) {
    this.busy = true;
    this.render();
    try {
      const result = await action();
      this.setStatus(typeof success === 'function' ? () => success(result) : success || '');
      return result;
    } catch (error) {
      this.setStatus(() => errorText(error), true);
      return null;
    } finally {
      this.busy = false;
      this.render();
    }
  }

  render() {
    const user = this.api.user;
    this.label.textContent = user ? user.username : t('account.signIn');
    this.button.title = user ? t('account.signedInAs', {name: user.username}) : t('account.buttonTitle');
    this.button.classList.toggle('signed-in', Boolean(user));
    this.server.textContent = t(this.api.online === false ? 'account.serverDown' : 'account.server', {url: this.api.baseUrl});
    this.server.classList.toggle('error', this.api.online === false);
    // On ne reconstruit le contenu que si l'écran change (connexion, onglet…) : une erreur ou un
    // appel en cours ne doit pas effacer ce que l'utilisateur a tapé.
    const view = user ? `profile:${user.username}` : this.mode;
    if (view !== this.view) {
      this.view = view;
      this.body.replaceChildren(...(user ? this.profileView(user) : this.signedOutView()));
      this.renderHints();
    }
    // Pendant un appel, tout est bloqué (y compris les onglets) : la réponse arrive sur le bon écran.
    for (const control of this.body.querySelectorAll('input, button')) control.disabled = this.busy;
  }

  signedOutView() {
    // Le contenu est recréé à chaque changement d'onglet : on redonne le focus au nouvel onglet actif.
    const tab = (mode, key) => localize(el('button', {type: 'button', role: 'tab', id: `accountTab-${mode}`, class: `account-tab${this.mode === mode ? ' active' : ''}`, onclick: () => { if (this.mode === mode) return; this.mode = mode; this.setStatus(''); this.render(); this.body.querySelector(`#accountTab-${mode}`)?.focus(); }}), {text: key});
    const field = (key, attributes) => el('label', {class: 'account-field'}, localize(el('span'), {text: key}), el('input', {required: true, ...attributes}));
    const form = this.mode === 'signin'
      ? el('form', {class: 'account-form', id: 'accountTabPanel', onsubmit: (event) => { event.preventDefault(); this.signIn(event.target.elements); }},
        field('account.email', {name: 'email', type: 'email', autocomplete: 'email'}),
        field('account.password', {name: 'password', type: 'password', autocomplete: 'current-password'}),
        localize(el('button', {type: 'submit', class: 'presets-primary'}), {text: 'account.signIn'}),
        // Le compte démo n'existe qu'en développement : l'indice n'est montré qu'avec une API locale.
        isLocalApi(this.api.baseUrl) ? localize(el('p', {class: 'host-help'}), {text: 'account.demo'}) : null)
      : el('form', {class: 'account-form', id: 'accountTabPanel', onsubmit: (event) => { event.preventDefault(); this.register(event.target.elements); }},
        field('account.username', {name: 'username', type: 'text', autocomplete: 'username', ...usernameInput}),
        el('p', {class: 'host-help account-username-help'}),
        field('account.emailPrivate', {name: 'email', type: 'email', autocomplete: 'email'}),
        field('account.password', {name: 'password', type: 'password', autocomplete: 'new-password', ...passwordInput}),
        field('account.confirm', {name: 'confirm', type: 'password', autocomplete: 'new-password', ...passwordInput}),
        localize(el('button', {type: 'submit', class: 'presets-primary'}), {text: 'account.create'}));
    const tabs = [tab('signin', 'account.signIn'), tab('register', 'account.create')];
    const tablist = localize(el('div', {class: 'account-tabs', role: 'tablist'}, ...tabs), {ariaLabel: 'account.tabs'});
    syncTabs(tabs, tabs[this.mode === 'signin' ? 0 : 1], () => form);
    bindTabKeys(tablist);
    return [tablist, form];
  }

  profileView(user) {
    return [
      el('div', {class: 'account-profile'},
        el('span', {class: 'account-avatar', 'aria-hidden': 'true', text: user.username.slice(0, 1).toUpperCase()}),
        el('div', {}, el('strong', {text: user.username}), el('span', {class: 'host-help', text: user.email}))),
      el('form', {class: 'account-form', onsubmit: (event) => { event.preventDefault(); this.rename(event.target.elements.username.value); }},
        el('label', {class: 'account-field'}, localize(el('span'), {text: 'account.changeUsername'}),
          el('input', {name: 'username', type: 'text', required: true, value: user.username, ...usernameInput})),
        localize(el('button', {type: 'submit'}), {text: 'account.saveUsername'})),
      localize(el('button', {type: 'button', class: 'presets-danger account-signout', onclick: () => this.signOut()}), {text: 'account.signOut'}),
    ];
  }

  async signIn(fields) {
    const user = await this.run(() => this.api.login({email: fields.email.value, password: fields.password.value}), (signed) => t('account.welcomeBack', {name: signed.username}));
    if (user) this.message(t('account.signedInAs', {name: user.username}));
  }

  async register(fields) {
    if (fields.password.value !== fields.confirm.value) { this.setStatus(() => t('account.mismatch'), true); return; }
    const user = await this.run(() => this.api.register({username: fields.username.value.trim(), email: fields.email.value, password: fields.password.value}), (created) => t('account.created', {name: created.username}));
    if (user) this.message(t('account.signedInAs', {name: user.username}));
  }

  async rename(username) {
    await this.run(() => this.api.updateProfile({username: username.trim()}), (user) => t('account.renamed', {name: user.username}));
  }

  signOut() {
    this.api.logout();
    this.mode = 'signin';
    this.setStatus(() => t('account.signedOut'));
    this.message(t('account.signedOutToast'));
  }
}
