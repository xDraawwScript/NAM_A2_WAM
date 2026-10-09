// Mission 8, étape 2 : thème « Tolex & Lampes ».
// Vérifie que l'habillage passe par les tokens de ui/theme.css, que les contrastes respectent
// WCAG AA, que les polices sont auto-hébergées et que les plugins gardent leur apparence.
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile, access} from 'node:fs/promises';

const read = (path) => readFile(new URL(`../../${path}`, import.meta.url), 'utf8');
const HOST_CSS = ['examples/wam/host.css', 'examples/wam/fx-chain.css', 'examples/wam/presets/presets.css', 'examples/wam/account/account.css'];

// Lit les tokens --nom: valeur; du bloc :root de theme.css.
async function tokens() {
  const css = await read('examples/wam/ui/theme.css');
  const root = css.slice(css.indexOf(':root'));
  return Object.fromEntries([...root.matchAll(/--([\w-]+):\s*([^;]+);/gu)].map(([, name, value]) => [name, value.trim()]));
}

// Luminance relative et rapport de contraste WCAG 2.1.
function luminance(hex) {
  const [r, g, b] = hex.replace('#', '').match(/../gu).map((pair) => parseInt(pair, 16) / 255)
    .map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
function contrast(a, b) {
  const [light, dark] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (light + 0.05) / (dark + 0.05);
}

test('index.html charge theme.css avant les autres feuilles de l\'hôte', async () => {
  const html = await read('examples/wam/index.html');
  const theme = html.indexOf('href="./ui/theme.css"');
  assert.ok(theme > 0, 'theme.css doit être lié');
  for (const sheet of ['./host.css', './fx-chain.css', './presets/presets.css', './account/account.css']) {
    assert.ok(html.indexOf(`href="${sheet}"`) > theme, `${sheet} doit venir après theme.css`);
  }
});

test('les textes respectent un contraste WCAG AA (4,5:1) sur toutes les surfaces', async () => {
  const t = await tokens();
  const backgrounds = ['bg', 'panel', 'surface', 'surface-2', 'surface-sunk'];
  for (const fg of ['text', 'text-muted', 'accent', 'ok', 'error', 'clip', 'piping']) {
    for (const bg of backgrounds) {
      const ratio = contrast(t[fg], t[bg]);
      assert.ok(ratio >= 4.5, `--${fg} sur --${bg} : ${ratio.toFixed(2)}:1`);
    }
  }
  // Texte posé sur une couleur pleine (boutons, badges).
  for (const [fg, bg] of [['accent-ink', 'accent'], ['accent-ink', 'accent-hover'], ['ok-ink', 'ok'], ['clip-ink', 'clip']]) {
    const ratio = contrast(t[fg], t[bg]);
    assert.ok(ratio >= 4.5, `--${fg} sur --${bg} : ${ratio.toFixed(2)}:1`);
  }
  // Texte gravé sur la plaque en métal brossé : on teste la teinte la plus sombre du dégradé.
  const plateShades = t.plate.match(/#[0-9a-f]{6}/giu);
  for (const shade of plateShades) {
    const ratio = contrast(t['text-on-plate'], shade);
    assert.ok(ratio >= 4.5, `--text-on-plate sur ${shade} : ${ratio.toFixed(2)}:1`);
  }
});

test('les feuilles de l\'hôte n\'écrivent pas de couleurs en dur (hors matières précises)', async () => {
  const [host, fx, presets, account] = await Promise.all(HOST_CSS.map(read));
  const hexes = (css) => css.match(/#[0-9a-f]{3,8}\b/giu) ?? [];
  assert.deepEqual(hexes(presets), [], 'presets.css');
  assert.deepEqual(hexes(account), [], 'account.css');
  // host.css : seules les lignes qui figent l'environnement des plugins gardent leurs anciennes couleurs.
  for (const line of host.split('\n')) {
    if (/\.fx-editor-mount|\.tuner-mount/u.test(line)) continue;
    assert.deepEqual(hexes(line).filter((hex) => hex !== '#000'), [], `host.css : ${line.trim().slice(0, 80)}`);
  }
  // fx-chain.css : uniquement le cadran crème du VU analogique et les faders de console.
  const allowed = new Set(['#000', '#000b', '#8d7956', '#fff3ce', '#d8c59b', '#33271566', '#554734', '#766244', '#8f3026', '#6d3c2d', '#ff2929',
    '#0b0907', '#5d5245', '#3a3027', '#f1e6c9', '#b8a888', '#2a221b', '#c9b994']);
  assert.deepEqual(hexes(fx).filter((hex) => !allowed.has(hex.toLowerCase())), [], 'fx-chain.css');
});

test('aucun texte sous 12 px dans les dialogs Presets et Compte ni dans host.css', async () => {
  for (const path of ['examples/wam/host.css', 'examples/wam/presets/presets.css', 'examples/wam/account/account.css']) {
    const css = await read(path);
    for (const [, px] of css.matchAll(/font-size:\s*(\d+)px/gu)) assert.ok(Number(px) >= 12, `${path} : ${px}px`);
    const t = await tokens();
    for (const [name, value] of Object.entries(t)) if (name.startsWith('fs-')) assert.ok(parseInt(value, 10) >= 12, `--${name}`);
  }
});

test('les polices sont auto-hébergées, avec leurs licences', async () => {
  const css = await read('examples/wam/ui/theme.css');
  assert.doesNotMatch(css, /fonts\.googleapis|fonts\.gstatic|@import|url\(["']?https?:/u, 'aucun appel réseau externe');
  const urls = [...css.matchAll(/url\("\.\/(fonts\/[^"]+\.woff2)"\)/gu)].map(([, path]) => path);
  assert.equal(urls.length, 6);
  for (const path of urls) await access(new URL(`../../examples/wam/ui/${path}`, import.meta.url));
  for (const license of ['OFL-barlow.txt', 'OFL-oswald.txt', 'LICENSE-yellowtail.txt']) {
    await access(new URL(`../../examples/wam/ui/fonts/${license}`, import.meta.url));
  }
});

test('les plugins gardent leur apparence : ni variables redéfinies, ni vignettes filtrées', async () => {
  const [theme, ...sheets] = await Promise.all([read('examples/wam/ui/theme.css'), ...HOST_CSS.map(read)]);
  const all = [theme, ...sheets].join('\n').replace(/\/\*[\s\S]*?\*\//gu, ''); // sans les commentaires
  assert.doesNotMatch(all, /--nam-accent|--cab-accent|--nam-panel/u, 'les variables des plugins ne sont pas redéfinies');
  // Aucune règle ne modifie l'image d'une carte de plugin (filtre, opacité, mélange).
  for (const [, selector, body] of all.matchAll(/([^{}]*\.fx-photo img[^{}]*)\{([^}]*)\}/gu)) {
    assert.doesNotMatch(body, /filter|opacity|mix-blend/u, `règle « ${selector.trim()} »`);
  }
  // Les styles de base de l'hôte excluent les zones où s'affichent les interfaces des plugins.
  const host = sheets[0];
  for (const rule of host.match(/^:where\((?:button|select)[^{]*\{/gmu)) {
    assert.match(rule, /:not\(\.fx-editor-mount \*, \.tuner-mount \*\)/u, rule);
  }
  assert.doesNotMatch(theme, /^\s*\*[^{]*\{/mu, 'pas de sélecteur universel dans le thème');
});

test('le CSS mort de l\'ancienne mise en page est supprimé', async () => {
  const host = await read('examples/wam/host.css');
  assert.doesNotMatch(host, /\.rack-grid|\.rack-slot|\.rack-connector|\.host-dot\.rose/u);
});
