import ExecutionEnvironment from '@docusaurus/ExecutionEnvironment';

declare global {
    interface Window {
        posthog?: { capture?: (event: string) => void };
    }
}

export function onRouteUpdate({ location, previousLocation }): void {
    if (!ExecutionEnvironment.canUseDOM) return;
    if (location.pathname === previousLocation?.pathname) return;
    window.posthog?.capture?.('$pageview');
}
