// Mission 8, étape 3 : infrastructure de traduction (ui/i18n.js) et dictionnaires FR/EN.
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile, readdir} from 'node:fs/promises';
import {join} from 'node:path';
import {fileURLToPath} from 'node:url';

// Import sans DOM : si le module touchait document/navigator/localStorage au chargement, ça casserait ici.
const i18n = await import('../../examples/wam/ui/i18n.js');
const {t, setLanguage, getLanguage, detectLanguage, normalizeLanguage, onLanguageChange, formatNumber, formatDate,
  applyTranslations, hasKey, DICTIONARIES, STORAGE_KEY} = i18n;
const {ApiClient} = await import('../../examples/wam/account/ApiClient.js');
const {ERROR_CODES} = await import('../../server/src/errorCodes.js');

const ROOT = fileURLToPath(new URL('../../', import.meta.url));
const PLURAL_FORMS = new Set(['zero', 'one', 'two', 'few', 'many', 'other']);
const isPlural = (value) => value && typeof value === 'object' && Object.keys(value).every((key) => PLURAL_FORMS.has(key));

/** { 'header.tuner': 'Tuner', 'presets.count': {one, other}, … } : une entrée par texte. */
function flatten(dictionary, prefix = '', out = {}) {
  for (const [key, value] of Object.entries(dictionary)) {
    const path = prefix ? `${prefix}.${key}` : key;
    if (typeof value === 'string' || isPlural(value)) out[path] = value;
    else if (value && typeof value === 'object') flatten(value, path, out);
    else out[path] = value; // valeur invalide : signalée par les tests
  }
  return out;
}
const params = (value) => new Set([...(typeof value === 'string' ? [value] : Object.values(value)).join(' ').matchAll(/\{(\w+)\}/gu)].map(([, name]) => name));
const memoryStorage = (initial = {}) => {
  const data = new Map(Object.entries(initial));
  return {data, getItem: (key) => data.get(key) ?? null, setItem: (key, value) => data.set(key, String(value))};
};

test.afterEach(() => setLanguage('en'));

test('le module s\'importe sans DOM et démarre en anglais', () => {
  assert.equal(globalThis.document, undefined);
  assert.equal(getLanguage(), 'en');
  assert.equal(t('header.tuner'), 'Tuner');
});

test('le français et l\'anglais ont exactement les mêmes clés', () => {
  const en = Object.keys(flatten(DICTIONARIES.en)).sort();
  const fr = Object.keys(flatten(DICTIONARIES.fr)).sort();
  assert.deepEqual(fr.filter((key) => !en.includes(key)), [], 'clés en trop dans fr.js');
  assert.deepEqual(en.filter((key) => !fr.includes(key)), [], 'clés manquantes dans fr.js');
});

test('chaque traduction garde les mêmes paramètres {x}, et aucune valeur n\'est vide', () => {
  const en = flatten(DICTIONARIES.en);
  const fr = flatten(DICTIONARIES.fr);
  for (const [key, value] of Object.entries(en)) {
    for (const [language, text] of [['en', value], ['fr', fr[key]]]) {
      const texts = typeof text === 'string' ? [text] : isPlural(text) ? Object.values(text) : [null];
      for (const item of texts) assert.ok(typeof item === 'string' && item.trim() !== '', `${language} ${key} vide ou invalide`);
    }
    assert.deepEqual([...params(fr[key])].sort(), [...params(value)].sort(), `paramètres différents pour ${key}`);
    if (isPlural(value)) assert.ok(value.other && fr[key].other, `${key} : la forme « other » est obligatoire`);
  }
});

