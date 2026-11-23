import {
  createOptimizedPicture, decorateBlock, loadBlock, toClassName,
} from '../../scripts/aem.js';
import { createBlockElement, fetchNewsArticles } from '../../scripts/news.js';
import { readSearchHash } from '../article-search/article-search.js';

/**
 * Article Results — the news search results (source: AEM "Article Search Results",
 * .aem-article-search-results). Reads the search from the URL hash (written by the
 * Article Search block, source format `#text=…&topic-id=…&topic-title=…`) and lists
 * the matching articles of the news index as the site's `Columns (list)` tiles, a
 * page at a time. Re-runs when the hash changes. No search → every article, no
 * heading (as the source).
 *
 * Matching (reproduces the source's AEM full-text search, verified on "coach" = the
 * same 30 articles): every search word must appear as a whole word (case-insensitive,
 * split on anything that isn't a letter or digit, so "Coach’s" matches "coach") in
 * the title, page title, navigation title or description. A topic other than All
 * keeps the articles tagged with it (page `Tags`).
 *
 * | Article Results                                        |
 * | Title         | Results for                            |  "<n> Results for "<words>, <topic>""
 * | Sort Label    | Sort by:                               |
 * | Sort          | Newest to Oldest | desc                |  repeatable; the first is the default
 * | Sort          | Oldest to Newest | asc                 |
 * | Page Size     | 10                                     |
 * | Show More     | Show More                              |
 * | Button        | Read Article                           |  tile CTA label
 * | Empty Message | No results found for the specified criteria |
 */

const words = (s) => (String(s || '').toLowerCase().match(/[\p{L}\p{N}]+/gu) || []);

function matches(article, terms, topicId) {
  if (topicId && topicId !== 'all' && !article.tags.some((t) => toClassName(t) === topicId)) return false;
  if (!terms.length) return true;
  const have = new Set(words([article.title, article.metaTitle, article.navTitle, article.description].join(' ')));
  return terms.every((t) => have.has(t));
}

function tile(article, label) {
  const picture = createOptimizedPicture(article.image, article.imageAlt, false, [{ width: '750' }]);
  const title = document.createElement('p');
  const titleLink = document.createElement('a');
  titleLink.href = article.path;
  titleLink.textContent = article.title;
  title.append(titleLink);
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
  return createBlockElement(['columns', 'list'], [[[picture], content]]);
}

/**
 * @param {Element} block The block element
 */
export default async function decorate(block) {
  const config = {};
  const sorts = [];
  [...block.children].forEach((row) => {
    const cells = [...row.children];
    const key = toClassName(cells[0]?.textContent || '');
    if (key === 'sort') {
      const title = cells[1]?.textContent.trim();
      const order = /asc|old/i.test(cells[2]?.textContent || '') ? 'asc' : 'desc';
      if (title) sorts.push({ title, order });
    } else if (key) {
      config[key] = (cells[1]?.textContent || '').trim();
    }
  });
  if (!sorts.length) sorts.push({ title: '', order: 'desc' });
  const pageSize = Math.max(1, parseInt(config['page-size'], 10) || 10);

  const top = document.createElement('div');
  top.className = 'article-results-top';
  const heading = document.createElement('p');
  heading.className = 'article-results-title';
  heading.setAttribute('aria-live', 'polite');
  const sort = document.createElement('select');
  sort.className = 'article-results-sort';
  if (config['sort-label']) sort.setAttribute('aria-label', config['sort-label']);
  sorts.forEach((s, i) => {
    const option = document.createElement('option');
    option.value = String(i);
    option.textContent = [config['sort-label'], s.title].filter(Boolean).join(' ');
    sort.append(option);
  });
  top.append(heading);
  if (sorts.length > 1) top.append(sort);

  const list = document.createElement('div');
  list.className = 'article-results-list';
  const empty = document.createElement('p');
  empty.className = 'article-results-empty';
  empty.textContent = config['empty-message'] || '';
  empty.hidden = true;
  const more = document.createElement('div');
  more.className = 'article-results-more';
  const moreButton = document.createElement('button');
  moreButton.type = 'button';
  moreButton.textContent = config['show-more'] || '';
  more.append(moreButton);
  more.hidden = true;
  block.replaceChildren(top, list, empty, more);

  const all = await fetchNewsArticles();
  let results = [];
  let shown = 0;

  const showNext = async () => {
    const next = results.slice(shown, shown + pageSize);
    shown += next.length;
    const tiles = next.map((a) => tile(a, config.button));
    list.append(...tiles);
    tiles.forEach((t) => decorateBlock(t));
    more.hidden = shown >= results.length;
    await Promise.all(tiles.map((t) => loadBlock(t)));
  };

  const run = async () => {
    const q = readSearchHash();
    const searched = /(^|[#&])(text|topic-id)=/.test(window.location.hash);
    const terms = words(q.text);
    const { order } = sorts[Number(sort.value) || 0];
    results = all.filter((a) => matches(a, terms, q.topicId));
    if (order === 'asc') results.reverse();
    heading.textContent = searched
      ? `${results.length} ${config.title || ''} "${[q.text, q.topicTitle].filter(Boolean).join(', ')}"`
      : '';
    // (no search: the heading stays in place, empty — as on the source, it keeps the
    // sort picker on the right and the row's 15px gap on phones)
    empty.hidden = results.length > 0;
    list.replaceChildren();
    shown = 0;
    await showNext();
  };

  moreButton.addEventListener('click', showNext);
  sort.addEventListener('change', run);
  window.addEventListener('hashchange', run);
  await run();
}
