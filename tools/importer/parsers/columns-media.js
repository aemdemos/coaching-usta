/* eslint-disable */
/* global WebImporter */
/**
 * Parser for columns-media. Base block: columns.
 * Source: https://www.ustacoaching.com/ (quiz-finder / Safe Play promo bands)
 * Generated for USTA Coaching homepage migration (da project).
 *
 * EDS columns convention: multiple columns; one content row whose cells become
 * side-by-side columns. Here: two cells — an image cell and a content cell
 * (heading + paragraph(s) + CTA). decorate() classifies each cell by a lone
 * <picture> vs text, so we keep the authored left→right order.
 */
export default function parse(element, { document }) {
  // The two columns are the two aem-GridColumn children of the inner grid.
  let columns = [...element.querySelectorAll(':scope > .aem-Grid > .aem-GridColumn')];
  if (columns.length < 2) {
    columns = [...element.querySelectorAll('.aem-Grid > .aem-GridColumn')];
  }

  // The source renders responsive duplicates of the same card (desktop / tablet /
  // mobile copies, some hidden via aem-GridColumn--*--hide). A hidden column is
  // dropped when picking CONTENT (so text isn't emitted twice), but the image
  // may only exist as a hidden responsive <img> (desktop uses a CSS background),
  // so media is picked from ALL columns.
  const isHidden = (col) => [...col.classList]
    .some((c) => /^aem-GridColumn--(default|desktop-small)--hide$/.test(c));

  // Classify each column: media (lone image) vs content (text + CTA). Keep only
  // the FIRST media element and the FIRST (visible) content column, so remaining
  // responsive duplicates are ignored.
  let mediaEl = null;
  let mediaIndex = -1;
  let mediaHidden = true;
  const contentEls = [];
  let contentFound = false;
  columns.forEach((col, i) => {
    const img = col.querySelector('img, picture');
    const hasText = col.querySelector('h1, h2, h3, h4, h5, h6, p, a');
    if (img && !hasText) {
      // Prefer a visible image (keeps its alt text); fall back to a hidden
      // responsive copy only when no visible image column exists.
      const hidden = isHidden(col);
      if (!mediaEl || (mediaHidden && !hidden)) {
        mediaEl = img.closest('picture') || img;
        mediaIndex = i;
        mediaHidden = hidden;
      }
    } else if (!contentFound && hasText && !isHidden(col)) {
      const heading = col.querySelector('h1, h2, h3, h4, h5, h6');
      const paras = [...col.querySelectorAll('p')].filter((p) => p.textContent.trim());
      const links = [...col.querySelectorAll('a[href]')];
      if (heading) contentEls.push(heading);
      contentEls.push(...paras);
      contentEls.push(...links);
      contentFound = true;
    }
  });

  // Empty-block guard.
  if (!mediaEl && contentEls.length === 0) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const mediaCell = mediaEl || '';
  const contentCell = contentEls.length ? contentEls : '';

  // Preserve authored order (media may be on the right in some instances).
  const contentFirst = mediaIndex > 0;
  const row = contentFirst ? [contentCell, mediaCell] : [mediaCell, contentCell];

  const cells = [row];
  const block = WebImporter.Blocks.createBlock(document, { name: 'columns-media', cells });
  element.replaceWith(block);
}
