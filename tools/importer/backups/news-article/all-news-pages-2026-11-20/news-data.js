/* eslint-disable */
/**
 * The source's news article list (page properties the article page doesn't render:
 * Article date, Add this article to featured articles) — exported by
 * export-news-articles.mjs into news-articles.json and bundled into the importers.
 */
import data from './news-articles.json';

export const NEWS_ARTICLES = data.articles;

/** EDS page name of a source/EDS URL (double hyphens collapsed, as EDS normalizes paths) */
export function articleSlug(url) {
  const { pathname } = new URL(url, 'https://www.ustacoaching.com');
  return pathname.split('/').pop().replace(/\.html$/, '').replace(/-{2,}/g, '-');
}

export const articleOf = (url) => NEWS_ARTICLES[articleSlug(url)] || null;

/** featured articles, newest article date first (the source's order) */
export const FEATURED = Object.entries(NEWS_ARTICLES)
  .filter(([, a]) => a.featured)
  .sort(([, a], [, b]) => b.articleDate.localeCompare(a.articleDate))
  .map(([slug, a]) => ({ slug, ...a }));

/** title → EDS path (the featured tile's CTA is a JS button with no href) */
export function pathForTitle(title) {
  const t = (title || '').trim();
  const hit = Object.values(NEWS_ARTICLES).find((a) => a.title === t);
  return hit ? hit.pageUrl.replace(/\.html$/, '').replace(/-{2,}/g, '-') : null;
}
