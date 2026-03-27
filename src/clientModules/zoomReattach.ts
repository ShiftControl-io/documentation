/**
 * Re-attach medium-zoom when the Docusaurus theme toggles.
 *
 * ThemedImage renders two <img> elements (light + dark) and uses CSS display
 * to show/hide them based on data-theme. When the theme changes, the previously
 * hidden img becomes visible — but medium-zoom only attaches to visible images
 * on route change. This module watches for theme changes and re-initializes zoom.
 */
import mediumZoom from 'medium-zoom';
import siteConfig from '@generated/docusaurus.config';

const { themeConfig } = siteConfig as any;

export function onRouteDidUpdate() {
  const zoomConfig = themeConfig?.zoom;
  if (!zoomConfig) return;

  const selector = zoomConfig.selector || '.markdown img';

  const observer = new MutationObserver(() => {
    // Delay to let ThemedImage CSS transition complete
    setTimeout(() => {
      // Detach zoom from all images (including now-hidden ones)
      const existingZoom = mediumZoom();
      existingZoom.detach();

      // Re-attach to currently visible images
      const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
      const bg = isDark
        ? zoomConfig.background?.dark || 'rgb(50, 50, 50)'
        : zoomConfig.background?.light || 'rgb(255, 255, 255)';

      mediumZoom(selector, { ...zoomConfig.config, background: bg });
    }, 200);
  });

  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['data-theme'],
  });
}
