/**
 * columns-cta — a horizontal call-to-action banner: a heading and supporting
 * text on one side, a CTA button on the other. Authored as a single row whose
 * cells hold the text and the action link.
 *
 * @param {Element} block the columns-cta block element
 */
export default function decorate(block) {
  const row = block.firstElementChild;
  if (!row) return;

  const cells = [...row.children];
  cells.forEach((cell) => {
    // A cell whose only meaningful content is a link is the CTA action.
    const link = cell.querySelector('a');
    const hasText = !!cell.querySelector('h1, h2, h3, h4, h5, h6, p:not(.button-container)');
    if (link && !hasText) {
      cell.classList.add('columns-cta-action');
    } else {
      cell.classList.add('columns-cta-text');
    }
  });
}
