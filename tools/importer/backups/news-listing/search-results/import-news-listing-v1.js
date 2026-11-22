/* eslint-disable */
/* global WebImporter */

/**
 * Importer — the news dashboards (catalog template `listing-hub`, news pages):
 *   /en/home/news.html                 (News & Updates)
 *   /en/home/news/search-results.html  (Search Results)
 * EDS template: landing-page (same source text / button components), so this importer RUNS
 * THE LANDING IMPORTER and only adds the news components in front of its KINDS. The
 * source components are Vue widgets fed by an AEM servlet; on EDS they are index-driven
 * blocks (data: helix-query.yaml → /en/home/news/query-index.json):
 *   - .aem-featured-article     (v-featured-article)        → Featured Article
 *       view "default" → option `display`; image-position "right" → `media-right`;
 *       Item = displayed-item-number + 1; Button = button-text; Background = background-color
 *   - .aem-latest-articles-list (v-latest-articles-list)    → Article List (Start = offset + 1,
 *       Count = limit)
 *   - .aem-search-bar           (v-search-bar)              → Article Search (labels, the results
 *       page = redirect-page or the current page, All label, topics)
 *   - .aem-article-search-results (v-article-search-results) → Article Results (title, sorters,
 *       page size, Show More, tile button = the article template's articleButtonText,
 *       empty message)
 *   - .breadcrumb (core breadcrumb)                         → Breadcrumb (+ metadata
 *       Breadcrumb Title = the source's current item)
 * The widgets' settings are Vue props in the page HTML, which Vue replaces on mount, so
 * onLoad re-reads the raw page HTML (same-origin GET) and copies each widget's props onto
 * its live component (`data-news-props`, in document order).
 */
import landing, {
  KINDS, block, el, norm, buttonEl, comps, isButton,
} from './import-landing-page-v1.js';

const SOURCE_ROOT = /^\/content\/coaching(?=\/)/;
const toEdsPath = (p) => (p || '').replace(SOURCE_ROOT, '').replace(/\.html$/, '');
const props = (c) => { try { return JSON.parse(c.getAttribute('data-news-props') || '{}'); } catch (e) { return {}; } };
const comp = (s, sel) => (s.matches && s.matches(sel) ? s : s.querySelector(sel));
const link = (document, href) => { const a = el(document, 'a'); a.href = href; a.textContent = href; return a; };
const text = (html) => { const d = document.createElement('div'); d.innerHTML = html || ''; return norm(d.textContent); };

