import { getMetadata } from '../../scripts/aem.js';
import { fetchPlaceholders } from '../../scripts/scripts.js';

/**
 * Breadcrumb — "News Home > <current page>" for news articles. Never authored:
 * the news-article template (templates/news-article) auto-builds it.
 *
 *   - Home label + link: the locale's placeholders sheet (`News Home` /
 *     `News Home Link`), e.g. "News Home" → /en/home/news, "Noticias Inicio" →
 *     /es/home/news.
 *   - Current item: page metadata `Breadcrumb Title` (filled by the importer from
 *     the source breadcrumb), falling back to the page's H1.
 *
 * @param {Element} block The block element
 */
export default async function decorate(block) {
  const placeholders = await fetchPlaceholders();
  const homeLabel = placeholders.newsHome;
  const homeLink = placeholders.newsHomeLink;
  const current = getMetadata('breadcrumb-title')
    || document.querySelector('main h1')?.textContent.trim()
    || '';

  const nav = document.createElement('nav');
  if (placeholders.breadcrumbLabel) nav.setAttribute('aria-label', placeholders.breadcrumbLabel);
  const list = document.createElement('ol');

  if (homeLabel) {
    const li = document.createElement('li');
    const a = document.createElement('a');
    a.href = homeLink || '/';
    // trailing space inside the link, like the source markup (part of the gap before " > ")
    a.textContent = `${homeLabel} `;
    li.append(a);
    list.append(li);
  }
  if (current) {
    const li = document.createElement('li');
    li.setAttribute('aria-current', 'page');
    li.textContent = current;
    list.append(li);
  }

  nav.append(list);
  block.replaceChildren(nav);
}
