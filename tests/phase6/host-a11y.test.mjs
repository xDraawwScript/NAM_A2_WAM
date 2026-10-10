// Mission 8, étape 6 : corrections issues de l'audit axe-core (0 violation côté hôte).
// Ces tests figent les corrections dans le code source pour qu'elles ne reviennent pas.
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';

const ROOT = fileURLToPath(new URL('../../examples/wam/', import.meta.url));
const read = (path) => readFile(ROOT + path, 'utf8');

test('un seul <main> et aucun <aside> dans <main> (landmark-unique, landmark-complementary-is-top-level)', async () => {
  const html = await read('index.html');
  assert.equal(html.match(/<main\b/gu)?.length, 1);
  const main = html.slice(html.indexOf('<main'), html.indexOf('</main>'));
  assert.doesNotMatch(main, /<aside\b/u, 'les bandes Entrée / Sortie sont des <section>');
  const player = await read('backing-track-player/BackingTrackPlayerElement.js');
  assert.doesNotMatch(player, /<(?:main|aside)\b/u, 'le lecteur est dans <main> : pas de second main ni d\'aside');
  assert.doesNotMatch(await read('FxChainView.js'), /element\('aside'/u);
});

test('les vumètres ont une valeur dès leur création (aria-required-attr du rôle meter)', async () => {
  const source = await read('FxChainView.js');
  const meter = source.slice(source.indexOf('createThinMeter(label)'), source.indexOf('createThinMeter(label)') + 400);
  assert.match(meter, /aria-valuenow','-60'/u);
});

test('photo d\'une carte : alt vide, le nom est déjà écrit à côté (image-redundant-alt)', async () => {
  assert.match(await read('FxChainView.js'), /card\.image\.alt=''/u);
});

test('l\'étiquette de dérivation est cachée à la création (button-name : jamais de bouton vide visible)', async () => {
  assert.match(await read('FxRackView.js'), /this\.routeLabel=el\('button','fx-route-label'\);this\.routeLabel\.hidden=true;/u);
});

test('les notifications sont dans une zone repère nommée et traduite (region)', async () => {
  const source = await read('ui/toast.js');
  assert.match(source, /createElement\('section'\)/u);
  assert.match(source, /'data-i18n-aria-label', 'toast\.region'/u);
  const {t, setLanguage} = await import('../../examples/wam/ui/i18n.js');
  setLanguage('fr');
  assert.equal(t('toast.region'), 'Notifications');
  setLanguage('en');
});

test('compte : role=tabpanel sur un <div> qui enveloppe le formulaire (aria-allowed-role)', async () => {
  const source = await read('account/AccountView.js');
  assert.match(source, /el\('div', \{id: 'accountTabPanel'\}, form\)/u);
  assert.doesNotMatch(source, /el\('form', \{[^}]*id: 'accountTabPanel'/u);
});

test('carte : le « + », la poubelle et la confirmation annoncent le nom affiché (titre du modèle), pas celui du plugin', async () => {
  const {FxChainView} = await import('../../examples/wam/FxChainView.js');
  const name = (entry) => FxChainView.prototype.displayName.call(null, entry);
  const nam = (metadata) => ({kind: 'nam', record: {name: 'NeuralWAMp Amp Sim'}, plugin: {audioNode: {getModelSnapshot: () => metadata}}});
  assert.equal(name(nam({provenance: {title: 'Bogner Shiva'}, name: 'shiva.nam'})), 'Bogner Shiva');
  assert.equal(name(nam({name: 'shiva.nam'})), 'shiva.nam');
  assert.equal(name({kind: 'cabinet', record: {name: 'NeuralWAMp Cabinet'}, plugin: {audioNode: {getIrSnapshot: () => ({metadata: {title: 'Twin 2x12'}})}}}), 'Twin 2x12');
  assert.equal(name({kind: 'effect', record: {name: 'Big Muff'}, plugin: {}}), 'Big Muff');
  assert.equal(name({kind: 'nam', record: {name: 'NeuralWAMp Amp Sim'}}), 'NeuralWAMp Amp Sim', 'plugin pas encore chargé');
  const source = await read('FxChainView.js');
  assert.match(source, /card\.remove\.setAttribute\('aria-label',t\('chain\.removeNamed',\{name\}\)\);card\.insert\.setAttribute\('aria-label',t\('chain\.insertBefore',\{name\}\)\)/u);
  assert.match(source, /confirmRemove\(id\) \{\n\s*const entry=this\.chain\.find\(id\),name=this\.displayName\(entry\);/u);
});
