// Fenêtre « Account » de l'hôte (mission 3) : connexion, inscription, profil, déconnexion.
// Même principe que TunerView / PresetView : un <dialog> créé en JavaScript, ouvert par un bouton
// du header qui affiche « Sign in » ou le pseudo de l'utilisateur connecté.

import {el} from '../ui/el.js';
import {USERNAME_MIN, USERNAME_MAX, USERNAME_CHARS, USERNAME_HINT, PASSWORD_MIN, PASSWORD_MAX} from './accountRules.js';

const usernameInput = {minlength: String(USERNAME_MIN), maxlength: String(USERNAME_MAX), pattern: `[${USERNAME_CHARS}]{${USERNAME_MIN},${USERNAME_MAX}}`, title: USERNAME_HINT};
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
    api.addEventListener('expired', () => this.message('Your session has expired. Please sign in again.', true));
    this.render();
  }

  build() {
    this.status = el('p', {class: 'presets-status', role: 'status', 'aria-live': 'polite'});
    this.body = el('div', {class: 'account-body'});
    this.server = el('p', {class: 'host-help account-server'});
    this.dialog = el('dialog', {class: 'host-presets host-account', id: 'accountDialog', 'aria-labelledby': 'accountTitle'},
      el('header', {}, el('strong', {id: 'accountTitle', text: 'Account'}), el('button', {type: 'button', 'aria-label': 'Close account', text: '×', onclick: () => this.close()})),
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

  setStatus(text, error = false) {
    this.status.textContent = text;
    this.status.classList.toggle('error', error);
  }

  /** Exécute une action réseau : bloque les boutons pendant l'appel et affiche l'erreur éventuelle. */
  async run(action, success) {
    this.busy = true;
    this.render();
    try {
      const result = await action();
      this.setStatus(typeof success === 'function' ? success(result) : success || '');
      return result;
    } catch (error) {
      this.setStatus(error.message, true);
      return null;
    } finally {
      this.busy = false;
      this.render();
    }
  }

  render() {
    const user = this.api.user;
    this.label.textContent = user ? user.username : 'Sign in';
    this.button.title = user ? `Signed in as ${user.username}` : 'Sign in or create an account';
    this.button.classList.toggle('signed-in', Boolean(user));
    this.server.textContent = `Server: ${this.api.baseUrl}${this.api.online === false ? ' — unreachable' : ''}`;
    this.server.classList.toggle('error', this.api.online === false);
    // On ne reconstruit le contenu que si l'écran change (connexion, onglet…) : une erreur ou un
    // appel en cours ne doit pas effacer ce que l'utilisateur a tapé.
    const view = user ? `profile:${user.username}` : this.mode;
    if (view !== this.view) {
      this.view = view;
      this.body.replaceChildren(...(user ? this.profileView(user) : this.signedOutView()));
    }
    // Pendant un appel, tout est bloqué (y compris les onglets) : la réponse arrive sur le bon écran.
    for (const control of this.body.querySelectorAll('input, button')) control.disabled = this.busy;
  }

  signedOutView() {
    const tab = (mode, text) => el('button', {type: 'button', role: 'tab', class: `account-tab${this.mode === mode ? ' active' : ''}`, 'aria-selected': String(this.mode === mode), text, onclick: () => { this.mode = mode; this.setStatus(''); this.render(); }});
    const field = (label, attributes) => el('label', {class: 'account-field'}, el('span', {text: label}), el('input', {required: true, ...attributes}));
    const form = this.mode === 'signin'
      ? el('form', {class: 'account-form', onsubmit: (event) => { event.preventDefault(); this.signIn(event.target.elements); }},
        field('Email', {name: 'email', type: 'email', autocomplete: 'email'}),
        field('Password', {name: 'password', type: 'password', autocomplete: 'current-password'}),
        el('button', {type: 'submit', class: 'presets-primary', text: 'Sign in'}),
        el('p', {class: 'host-help', text: 'Demo account: demo@example.com / Demo1234!'}))
      : el('form', {class: 'account-form', onsubmit: (event) => { event.preventDefault(); this.register(event.target.elements); }},
        field('Username (public)', {name: 'username', type: 'text', autocomplete: 'username', ...usernameInput}),
        el('p', {class: 'host-help', text: `${USERNAME_HINT}. Shown as the author of your public presets.`}),
        field('Email (private, used to sign in)', {name: 'email', type: 'email', autocomplete: 'email'}),
        field('Password', {name: 'password', type: 'password', autocomplete: 'new-password', ...passwordInput}),
        field('Confirm password', {name: 'confirm', type: 'password', autocomplete: 'new-password', ...passwordInput}),
        el('button', {type: 'submit', class: 'presets-primary', text: 'Create account'}));
    return [el('div', {class: 'account-tabs', role: 'tablist'}, tab('signin', 'Sign in'), tab('register', 'Create account')), form];
  }

  profileView(user) {
    return [
      el('div', {class: 'account-profile'},
        el('span', {class: 'account-avatar', 'aria-hidden': 'true', text: user.username.slice(0, 1).toUpperCase()}),
        el('div', {}, el('strong', {text: user.username}), el('span', {class: 'host-help', text: user.email}))),
      el('form', {class: 'account-form', onsubmit: (event) => { event.preventDefault(); this.rename(event.target.elements.username.value); }},
        el('label', {class: 'account-field'}, el('span', {text: 'Change username'}),
          el('input', {name: 'username', type: 'text', required: true, value: user.username, ...usernameInput})),
        el('button', {type: 'submit', text: 'Save username'})),
      el('button', {type: 'button', class: 'presets-danger account-signout', text: 'Sign out', onclick: () => this.signOut()}),
    ];
  }

  async signIn(fields) {
    const user = await this.run(() => this.api.login({email: fields.email.value, password: fields.password.value}), (signed) => `Welcome back, ${signed.username}!`);
    if (user) this.message(`Signed in as ${user.username}`);
  }

  async register(fields) {
    if (fields.password.value !== fields.confirm.value) { this.setStatus('The two passwords are different.', true); return; }
    const user = await this.run(() => this.api.register({username: fields.username.value.trim(), email: fields.email.value, password: fields.password.value}), (created) => `Account created. Welcome, ${created.username}!`);
    if (user) this.message(`Signed in as ${user.username}`);
  }

  async rename(username) {
    await this.run(() => this.api.updateProfile({username: username.trim()}), (user) => `Username changed to ${user.username}.`);
  }

  signOut() {
    this.api.logout();
    this.mode = 'signin';
    this.setStatus('You are signed out.');
    this.message('Signed out');
  }
}
