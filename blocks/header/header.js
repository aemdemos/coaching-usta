// media query match that indicates desktop width (inline links vs flyout-only)
const isDesktop = window.matchMedia('(min-width: 900px)');

/**
 * Fetches the nav fragment DOM. Metadata-independent dual-fetch:
 * /content first (localhost / aem up), then root (DA/EDS production).
 * @returns {HTMLElement|null} a <main> wrapping the fragment sections, or null
 */
async function loadNavFragment() {
  let resp = await fetch('/content/nav.plain.html');
  if (!resp.ok) resp = await fetch('/nav.plain.html');
  if (!resp.ok) return null;
  const text = await resp.text();
  const doc = new DOMParser().parseFromString(text, 'text/html');
  // plain.html is a list of top-level section divs; DOMParser puts them in <body>
  const container = document.createElement('div');
  const main = doc.querySelector('main');
  const sections = main ? main.querySelectorAll(':scope > div') : doc.querySelectorAll('body > div');
  sections.forEach((s) => container.append(s));
  return container;
}

/**
 * Closes the flyout panel and resets the hamburger toggle.
 * @param {Element} nav the nav element
 */
function closeFlyout(nav) {
  const toggle = nav.querySelector('.nav-hamburger button');
  const flyout = nav.querySelector('.nav-flyout');
  if (!toggle || !flyout) return;
  toggle.setAttribute('aria-expanded', 'false');
  toggle.setAttribute('aria-label', 'Open menu');
  flyout.setAttribute('aria-hidden', 'true');
  document.body.style.overflowY = '';
}

/**
 * Opens the flyout panel and marks the hamburger toggle as expanded.
 * @param {Element} nav the nav element
 */
function openFlyout(nav) {
  const toggle = nav.querySelector('.nav-hamburger button');
  const flyout = nav.querySelector('.nav-flyout');
  if (!toggle || !flyout) return;
  toggle.setAttribute('aria-expanded', 'true');
  toggle.setAttribute('aria-label', 'Close menu');
  flyout.setAttribute('aria-hidden', 'false');
  // lock body scroll only on mobile full-screen flyout
  if (!isDesktop.matches) document.body.style.overflowY = 'hidden';
}

/**
 * Toggles the flyout open/closed.
 * @param {Element} nav the nav element
 */
function toggleFlyout(nav) {
  const toggle = nav.querySelector('.nav-hamburger button');
  const expanded = toggle.getAttribute('aria-expanded') === 'true';
  if (expanded) closeFlyout(nav);
  else openFlyout(nav);
}

/**
 * EDS wraps a list item's single link in a <p> (`<li><p><a>…</a></p><ul>…`),
 * whereas the local dev server leaves it as a bare `<li><a>…</a>`. Unwrap any
 * such single-anchor <p> that sits directly inside an <li> so the rest of the
 * code (and the CSS) can rely on `li > a` being a direct child in every
 * environment — this is what makes the language switcher's nested <ul> a
 * sibling of its toggle link, so the chevron/checkmark/toggle all work on EDS.
 * @param {Element} scope the container to normalize
 */
function unwrapListItemParagraphs(scope) {
  scope.querySelectorAll('li > p').forEach((p) => {
    // only unwrap when the <p> is a simple wrapper around a single anchor
    const onlyChild = p.children.length === 1 && p.firstElementChild.tagName === 'A';
    if (onlyChild) p.replaceWith(...p.childNodes);
  });
}

/**
 * Wires the language switcher: a nav item whose link has a nested <ul>.
 * Clicking the top-level label toggles the nested language list.
 * @param {Element} scope the container to search within
 */
function decorateLanguageSwitcher(scope) {
  scope.querySelectorAll('li').forEach((li) => {
    const nested = li.querySelector(':scope > ul');
    const link = li.querySelector(':scope > a');
    if (!nested || !link) return;
    li.classList.add('nav-language-switcher');
    link.setAttribute('aria-expanded', 'false');
    const options = [...nested.querySelectorAll(':scope > li')];

    // Determine the active locale from the current URL (/en/ vs /es/), matching
    // the source's behaviour where each option navigates to its locale path.
    const localeOf = (href) => {
      const m = (href || '').match(/\/(en|es)(\/|$)/i);
      return m ? m[1].toLowerCase() : null;
    };
    const currentLocale = localeOf(window.location.pathname) || 'en';

    options.forEach((opt) => {
      const a = opt.querySelector('a');
      if (!a) return;
      a.setAttribute('role', 'button');
      const optLocale = localeOf(a.getAttribute('href'));
      const isActive = optLocale === currentLocale;
      opt.classList.toggle('nav-language-active', isActive);
      // the summary label reflects the active language
      if (isActive) link.childNodes[0].nodeValue = a.textContent.trim();
    });
    // fall back to first option if no locale matched
    if (!options.some((o) => o.classList.contains('nav-language-active')) && options[0]) {
      options[0].classList.add('nav-language-active');
    }

    // clicking the summary toggles the nested language list open/closed
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const open = link.getAttribute('aria-expanded') === 'true';
      link.setAttribute('aria-expanded', open ? 'false' : 'true');
    });
    // each option navigates to its locale path (source: /en/ ↔ /es/ page swap) —
    // real <a href> navigation is left intact, so no click handler is needed here.
  });
}

/**
 * Marks external links (absolute http/https URLs) so CSS can add an icon
 * and they open in a new tab.
 * @param {Element} scope the container to search within
 */
