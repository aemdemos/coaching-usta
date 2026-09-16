/**
 * The active locale, derived from the page URL (/en/ vs /es/). Any page whose
 * path contains an `/es/` segment uses the Spanish footer; everything else the
 * default. Mirrors the header's locale detection.
 * @returns {'en'|'es'} the locale code
 */
function currentFooterLocale() {
  return /(^|\/)es(\/|$)/i.test(window.location.pathname) ? 'es' : 'en';
}

/**
 * Fetches the footer fragment DOM. Locale-aware, metadata-independent dual-fetch:
 * per locale, try /content first (localhost / aem up), then root (DA/EDS
 * production). Spanish pages load the /es/ footer; the English footer is the
 * default and also the fallback if a locale-specific fragment is missing.
 * @returns {HTMLElement|null} a container wrapping the fragment sections, or null
 */
async function loadFooterFragment() {
  const locale = currentFooterLocale();
  const candidates = locale === 'es'
    ? ['/content/es/footer.plain.html', '/es/footer.plain.html', '/content/footer.plain.html', '/footer.plain.html']
    : ['/content/footer.plain.html', '/footer.plain.html'];
  let resp = null;
  // eslint-disable-next-line no-restricted-syntax
  for (const path of candidates) {
    // eslint-disable-next-line no-await-in-loop
    const r = await fetch(path);
    if (r.ok) { resp = r; break; }
  }
  if (!resp) return null;
  const text = await resp.text();
  const doc = new DOMParser().parseFromString(text, 'text/html');
  const container = document.createElement('div');
  const main = doc.querySelector('main');
  const sections = main ? main.querySelectorAll(':scope > div') : doc.querySelectorAll('body > div');
  sections.forEach((s) => container.append(s));
  return container;
}

/**
 * Marks external links (absolute http/https URLs) so they open in a new tab.
 * @param {Element} scope the container to search within
 */
function decorateExternalLinks(scope) {
  scope.querySelectorAll('a[href^="http"]').forEach((a) => {
    a.setAttribute('target', '_blank');
    a.setAttribute('rel', 'noopener');
  });
}

/**
 * loads and decorates the footer.
 * @param {Element} block The footer block element
 */
export default async function decorate(block) {
  const fragment = await loadFooterFragment();
  block.textContent = '';
  if (!fragment) return;

  const footer = document.createElement('div');
  footer.className = 'footer-content';

  // Fragment sections in order: 0 brand(logo) | 1 footer links | 2 social icons
  const sections = [...fragment.querySelectorAll(':scope > div')];
  const [brandSrc, linksSrc, socialSrc] = sections;

  // --- Brand / logo ---
  const brand = document.createElement('div');
  brand.className = 'footer-brand';
  if (brandSrc) while (brandSrc.firstChild) brand.append(brandSrc.firstChild);

  // --- Bottom row: links (left) + social (right) ---
  const row = document.createElement('div');
  row.className = 'footer-row';

  const links = document.createElement('nav');
  links.className = 'footer-links';
  links.setAttribute('aria-label', 'Footer links');
  if (linksSrc) while (linksSrc.firstChild) links.append(linksSrc.firstChild);

  const social = document.createElement('nav');
  social.className = 'footer-social';
  social.setAttribute('aria-label', 'Social media links');
  if (socialSrc) while (socialSrc.firstChild) social.append(socialSrc.firstChild);
  // label social links from their icon alt text for accessibility
  social.querySelectorAll('a').forEach((a) => {
    const img = a.querySelector('img');
    if (img && img.alt && !a.getAttribute('aria-label')) a.setAttribute('aria-label', img.alt);
  });

  row.append(links, social);
  footer.append(brand, row);

  // must run AFTER the links are in the tree — mirrors the source, where every
  // footer link opens in a new tab except the internal Program Terms link.
  decorateExternalLinks(footer);

  block.append(footer);
}