test('chaque t(\'…\') du code et chaque data-i18n du HTML existe dans en.js', async () => {
  const files = [];
  const walk = async (dir) => {
    for (const entry of await readdir(dir, {withFileTypes: true})) {
      const path = join(dir, entry.name);
      if (entry.isDirectory()) { if (!['wamPlugins', 'plugins', 'node_modules', 'fx-test', 'locales'].includes(entry.name)) await walk(path); }
      else if (/\.(m?js|html)$/u.test(entry.name)) files.push(path);
    }
  };
  await walk(join(ROOT, 'examples/wam'));
  const used = new Map();
  for (const file of files) {
    const source = await readFile(file, 'utf8');
    for (const [, key] of source.matchAll(/\bt\(\s*'([\w.]+)'/gu)) used.set(key, file);
    for (const [, key] of source.matchAll(/data-i18n(?:-title|-aria-label|-placeholder)?="([\w.]+)"/gu)) used.set(key, file);
  }
  assert.ok(used.size >= 8, `scan trop maigre (${used.size} clés) : le motif de recherche est cassé`);
  for (const [key, file] of used) assert.ok(hasKey(key, 'en'), `clé absente de en.js : ${key} (${file})`);
});

test('chaque code d\'erreur du serveur a sa traduction en anglais et en français', () => {
  for (const code of ERROR_CODES) {
    assert.ok(hasKey(`errors.server.${code}`, 'en'), `en : errors.server.${code}`);
    assert.ok(hasKey(`errors.server.${code}`, 'fr'), `fr : errors.server.${code}`);
  }
});

test('interpolation et formats dépendant de la langue', () => {
  assert.equal(t('errors.http', {status: 503}), 'Server error (HTTP 503).');
  assert.equal(t('errors.http'), 'Server error (HTTP {status}).', 'un paramètre oublié reste visible');
  setLanguage('fr');
  assert.equal(t('errors.server.auth_password_length', {min: 8, max: 72}), 'Mot de passe : 8 à 72 caractères (les lettres accentuées comptent double).');
  assert.match(formatNumber(1234.5), /^1\s?234,5$/u);
  assert.equal(formatDate('2026-10-09T12:00:00Z', {year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC'}), '9 octobre 2026');
  assert.equal(formatDate('pas une date'), '');
  setLanguage('en');
  assert.equal(formatNumber(1234.5), '1,234.5');
});

test('pluriels : règles de chaque langue (0 est singulier en français, pluriel en anglais)', () => {
  assert.equal(t('presets.count', {count: 1}), '1 preset');
  assert.equal(t('presets.count', {count: 0}), '0 presets');
  assert.equal(t('presets.count', {count: 2}), '2 presets');
  setLanguage('fr');
  assert.equal(t('presets.count', {count: 0}), '0 preset');
  assert.equal(t('presets.count', {count: 1}), '1 preset');
  assert.equal(t('presets.count', {count: 1500}), '1 500 presets');
});

test('repli : clé absente en français → anglais ; clé inconnue → la clé elle-même', () => {
  DICTIONARIES.en.header.onlyInEnglish = 'Only in English';
  try {
    setLanguage('fr');
    assert.equal(t('header.onlyInEnglish'), 'Only in English');
    assert.equal(hasKey('header.onlyInEnglish', 'fr'), false);
  } finally {
    delete DICTIONARIES.en.header.onlyInEnglish;
  }
  assert.equal(t('does.not.exist'), 'does.not.exist');
  assert.equal(t('header'), 'header', 'un groupe de clés n\'est pas un texte');
});

test('détection de la langue : ?lang=, puis choix mémorisé, puis navigateur, puis anglais', () => {
  const saved = memoryStorage({[STORAGE_KEY]: 'fr'});
  assert.equal(detectLanguage({search: '?lang=en', storage: saved, languages: ['fr-FR']}), 'en');
  assert.equal(detectLanguage({search: '?lang=xx', storage: saved, languages: ['en-US']}), 'fr');
  assert.equal(detectLanguage({storage: memoryStorage(), languages: ['de-DE', 'fr-CA', 'en']}), 'fr');
  assert.equal(detectLanguage({languages: ['de', 'es']}), 'en');
  const broken = {getItem() { throw new Error('SecurityError'); }};
  assert.equal(detectLanguage({storage: broken, languages: ['fr']}), 'fr', 'un stockage bloqué ne casse rien');
  assert.equal(normalizeLanguage('FR-fr'), 'fr');
  assert.equal(normalizeLanguage('de'), null);
});

test('setLanguage : mémorise seulement si demandé, prévient les abonnés une fois par vrai changement', () => {
  const storage = memoryStorage();
  const seen = [];
  const stop = onLanguageChange((language) => seen.push(language));
  assert.equal(setLanguage('fr-BE', {storage}), 'fr');
  assert.equal(storage.data.size, 0, 'pas mémorisé sans persist');
  setLanguage('fr', {storage});
  assert.equal(setLanguage('en', {persist: true, storage}), 'en');
  assert.equal(storage.data.get(STORAGE_KEY), 'en');
  assert.equal(setLanguage('klingon'), 'en', 'langue inconnue → anglais');
  stop();
  setLanguage('fr');
  assert.deepEqual(seen, ['fr', 'en']);
});

test('applyTranslations remplit les textes et attributs data-i18n*', () => {
  const node = (dataset, attributes = {}) => ({dataset, textContent: '', attributes, getAttribute: (name) => attributes[name], setAttribute(name, value) { this.attributes[name] = value; }});
  const text = node({i18n: 'header.tuner'});
  const titled = node({}, {'data-i18n-title': 'header.tunerTitle'});
  const root = {querySelectorAll: (selector) => ({'[data-i18n]': [text], '[data-i18n-title]': [titled]}[selector] ?? [])};
  setLanguage('fr');
  applyTranslations(root);
  assert.equal(text.textContent, 'Accordeur');
  assert.equal(titled.attributes.title, 'Ouvrir l\'accordeur');
  applyTranslations(null); // sans DOM : ne fait rien
});

test('ApiClient affiche le message traduit grâce au code, sinon le message du serveur', async () => {
  const reply = (status, body) => new ApiClient({baseUrl: 'http://api', storage: memoryStorage(),
    fetch: async () => ({ok: false, status, text: async () => JSON.stringify(body)})});
  setLanguage('fr');
  const translated = reply(400, {message: 'Password: 8 to 72 characters', code: 'auth_password_length', params: {min: 8, max: 72}});
  await assert.rejects(translated.health(), (error) => error.code === 'auth_password_length' && /^Mot de passe : 8 à 72/u.test(error.message));
  const plural = reply(400, {message: 'Missing asset(s)', code: 'asset_missing', params: {count: 3}});
  await assert.rejects(plural.health(), (error) => /^3 fichiers utilisés/u.test(error.message));
  const unknownCode = reply(418, {message: 'I am a teapot', code: 'teapot'});
  await assert.rejects(unknownCode.health(), (error) => error.message === 'I am a teapot' && error.code === 'teapot');
  const noBody = new ApiClient({baseUrl: 'http://api', storage: memoryStorage(), fetch: async () => ({ok: false, status: 502, text: async () => ''})});
  await assert.rejects(noBody.health(), /Erreur du serveur \(HTTP 502\)/u);
  const down = new ApiClient({baseUrl: 'http://api', storage: memoryStorage(), fetch: async () => { throw new TypeError('Failed to fetch'); }});
  await assert.rejects(down.health(), (error) => error.status === 0 && /Impossible de joindre le serveur \(http:\/\/api\)/u.test(error.message));
});
