/* eslint-disable */
/* global WebImporter */
/**
 * Parser: news-article text + image row → `Columns (article, media-right|media-left, media-N)`.
 * Source (AEM float grid): a text column (`.container`/`.text`, span 12-N) and an
 * `.image` column (span N) that are SIBLINGS in one `.aem-Grid`. The image span is
 * an editorial choice per row, so it is read straight from the source classes:
 *   aem-GridColumn--default--N        → media-N        (≥1280; stacked below)
 * Max three options by decision: the source's 1024–1279 span (desktop-small) is not
 * carried — ~25% of rows stay side by side there on the source, ours stack.
 * A span-12 image is not a row: it sits full width under/over the text at every
 * width, so it stays default content (text, then the image) — no Columns block.
 * `element` = the image column. Its text partner is the adjacent sibling.
 */
const spanOf = (el, bp) => {
  const m = [...el.classList].map((c) => c.match(new RegExp(`^aem-GridColumn--${bp}--(\\d+)$`))).find(Boolean);
  return m ? Number(m[1]) : null;
};

export default function parse(element, { document }) {
  const img = element.querySelector('img');
  if (!img) return;
  const isText = (el) => el && el.classList && el.classList.contains('aem-GridColumn')
    && (el.classList.contains('text') || el.classList.contains('container'))
    && el.textContent.trim();
  const prev = element.previousElementSibling;
  const next = element.nextElementSibling;
  const textEl = isText(prev) ? prev : (isText(next) ? next : null);
  if (!textEl) return; // a standalone image stays default content
  const textFirst = textEl === prev;

  const n = spanOf(element, 'default');
  if (n === 12) return; // full-width image: default content
  const options = [textFirst ? 'media-right' : 'media-left'];
  if (n) options.push(`media-${n}`);

  // text cell: every heading/paragraph/list in the text column, in order
  const content = [...textEl.querySelectorAll('h1, h2, h3, h4, h5, h6, p, ul, ol')]
    .filter((e) => !e.parentElement.closest('h1, h2, h3, h4, h5, h6, p, ul, ol'))
    .filter((e) => e.textContent.trim() || e.querySelector('img'));
  const picture = img.closest('picture') || img;
  const row = textFirst ? [content, picture] : [picture, content];

  const block = WebImporter.Blocks.createBlock(document, {
    name: `Columns (${['article', ...options].join(', ')})`,
    cells: [row],
  });
  textEl.replaceWith(block);
  element.remove();
}
