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
  // the quote's own container (quote + attribution only) goes with it; inside a larger
  // container (the article body) the quote stands alone (the next text is body copy)
  const container = element.parentElement && element.parentElement.closest('.container');
  const own = !!container && container.querySelectorAll('.aem-GridColumn').length <= 2 && !container.querySelector('.container');
  const attrEl = own && element.nextElementSibling && element.nextElementSibling.classList.contains('text')
    ? element.nextElementSibling : null;
  const attribution = attrEl ? [...attrEl.querySelectorAll('p')].filter((p) => p.textContent.trim()) : [];

  // the quote block's lime comes from the site convention italic → lime (<em>)
  const q = document.createElement('p');
  const em = document.createElement('em');
  em.textContent = quote.textContent.trim();
  q.append(em);
  // oversized quote marks typed around the quote (source spans at 64px) → `Quote (marks)`
  const marks = [...quote.querySelectorAll('span[style]')].some((sp) => /font-size:\s*6\d/.test(sp.getAttribute('style')));
  const block = WebImporter.Blocks.createBlock(document, {
    name: marks ? 'Quote (marks)' : 'Quote',
    cells: [[[q, ...gaps, ...attribution]]],
  });
  (own ? container : element).replaceWith(block);
}
