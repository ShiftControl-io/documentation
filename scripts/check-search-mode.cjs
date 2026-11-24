const assert = require('node:assert/strict');
const { mkdtempSync, rmSync, writeFileSync } = require('node:fs');
const { registerHooks } = require('node:module');
const { tmpdir } = require('node:os');
const { join } = require('node:path');
const test = require('node:test');
const { pathToFileURL } = require('node:url');
const { Worker } = require('node:worker_threads');
const lunr = require('lunr');

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
  const url = '/fixture/';
  const hiddenHeadings = Array.from({ length: 6 }, (_, i) =>
    `<h2 class="anchor" id="private-${i}">Transfers ${i + 1}</h2><p>Revocation instructions.</p>`,
  ).join('');
  writeFileSync(path, `<article><div class="markdown">
    <h1>App settings</h1>
    <h2 class="anchor" id="shared">Shared settings</h2><p>Manage transfers.</p>
    <div data-modes="google-only,jc-google,google-jc">${hiddenHeadings}</div>
  </div></article>`);

  const searchDocs = await new Promise((resolve, reject) => {
    const docs = [];
    const worker = new Worker(require.resolve('docusaurus-lunr-search/src/html-to-doc.js'), {
      workerData: { loadedVersions: null },
    });
    worker.on('message', ([isDoc, doc]) => {
      if (isDoc) docs.push(doc);
      else worker.postMessage(null);
    });
    worker.on('error', reject);
    worker.on('exit', (code) => code ? reject(new Error(`Search worker exited with ${code}`)) : resolve(docs));
    worker.postMessage({ path, url });
  });

  const { default: Adapter } = await import('docusaurus-lunr-search/src/theme/SearchBar/lunar-search.js');
  const index = lunr(function () {
    this.ref('id');
    this.field('title', { boost: 200 });
    this.field('content');
    this.metadataWhitelist = ['position'];
    searchDocs.forEach((doc, id) => this.add({ ...doc, id }));
  });
  let mode = 'google-only';
  const search = new Adapter(searchDocs, index.toJSON(), '/', 5, () => mode);
  assert((await search.search('revocation')).some(hit => hit.url.startsWith(url + '#private-')));

  mode = 'jc-only';
  assert.deepEqual(await search.search('revocation'), []);
  assert.deepEqual((await search.search('transfers')).map(hit => hit.url), [url + '#shared']);
});
