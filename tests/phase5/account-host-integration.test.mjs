import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile, stat} from 'node:fs/promises';

const read = (path) => readFile(new URL(`../../${path}`, import.meta.url), 'utf8');
const ACCOUNT_FILES = ['account/ApiClient.js', 'account/AccountView.js', 'account/accountRules.js', 'account/account.css', 'ui/el.js'];

test('host exposes an Account button and wires the API client', async () => {
  const [html, main, config] = await Promise.all([read('examples/wam/index.html'), read('examples/wam/main.js'), read('examples/wam/config.js')]);
  assert.match(html, /id="accountButton"[^>]*aria-haspopup="dialog"[^>]*disabled/u);
  assert.match(html, /id="accountName"[^>]*>Sign in</u);
  assert.match(html, /href="\.\/account\/account\.css"/u);
  assert.match(main, /const apiUrl=window\.NAM_A2_WAM_CONFIG\?\.api\?\.baseUrl;\s*const api=apiUrl\?new ApiClient\(\{baseUrl:apiUrl\}\):null;/u);
  assert.match(main, /new AccountView\(\{api,button:\$\('#accountButton'\)/u);
  assert.match(config, /api:\s*\{\s*baseUrl:\s*'http:\/\/localhost:3000\/api'/u);
  // Contrat du prof (tests/phase4a2) : pas d'URL d'API de modèles/IR dans main.js.
  assert.doesNotMatch(main, /api\/.*(model|ir)/u);
  assert.doesNotMatch(config, /(?:secret|password)\w*['"]?\s*[:=]/iu, 'config.js is public: no secret value');
});

test('account modules use textContent only and never touch plugins or audio devices', async () => {
  for (const file of ['account/ApiClient.js', 'account/AccountView.js', 'account/accountRules.js', 'ui/el.js']) {
    const source = await read(`examples/wam/${file}`);
    assert.doesNotMatch(source, /from ['"][^'"]*(?:src\/|wamPlugins)/u, `${file} must not import plugin code`);
    assert.doesNotMatch(source, /getUserMedia|activateLive|setSinkId/u, `${file} must not handle devices`);
    assert.doesNotMatch(source, /\.innerHTML\s*=/u, `${file}: no innerHTML`);
  }
  // Le mot de passe n'est jamais enregistré dans le navigateur.
  const api = await read('examples/wam/account/ApiClient.js');
  assert.doesNotMatch(api, /setItem\([^)]*password/u);
});

test('build script copies and checks the account modules', async () => {
  const build = await read('tools/build-static-dist.mjs');
  assert.match(build, /\['examples\/wam\/account', 'account'\], \['examples\/wam\/ui', 'ui'\]/u);
  for (const file of ACCOUNT_FILES) assert.ok(build.includes(`'${file}'`), `${file} is checked by the build`);
});

test('static distribution contains the account modules (after npm run dist)', {skip: await stat(new URL('../../dist/NAM_A2_WAM/index.html', import.meta.url)).then(() => false, () => 'dist not built')}, async () => {
  for (const file of ACCOUNT_FILES) await stat(new URL(`../../dist/NAM_A2_WAM/${file}`, import.meta.url));
});
