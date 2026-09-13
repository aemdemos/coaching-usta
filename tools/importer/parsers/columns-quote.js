/* eslint-disable */
/* global WebImporter */
/**
 * Parser for columns-quote. Base block: columns.
 * Source: https://www.ustacoaching.com/ (success-story testimonials)
 * Generated for USTA Coaching homepage migration (da project).
 *
 * EDS columns convention: multiple columns; one content row whose cells become
 * side-by-side columns. Here two cells:
 *   - image cell: headshot / portrait
 *   - body cell: quote paragraph(s) followed by an attribution paragraph
 * Target decorate() (blocks/columns-quote/columns-quote.js) classifies a
 * lone-picture cell as the image, and marks the last <p> in the body as the
 * attribution. The source may include a decorative quote-mark SVG plus the
 * portrait; we prefer a non-quote image for the image cell.
 */
export default function parse(element, { document }) {
  // Portrait / headshot image. Skip decorative quote-mark SVGs by alt/src hint.
  const imgs = [...element.querySelectorAll('img')];
  const portrait = imgs.find((img) => {
    const src = (img.getAttribute('src') || '').toLowerCase();
    const alt = (img.getAttribute('alt') || '').toLowerCase();
    return !src.includes('quote') && !alt.includes('quote');
  });
  const imageEl = portrait || imgs[0] || null;
  const imageCell = imageEl ? (imageEl.closest('picture') || imageEl) : '';

  // Body: all meaningful paragraphs (quote text + attribution lines).
  const paras = [...element.querySelectorAll('.cmp-text p, p')].filter((p) => p.textContent.trim());

  // Empty-block guard.
  if (!imageCell && !paras.length) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const bodyCell = paras.length ? paras : '';

  const cells = [[imageCell, bodyCell]];
  const block = WebImporter.Blocks.createBlock(document, { name: 'columns-quote', cells });
  element.replaceWith(block);
}
