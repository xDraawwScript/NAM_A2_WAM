// Traduction de l'interface de l'hôte (mission 8, étape 3).
//
// - t('errors.http', {status: 503}) renvoie le texte dans la langue courante, avec {status} remplacé ;
//   une clé absente en français retombe sur l'anglais, puis sur la clé elle-même.
// - Pluriels : une valeur { one: '…', other: '…' } + le paramètre `count` ; la bonne forme est
//   choisie par Intl.PluralRules (en français, 0 et 1 sont au singulier, en anglais seul 1 l'est).
// - formatDate / formatNumber : dates et nombres au format de la langue (Intl).
// - setLanguage('fr') change la langue, met à jour <html lang> et prévient les vues abonnées
//   avec onLanguageChange(). On n'utilise pas l'événement `languagechange` de window : le
//   navigateur l'émet déjà quand la langue du système change.
// - applyTranslations(root) remplit les attributs data-i18n* du HTML statique.
//
// Le module ne touche ni au DOM, ni à navigator, ni au localStorage au chargement : il s'importe
// dans Node (tests) et la langue par défaut est l'anglais. Tout accès au navigateur est dans des
// fonctions appelées explicitement (initLanguage, setLanguage, applyTranslations).

import en from './locales/en.js';
import fr from './locales/fr.js';

export const DICTIONARIES = Object.freeze({en, fr});
export const LANGUAGES = Object.freeze(Object.keys(DICTIONARIES));
export const DEFAULT_LANGUAGE = 'en';
/** Clé du choix mémorisé. Elle vit dans ui/ uniquement : les presets n'en dépendent pas. */
export const STORAGE_KEY = 'nam-a2-lang';

let current = DEFAULT_LANGUAGE;
const listeners = new Set();

/** 'fr-FR', 'FR', ' fr ' → 'fr' ; langue non gérée → null. */
export function normalizeLanguage(value) {
  const base = String(value ?? '').trim().toLowerCase().split(/[-_]/u)[0];
  return LANGUAGES.includes(base) ? base : null;
}

export function getLanguage() { return current; }

function lookup(dictionary, key) {
  let node = dictionary;
  for (const part of String(key).split('.')) {
    if (node === null || typeof node !== 'object' || !Object.hasOwn(node, part)) return undefined;
    node = node[part];
  }
  return node;
}

/** Vrai si la clé existe (dans la langue donnée, sans repli). */
export function hasKey(key, language = current) {
  return lookup(DICTIONARIES[language], key) !== undefined;
}

function pluralForm(value, count, language) {
  if (value === null || typeof value !== 'object') return value;
  const category = new Intl.PluralRules(language).select(Number(count));
  return value[category] ?? value.other;
}

export function formatNumber(value, options = {}) {
  return new Intl.NumberFormat(current, options).format(value);
}

export function formatDate(value, options = {dateStyle: 'medium'}) {
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? '' : new Intl.DateTimeFormat(current, options).format(date);
}

/**
 * Texte traduit. Les paramètres numériques sont formatés selon la langue (1 234,5 en français).
 * Un paramètre absent laisse {nom} visible : l'oubli se voit au lieu de disparaître.
 */
export function t(key, params = {}) {
  let value = lookup(DICTIONARIES[current], key);
  let language = current;
  if (value === undefined) { value = lookup(DICTIONARIES[DEFAULT_LANGUAGE], key); language = DEFAULT_LANGUAGE; }
  if (value !== null && typeof value === 'object' && params.count !== undefined) value = pluralForm(value, params.count, language);
  if (typeof value !== 'string') return String(key);
  return value.replace(/\{(\w+)\}/gu, (match, name) => {
    if (!Object.hasOwn(params, name)) return match;
    const param = params[name];
    return typeof param === 'number' ? formatNumber(param) : String(param);
  });
}

