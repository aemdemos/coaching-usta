/**
 * Fetches the footer fragment DOM. Metadata-independent dual-fetch:
 * /content first (localhost / aem up), then root (DA/EDS production).
 * @returns {HTMLElement|null} a container wrapping the fragment sections, or null
 */
async function loadFooterFragment() {
  let resp = await fetch('/content/footer.plain.html');
  if (!resp.ok) resp = await fetch('/footer.plain.html');
  if (!resp.ok) return null;
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

  decorateExternalLinks(footer);

  footer.append(brand, row);
  block.append(footer);
}
