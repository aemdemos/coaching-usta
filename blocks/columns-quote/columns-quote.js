import { createOptimizedPicture } from '../../scripts/aem.js';

/**
 * columns-quote — a two-column testimonial: a headshot photo beside a quote and
 * its attribution. Authored as a single row with an image cell and a text cell
 * (quote paragraph(s) + attribution).
 *
 * @param {Element} block the columns-quote block element
 */
export default function decorate(block) {
  const row = block.firstElementChild;
  if (!row) return;

  [...row.children].forEach((cell) => {
    const pic = cell.querySelector('picture');
    const hasText = !!cell.querySelector('h1, h2, h3, h4, h5, h6, p, blockquote');
    if (pic && !hasText) {
      cell.classList.add('columns-quote-image');
    } else {
      cell.classList.add('columns-quote-body');
    }
  });

  // The last paragraph in the body is the attribution.
  const body = row.querySelector('.columns-quote-body');
  if (body) {
    const paras = body.querySelectorAll('p');
    if (paras.length > 1) paras[paras.length - 1].classList.add('columns-quote-attribution');
  }

  block.querySelectorAll('.columns-quote-image img').forEach((img) => {
    img.closest('picture').replaceWith(createOptimizedPicture(img.src, img.alt, false, [{ width: '600' }]));
  });
}
