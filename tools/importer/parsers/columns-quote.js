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
  // Columns convention: one content row with two cells (→ two side-by-side
  // columns). Here:
  //   - cell 1: the headshot PORTRAIT image
  //   - cell 2: the decorative quote-mark glyph, then the quote paragraph, then
  //             the attribution paragraphs (name, role)
  // The white-bordered card (`element`) holds the glyph + text; the portrait is a
  // SIBLING image column in the same grid row, so scan the parent grid too. Fall
  // back to the card itself if no sibling grid exists.
  const grid = element.parentElement || element;
  const scope = grid.querySelector('img') ? grid : element;
  const imgs = [...scope.querySelectorAll('img')];
  const isQuoteGlyph = (img) => {
    const src = (img.getAttribute('src') || '').toLowerCase();
    const alt = (img.getAttribute('alt') || '').toLowerCase();
    return src.includes('quote') || alt.includes('quote');
  };
  const portrait = imgs.find((img) => !isQuoteGlyph(img));
  const glyph = imgs.find((img) => isQuoteGlyph(img));

  const photoCell = portrait ? (portrait.closest('picture') || portrait) : '';

  // quote/attribution paragraphs live inside the card (`element`)
  const paras = [...element.querySelectorAll('.cmp-text p, p')].filter((p) => p.textContent.trim());
  const glyphEl = glyph ? (glyph.closest('picture') || glyph) : null;
  const cardCell = [glyphEl, ...paras].filter(Boolean);

  // Empty-block guard.
  if (!photoCell && !cardCell.length) {
    element.replaceWith(...element.childNodes);
    return;
  }

  // Second row = the two columns. First row (the block name) is added by createBlock.
  const cells = [[photoCell, cardCell.length ? cardCell : '']];
  const block = WebImporter.Blocks.createBlock(document, { name: 'columns-quote', cells });
  element.replaceWith(block);
}
