/**
 * Social block — "Share This Article": a lime label above Facebook / X /
 * LinkedIn share icons (source: the news-article footer,
 * /en/home/news/usta-coaching-butch-staples-award-2026-coaches-open.html).
 *
 * Authoring model (one cell per row):
 *
 *   | social                  |   ← optional variant: `left` or `center`
 *   | Share This Article      |   ← label (any row that isn't a network name)
 *   | facebook                |   ← optional network rows, in display order;
 *   | x                       |     none authored = all three
 *   | linkedin                |
 *
 * Alignment: right by default (left-aligned on phones, like the source);
 * `left` / `center` pin it at every viewport. Share URLs are built at runtime
 * from the page's canonical URL and title, the same targets the source opens.
 *
 * @param {Element} block The block element
 */

const NETWORKS = {
  facebook: {
    name: 'Facebook',
    href: (url) => `https://www.facebook.com/sharer/sharer.php?u=${url}`,
  },
  x: {
    name: 'X',
    href: (url, title) => `https://x.com/intent/post?text=${title}&url=${url}`,
  },
  linkedin: {
    name: 'LinkedIn',
    href: (url) => `https://www.linkedin.com/shareArticle/?url=${url}`,
  },
};
const ALIASES = { twitter: 'x' };

/**
 * @param {string} text authored cell text
 * @returns {string|null} the network key, or null when the text isn't one
 */
function networkKey(text) {
  const key = text.trim().toLowerCase();
  const resolved = ALIASES[key] || key;
  return NETWORKS[resolved] ? resolved : null;
}

function pageUrl() {
  const canonical = document.querySelector('link[rel="canonical"]')?.href;
  return canonical || `${window.location.origin}${window.location.pathname}`;
}

function pageTitle() {
  return document.querySelector('meta[property="og:title"]')?.content || document.title;
}

export default function decorate(block) {
  const cells = [...block.children].map((row) => row.firstElementChild || row);
  const keys = [];
  let labelCell = null;
  cells.forEach((cell) => {
    const key = networkKey(cell.textContent);
    if (key) {
      if (!keys.includes(key)) keys.push(key);
    } else if (!labelCell && cell.textContent.trim()) {
      labelCell = cell;
    }
  });
  if (!keys.length) keys.push(...Object.keys(NETWORKS));

  const url = encodeURIComponent(pageUrl());
  const title = encodeURIComponent(pageTitle());

  const share = document.createElement('div');
  share.className = 'social-share';
  share.setAttribute('role', 'group');

  if (labelCell) {
    const label = document.createElement('p');
    label.className = 'social-title';
    label.textContent = labelCell.textContent.trim();
    share.setAttribute('aria-label', label.textContent);
    share.append(label);
  }

  const list = document.createElement('ul');
  list.className = 'social-icons';
  keys.forEach((key) => {
    const network = NETWORKS[key];
    const li = document.createElement('li');
    const a = document.createElement('a');
    a.className = `social-link social-${key}`;
    a.href = network.href(url, title);
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    a.setAttribute('aria-label', network.name);
    const img = document.createElement('img');
    img.src = `${window.hlx.codeBasePath}/icons/share-${key}.svg`;
    img.alt = '';
    img.loading = 'lazy';
    a.append(img);
    li.append(a);
    list.append(li);
  });
  share.append(list);

  block.replaceChildren(share);
}