const NEWS_KINDS = [
  {
    name: 'featured-article',
    match: (s) => !!comp(s, '.aem-featured-article'),
    // (a button sharing the section — news.html "See More" under the last tile — follows it)
    emit: (s, { document, pagePath }) => [...[...s.querySelectorAll('.aem-featured-article'), ...(s.matches('.aem-featured-article') ? [s] : [])].map((c) => {
      const p = props(c);
      const opts = [p.view === 'default' ? 'display' : '', p['image-position'] === 'right' ? 'media-right' : ''].filter(Boolean);
      const rows = [['Item', String((Number(p[':displayed-item-number']) || 0) + 1)]];
      if (p['button-text'] && p[':hide-button'] !== 'true') rows.push(['Button', p['button-text']]);
      if (p['background-color']) rows.push(['Background', p['background-color']]);
      return block(document, opts.length ? `Featured Article (${opts.join(', ')})` : 'Featured Article', rows);
    }), ...comps(s).filter(isButton).map((b) => buttonEl(b, document, pagePath)).filter(Boolean)],
  },
  {
    name: 'article-list',
    match: (s) => !!comp(s, '.aem-latest-articles-list'),
    emit: (s, { document }) => [...s.querySelectorAll('.aem-latest-articles-list'), ...(s.matches('.aem-latest-articles-list') ? [s] : [])].map((c) => {
      const p = props(c);
      return block(document, 'Article List', [
        ['Start', String((Number(p[':offset']) || 0) + 1)],
        ['Count', String(Number(p[':limit']) || 4)],
      ]);
    }),
  },
  {
    name: 'article-search',
    match: (s) => !!comp(s, '.aem-search-bar'),
    emit: (s, { document, pagePath }) => {
      const p = props(comp(s, '.aem-search-bar'));
      const results = toEdsPath(p['redirect-page']) || pagePath;
      const rows = [
        ['Label', p['aria-label'] || ''],
        ['Placeholder', p['placeholder-text'] || ''],
        ['Button', p['button-label'] || ''],
        ['Results Page', link(document, results)],
        ['All Topics', p['all-topics-label'] || ''],
      ];
      let topics = [];
      try { topics = JSON.parse(p[':topics'] || '[]'); } catch (e) { topics = []; }
      topics.forEach((t) => { const title = typeof t === 'string' ? t : (t.title || t.label || t.name || ''); if (title) rows.push(['Topic', title]); });
      return [block(document, 'Article Search', rows.filter((r) => r[1]))];
    },
  },
  {
    // the results widget shares its source section with the breadcrumb above it
    name: 'article-results',
    match: (s) => !!comp(s, '.aem-article-search-results'),
    emit: (s, { document }) => {
      const out = [];
      if (comp(s, '.cmp-breadcrumb')) out.push(block(document, 'Breadcrumb', [['']]));
      const c = comp(s, '.aem-article-search-results');
      const p = props(c);
      let sorters = [];
      let templates = [];
      try { sorters = JSON.parse(p[':sorters'] || '[]'); } catch (e) { sorters = []; }
      try { templates = JSON.parse(p[':templates'] || '[]'); } catch (e) { templates = []; }
      // the default sorter first
      sorters.sort((a, b) => (b.appliedByDefault === 'true') - (a.appliedByDefault === 'true'));
      const sortLabel = norm((c.querySelector('.v-article-search-results__sorting-button') || {}).textContent || '').split(':')[0];
      const article = templates.find((t) => /article-page$/.test(t.templatePath || '')) || templates[0] || {};
      const rows = [['Title', p.title || '']];
      if (sortLabel) rows.push(['Sort Label', `${sortLabel}:`]);
      sorters.forEach((x) => rows.push(['Sort', x.sorterTitle || '', x.sortOrder || 'desc']));
      rows.push(['Page Size', String(Number(p[':page-size']) || 10)]);
      rows.push(['Show More', p['pagination-button-text'] || '']);
      rows.push(['Button', article.articleButtonText || '']);
      rows.push(['Empty Message', text(p['empty-message'])]);
      out.push(block(document, 'Article Results', rows.filter((r) => r[1])));
      return out;
    },
  },
];
KINDS.unshift(...NEWS_KINDS);

const WIDGETS = [
  ['v-featured-article', '.aem-featured-article'],
  ['v-latest-articles-list', '.aem-latest-articles-list'],
  ['v-search-bar', '.aem-search-bar'],
  ['v-article-search-results', '.aem-article-search-results'],
];

export default {
  onLoad: (payload) => {
    const { document } = payload;
    // the widgets' Vue props from the raw page HTML (Vue replaced the elements on mount)
    try {
      const xhr = new (document.defaultView || window).XMLHttpRequest();
      xhr.open('GET', document.location.href.split('#')[0], false);
      xhr.send();
      const raw = new DOMParser().parseFromString(xhr.responseText, 'text/html');
      WIDGETS.forEach(([tag, sel]) => {
        const live = [...document.querySelectorAll(sel)];
        [...raw.querySelectorAll(tag)].forEach((v, i) => {
          if (!live[i]) return;
          const o = {};
          [...v.attributes].forEach((a) => { o[a.name] = a.value; });
          live[i].setAttribute('data-news-props', JSON.stringify(o));
        });
      });
    } catch (e) { /* props stay empty → block defaults */ }
    // the source breadcrumb's current item → metadata Breadcrumb Title (transform)
    const crumb = document.querySelector('main .cmp-breadcrumb__item--active, .cmp-breadcrumb__item--active');
    if (crumb) document.body.setAttribute('data-breadcrumb-title', norm(crumb.textContent));
    landing.onLoad(payload);
  },
  transform: (payload) => {
    const crumb = payload.document.body.getAttribute('data-breadcrumb-title');
    const out = landing.transform(payload);
    if (crumb) {
      out.forEach(({ element }) => {
        const meta = [...element.querySelectorAll('table')].find((t) => /^metadata$/i.test(norm(t.rows[0] && t.rows[0].textContent)));
        if (!meta) return;
        const tr = payload.document.createElement('tr');
        [payload.document.createElement('td'), payload.document.createElement('td')].forEach((td, i) => { td.textContent = i ? crumb : 'Breadcrumb Title'; tr.append(td); });
        (meta.tBodies[0] || meta).append(tr);
      });
    }
    return out;
  },
};
