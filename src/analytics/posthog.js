/**
 * PostHog for docs.shiftcontrol.io, held until the visitor answers the Captain Compliance
 * banner. Inlined verbatim into <head> by docusaurus.config.ts, which substitutes the
 * project key and API host into the two placeholders below.
 *
 * It is a plain .js file rather than a template literal in the config because the referrer
 * regex needs backslashes that a template literal consumes, and because 200-odd lines of
 * consent logic want syntax highlighting.
 *
 * Mirrors Journey's src/components/PostHogAnalytics.astro. Two deliberate differences, both
 * because this site is a single-page app rather than a set of documents:
 *   - The first pageview is emitted by the consent bridge, every later one by
 *     src/clientModules/posthogPageview.ts on client-side route change.
 *   - `defaults` and `person_profiles` are left at the SDK's values. Journey's
 *     `person_profiles: 'always'` would start writing person profiles for anonymous
 *     readers, and nobody has audited what else the 2025-05-24 defaults change here.
 *
 * Every method this file calls on `posthog` must appear in the loader stub's name list
 * below. A name outside that list throws instead of queueing when it is called before
 * array.js lands, and by the dataLayer wrapper at the foot of this file that throw would
 * land in the consent banner's own click handler.
 */
!function(t,e){var o,n,p,r;e.__SV||(window.posthog && window.posthog.__loaded)||(window.posthog=e,e._i=[],e.init=function(i,s,a){function g(t,e){var o=e.split(".");2==o.length&&(t=t[o[0]],e=o[1]),t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}}(p=t.createElement("script")).type="text/javascript",p.crossOrigin="anonymous",p.async=!0,p.src=s.api_host.replace(".i.posthog.com","-assets.i.posthog.com")+"/static/array.js",(r=t.getElementsByTagName("script")[0]).parentNode.insertBefore(p,r);var u=e;for(void 0!==a?u=e[a]=[]:a="posthog",u.people=u.people||[],u.toString=function(t){var e="posthog";return"posthog"!==a&&(e+="."+a),t||(e+=" (stub)"),e},u.people.toString=function(){return u.toString(1)+".people (stub)"},o="init Rr Mr fi Or Ar ci Tr Cr capture Mi calculateEventProperties Lr register register_once register_for_session unregister unregister_for_session Hr getFeatureFlag getFeatureFlagPayload isFeatureEnabled reloadFeatureFlags updateEarlyAccessFeatureEnrollment getEarlyAccessFeatures on onFeatureFlags onSurveysLoaded onSessionId getSurveys getActiveMatchingSurveys renderSurvey displaySurvey canRenderSurvey canRenderSurveyAsync identify setPersonProperties group resetGroups setPersonPropertiesForFlags resetPersonPropertiesForFlags setGroupPropertiesForFlags resetGroupPropertiesForFlags reset get_distinct_id getGroups get_session_id get_session_replay_url alias set_config startSessionRecording stopSessionRecording sessionRecordingStarted captureException loadToolbar get_property getSessionProperty Ur jr createPersonProfile zr kr Br opt_in_capturing opt_out_capturing has_opted_in_capturing has_opted_out_capturing get_explicit_consent_status is_capturing clear_opt_in_out_capturing Dr debug M Nr getPageViewId captureTraceFeedback captureTraceMetric $r".split(" "),n=0;n<o.length;n++)g(u,o[n]);e._i.push([i,s,a])},e.__SV=1)}(document,window.posthog||[]);

