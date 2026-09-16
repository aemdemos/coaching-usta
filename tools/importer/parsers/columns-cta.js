/* eslint-disable */
/* global WebImporter */
/**
 * Parser for columns-cta. Base block: columns.
 * Source: https://www.ustacoaching.com/ (events banner .container--display--flex)
 * Generated for USTA Coaching homepage migration (da project).
 *
 * EDS columns convention: multiple columns; one content row whose cells become
 * side-by-side columns. Here two cells:
 *   - text cell: heading + supporting paragraph
 *   - action cell: the CTA link
 * Target decorate() (blocks/columns-cta/columns-cta.js) classifies a link-only
 * cell as the action and the rest as text.
 */
export default function parse(element, { document }) {
  // Supporting text paragraphs.
  const paras = [...element.querySelectorAll('.cmp-text p, p')].filter((p) => p.textContent.trim());

  // CTA link.
  const cta = element.querySelector('a[href]');

  // Empty-block guard.
  if (!paras.length && !cta) {
    element.replaceWith(...element.childNodes);
    return;
  }

  // Build the text cell: first paragraph is the headline → promote to a
  // heading; remaining paragraphs are supporting copy. Exclude any paragraph
  // inside the CTA link.
  const textParas = paras.filter((p) => !cta || !cta.contains(p));
  const textCell = [];
  if (textParas[0]) {
    const h = document.createElement('h2');
    h.textContent = textParas[0].textContent.trim();
    textCell.push(h);
  }
  textParas.slice(1).forEach((p) => textCell.push(p));

  const actionCell = cta || '';

  const cells = [[textCell.length ? textCell : '', actionCell]];
  const block = WebImporter.Blocks.createBlock(document, { name: 'columns-cta', cells });
  element.replaceWith(block);
}
