import { createOptimizedPicture } from '../../scripts/aem.js';

/**
 * columns — a two-column layout. Three variants share this block:
 *   • default : generic N-column layout (boilerplate).
 *   • media   : image beside text (heading + paragraph + CTA); `media-right`
 *               forces the image to the right (text-first).
 *   • quote   : headshot beside a testimonial quote + attribution.
 * The variant is authored as a class on the block (e.g. `columns (media)`), so
 * we dispatch on it here and keep each variant's own inner class names.
 *
 * @param {Element} block the columns block element
 */
function decorateMedia(block) {
  const row = block.firstElementChild;
  if (!row) return;

  // Tag each cell as media (a picture as its only meaningful content) or content
  // (text + CTA).
  [...row.children].forEach((cell) => {
    const pic = cell.querySelector('picture');
    const hasText = !!cell.querySelector('h1, h2, h3, h4, h5, h6, p:not(.button-container)');
    if (pic && !hasText) {
      cell.classList.add('columns-media-media');
    } else {
      cell.classList.add('columns-media-content');
    }
  });

  block.querySelectorAll('.columns-media-media img').forEach((img) => {
    img.closest('picture').replaceWith(createOptimizedPicture(img.src, img.alt, false, [{ width: '900' }]));
  });
}

function decorateQuote(block) {
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

function decorateDefault(block) {
  const cols = [...block.firstElementChild.children];
  block.classList.add(`columns-${cols.length}-cols`);

  // setup image columns
  [...block.children].forEach((row) => {
    [...row.children].forEach((col) => {
      const pic = col.querySelector('picture');
      if (pic) {
        const picWrapper = pic.closest('div');
        if (picWrapper && picWrapper.children.length === 1) {
          // picture is only content in column
          picWrapper.classList.add('columns-img-col');
        }
      }
    });
  });
}

export default function decorate(block) {
  if (block.classList.contains('media')) decorateMedia(block);
  else if (block.classList.contains('quote')) decorateQuote(block);
  else decorateDefault(block);
}