(function () {
  var PH_KEY = '__POSTHOG_KEY__';
  var PH_HOST = '__POSTHOG_HOST__';

  // PostHog compares the referrer's exact hostname, so a hop from another shiftcontrol.io
  // subdomain is stored as an external referral from ourselves. Session attribution reads
  // the $session_entry_ copies, so every variant has to be rewritten, not just $referrer.
  var REFERRER_PROPERTY = /^\$(?:session_entry_|initial_)?referr(?:er|ing_domain)$/;

  function phHostOf(value) {
    var parsed = '';
    try {
      parsed = new URL(value).hostname;
    } catch (err) {
      parsed = '';
    }
    // A bare host:port does not throw: it parses as a scheme with an opaque path, so an
    // empty hostname is the signal that the value was a host rather than a URL.
    var host = parsed === '' ? String(value).replace(/:\d+$/, '') : parsed;
    return host.toLowerCase().replace(/\.$/, '');
  }

  function phIsSelfReferral(value) {
    var host = phHostOf(value);
    return host === 'shiftcontrol.io' || host.endsWith('.shiftcontrol.io');
  }

  function phRewriteBag(bag) {
    if (!bag) return;
    Object.keys(bag).forEach(function (key) {
      var value = bag[key];
      if (typeof value === 'string' && REFERRER_PROPERTY.test(key) && phIsSelfReferral(value)) {
        bag[key] = '$direct';
      }
    });
  }

  function normalizeSelfReferral(event) {
    if (!event) return event;
    phRewriteBag(event.properties);
    phRewriteBag(event.$set);
    phRewriteBag(event.$set_once);
    return event;
  }

  // A throw here escapes into posthog.capture() rather than dropping one event, so every
  // branch above stays total. set_config replaces before_send outright, which is why each
  // consent branch has to rebuild the chain instead of appending to it.
  function withNormalized(next) {
    return function (event) {
      var normalized = normalizeSelfReferral(event);
      return next ? next(normalized) : normalized;
    };
  }

  posthog.init(PH_KEY, {
    api_host: PH_HOST,
    before_send: withNormalized(null),
    // The pageview is fired by the consent bridge below, once the visitor has decided.
    // Left on, it would fire while capture is still held and be dropped.
    capture_pageview: false,
    capture_pageleave: true,
    // Store nothing and send nothing until the visitor decides. This is the whole gate:
    // while consent is pending the SDK reports isOptedOut(), so events are generated and
    // dropped rather than sent, and no cookie or storage key is written. Measured on a
    // production build 2026-09-09: six pre-decision clicks produced seven internal
    // capture() calls, zero requests to /i/v0/e/, and zero cookies or storage keys.
    // Visitors who reject are still counted, through a server-side daily-salted hash.
    cookieless_mode: 'on_reject',
    // Replay waits for the Performance category; the bridge below starts it on accept.
    disable_session_recording: true,
    // Stops feature-flag evaluation; this site evaluates none. Measured 2026-09-09 against
    // this project, which does have flags: no /flags request fires either side of the
    // decision, while the replay config still arrives and recording starts on accept. Not
    // advanced_disable_flags, which also withholds that config and leaves session recording
    // stuck at awaiting_config (measured on Journey, 2026-09-05).
    advanced_disable_feature_flags: true,
  });

  // Captain Compliance is the consent authority; this turns its decision into PostHog
  // state. PostHog is classified Performance, which covers events, replay and heatmaps.
  //
  // Verified against the running banner (2026-08-22, re-checked 2026-09-09) rather than
  // taken from their docs: the page global is CaptainConsent (not CaptainCompliance), and
  // the method used below is getConsentState(), which returns { hasDecision, ... }. It also
  // exposes getConsent() and on(), neither of which this file needs. Consent is published as
  // Google Consent Mode v2 signals — gtag-style ['consent','default'|'update',{...}] entries
  // pushed onto dataLayer, mirrored on window.__ccLastConsent. Performance maps to
  // analytics_storage.
  var PREFIX = 'ph_' + PH_KEY + '_';

  // The landing URL, read before any client-side route change can move it. The deferred
  // pageview below is attributed to this rather than to wherever the visitor happens to be
  // when they answer the banner, so entry-page reporting stays honest on an SPA.
  var ENTRY_URL = window.location.href;

  // The banner emits a granted `default` even while it sits open awaiting a choice, so a
  // default is not consent. This is the vendor's own "has the visitor decided" answer.
  function hasDecision() {
    try {
      var cc = window.CaptainConsent;
      var state = cc && cc.getConsentState ? cc.getConsentState() : null;
      return !!(state && state.hasDecision);
    } catch (err) {
      return false;
    }
  }

  function clearStoredKeys() {
    ['localStorage', 'sessionStorage'].forEach(function (name) {
      try {
        // Reading the accessor itself throws in the hardened privacy modes this guards,
        // so it has to sit inside the try rather than in the array above.
        var store = window[name];
        Object.keys(store).forEach(function (key) {
          if (key.indexOf(PREFIX) === 0) store.removeItem(key);
        });
      } catch (err) {
        // Storage is unavailable, so there is nothing to clear.
      }
    });
    try {
      // Two forms, because a browser silently drops a Set-Cookie whose Domain is not a
      // suffix of the current host. The domain form clears the real cookie in production,
      // where cross_subdomain_cookie puts it on .shiftcontrol.io; the host-only form is
      // what actually clears it on localhost and on *.pages.dev previews, which are
      // production builds and so run this code.
      document.cookie = PREFIX + 'posthog=; Max-Age=0; path=/';
      document.cookie = PREFIX + 'posthog=; Max-Age=0; path=/; domain=.shiftcontrol.io';
    } catch (err) {
      // document.cookie throws in a sandboxed iframe without allow-same-origin. Nothing
      // was stored in that case either, and this must not escape into the banner's click
      // handler by way of the dataLayer wrapper below.
    }
  }

  var pageviewSent = false;

  // Drop every event except the pageview. Used once the visitor has REFUSED, so a refusal
  // yields a visit count and nothing else. A visitor who ignores the banner never reaches
  // this or any other branch, and is not counted at all. On this site the filter also
  // covers the route-change pageviews from the posthogPageview client module.
  function pageviewOnly(event) {
    if (!event) return event;
    return event.event === '$pageview' ? event : null;
  }

  // One pageview for the landing page, whichever way the visitor decided. Deferring it is
  // what keeps the first visit: a pageview fired before the decision is dropped, because
  // capture is held until consent resolves. It carries ENTRY_URL explicitly, because on an
  // SPA the visitor may have navigated on before answering and PostHog would otherwise
  // attribute the entry to whichever page they were reading at that moment. Pages visited
  // between landing and deciding are not recovered. Later routes are the client module's job.
  function capturePageviewOnce() {
    if (pageviewSent) return;
    pageviewSent = true;
    posthog.capture('$pageview', { $current_url: ENTRY_URL });
  }

  // Idempotent: the banner reports the same state more than once per page load.
  function applyConsent(granted) {
    if (granted) {
      posthog.set_config({ before_send: withNormalized(null) });
      posthog.opt_in_capturing();
      capturePageviewOnce();
      if (posthog.startSessionRecording) posthog.startSessionRecording();
      return;
    }

    // Not granted, either by a stricter regional default or an explicit refusal.
    // Opting out here puts PostHog in cookieless mode, where it still counts the
    // visit through a server-side daily-salted hash and writes no cookie. But
    // cookieless capture leaves autocapture and heatmaps firing, which is well past
    // counting a visit, so the filter holds everything except the pageview.
    posthog.set_config({ before_send: withNormalized(pageviewOnly) });
    if (posthog.stopSessionRecording) posthog.stopSessionRecording();
    posthog.opt_out_capturing();
    capturePageviewOnce();
    // Opting out stops collection but leaves anything written before withdrawal.
    // The opt-out record itself (__ph_opt_in_out_<key>) is deliberately kept: it is
    // the record of the refusal, and clearStoredKeys only matches the ph_<key>_ set.
    clearStoredKeys();
  }

  // A 'default' is the banner's pre-interaction baseline, emitted as granted even while
  // the banner sits open, so it only counts once the visitor has actually decided. A
  // returning visitor's stored choice arrives that way; otherwise wait for the 'update'.
  function readConsentSignal(entry) {
    if (!entry || typeof entry !== 'object') return;

    // gtag argument objects are array-like: {0:'consent',1:'update',2:{...}}.
    if (entry[0] === 'consent' && (entry[1] === 'default' || entry[1] === 'update')) {
      var payload = entry[2];
      if (!payload || typeof payload.analytics_storage !== 'string') return;
      if (entry[1] === 'default' && !hasDecision()) return;
      applyConsent(payload.analytics_storage === 'granted');
      return;
    }

    // Their GTM deployment path emits named events instead; harmless to accept both.
    // Gated on hasDecision() like every other path: anything on the page can push to
    // dataLayer, and without the gate a truthy value here would re-enable full capture
    // for a visitor who has already refused.
    if (
      (entry.event === 'captainComplianceConsent' ||
        entry.event === 'captainComplianceConsentUpdated') &&
      typeof entry.CaptainPerformance === 'boolean' &&
      hasDecision()
    ) {
      applyConsent(entry.CaptainPerformance);
    }
  }

  // Nothing in the bridge may escape into whoever pushed the signal: the banner publishes
  // consent from inside its own click handler, so a throw here would abort that handler
  // mid-update and the visitor's choice might never be stored.
  function read(entry) {
    try {
      readConsentSignal(entry);
    } catch (err) {
      // Analytics stays held, which is the safe direction to fail in.
    }
  }

  if (hasDecision() && window.__ccLastConsent && typeof window.__ccLastConsent.analytics_storage === 'string') {
    applyConsent(window.__ccLastConsent.analytics_storage === 'granted');
  }

  // Another script may have put something other than an array here; treat that as absent
  // rather than throwing, because a throw would leave the wrapper below uninstalled and
  // no consent signal would ever reach the bridge.
  if (!Array.isArray(window.dataLayer)) window.dataLayer = [];
  window.dataLayer.forEach(read);
  var push = window.dataLayer.push.bind(window.dataLayer);
  window.dataLayer.push = function () {
    // Forward first. Reading first would let a failure in the bridge withhold the entry
    // from every other dataLayer consumer, which is not ours to withhold.
    var result = push.apply(null, arguments);
    for (var i = 0; i < arguments.length; i++) read(arguments[i]);
    return result;
  };
})();