/** Abonnement au changement de langue ; renvoie la fonction de désabonnement. */
export function onLanguageChange(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/**
 * Change la langue. `persist` : mémoriser le choix (vrai quand l'utilisateur clique FR/EN).
 * Renvoie la langue réellement appliquée (une langue inconnue donne l'anglais).
 */
export function setLanguage(language, {persist = false, storage = safeStorage()} = {}) {
  const next = normalizeLanguage(language) ?? DEFAULT_LANGUAGE;
  if (persist) {
    try { storage?.setItem(STORAGE_KEY, next); } catch { /* stockage indisponible : choix gardé pour la session */ }
  }
  const changed = next !== current;
  current = next;
  if (globalThis.document?.documentElement) globalThis.document.documentElement.lang = next;
  if (changed) for (const listener of [...listeners]) listener(next);
  return next;
}

/**
 * Langue de départ, par ordre de priorité : ?lang= dans l'URL, choix mémorisé, langues du
 * navigateur, anglais. Fonction pure : les tests lui passent des valeurs simulées.
 */
export function detectLanguage({search = '', storage = null, languages = []} = {}) {
  const fromUrl = normalizeLanguage(new URLSearchParams(search).get('lang'));
  if (fromUrl) return fromUrl;
  let saved = null;
  try { saved = normalizeLanguage(storage?.getItem(STORAGE_KEY)); } catch { saved = null; }
  if (saved) return saved;
  for (const language of languages ?? []) {
    const supported = normalizeLanguage(language);
    if (supported) return supported;
  }
  return DEFAULT_LANGUAGE;
}

/** À appeler au démarrage de la page : détecte et applique la langue (sans la mémoriser). */
export function initLanguage() {
  const nav = globalThis.navigator;
  return setLanguage(detectLanguage({
    search: globalThis.location?.search ?? '',
    storage: safeStorage(),
    languages: nav?.languages?.length ? nav.languages : [nav?.language],
  }));
}

/** « −12,5 dB » : une décimale, au format de la langue ; −∞ sous le plancher. */
export function formatDb(value, {floor = -Infinity, unit = 'dB'} = {}) {
  const number = Number(value);
  if (!Number.isFinite(number) || number <= floor) return `−∞ ${unit}`;
  return `${dbFormat().format(number)} ${unit}`;
}

// formatDb sert aussi aux vumètres (60 fois par seconde) : un formateur par langue, réutilisé.
const dbFormats = new Map();
function dbFormat() {
  if (!dbFormats.has(current)) dbFormats.set(current, new Intl.NumberFormat(current, {minimumFractionDigits: 1, maximumFractionDigits: 1}));
  return dbFormats.get(current);
}

const ATTRIBUTES = [['data-i18n-title', 'title'], ['data-i18n-aria-label', 'aria-label'], ['data-i18n-placeholder', 'placeholder']];

function readParams(node) {
  try { return JSON.parse(node.getAttribute('data-i18n-params') || '{}'); } catch { return {}; }
}

/**
 * Remplit le HTML : data-i18n → texte, data-i18n-title / -aria-label / -placeholder → attributs,
 * avec les paramètres de data-i18n-params (JSON) s'il y en a. data-i18n remplace tout le texte du
 * nœud : il ne se met que sur un élément sans enfant (un <span> autour du texte sinon).
 */
export function applyTranslations(root = globalThis.document) {
  if (!root?.querySelectorAll) return;
  for (const node of root.querySelectorAll('[data-i18n]')) node.textContent = t(node.getAttribute('data-i18n'), readParams(node));
  for (const [data, attribute] of ATTRIBUTES) {
    for (const node of root.querySelectorAll(`[${data}]`)) node.setAttribute(attribute, t(node.getAttribute(data), readParams(node)));
  }
}

/**
 * Traduit un élément créé en JavaScript ET le marque pour qu'il suive les changements de langue
 * (applyTranslations le retraduit) : localize(button, {text: 'rack.mute', title: 'rack.muteChain'}, {lane: 'B'}).
 * Clés possibles : text, title, ariaLabel, placeholder. Renvoie l'élément.
 */
export function localize(node, keys, params = null) {
  if (params) node.setAttribute('data-i18n-params', JSON.stringify(params));
  else node.removeAttribute('data-i18n-params');
  const values = params ?? {};
  for (const [name, key] of Object.entries(keys)) {
    if (name === 'text') { node.setAttribute('data-i18n', key); node.textContent = t(key, values); continue; }
    const attribute = {title: 'title', ariaLabel: 'aria-label', placeholder: 'placeholder'}[name];
    if (!attribute) throw new Error(`localize: unknown target ${name}`);
    node.setAttribute(`data-i18n-${attribute}`, key);
    node.setAttribute(attribute, t(key, values));
  }
  return node;
}

function safeStorage() {
  try { return globalThis.localStorage ?? null; } catch { return null; }
}
