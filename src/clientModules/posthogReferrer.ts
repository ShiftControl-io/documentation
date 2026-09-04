/**
 * PostHog compares the referrer's exact hostname, so a hop from another shiftcontrol.io
 * subdomain is stored as an external referral from ourselves. Session attribution reads the
 * $session_entry_ copies rather than $referrer, so every variant has to be rewritten.
 *
 * This runs as a client module rather than a plugin option because posthog-docusaurus
 * JSON.stringifies its init options, which drops a function. The plugin's init therefore sets
 * capture_pageview: false and its own onRouteUpdate fires the pageview, which happens after
 * every client module's top-level code — so the filter is installed before the first event.
 */
const SELF_HOST = "shiftcontrol.io";
const DIRECT = "$direct";

const REFERRER_PROPERTY = /^\$(?:session_entry_|initial_)?referr(?:er|ing_domain)$/;

const hostOf = (value: string): string => {
    let parsed: string;
    try {
        parsed = new URL(value).hostname;
    } catch {
        parsed = "";
    }
    // A bare host:port does not throw: it parses as a scheme with an opaque path, so an empty
    // hostname is the signal that the value was a host rather than a URL.
    const host = parsed === "" ? value.replace(/:\d+$/, "") : parsed;
    return host.toLowerCase().replace(/\.$/, "");
};

const isSelfReferral = (value: string): boolean => {
    const host = hostOf(value);
    return host === SELF_HOST || host.endsWith(`.${SELF_HOST}`);
};

const rewrite = (bag: Record<string, unknown> | undefined): void => {
    if (!bag) return;
    for (const [key, value] of Object.entries(bag)) {
        if (typeof value === "string" && REFERRER_PROPERTY.test(key) && isSelfReferral(value)) {
            bag[key] = DIRECT;
        }
    }
};

type PosthogEvent = {
    properties?: Record<string, unknown>;
    $set?: Record<string, unknown>;
    $set_once?: Record<string, unknown>;
} | null;

/** A throw here escapes into posthog.capture() rather than dropping one event, so every branch
 * stays total. The event-path runner has no try/catch; only the log and metric ones do. */
const normalizeSelfReferral = (event: PosthogEvent): PosthogEvent => {
    if (!event) return event;
    rewrite(event.properties);
    rewrite(event.$set);
    rewrite(event.$set_once);
    return event;
};

declare global {
    interface Window {
        posthog?: { set_config?: (config: Record<string, unknown>) => void };
    }
}

// Absent in development, where the plugin injects no snippet at all.
if (typeof window !== "undefined" && typeof window.posthog?.set_config === "function") {
    window.posthog.set_config({ before_send: normalizeSelfReferral });
}

export {};
