import {
  createOptimizedPicture, decorateBlock, loadBlock, readBlockConfig,
} from '../../scripts/aem.js';
import {
  createBlockElement, currentPagePath, fetchNewsArticles,
} from '../../scripts/news.js';

/**
 * Featured Article — one featured news story, picked from the news index
 * (source: AEM "Featured Article" component, .aem-featured-article).
 *
 * Authors mark an article as featured with its page metadata `Featured: true`; the
 * featured articles are ordered newest article date first. This block shows the
 * Nth of them (`Item`, 1 = the newest), skipping the page it sits on (so an
 * article never features itself — the source rule). Nothing to show → the block
 * removes itself.
 *
 * | Featured Article (options)  |
 * | Item       | 1              |  position in the featured list (default 1)
 * | Button     | Read More      |  CTA label
 * | Background | #A4EE90        |  optional colour of the text panel (black text)
 *
 * Options: `display` — the source's "Default" view (title in the display face from
 * 768); `media-right` — image on the right (from 1024). Renders the site's
 * `Columns (media, dark)` tile (the same tile as the article footer).
 * @param {Element} block The block element
 */
export default async function decorate(block) {
  const config = readBlockConfig(block);
  const item = Math.max(1, parseInt(config.item, 10) || 1);
  const label = (config.button || '').trim();
  const background = (config.background || '').trim();
  block.replaceChildren();

  const current = currentPagePath();
  const featured = (await fetchNewsArticles()).filter((a) => a.featured && a.path !== current);
  const article = featured[item - 1];
  if (!article) {
    block.parentElement.remove();
    return;
  }

  const picture = createOptimizedPicture(article.image, article.imageAlt, false, [{ width: '900' }]);
  const title = document.createElement('h2');
  title.textContent = article.title;
  const content = [title];
  if (article.description) {
    const p = document.createElement('p');
    p.textContent = article.description;
    content.push(p);
  }
  if (label) {
    const p = document.createElement('p');
    const a = document.createElement('a');
    a.href = article.path;
    a.textContent = label;
    a.setAttribute('aria-label', `${label}: ${article.title}`);
    p.append(a);
    content.push(p);
  }

  const classes = ['columns', 'media', 'dark'];
  if (block.classList.contains('media-right')) classes.push('media-right');
  const tile = createBlockElement(classes, [[[picture], content]]);
  // a validated CSS colour only (hex / rgb() / a colour name) — authored input
  if (background && /^(#[0-9a-f]{3,8}|rgba?\([\d\s.,%]+\)|[a-z]+)$/i.test(background)) {
    block.classList.add('has-background');
    block.style.setProperty('--featured-article-background', background);
  }
  block.append(tile);
  decorateBlock(tile);
  await loadBlock(tile);
}
