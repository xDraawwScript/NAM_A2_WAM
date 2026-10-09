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
