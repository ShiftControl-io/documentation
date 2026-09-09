/**
 * Mirrors the Docusaurus colour mode onto the Captain Compliance banner, so a reader in
 * light mode does not get a dark banner. Inlined verbatim into <head> by
 * docusaurus.config.ts, alongside the banner script it exists to serve.
 *
 * The banner's own stylesheet ships a light branch keyed on a `cc-light` class. What it
 * cannot do is read the class off <html>: Captain Compliance renders the banner, the
 * settings modal and the mini button inside the open shadow root of a
 * `div.captain-compliance-modal-container` it appends to <body>, and a selector inside a
 * shadow tree cannot see an ancestor outside it. Measured on the live site 2026-09-09:
 * adding `cc-light` to <html> or to the container moved nothing, while the same class
 * against a `:host(.cc-light)` rule injected into that shadow root recoloured the panel.
 *
 * So the class goes on both places, and stays correct under either selector form the
 * banner CSS uses — `:host(.cc-light)` (works in every browser, needs the class on the
 * container) or `:host-context(.cc-light)` (Chromium and WebKit only, reads <html>).
 *
 * Two things are watched rather than read once. `data-theme` is written by Docusaurus's own
 * inline script, which is a preBodyTag and therefore runs AFTER this file, so the first
 * correct value arrives as a mutation, as does every later toggle. And the container does
 * not exist until Captain Compliance has fetched its configuration, so its arrival is
 * watched too — <body>'s direct children, not a subtree, because that is where the
 * container is appended.
 */
(function () {
  var LIGHT_CLASS = 'cc-light';
  var CONTAINER = '.captain-compliance-modal-container';

  function ccApply() {
    // An absent attribute means Docusaurus has not written it yet, not that the reader is
    // in light mode. Dark is the banner's default, so treating it as dark leaves the
    // banner alone until the real value lands a moment later.
    var light = document.documentElement.getAttribute('data-theme') === 'light';
    document.documentElement.classList.toggle(LIGHT_CLASS, light);
    var container = document.querySelector(CONTAINER);
    if (container) container.classList.toggle(LIGHT_CLASS, light);
  }

  new MutationObserver(ccApply).observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['data-theme'],
  });

  function ccWatchBody() {
    ccApply();
    new MutationObserver(ccApply).observe(document.body, { childList: true });
  }

  if (document.body) {
    ccWatchBody();
  } else {
    document.addEventListener('DOMContentLoaded', ccWatchBody);
  }

  ccApply();
})();
