// Mission 8, étape 5 : tous les textes de l'hôte passent par la traduction (ui/i18n.js).
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile, readdir} from 'node:fs/promises';
import {join} from 'node:path';
import {fileURLToPath} from 'node:url';

const {t, setLanguage, hasKey, formatDb, localize} = await import('../../examples/wam/ui/i18n.js');
const {KNOWN_MESSAGES, KNOWN_PATTERNS, localizeMessage, errorText} = await import('../../examples/wam/ui/hostMessages.js');
const {PresetError, validatePreset} = await import('../../examples/wam/presets/PresetFormat.js');
const {describe} = await import('../../examples/wam/presets/presetText.js');

const ROOT = fileURLToPath(new URL('../../', import.meta.url));
const HOST = join(ROOT, 'examples/wam');
const read = (path) => readFile(join(ROOT, path), 'utf8');
// Code de l'hôte (pas les plugins, pas la page de test fx-test, pas les dictionnaires).
async function hostSources() {
  const files = [];
  const walk = async (dir) => {
    for (const entry of await readdir(dir, {withFileTypes: true})) {
      const path = join(dir, entry.name);
      if (entry.isDirectory()) { if (!['wamPlugins', 'plugins', 'node_modules', 'fx-test', 'locales', 'vendor', 'assets'].includes(entry.name)) await walk(path); }
      else if (/\.m?js$/u.test(entry.name) && entry.name !== 'hostMessages.js') files.push(path);
    }
  };
  await walk(HOST);
  return Promise.all(files.map(async (file) => [file, await readFile(file, 'utf8')]));
}

test.afterEach(() => setLanguage('en'));

