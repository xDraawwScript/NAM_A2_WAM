// Client HTTP de l'API du projet (server/, voir server/API_CONTRACT.md) — mission 3.
//
// Rôle : garder la session (jeton JWT + profil), ajouter l'en-tête `Authorization: Bearer …` aux
// requêtes, transformer les réponses d'erreur en exceptions lisibles, et prévenir l'interface
// (événement 'change') quand on se connecte, se déconnecte ou que la session expire.
//
// La session est gardée dans le localStorage pour rester connecté après un rechargement de la
// page. Elle ne contient que le jeton et le profil (pseudo, email), jamais le mot de passe.
// Compromis assumé : un script malveillant exécuté sur la page pourrait lire ce jeton (XSS). On
// limite le risque : aucun HTML venant de l'utilisateur n'est interprété (textContent), le jeton
// expire après 12 h et ne donne accès qu'aux presets. Un cookie HttpOnly serait plus sûr mais
// demanderait que la page et l'API soient servies par la même origine.
// `fetch`, `storage` et `now` sont injectables : les tests utilisent des versions simulées.

export const SESSION_KEY = 'nam-a2-wam.session';

/** Erreur d'appel à l'API : `status` = code HTTP (0 = serveur injoignable). */
export class ApiError extends Error {
  constructor(status, message) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

/**
 * Date d'expiration d'un JWT (en ms), lue dans sa partie centrale (payload, encodée en base64url).
 * Un JWT est signé mais pas chiffré : le navigateur peut lire `exp` sans connaître le secret.
 */
export function tokenExpiry(token) {
  try {
    const payload = token.split('.')[1].replace(/-/gu, '+').replace(/_/gu, '/');
    const {exp} = JSON.parse(atob(payload.padEnd(Math.ceil(payload.length / 4) * 4, '=')));
    return Number.isFinite(exp) ? exp * 1000 : null;
  } catch {
    return null;
  }
}

export class ApiClient extends EventTarget {
  constructor({baseUrl, fetch = globalThis.fetch?.bind(globalThis), storage = safeLocalStorage(), now = () => Date.now()}) {
    super();
    if (!baseUrl) throw new Error('API base URL is not configured (config.js → api.baseUrl)');
    Object.assign(this, {baseUrl: String(baseUrl).replace(/\/+$/u, ''), fetchImpl: fetch, storage, now});
    this.session = this.readSession();
    this.online = null; // null = inconnu, true/false après le premier appel
  }

  // --- Session -------------------------------------------------------------------------------

  readSession() {
    try {
      const session = JSON.parse(this.storage?.getItem(SESSION_KEY) || 'null');
      if (!session?.token || !session?.user) return null;
      const expiry = tokenExpiry(session.token);
      if (expiry !== null && expiry <= this.now()) { this.storage?.removeItem(SESSION_KEY); return null; }
      return session;
    } catch {
      return null;
    }
  }

  writeSession(session) {
    this.session = session;
    try {
      if (session) this.storage?.setItem(SESSION_KEY, JSON.stringify(session));
      else this.storage?.removeItem(SESSION_KEY);
    } catch { /* stockage indisponible (navigation privée) : la session reste en mémoire */ }
    this.dispatchEvent(new Event('change'));
  }

  get user() { return this.session?.user || null; }
  get loggedIn() { return Boolean(this.session); }

  // --- Requêtes ------------------------------------------------------------------------------

  /**
   * Appel JSON générique. `auth: true` exige d'être connecté ; sinon le jeton est envoyé s'il
   * existe. Une réponse 401 sur une requête authentifiée = session expirée → déconnexion.
   */
  async request(path, {method = 'GET', body, auth = false} = {}) {
    if (auth && !this.session) throw new ApiError(401, 'Please sign in first');
    const headers = {};
    if (body !== undefined) headers['Content-Type'] = 'application/json';
    if (this.session) headers.Authorization = `Bearer ${this.session.token}`;
    let response;
    try {
      response = await this.fetchImpl(`${this.baseUrl}${path}`, {method, headers, body: body === undefined ? undefined : JSON.stringify(body)});
    } catch {
      this.setOnline(false);
      throw new ApiError(0, `Cannot reach the server (${this.baseUrl}). Is the backend running?`);
    }
    this.setOnline(true);
    const text = method === 'HEAD' ? '' : await response.text();
    let data = null;
    try { data = text ? JSON.parse(text) : null; } catch { data = null; }
    if (!response.ok) {
      if (response.status === 401 && this.session && auth) {
        this.writeSession(null);
        this.dispatchEvent(new Event('expired'));
        throw new ApiError(401, 'Your session has expired. Please sign in again.');
      }
      throw new ApiError(response.status, data?.message || `Server error (HTTP ${response.status})`);
    }
    return data;
  }

  setOnline(online) {
    if (this.online === online) return;
    this.online = online;
    this.dispatchEvent(new Event('change'));
  }

  // --- Comptes -------------------------------------------------------------------------------

  async register({username, email, password}) {
    const {token, user} = await this.request('/auth/register', {method: 'POST', body: {username, email, password}});
    this.writeSession({token, user});
    return user;
  }

  async login({email, password}) {
    const {token, user} = await this.request('/auth/login', {method: 'POST', body: {email, password}});
    this.writeSession({token, user});
    return user;
  }

  logout() { this.writeSession(null); }

  /** Vérifie la session auprès du serveur (au démarrage) et met le profil à jour. */
  async refresh() {
    if (!this.session) return null;
    const token = this.session.token;
    try {
      const user = await this.request('/users/me', {auth: true});
      this.updateUser(token, user);
      return user;
    } catch (error) {
      if (error.status === 0) return this.user; // serveur injoignable : on garde la session locale
      throw error;
    }
  }

  async updateProfile({username}) {
    const token = this.session?.token;
    const user = await this.request('/users/me', {method: 'PUT', body: {username}, auth: true});
    this.updateUser(token, user);
    return user;
  }

  /**
   * Met à jour le profil seulement si la session n'a pas changé pendant la requête : si
   * l'utilisateur s'est déconnecté (ou reconnecté) entre-temps, la réponse est ignorée.
   */
  updateUser(token, user) {
    if (this.session?.token === token) this.writeSession({...this.session, user});
  }

  health() { return this.request('/health'); }
}

function safeLocalStorage() {
  try { return globalThis.localStorage ?? null; } catch { return null; }
}
