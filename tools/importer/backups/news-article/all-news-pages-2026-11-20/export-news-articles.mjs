/*
 * Exports the source's news article list (the AEM page properties the news dashboards
 * use) into ONE data file the news importer bundles:
 *   tools/importer/news/news-articles.json
 *
 * Where the data comes from: the source's news components (Featured Article, Latest
 * Articles, Article Search Results) all call ONE AEM servlet,
 *   POST https://www.ustacoaching.com/coaching/news-search.json
 *   body {"filter":"featured"|"not-featured", "path":"/content/coaching/en/home/news",
 *         "sorting":{"sortBy":"articleDate","sortOrder":"desc"}, …}
 * guarded by the public Granite CSRF token (/libs/granite/csrf/token.json). Each article:
 * title, description, pageUrl, image, imageAltText, articleDate (ISO, UTC), tags.
 * `Article date` and `Add this article to featured articles` are page properties that
 * never appear on the article page itself — this servlet is the only place to read them.
 *
 * Output: { exported, source, articles: { <slug>: { articleDate, featured, title, pageUrl,
 *   image, imageAltText, tags } } } — slug = the EDS page name (double hyphens collapsed,
 *   as EDS normalizes paths). articleDate = the US Eastern calendar date (YYYY-MM-DD) the
 *   source displays ("October 13, 2026"). Pages without a date (the search-results page
 *   the servlet also returns) are skipped.
 *
 *   node tools/importer/news/export-news-articles.mjs [--locale en] [--dry-run]
 */
import { writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ORIGIN = 'https://www.ustacoaching.com';
const args = process.argv.slice(2);
const locale = args.includes('--locale') ? args[args.indexOf('--locale') + 1] : 'en';
const dryRun = args.includes('--dry-run');
const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124 Safari/537.36';

async function token() {
  const res = await fetch(`${ORIGIN}/libs/granite/csrf/token.json`, { headers: { 'user-agent': UA } });
  if (!res.ok) throw new Error(`csrf token: ${res.status}`);
  const cookie = (res.headers.getSetCookie?.() || []).map((c) => c.split(';')[0]).join('; ');
  return { token: (await res.json()).token, cookie };
}

async function search(filter, csrf) {
  const path = `/content/coaching/${locale}/home/news`;
  const res = await fetch(`${ORIGIN}/coaching/news-search.json`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'csrf-token': csrf.token,
      'user-agent': UA,
      origin: ORIGIN,
      referer: `${ORIGIN}/${locale}/home/news.html`,
      'x-requested-with': 'XMLHttpRequest',
      ...(csrf.cookie ? { cookie: csrf.cookie } : {}),
    },
    body: JSON.stringify({
      filter, useCache: false, currentPage: path, path, templates: [],
      sorting: { sortOrder: 'desc', sortBy: 'articleDate' },
    }),
  });
  const text = await res.text();
  if (!res.ok || !text.trim().startsWith('{')) throw new Error(`news-search ${filter}: ${res.status} ${text.slice(0, 120)}`);
  return JSON.parse(text).articles || [];
}

/** ISO UTC timestamp → the US Eastern calendar date (the source displays it that way) */
function easternDate(iso) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/New_York', year: 'numeric', month: '2-digit', day: '2-digit',
  }).format(new Date(iso));
  return parts; // en-CA formats as YYYY-MM-DD
}

const slugOf = (pageUrl) => pageUrl.split('/').pop().replace(/\.html$/, '').replace(/-{2,}/g, '-');

const csrf = await token();
const featured = await search('featured', csrf);
const others = await search('not-featured', csrf);
const articles = {};
[[featured, true], [others, false]].forEach(([list, isFeatured]) => {
  list.forEach((a) => {
    if (!a.articleDate) return;
    articles[slugOf(a.pageUrl)] = {
      articleDate: easternDate(a.articleDate),
      featured: isFeatured,
      title: a.title.trim(),
      pageUrl: a.pageUrl,
      image: a.image,
      imageAltText: (a.imageAltText || '').trim(),
      tags: a.tags || [],
    };
  });
});

const out = {
  exported: new Date().toISOString(),
  source: `${ORIGIN}/coaching/news-search.json (${locale})`,
  articles,
};
const file = join(dirname(fileURLToPath(import.meta.url)), locale === 'en' ? 'news-articles.json' : `news-articles-${locale}.json`);
const n = Object.keys(articles).length;
const nf = Object.values(articles).filter((a) => a.featured).length;
if (dryRun) {
  console.log(JSON.stringify(out, null, 2));
} else {
  writeFileSync(file, `${JSON.stringify(out, null, 2)}\n`);
}
console.log(`${n} articles (${nf} featured) → ${dryRun ? '(dry run)' : file}`);
