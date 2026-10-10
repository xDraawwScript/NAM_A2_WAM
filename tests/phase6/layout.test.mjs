// Mission 8, étape 4 : mise en page de l'hôte et règles qui la rendent traduisible et accessible.
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile, readdir} from 'node:fs/promises';
import {join} from 'node:path';
import {fileURLToPath} from 'node:url';

const ROOT = fileURLToPath(new URL('../../', import.meta.url));
const read = (path) => readFile(join(ROOT, path), 'utf8');

async function hostScripts() {
  const files = [];
  const walk = async (dir) => {
    for (const entry of await readdir(dir, {withFileTypes: true})) {
      const path = join(dir, entry.name);
      if (entry.isDirectory()) { if (!['wamPlugins', 'node_modules', 'fx-test', 'vendor', 'locales'].includes(entry.name)) await walk(path); }
      else if (/\.m?js$/u.test(entry.name)) files.push(path);
    }
  };
  await walk(join(ROOT, 'examples/wam'));
  return files;
}

test('le code ne retrouve jamais un élément par son texte (aria-label, title) : la traduction le casserait', async () => {
  for (const file of await hostScripts()) {
    const source = await readFile(file, 'utf8');
    assert.doesNotMatch(source, /(?:querySelector(?:All)?|matches|closest)\(\s*['"`][^'"`]*\[(?:aria-label|title)=/u, file);
  }
  const rack = await read('examples/wam/FxRackView.js');
  assert.match(rack, /querySelector\('\.fx-input-strip'\)/u);
  assert.match(rack, /querySelector\('\.fx-output-strip'\)/u);
  assert.match(await read('examples/wam/index.html'), /class="fx-endpoint fx-input-strip"/u);
});

test('chaque fenêtre de l\'hôte a un titre annoncé (aria-labelledby)', async () => {
  const chain = await read('examples/wam/FxChainView.js');
  assert.match(chain, /this\.dialog\.setAttribute\('aria-labelledby',this\.title\.id\)/u, 'éditeur de plugin');
  assert.match(chain, /this\.menu\.setAttribute\('aria-labelledby'/u, 'menu d\'ajout');
  assert.match(chain, /title\.id=this\.menuTitleId/u);
  const rack = await read('examples/wam/FxRackView.js');
  assert.match(rack, /setAttribute\('aria-labelledby','fxRouteTitle'\)/u, 'fenêtre de routage');
  assert.match(rack, /title\.id='fxRouteTitle'/u);
  // Les identifiants dépendent de la chaîne (A ou B) : deux éditeurs n'ont jamais le même id.
  assert.match(chain, /const uid=`fx-\$\{options\.meterPrefix\|\|'chain'\}`/u);
});

test('onglets Presets et Compte : role=tabpanel, aria-controls et flèches du clavier', async () => {
  const presets = await read('examples/wam/presets/PresetView.js');
  assert.match(presets, /bindTabKeys\(this\.tablist\)/u);
  assert.match(presets, /syncTabs\(/u);
  for (const id of ['presetsTabFactory', 'presetsTabBrowser', 'presetsTabAccount', 'presetsTabExplore', 'presetsPanelMine', 'presetsPanelExplore']) assert.match(presets, new RegExp(id, 'u'));
  const account = await read('examples/wam/account/AccountView.js');
  assert.match(account, /bindTabKeys\(tablist\)/u);
  assert.match(account, /id: 'accountTabPanel'/u);
});

test('header en trois zones, guide et barre d\'outils du rack ; aucun ancien identifiant perdu', async () => {
  const html = await read('examples/wam/index.html');
  // Identifiants utilisés par main.js, les vues et les tests navigateur avant la refonte.
  const before = ['accountButton', 'accountName', 'audioSource', 'authorizeOutput', 'automatedResult', 'chainInputLevel', 'chainInputMeter',
    'chainInputReset', 'chainOutputGain', 'chainOutputGainValue', 'chainOutputLevel', 'chainOutputMeter', 'chainOutputPan', 'chainOutputPanValue',
    'chainOutputReset', 'discovery', 'enableLive', 'fxChain', 'hostSidebar', 'hostStatus', 'inputChannel', 'inputChannelRow', 'inputChannelStatus',
    'inputDevice', 'loop', 'outputDevice', 'outputSupport', 'pause', 'play', 'player', 'playerPanel', 'presetCurrent', 'presetsButton',
    'recoverAudio', 'restoreState', 'saveState', 'seek', 'source-title', 'sourceTrim', 'sourceTrimValue', 'stateSize', 'stop', 'toggleSidebar',
    'tunerButton', 'uiMode'];
  for (const id of before) assert.match(html, new RegExp(`id="${id}"`, 'u'), id);
  for (const id of new Set([...html.matchAll(/id="([^"]+)"/gu)].map(([, id]) => id))) {
    assert.equal(html.split(`id="${id}"`).length, 2, `identifiant en double : ${id}`);
  }
  const start = html.indexOf('<header class="host-header"');
  const header = html.slice(start, html.indexOf('</header>', start));
  for (const zone of ['host-brand', 'host-now', 'host-actions']) assert.match(header, new RegExp(`class="${zone}"`, 'u'), zone);
  assert.match(header, /id="presetLine"[^>]*hidden/u, 'ligne du preset cachée tant qu\'aucun preset');
  assert.doesNotMatch(html.slice(html.indexOf('id="presetsButton"'), html.indexOf('</button>', html.indexOf('id="presetsButton"'))), /presetCurrent/u,
    'le nom du preset n\'est plus dans le bouton');
  assert.match(html, /<section[^>]*id="gettingStarted"[^>]*hidden/u);
  assert.match(html, /id="rackToolbar"/u);
  assert.match(html, /id="shortcutsButton"/u);
  assert.match(html, /id="hostStatus" class="sr-only" role="status"/u);
  // Le panneau source se ferme par un vrai bouton nommé, pas seulement par Échap.
  assert.match(html, /id="closeSidebar"[^>]*data-i18n-aria-label="source\.close"/u);
});

test('main.js : guide relié aux vraies actions, messages aussi en toast', async () => {
  const main = await read('examples/wam/main.js');
  for (const step of ['source', 'live', 'preset']) assert.match(main, new RegExp(`guide\\??\\.complete\\('${step}'\\)`, 'u'), step);
  assert.match(main, /toaster\.show\(/u);
  assert.match(main, /mountShortcutsHelp\(/u);
  // setSource() ne renvoie pas toujours une promesse : jamais de .catch() directement dessus.
  assert.doesNotMatch(main, /setSource\([^)]*\)\.catch/u);
  const build = await read('tools/build-static-dist.mjs');
  for (const file of ['ui/toast.js', 'ui/GettingStarted.js', 'ui/ShortcutsHelp.js', 'ui/confirmDialog.js', 'ui/tabs.js']) assert.ok(build.includes(`'${file}'`), file);
});
