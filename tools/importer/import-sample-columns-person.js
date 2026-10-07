/* eslint-disable */
/* global WebImporter */

/**
 * Block-sample importer — drafts/block-samples/columns-person.
 * Input: https://www.ustacoaching.com/en/home/news/coaches-reveal-their-game-changing-goals-for-2026.html
 *
 * Runs the news-article importer on the source page (so the sample shows exactly what
 * articles produce) and keeps three real person rows (each draws its own divider line):
 *   - Erin Wilson   — goals as a real numbered list (media-3)
 *   - Tony Mulé     — goals as typed "1. …" paragraphs, indented (media-3)
 *   - Larry Dillon  — header ending on the role line (location styled like the role) (media-5)
 * plus a short description of the authoring contract, in a bordered section.
 */
import news from './import-news-article-v1.js';

const SOURCE = 'https://www.ustacoaching.com/en/home/news/coaches-reveal-their-game-changing-goals-for-2026.html';
const PEOPLE = ['Erin Wilson', 'Tony Mul', 'Larry Dillon'];

const blockName = (t) => (t.querySelector('tr > th, tr > td')?.textContent || '').trim();
const el = (document, tag, html) => { const e = document.createElement(tag); e.innerHTML = html; return e; };

export default {
  onLoad: news.onLoad,
  transform: (payload) => {
    const { document } = payload;
    const [{ element: article }] = news.transform(payload);
    const tables = [...article.querySelectorAll('table')];
    const rows = PEOPLE.map((name) => tables.find((t) => /^Columns \(person/i.test(blockName(t)) && t.textContent.includes(name)));
    const gap = (d, m) => WebImporter.Blocks.createBlock(document, { name: 'Spacer', cells: [['desktop', `${d}px`], ['mobile', `${m}px`]] });

    const out = document.createElement('div');
    out.append(
      gap(80, 60),
      el(document, 'h1', 'Columns (person)'),
      el(document, 'p', 'News-article row for a person: an article row (same <code>media-right</code> / <code>media-left</code>, <code>media-N</code> contract and layout) whose text cell starts with a person header. Authored as <code>columns (person, media-right, media-N)</code> — three options.'),
      el(document, 'p', 'The <strong>first three paragraphs</strong> are the header: name (lime 22px bold), role (lime 18px), location (lime 16px), with no gaps between the lines and 40px below; a header with only two lines ends on the role (24px below). The goals follow as a numbered list or as indented paragraphs (a blockquote). Below 1024 the row stacks (text, then photo); at 1024–1279 the photo sits beside the text and the goals flow around it; from 1280 text and photo sit side by side at N/12.'),
      el(document, 'p', 'Each person row draws the source\'s visible divider above itself — a 42px band with a 2px gray rule — except directly under the article title. No spacer block is needed.'),
      el(document, 'p', `<em>Source: <a href="${SOURCE}">coaches-reveal-their-game-changing-goals-for-2026</a></em>`),
      gap(40, 24),
      document.createElement('hr'),
    );
    rows.filter(Boolean).forEach((r) => out.append(r));
    out.append(
      WebImporter.Blocks.createBlock(document, { name: 'Section Metadata', cells: { Style: 'bordered' } }),
      document.createElement('hr'),
      gap(80, 60),
      WebImporter.Blocks.createBlock(document, { name: 'Metadata', cells: { Title: 'Columns (person) — Block Sample', Robots: 'noindex, nofollow' } }),
    );
    WebImporter.rules.adjustImageUrls(out, SOURCE, SOURCE);
    return [{ element: out, path: '/drafts/block-samples/columns-person', report: { template: 'block-sample' } }];
  },
};
