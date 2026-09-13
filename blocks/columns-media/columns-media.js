import { createOptimizedPicture } from '../../scripts/aem.js';

/**
 * columns-media — a two-column promo: one column holds an image, the other holds
 * text (heading + paragraph + CTA). Authored as a single row with two cells.
 * The image cell can be on either side; the `media-right` option forces the
 * image to the right (text-first) regardless of authored order.
 *
 * @param {Element} block the columns-media block element
 */
export default function decorate(block) {
  const row = block.firstElementChild;
  if (!row) return;

  const cells = [...row.children];

  // Tag each cell as media (contains a picture as its only meaningful content)
  // or content (text + CTA).
  cells.forEach((cell) => {
    const pic = cell.querySelector('picture');
    const hasText = !!cell.querySelector('h1, h2, h3, h4, h5, h6, p:not(.button-container)');
    if (pic && !hasText) {
      cell.classList.add('columns-media-media');
    } else {
      cell.classList.add('columns-media-content');
    }
  });

  // Optimize any images in the media cell(s).
  block.querySelectorAll('.columns-media-media img').forEach((img) => {
    const optimized = createOptimizedPicture(img.src, img.alt, false, [{ width: '900' }]);
    img.closest('picture').replaceWith(optimized);
  });
}
