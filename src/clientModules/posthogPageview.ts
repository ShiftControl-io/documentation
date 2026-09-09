import ExecutionEnvironment from '@docusaurus/ExecutionEnvironment';

declare global {
    interface Window {
        posthog?: { capture?: (event: string) => void };
    }
}

/** The snippet is only injected in production builds, but a browser extension, a devtool or
 * another local script can still define window.posthog, and that pageview would be real. */
const POSTHOG_ENABLED = process.env.NODE_ENV === 'production';

export function onRouteUpdate({ location, previousLocation }): void {
    if (!POSTHOG_ENABLED || !ExecutionEnvironment.canUseDOM) return;
    // Docusaurus dispatches onRouteUpdate on first mount with previousLocation null. That
    // pageview belongs to the consent bridge in src/analytics/posthog.js, which fires it once
    // the visitor has decided; firing it here as well would either double-count the landing
    // page or emit it while capture is still held.
    if (!previousLocation || location.pathname === previousLocation.pathname) return;
    window.posthog?.capture?.('$pageview');
}
