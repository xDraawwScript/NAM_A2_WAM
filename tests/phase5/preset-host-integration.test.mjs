import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile, stat} from 'node:fs/promises';

const read = (path) => readFile(new URL(`../../${path}`, import.meta.url), 'utf8');
const PRESET_FILES = ['PresetFormat.js', 'PresetAssets.js', 'PresetStorage.js', 'RemotePresetStorage.js', 'PresetFile.js', 'PresetManager.js', 'PresetView.js', 'presets.css'];

test('host exposes a Presets button and wires the preset manager', async () => {
  const [html, main] = await Promise.all([read('examples/wam/index.html'), read('examples/wam/main.js')]);
  assert.match(html, /id="presetsButton"[^>]*aria-haspopup="dialog"[^>]*disabled/u);
  assert.match(html, /href="\.\/presets\/presets\.css"/u);
  assert.match(main, /from '\.\/presets\/PresetManager\.js'/u);
  assert.match(main, /const browserPresets=new IndexedDbPresetStorage\(\);\s*const presetManager=new PresetManager\(\{rack,storage:browserPresets/u);
  // Mission 4 : le stockage « My account » n'est branché que pendant une session.
  assert.match(main, /new RemotePresetStorage\(\{api,cache:browserPresets\}\)/u);
  assert.match(main, /accountPresets\.clear\(\);presetManager\.setAccountStorage\(signedIn\?accountPresets:null\)/u);
  assert.match(main, /beforeLoad:\(\)=>chainView\.close\(\)/u);
  // Le contrat du prof : l'hôte ne lit pas lui-même les manifestes d'usine (tests/phase4a2).
  assert.doesNotMatch(main, /models-manifest|irs-manifest/u);
});

test('preset modules never import plugin code and never touch live input or devices', async () => {
  for (const file of PRESET_FILES.filter((name) => name.endsWith('.js'))) {
    const source = await read(`examples/wam/presets/${file}`);
    assert.doesNotMatch(source, /from ['"][^'"]*(?:src\/|wamPlugins)/u, `${file} must not import plugin code`);
    assert.doesNotMatch(source, /getUserMedia|activateLive|setSinkId|deviceId/u, `${file} must not handle devices`);
    assert.doesNotMatch(source, /localStorage\s*\.|\.innerHTML\s*=/u, `${file}: IndexedDB only, and no innerHTML with user data`);
  }
});

test('build script copies the preset modules into the static distribution', async () => {
  const build = await read('tools/build-static-dist.mjs');
  assert.match(build, /\['examples\/wam\/presets', 'presets'\]/u);
  for (const file of PRESET_FILES) assert.ok(build.includes(`'${file}'`), `${file} is checked by the build`);
});

test('static distribution contains the preset modules (after npm run dist)', {skip: await stat(new URL('../../dist/NAM_A2_WAM/index.html', import.meta.url)).then(() => false, () => 'dist not built')}, async () => {
  for (const file of PRESET_FILES) await stat(new URL(`../../dist/NAM_A2_WAM/presets/${file}`, import.meta.url));
  const main = await read('dist/NAM_A2_WAM/main.js');
  assert.match(main, /'\.\/presets\/PresetManager\.js'/u);
});
