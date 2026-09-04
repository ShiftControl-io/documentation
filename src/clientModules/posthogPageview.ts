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
    if (location.pathname === previousLocation?.pathname) return;
    window.posthog?.capture?.('$pageview');
}
