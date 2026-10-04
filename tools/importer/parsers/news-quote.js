/* eslint-disable */
/* global WebImporter */
/**
 * Parser: news-article pull-quote → `Quote`.
 * Source: a centred `.container` holding a `.text.text--font-family--graphic-semibold`
 * quote (lime) followed by a plain `.text` attribution. The quote block's
 * contract: one cell — quote paragraph first, attribution paragraph(s) after.
 * `element` = the quote text column.
 */
export default function parse(element, { document }) {
  const quote = [...element.querySelectorAll('p')].find((p) => p.textContent.trim());
  if (!quote) return;
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
    cells: [[[q, ...attribution]]],
  });
  const container = element.closest('.container') || element;
  container.replaceWith(block);
}
