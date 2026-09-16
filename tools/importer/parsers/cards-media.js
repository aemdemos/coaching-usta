/* eslint-disable */
/* global WebImporter */
/**
 * Parser for cards-media. Base block: cards.
 * Source: https://www.ustacoaching.com/ (community benefits grid)
 * Generated for USTA Coaching homepage migration (da project).
 *
 * EDS cards convention: 2 columns, one row per card — image/icon in the first
 * cell, text (heading + description + optional CTA) in the second. Target
 * decorate() (blocks/cards-media/cards-media.js) classifies a lone-picture cell
 * as the image and the rest as the card body.
 *
 * The page-templates selector (`.cmp-container .aem-Grid--4`) matches each card
 * grid individually, so a single element is normally ONE card. We still handle
 * the case where the element wraps several `.aem-Grid--4` card units.
 */
export default function parse(element, { document }) {
  // Determine the card units: nested card grids if present, else the element
  // itself is a single card.
  let cardUnits = [...element.querySelectorAll(':scope > .aem-Grid--4')];
  if (!cardUnits.length) cardUnits = [element];

  const cells = [];
  cardUnits.forEach((card) => {
    const img = card.querySelector('img, picture');
    const imageCell = img ? (img.closest('picture') || img) : '';

    // Body: heading + paragraph(s), preserved as elements.
    const bodyEls = [];
    const heading = card.querySelector('h1, h2, h3, h4, h5, h6');
    if (heading) bodyEls.push(heading);
    [...card.querySelectorAll('p')].forEach((p) => {
      if (p.textContent.trim()) bodyEls.push(p);
    });

    if (imageCell || bodyEls.length) {
      cells.push([imageCell, bodyEls.length ? bodyEls : '']);
    }
  });

  // Empty-block guard.
  if (!cells.length) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const block = WebImporter.Blocks.createBlock(document, { name: 'cards-media', cells });
  element.replaceWith(block);
}
