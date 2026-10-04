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
  if (main.querySelector('.breadcrumb')) return;
  const section = document.createElement('div');
  section.append(buildBlock('breadcrumb', ''));
  main.prepend(section);
}