test('chaque message anglais traduit par hostMessages existe vraiment dans le code (sinon la traduction est morte)', async () => {
  const sources = (await hostSources()).map(([, source]) => source).join('\n');
  for (const [message, key] of Object.entries(KNOWN_MESSAGES)) {
    assert.ok(sources.includes(`'${message}'`) || sources.includes(`"${message}"`) || sources.includes(`\`${message}\``), `message introuvable dans le code : ${message}`);
    assert.ok(hasKey(key, 'en') && hasKey(key, 'fr'), `clé manquante : ${key}`);
  }
  for (const [pattern, key] of KNOWN_PATTERNS) {
    const fixed = pattern.source.replace(/^\^/u, '').split(/\\\(|\(\.\+\)|\(\\d\+\)/u)[0].replaceAll('\\', '');
    assert.ok(sources.includes(fixed), `début de message introuvable : ${fixed}`);
    assert.ok(hasKey(key, 'en') && hasKey(key, 'fr'), `clé manquante : ${key}`);
  }
});

test('localizeMessage et errorText : message connu traduit, inconnu laissé tel quel', () => {
  setLanguage('fr');
  assert.equal(localizeMessage('Enable live input'), 'Activer l\'entrée live');
  assert.match(localizeMessage('Backing track catalogue: HTTP 404'), /HTTP 404/u);
  assert.doesNotMatch(localizeMessage('Backing track catalogue: HTTP 404'), /^Backing track catalogue:/u);
  assert.equal(localizeMessage('Something new'), 'Something new');
  assert.equal(errorText(new PresetError('Preset name is limited to 80 characters', 'nameTooLong', {max: 80})), 'Le nom du preset est limité à 80 caractères.');
  assert.equal(errorText(Object.assign(new Error('Permission denied'), {name: 'NotAllowedError'})), t('engine.permissionDenied'));
  assert.equal(errorText(Object.assign(new Error('Déjà traduit par ApiClient'), {code: 'auth_password_length'})), 'Déjà traduit par ApiClient', 'un code serveur n\'est pas un code de preset');
  assert.equal(errorText('texte brut'), 'texte brut');
});

test('preset refusé par le serveur : le détail est traduit grâce à detailCode', async () => {
  const {serverErrorMessage} = await import('../../examples/wam/account/ApiClient.js');
  const body = {message: 'Chain A is missing or invalid', code: 'preset_invalid', params: {detail: 'Chain A is missing or invalid', detailCode: 'chainAInvalid', detailParams: {}}};
  setLanguage('fr');
  assert.equal(serverErrorMessage(400, body), 'Ce preset est invalide : La chaîne A manque ou est invalide dans ce preset.');
  // Ancien serveur (sans detailCode) ou code inconnu : le détail anglais reste affiché.
  assert.equal(serverErrorMessage(400, {...body, params: {detail: 'Chain A is missing or invalid'}}), 'Ce preset est invalide : Chain A is missing or invalid');
  assert.equal(serverErrorMessage(400, {...body, params: {detail: 'X', detailCode: 'nope'}}), 'Ce preset est invalide : X');
});

test('PresetError : le message reste anglais (serveur, tests) et le code donne la traduction', () => {
  assert.throws(() => validatePreset({}), (error) => error instanceof PresetError && /^[A-Z][a-z]/u.test(error.message) && hasKey(`errors.preset.${error.code}`, 'fr'));
});

/** Les appels « new PresetError(…) » complets (parenthèses équilibrées : un message peut contenir « (s) »). */
function presetErrorCalls(source) {
  const calls = [];
  for (let start = source.indexOf('new PresetError('); start !== -1; start = source.indexOf('new PresetError(', start + 1)) {
    let depth = 0;
    let end = start + 'new PresetError'.length;
    do { depth += source[end] === '(' ? 1 : source[end] === ')' ? -1 : 0; end++; } while (depth > 0 && end < source.length);
    calls.push(source.slice(start, end));
  }
  return calls;
}

test('chaque new PresetError(…) du code a un code, traduit en anglais et en français', async () => {
  let calls = 0;
  for (const [file, source] of await hostSources()) {
    for (const call of presetErrorCalls(source)) {
      calls++;
      // Les codes : chaînes 'motCamel' hors du message (gabarit `…`) et hors comparaisons (kind === 'nam').
      const codes = [...call.replace(/`[^`]*`/gu, '').matchAll(/(?<!===\s)'([a-z][A-Za-z]+)'/gu)].map(([, code]) => code);
      assert.ok(codes.length, `${file} : PresetError sans code → ${call.slice(0, 90)}`);
      for (const code of codes) {
        assert.ok(hasKey(`errors.preset.${code}`, 'en') && hasKey(`errors.preset.${code}`, 'fr'), `${file} : errors.preset.${code} manquant`);
      }
    }
  }
  assert.ok(calls >= 30, `scan trop maigre (${calls} appels) : le motif est cassé`);
});

test('les vues de l\'hôte n\'écrivent plus de texte anglais en dur', async () => {
  const views = ['presets/PresetView.js', 'presets/ExplorePanel.js', 'presets/presetText.js', 'account/AccountView.js', 'TunerView.js', 'FxRackView.js', 'FxChainView.js', 'backing-track-player/BackingTrackPlayerElement.js', 'main.js'];
  // Texte visible ou annoncé posé directement : text:'…', textContent='…', title='…', aria-label…, new Option('…').
  const literal = /(?:\btext\s*:|textContent\s*=|\.title\s*=|'aria-label'\s*,|new Option\()\s*(['`])[A-Z][a-z]+[ .…:]/u;
  for (const view of views) {
    const source = await read(`examples/wam/${view}`);
    const lines = source.split('\n').filter((line) => literal.test(line) && !/data-i18n|t\(|localizeMessage\(/u.test(line.split(literal)[0] + line.match(literal)[0]));
    assert.deepEqual(lines, [], view);
  }
});

test('les clés posées par localize(…) existent (le scan de i18n.test.mjs ne voit que t(…) et data-i18n)', async () => {
  let count = 0;
  for (const [file, source] of await hostSources()) {
    for (const [, block] of source.matchAll(/localize\([^;]*?\{([^{}]*)\}/gu)) {
      for (const [, key] of block.matchAll(/(?:text|title|ariaLabel|placeholder)\s*:\s*'([a-z]\w*\.[\w.]+)'/gu)) {
        count++;
        assert.ok(hasKey(key, 'en') && hasKey(key, 'fr'), `${file} : clé absente ${key}`);
      }
    }
  }
  assert.ok(count >= 15, `scan trop maigre (${count})`);
});

test('résumé de preset et dB dans la langue choisie (l\'anglais reste identique pour les tests existants)', () => {
  const summary = {amp: 'Twin', effects: ['BigMuff'], chains: 2};
  assert.equal(describe(summary), 'Amp: Twin · 1 effect: BigMuff · Chains A + B');
  setLanguage('fr');
  assert.equal(describe(summary), 'Ampli : Twin · 1 effet : BigMuff · Chaînes A + B');
  assert.equal(describe({amp: 'Twin', cabinet: 'V30', effects: ['A', 'B']}), 'Ampli : Twin · Baffle : V30 · 2 effets : A, B');
  assert.equal(formatDb(-12), '-12,0 dB');
  assert.equal(formatDb(-90, {floor: -60, unit: 'dBFS'}), '−∞ dBFS');
  setLanguage('en');
  assert.equal(formatDb(3.25), '3.3 dB');
});

test('localize marque l\'élément pour qu\'il suive les changements de langue', () => {
  const attributes = {};
  const node = {textContent: '', setAttribute(name, value) { attributes[name] = value; }, removeAttribute(name) { delete attributes[name]; }};
  setLanguage('fr');
  localize(node, {text: 'rack.inputTitle', ariaLabel: 'rack.input'}, {lane: 'B'});
  assert.equal(node.textContent, 'ENTRÉE · B');
  assert.equal(attributes['data-i18n'], 'rack.inputTitle');
  assert.equal(attributes['data-i18n-aria-label'], 'rack.input');
  assert.equal(attributes['data-i18n-params'], '{"lane":"B"}');
  assert.throws(() => localize(node, {color: 'x.y'}), /unknown target/u);
});

test('index.html : textes traduisibles balisés, textes anglais exigés par les tests conservés', async () => {
  const html = await read('examples/wam/index.html');
  for (const key of ['input.source', 'input.player', 'input.chooseOutput', 'input.recover', 'input.session', 'input.saveState', 'input.restoreState', 'rack.inputDevice', 'rack.outputDevice', 'header.language']) {
    assert.match(html, new RegExp(`data-i18n(?:-[a-z-]+)?="${key.replace('.', '\\.')}"`, 'u'), key);
  }
  assert.match(html, /<summary>Automated test results/u);
  assert.match(html, /id="autoHelp"[^>]*>[^<]*opened with <code>\?auto=1<\/code>/u);
  const main = await read('examples/wam/main.js');
  assert.match(main, /summary\.textContent = t\('input\.automated'\)/u, 'main.js traduit le résumé « Automated test results »');
  assert.match(main, /onLanguageChange\(\(\) => \{ applyTranslations\(\); relabelHost\(\); \}\)/u);
  assert.match(main, /: \(\) => localizeMessage\(text\)/u, 'les messages du moteur passent par localizeMessage');
  assert.match(main, /\$\('#hostStatus'\)\.textContent = hostStatusText\(\);/u, 'le statut lu par les lecteurs d\'écran est retraduit au changement de langue');
  assert.doesNotMatch(main, /message\(t\(/u, 'un statut traduit est passé en fonction (() => t(…)) pour être retraduit');
});

test('chaque vue se retraduit au changement de langue', async () => {
  for (const view of ['presets/PresetView.js', 'account/AccountView.js', 'TunerView.js', 'FxRackView.js', 'FxChainView.js', 'backing-track-player/BackingTrackPlayerElement.js']) {
    assert.match(await read(`examples/wam/${view}`), /onLanguageChange\(/u, view);
  }
  assert.match(await read('examples/wam/presets/ExplorePanel.js'), /relabel\(\)/u);
  assert.match(await read('tools/build-static-dist.mjs'), /'ui\/hostMessages\.js'/u);
  assert.match(await read('tools/build-static-dist.mjs'), /t\('input\.bundledFiles'/u, 'la dist traduit aussi la découverte des fichiers');
});
