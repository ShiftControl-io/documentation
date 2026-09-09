/**
 * PostHog for docs.shiftcontrol.io, held until the visitor answers the Captain Compliance
 * banner. Inlined verbatim into <head> by docusaurus.config.ts, which substitutes the
 * project key and API host into the two placeholders below.
 *
 * It is a plain .js file rather than a template literal in the config because the referrer
 * regex and the cookie-clearing code need backslashes that a template literal consumes.
 *
 * Mirrors Journey's src/components/PostHogAnalytics.astro. Two deliberate differences, both
 * because this site is a single-page app rather than a set of documents:
 *   - The first pageview is emitted by the consent bridge, every later one by
 *     src/clientModules/posthogPageview.ts on client-side route change.
 *   - `defaults` and `person_profiles` are left at the SDK's values. Adopting Journey's
 *     would switch pageview capture to history_change and start writing person profiles for
 *     anonymous readers, neither of which this change is about.
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
    // Store nothing and send nothing until the visitor decides. Visitors who reject are
    // still counted, through a server-side daily-salted hash rather than a stored id.
    cookieless_mode: 'on_reject',
    // Replay waits for the Performance category; the bridge below starts it on accept.
    disable_session_recording: true,
    // Suppresses the pre-consent /flags/ POST; this site evaluates no feature flags.
    // Not advanced_disable_flags, which also withholds the replay config and leaves
    // session recording stuck at awaiting_config (measured on Journey, 2026-09-05).
    advanced_disable_feature_flags: true,
  });

  // Captain Compliance is the consent authority; this turns its decision into PostHog
  // state. PostHog is classified Performance, which covers events, replay and heatmaps.
  //
  // Verified against the running banner (2026-08-22) rather than taken from their docs:
  // the page global is CaptainConsent (not CaptainCompliance), it exposes getConsent()
  // and on(), and consent is published as Google Consent Mode v2 signals — gtag-style
  // ['consent','default'|'update',{...}] entries pushed onto dataLayer, mirrored on
  // window.__ccLastConsent. Performance maps to analytics_storage.
  var PREFIX = 'ph_' + PH_KEY + '_';
  var MAX_WAIT_MS = 10000;
  var RETRY_MS = 200;

  // The loader stub only queues the method names baked into the snippet, so calling a
  // newer method before array.js lands throws rather than queueing.
  function ready() {
    return !!window.posthog && typeof window.posthog.opt_in_capturing === 'function';
  }

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
    document.cookie = PREFIX + 'posthog=; Max-Age=0; path=/; domain=.shiftcontrol.io';
  }

  var pageviewSent = false;

  // Drop every event except the pageview. Used while consent is anything but granted,
  // so an ignored or refused banner yields a visit count and nothing else. On this site
  // that also covers the route-change pageviews from the posthogPageview client module.
  function pageviewOnly(event) {
    if (!event) return event;
    return event.event === '$pageview' ? event : null;
  }

  // One pageview for the landing page, whichever way the visitor decided. Deferring it is
  // what keeps the first visit: a pageview fired before the decision is dropped, because
  // capture is held until consent resolves. Later routes are the client module's job.
  function capturePageviewOnce() {
    if (pageviewSent) return;
    pageviewSent = true;
    posthog.capture('$pageview');
  }

  // Idempotent: the banner reports the same state more than once per page load.
  function applyConsent(granted, waitedMs) {
    if (!ready()) {
      if ((waitedMs || 0) >= MAX_WAIT_MS) return;
      setTimeout(function () {
        applyConsent(granted, (waitedMs || 0) + RETRY_MS);
      }, RETRY_MS);
      return;
    }
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
      applyConsent(payload.analytics_storage === 'granted', 0);
      return;
    }

    // Their GTM deployment path emits named events instead; harmless to accept both.
    if (
      (entry.event === 'captainComplianceConsent' ||
        entry.event === 'captainComplianceConsentUpdated') &&
      typeof entry.CaptainPerformance === 'boolean'
    ) {
      applyConsent(entry.CaptainPerformance, 0);
    }
  }

  var read = readConsentSignal;

  if (hasDecision() && window.__ccLastConsent && typeof window.__ccLastConsent.analytics_storage === 'string') {
    applyConsent(window.__ccLastConsent.analytics_storage === 'granted', 0);
  }

  window.dataLayer = window.dataLayer || [];
  window.dataLayer.forEach(read);
  var push = window.dataLayer.push.bind(window.dataLayer);
  window.dataLayer.push = function () {
    for (var i = 0; i < arguments.length; i++) read(arguments[i]);
    return push.apply(null, arguments);
  };
})();
