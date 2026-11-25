import {
  createOptimizedPicture, decorateBlock, loadBlock, readBlockConfig,
} from '../../scripts/aem.js';
import {
  createBlockElement, currentPagePath, fetchNewsArticles, formatArticleDate,
} from '../../scripts/news.js';

/**
 * Article List — the latest news articles from the news index, newest article date
 * first (source: AEM "Latest Articles" component, .aem-latest-articles-list).
 * Featured articles (metadata `Featured: true`) and the current page are left out,
 * as on the source. Two lists can split the stream: Start 1 / Count 4, then
 * Start 5 / Count 4.
 *
 * | Article List  |
 * | Start | 1     |  first article to show (1 = the newest; default 1)
 * | Count | 4     |  how many (default 4)
 *
 * Renders the site's `Cards (news)` grid (image, arrow, title link, date, description).
 * Nothing to show → the block removes itself.
 * @param {Element} block The block element
 */
export default async function decorate(block) {
  const config = readBlockConfig(block);
  const start = Math.max(1, parseInt(config.start, 10) || 1);
  const count = Math.max(1, parseInt(config.count, 10) || 4);
  block.replaceChildren();

  const current = currentPagePath();
  const articles = (await fetchNewsArticles())
    .filter((a) => !a.featured && a.path !== current)
    .slice(start - 1, start - 1 + count);
  if (!articles.length) {
    block.parentElement.remove();
    return;
  }

  const rows = articles.map((article) => {
    const picture = createOptimizedPicture(article.image, article.imageAlt, false, [{ width: '750' }]);
    const h3 = document.createElement('h3');
    const a = document.createElement('a');
    a.href = article.path;
    a.textContent = article.title;
    h3.append(a);
    const date = document.createElement('p');
    date.textContent = formatArticleDate(article.date);
    const body = [h3, date];
    if (article.description) {
      const p = document.createElement('p');
      p.textContent = article.description;
      body.push(p);
    }
    return [[picture], body];
  });

  const cards = createBlockElement(['cards', 'news'], rows);
  block.append(cards);
  decorateBlock(cards);
  await loadBlock(cards);
}
