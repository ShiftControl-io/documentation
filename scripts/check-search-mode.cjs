const assert = require('node:assert/strict');
const { mkdtempSync, readFileSync, rmSync, writeFileSync } = require('node:fs');
const { registerHooks } = require('node:module');
const { tmpdir } = require('node:os');
const { join } = require('node:path');
const test = require('node:test');
const { pathToFileURL } = require('node:url');
const lunrPlugin = require('docusaurus-lunr-search');

const lunrUrl = pathToFileURL(require.resolve('lunr')).href;
registerHooks({
  resolve(specifier, context, nextResolve) {
    return nextResolve(specifier === '@generated/lunr.client' ? lunrUrl : specifier, context);
  },
});

test('hidden instructions do not match or crowd out shared hits in another mode', async (t) => {
  const dir = mkdtempSync(join(tmpdir(), 'docs-search-mode-'));
  t.after(() => rmSync(dir, { force: true, recursive: true }));
  const path = join(dir, 'index.html');
  const url = '/';
  const hiddenHeadings = Array.from({ length: 6 }, (_, i) =>
    `<h2 class="anchor" id="private-${i}">Transfers ${i + 1}</h2><p>Revocation instructions.</p>`,
  ).join('');
  writeFileSync(path, `<article><div class="markdown">
    <h1>App settings</h1>
    <h2 class="anchor" id="shared">Shared settings</h2><p>Manage transfers.</p>
    <div data-modes="jc-only"><p>Use the JumpCloud connector for transfers.</p></div>
    <div data-modes="google-only,jc-google,google-jc">${hiddenHeadings}</div>
  </div></article>`);

  await lunrPlugin({}, { indexBaseUrl: true }).postBuild({
    routesPaths: [url],
    outDir: dir,
    baseUrl: '/',
    plugins: [],
  });

  const { default: Adapter } = await import('docusaurus-lunr-search/src/theme/SearchBar/lunar-search.js');
  const { searchDocs } = JSON.parse(readFileSync(join(dir, 'search-doc.json'), 'utf8'));
  const index = JSON.parse(readFileSync(join(dir, 'lunr-index.json'), 'utf8'));
  let mode = 'google-only';
  const search = new Adapter(searchDocs, index, '/', 5, () => mode);
  assert((await search.search('revocation')).some(hit => hit.url.startsWith(url + '#private-')));
  assert.deepEqual(await search.search('connector'), []);

  mode = 'jc-only';
  assert.deepEqual(await search.search('revocation'), []);
  assert.deepEqual((await search.search('connector')).map(hit => hit.url), [url + '#shared']);
  assert.equal(search.getLunrResult('settings').filter(hit => searchDocs[hit.ref].url === url + '#shared').length, 1);
  assert.deepEqual((await search.search('transfers')).map(hit => hit.url), [url + '#shared']);
});