function decorateExternalLinks(scope) {
  scope.querySelectorAll('a[href^="http"]').forEach((a) => {
    a.classList.add('nav-external');
    a.setAttribute('target', '_blank');
    a.setAttribute('rel', 'noopener');
  });
}

/**
 * Turns a list of anchors into styled CTA buttons.
 * The first action becomes the primary CTA, the rest secondary/outlined.
 * @param {Element} list a <ul> of action links
 */
function decorateActionButtons(list) {
  if (!list) return;
  [...list.querySelectorAll(':scope > li > a')].forEach((a, i) => {
    a.classList.add('nav-button');
    a.classList.add(i === 0 ? 'nav-button-primary' : 'nav-button-secondary');
  });
}

/**
 * loads and decorates the header.
 * @param {Element} block The header block element
 */
export default async function decorate(block) {
  const fragment = await loadNavFragment();
  block.textContent = '';
  if (!fragment) return;

  // Normalize EDS's <li><p><a> wrapping to <li><a> so link selectors and the
  // language-switcher nested-list detection work the same locally and on EDS.
  unwrapListItemParagraphs(fragment);

  const nav = document.createElement('nav');
  nav.id = 'nav';

  // Fragment sections in order:
  // 0 brand(logo) | 1 left inline nav | 2 right inline nav |
  // 3 flyout-only links + language | 4 action buttons (Join / Sign In)
  const sections = [...fragment.querySelectorAll(':scope > div')];
  const [brandSrc, leftSrc, rightSrc, extraSrc, actionsSrc] = sections;

  // --- Brand / logo ---
  const brand = document.createElement('div');
  brand.className = 'nav-brand';
  if (brandSrc) while (brandSrc.firstChild) brand.append(brandSrc.firstChild);

  // --- Inline nav groups (shown in the bar at desktop) ---
  const leftNav = document.createElement('div');
  leftNav.className = 'nav-inline nav-inline-left';
  if (leftSrc) while (leftSrc.firstChild) leftNav.append(leftSrc.firstChild);

  const rightNav = document.createElement('div');
  rightNav.className = 'nav-inline nav-inline-right';
  if (rightSrc) while (rightSrc.firstChild) rightNav.append(rightSrc.firstChild);

  // --- Flyout extra links + language switcher ---
  const extra = document.createElement('div');
  extra.className = 'nav-flyout-links';
  if (extraSrc) while (extraSrc.firstChild) extra.append(extraSrc.firstChild);

  // --- Action buttons (Join / Sign In) ---
  const actions = document.createElement('div');
  actions.className = 'nav-actions';
  if (actionsSrc) while (actionsSrc.firstChild) actions.append(actionsSrc.firstChild);
  decorateActionButtons(actions.querySelector('ul'));

  // --- Hamburger toggle ---
  const hamburger = document.createElement('div');
  hamburger.className = 'nav-hamburger';
  hamburger.innerHTML = `<button type="button" aria-controls="nav-flyout" aria-expanded="false" aria-label="Open menu">
      <span class="nav-hamburger-icon"></span>
    </button>`;

  // --- Flyout panel ---
  const flyout = document.createElement('div');
  flyout.className = 'nav-flyout';
  flyout.id = 'nav-flyout';
  flyout.setAttribute('aria-hidden', 'true');
  // Inline groups are cloned into the flyout for mobile; hidden on desktop via CSS.
  const flyoutInline = document.createElement('div');
  flyoutInline.className = 'nav-flyout-inline';
  if (leftSrc || rightSrc) {
    const cloneLeft = leftNav.querySelector('ul');
    const cloneRight = rightNav.querySelector('ul');
    if (cloneLeft) flyoutInline.append(cloneLeft.cloneNode(true));
    if (cloneRight) flyoutInline.append(cloneRight.cloneNode(true));
  }
  flyout.append(flyoutInline);
  flyout.append(extra);
  // action buttons live at the bottom of the flyout too (clone for flyout)
  const flyoutActions = actions.cloneNode(true);
  flyout.append(flyoutActions);

  // decorate behaviors
  decorateLanguageSwitcher(flyout);
  decorateExternalLinks(nav);
  decorateExternalLinks(flyout);

  // --- Assemble bar: [hamburger + leftNav] [brand] [rightNav + actions] ---
  const barLeft = document.createElement('div');
  barLeft.className = 'nav-bar-left';
  // flyout lives inside the left group so the desktop dropdown anchors to the
  // hamburger's left edge (left:0 relative to .nav-bar-left)
  barLeft.append(hamburger, leftNav, flyout);

  const barRight = document.createElement('div');
  barRight.className = 'nav-bar-right';
  barRight.append(rightNav, actions);

  nav.append(barLeft, brand, barRight);

  // --- Interactions ---
  hamburger.querySelector('button').addEventListener('click', () => toggleFlyout(nav));

  // close on escape
  window.addEventListener('keydown', (e) => {
    if (e.code === 'Escape') closeFlyout(nav);
  });

  // close when clicking outside the nav
  document.addEventListener('click', (e) => {
    if (!nav.contains(e.target)) closeFlyout(nav);
  });

  // reset state cleanly when crossing the desktop/mobile breakpoint
  isDesktop.addEventListener('change', () => {
    closeFlyout(nav);
    const langLinks = flyout.querySelectorAll('.nav-language-switcher > a');
    langLinks.forEach((a) => a.setAttribute('aria-expanded', 'false'));
  });

  const navWrapper = document.createElement('div');
  navWrapper.className = 'nav-wrapper';
  navWrapper.append(nav);
  block.append(navWrapper);
}
