import { buildBlock } from '../../scripts/aem.js';

/**
 * News article template (metadata `Template: news-article`). Runs before the
 * page is decorated: news articles get their breadcrumb automatically (never
 * authored) — a section with a `breadcrumb` block is prepended to main.
 * @param {Element} main The page's main element
 */
export default function decorate(main) {
  // authored blank lines (<p>&nbsp;</p>, kept by the importer next to lists) are
  // plain 24px lines, not padded paragraphs — see news-article.css
  main.querySelectorAll('p').forEach((p) => {
    if (!p.textContent.trim() && !p.querySelector('img, picture, a, iframe')) p.classList.add('blank');
  });
  // a lime link (source: an inline-coloured link) is authored as an italic link — an
  // <em> holding nothing but the link; italic copy that merely contains a link stays as is
  main.querySelectorAll('em').forEach((em) => {
    const a = em.querySelector(':scope > a');
    if (a && em.children.length === 1 && em.textContent.trim() === a.textContent.trim()) em.classList.add('lime-link');
  });
  if (main.querySelector('.breadcrumb')) return;
  const section = document.createElement('div');
  section.append(buildBlock('breadcrumb', ''));
  main.prepend(section);
}
