/* eslint-disable */
/* global WebImporter */

/**
 * Transformer: coaching-usta site-wide cleanup.
 * All selectors verified against migration-work/cleaned.html (USTA Coaching homepage).
 * Removes non-authorable AEM Sites shell/chrome (header/footer/modals experience
 * fragments), cookie-consent UI, tracking/chat iframes, empty placeholder divs,
 * and strips AEM data-* / grid tracking attributes.
 */

const TransformHook = {
  beforeTransform: 'beforeTransform',
  afterTransform: 'afterTransform',
};

export default function transform(hookName, element, payload) {
  if (hookName === TransformHook.beforeTransform) {
    // Cookie-consent UI (OneTrust) — blocks/overlays content; remove before parsing.
    // Verified: <div id="onetrust-consent-sdk">, .onetrust-pc-dark-filter
    WebImporter.DOMUtils.remove(element, [
      '#onetrust-consent-sdk',
      '.onetrust-pc-dark-filter',
      '[id^="onetrust-"]',
      '[class*="ot-sdk"]',
    ]);

    // Empty non-authorable placeholder divs from the AEM component shell.
    // Verified: <div class="phe-block phe-block--s"> (450x, always empty),
    //           <div class="cmp-text__icon"> (73x, empty icon slots)
    WebImporter.DOMUtils.remove(element, [
      '.phe-block',
      '.cmp-text__icon',
    ]);

    // Hidden "compare all features" pricing matrix — collapsed (0-height) on the
    // homepage and not part of the visible pricing tiles, but present in the DOM
    // so the scraper picks it up as loose paragraphs / checkmark rows after the
    // cards-pricing block. The matrix rows live in .aem-dynamictable components
    // (verified: 3 hidden instances, 142 checkmarks total, none containing the
    // visible .v-tiers tiles); the "CHOOSE YOUR PACKAGE" heading is in a separate
    // hidden wrapper. Remove both.
    WebImporter.DOMUtils.remove(element, [
      '.aem-dynamictable',
      '.container--no-inner-gutter-paddings.container--inner-full-height--vertical-center',
    ]);
  }

  if (hookName === TransformHook.afterTransform) {
    // Non-authorable site chrome delivered via experience fragments.
    // Verified: .cmp-experiencefragment--header-xf / --footer-xf / --modals-xf
    WebImporter.DOMUtils.remove(element, [
      '.cmp-experiencefragment--header-xf',
      '.cmp-experiencefragment--footer-xf',
      '.cmp-experiencefragment--modals-xf',
      '.v-header',
    ]);

    // Tracking/chat/utility iframes and non-authorable leftover elements.
    // Verified: <iframe title="GPP Locator" | "Adobe ID Syncing iFrame" |
    //           "Button to launch messaging window" (#launcher) | etc.
    WebImporter.DOMUtils.remove(element, [
      'iframe',
      'noscript',
      'link',
      'source',
    ]);

    // Strip AEM authoring / data-layer tracking attributes.
    // Verified present: data-cmp-data-layer-name, data-cmp-link-accessibility-*
    element.querySelectorAll('*').forEach((el) => {
      el.removeAttribute('data-cmp-data-layer-name');
      el.removeAttribute('data-cmp-link-accessibility-enabled');
      el.removeAttribute('data-cmp-link-accessibility-text');
      // Generic AEM data-cmp-* hooks left by core components.
      [...el.attributes]
        .filter((attr) => attr.name.startsWith('data-cmp-'))
        .forEach((attr) => el.removeAttribute(attr.name));
    });
  }
}
