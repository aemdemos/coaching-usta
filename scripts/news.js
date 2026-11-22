/**
 * News dashboards — shared helpers of the index-driven news blocks (Featured Article,
 * Article List, Article Search, Article Results). Imported by those blocks only, so it
 * loads just on pages that show a news block (news.html, the search results page, and
 * every article through the shared featured-article fragment) — never site-wide.
 * Data: the `news` index (helix-query.yaml → /en/home/news/query-index.json).
 */
import { localePrefix } from './scripts.js';

let newsPromise;
/**
 * The published news articles, from the `news` index (helix-query.yaml →
 * `/en/home/news/query-index.json`), newest article date first — the data source of
 * the news dashboards (Featured Article, Article List, Article Results). Fetched
 * once per page. Each article: { path, title (the page's H1 = the source's displayed
 * title), navTitle, description, image (path), imageAlt, date (YYYY-MM-DD),
 * featured (bool), tags[] }. Rows without an article date are skipped.
 * @returns {Promise<Object[]>}
 */
export function fetchNewsArticles() {
  if (!newsPromise) {
    const url = `${localePrefix() || '/en'}/home/news/query-index.json`;
    newsPromise = (async () => {
      const rows = [];
      try {
        let offset = 0;
        let total = 1;
        while (offset < total) {
          // eslint-disable-next-line no-await-in-loop
          const resp = await fetch(`${url}?offset=${offset}&limit=500`);
          if (!resp.ok) break;
          // eslint-disable-next-line no-await-in-loop
          const json = await resp.json();
          const data = json.data || [];
          rows.push(...data);
          total = Number(json.total) || rows.length;
          if (!data.length) break;
          offset += data.length;
        }
      } catch { /* no index → no articles */ }
      const toPath = (u) => { try { return new URL(u, window.location.href).pathname; } catch { return ''; } };
      const tags = (t) => (Array.isArray(t) ? t : String(t || '').split(','))
        .map((s) => s.trim()).filter(Boolean);
      return rows
        .filter((r) => /^\d{4}-\d{2}-\d{2}$/.test(r.articleDate || '') && r.robots !== 'noindex')
        .map((r) => ({
          path: r.path,
          title: (r.headline || r.title || '').trim(),
          navTitle: (r.navTitle || '').trim(),
          metaTitle: (r.title || '').trim(),
          description: (r.description || '').trim(),
          image: toPath(r.image),
          imageAlt: (r.imageAlt || '').trim(),
          date: r.articleDate,
          featured: r.featured === 'true',
          tags: tags(r.tags),
        }))
        .sort((a, b) => b.date.localeCompare(a.date));
    })();
  }
  return newsPromise;
}

/**
 * The current page's path without the local preview's /content prefix and any
 * .html extension, to compare with index paths.
 * @returns {string}
 */
export function currentPagePath() {
  return window.location.pathname.replace(/^\/content(?=\/)/, '').replace(/\.html$/, '');
}

/**
 * An article date (YYYY-MM-DD) in the page language, e.g. "October 13, 2026".
 * @param {string} date
 * @returns {string}
 */
export function formatArticleDate(date) {
  const [y, m, d] = date.split('-').map(Number);
  const lang = document.documentElement.lang || 'en-US';
  return new Intl.DateTimeFormat(lang, {
    year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC',
  }).format(new Date(Date.UTC(y, m - 1, d)));
}

/**
 * Builds a block element from rows of cells (each cell an array of nodes / strings),
 * ready for decorateBlock + loadBlock (used by the news blocks to render an existing
 * block — cards news, columns media / list — from index data).
 * @param {string[]} classes block name + options, e.g. ['columns', 'media', 'dark']
 * @param {Array<Array<Array<Node|string>>>} rows
 * @returns {HTMLDivElement}
 */
export function createBlockElement(classes, rows) {
  const block = document.createElement('div');
  block.classList.add(...classes);
  rows.forEach((cells) => {
    const row = document.createElement('div');
    cells.forEach((content) => {
      const cell = document.createElement('div');
      cell.append(...content);
      row.append(cell);
    });
    block.append(row);
  });
  return block;
}
