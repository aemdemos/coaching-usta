/* eslint-disable */
/* global WebImporter */
/**
 * Parser: news-article pull-quote → `Quote`.
 * Source: a centred `.container` holding a `.text.text--font-family--graphic-semibold`
 * quote (lime) followed by a plain `.text` attribution. The quote block's
 * contract: one cell — quote paragraph first, attribution paragraph(s) after.
 * Blank lines the source authors after the quote (inside the quote component —
 * one quote-size line each, e.g. 32px at desktop) are kept as blank paragraphs
 * between quote and attribution (the importer's nbsp sentinel keeps them alive).
 * `element` = the quote text column.
 */
const NBSP_MARK = '\uE000';
const isBlank = (p) => !p.textContent.replace(/[\s\u00a0\uE000]/g, '') && !p.querySelector('img');

export default function parse(element, { document }) {
  const paras = [...element.querySelectorAll('p')];
  const qi = paras.findIndex((p) => !isBlank(p));
  const quote = paras[qi];
  if (!quote) return;
  const gaps = [];
  for (let i = qi + 1; i < paras.length && isBlank(paras[i]); i += 1) {
    const g = document.createElement('p');
    g.textContent = NBSP_MARK;
    gaps.push(g);
  }
  const attrEl = element.nextElementSibling && element.nextElementSibling.classList.contains('text')
    ? element.nextElementSibling : null;
  const attribution = attrEl ? [...attrEl.querySelectorAll('p')].filter((p) => p.textContent.trim()) : [];

  // the quote block's lime comes from the site convention italic → lime (<em>)
  const q = document.createElement('p');
  const em = document.createElement('em');
  em.textContent = quote.textContent.trim();
  q.append(em);
  const block = WebImporter.Blocks.createBlock(document, {
    name: 'Quote',
    cells: [[[q, ...gaps, ...attribution]]],
  });
  const container = element.closest('.container') || element;
  container.replaceWith(block);
}
