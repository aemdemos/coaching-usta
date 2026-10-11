/* eslint-disable */
/* global WebImporter */

/**
 * Block-sample importer for the news-article blocks added in the parity pass —
 * drafts/block-samples/<sample>. Runs the news-article importer on a real source
 * article (so each sample shows exactly what articles produce) and keeps the blocks
 * of one kind, with a short description of the authoring contract. The samples use the
 * news-article template, so they render exactly as inside an article.
 *
 * One source URL → one sample page (see SAMPLES):
 *   - columns-grid         Columns (grid)          side by side from 1280 (advantage cards)
 *   - columns-grid-tablet  Columns (grid, tablet)  side by side from 768 (college icon cards)
 *   - columns-grid-mobile  Columns (grid, mobile)  always side by side (sportimes photos)
 *   - columns-article-embed Columns (article, …) with an embedded LinkedIn post (jack-and-jill)
 *   - text-style-label / -center / -large / -intro  Text Style (…)
 *   - quote-marks          Quote (marks)
 */
import news from './import-news-article-v1.js';

const BASE = 'https://www.ustacoaching.com/en/home/news/';
const SAMPLES = {
  'advantage-coaches-celebrating-one-year-of-usta-coaching': {
    path: 'columns-grid', title: 'Columns (grid)', pick: /^Columns \(grid\)$/i,
    about: 'Two or more cards or photos side by side, one cell each, equal widths — the source\'s sibling columns (here 3 × 4/12 and 2 × 4/12 cards: photo, heading, copy). Stacked below 1280, side by side from 1280. An empty cell keeps an empty column\'s width (2 of 3 columns used).',
  },
  'how-usta-coaching-benefits-college-tennis-coaches': {
    path: 'columns-grid-tablet', title: 'Columns (grid, tablet)', pick: /^Columns \(grid, tablet\)$/i,
    about: 'Side by side from 768 (`tablet`), stacked on phones. A text cell whose first line starts with a small image shows it as the card icon, 10px left of the copy (source: the text component image).',
  },
  'sportimes-playbook-for-the-modern-tennis-coach': {
    path: 'columns-grid-mobile', title: 'Columns (grid, mobile)', pick: /^Columns \(grid, mobile\)$/i,
    about: 'Side by side at every width (`mobile`): here three photos, 4/12 each. Photos keep their own height (top-aligned).',
  },
  'jack-and-jill-usta-coaching-tennis-for-black-families': {
    path: 'columns-article-embed', title: 'Columns (article) — embedded post', pick: /^Columns \(article, media.left/i,
    about: 'An article row whose photo cell holds a link to an embedded post (LinkedIn) instead of a photo; the link\'s #WIDTHxHEIGHT gives the post size (full cell width up to 1023px). Stacked, the text comes first.',
  },
  'usta-coaching-wecoach': {
    path: 'text-style-label', title: 'Text Style (label)', pick: /^Text Style \(label\)$/i,
    about: 'A short label line: Graphik Semibold 24/32, uppercase (source text style `label-style`).',
  },
  'how-usta-coaching-benefits-college-tennis-coaches#center': {
    path: 'text-style-center', title: 'Text Style (center)', pick: /^Text Style \(center\)$/i,
    about: 'Body copy, centred (source text alignment `center`).',
  },
  'usta-coaching-online-learning-hub-is-live': {
    path: 'text-style-large', title: 'Text Style (large)', pick: /^Text Style \(large\)$/i,
    about: 'A 25px line (source: a paragraph set to 25px); bold copy stays bold.',
  },
  'women-in-coaching-advancing-female-tennis-coach-development': {
    path: 'text-style-intro', title: 'Text Style (intro)', pick: /^Text Style \(intro\)$/i,
    about: 'A centred lime lead-in on 10 of 12 columns: Graphik Semibold 16 → 18 @1024 → 24 @1280 (source: semibold `24px-16px`, centred).',
  },
  'how-coach-developer-lois-arterberry-is-shaping-the-future-of-coaching': {
    path: 'quote-marks', title: 'Quote (marks)', pick: /^Quote \(marks\)$/i,
    about: 'A pull-quote whose opening and closing quote marks are set large (64px), as typed on the source.',
  },
};

const blockName = (t) => (t.querySelector('tr > th, tr > td')?.textContent || '').trim();
const el = (document, tag, html) => { const e = document.createElement(tag); e.innerHTML = html; return e; };

export default {
  onLoad: news.onLoad,
  transform: (payload) => {
    const { document, params } = payload;
    const url = new URL(params.originalURL);
    const key = `${url.pathname.split('/news/')[1].replace(/\.html$/, '')}${url.hash}`;
    const cfg = SAMPLES[key];
    if (!cfg) throw new Error(`no sample configured for ${key}`);
    const source = `${BASE}${key.split('#')[0]}.html`;
    const [{ element: article }] = news.transform({ ...payload, params: { ...params, originalURL: source } });
    const picked = [...article.querySelectorAll('table')].filter((t) => cfg.pick.test(blockName(t)));
    if (!picked.length) throw new Error(`no ${cfg.pick} block in ${key}`);
    const gap = (d, m) => WebImporter.Blocks.createBlock(document, { name: 'Spacer', cells: [['desktop', `${d}px`], ['mobile', `${m}px`]] });

    const out = document.createElement('div');
    out.append(
      gap(80, 60),
      el(document, 'h1', cfg.title),
      el(document, 'p', cfg.about),
      el(document, 'p', `<em>Source: <a href="${source}">${key.split('#')[0]}</a></em>`),
      gap(40, 24),
      document.createElement('hr'),
      ...picked,
      WebImporter.Blocks.createBlock(document, { name: 'Section Metadata', cells: { Style: 'bordered' } }),
      document.createElement('hr'),
      gap(80, 60),
      WebImporter.Blocks.createBlock(document, { name: 'Metadata', cells: { Title: `${cfg.title} — Block Sample`, Template: 'news-article', Robots: 'noindex, nofollow' } }),
    );
    WebImporter.rules.adjustImageUrls(out, source, source);
    return [{ element: out, path: `/drafts/block-samples/${cfg.path}`, report: { template: 'block-sample' } }];
  },
};
