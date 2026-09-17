import { createOptimizedPicture } from '../../scripts/aem.js';

/**
 * columns — a two-column layout. Three variants share this block:
 *   • default : generic N-column layout (boilerplate).
 *   • media   : image beside text (heading + paragraph + CTA); `media-right`
 *               forces the image to the right (text-first).
 *   • feature : image beside a bordered text card (heading + paragraph), both
 *               inside a dark rounded panel (the Women's Coaching Cohort promo).
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

/*
 * quote (SUCCESS STORIES) — a two-column row: a HEADSHOT photo on the left and a
 * bordered rounded CARD on the right. The card stacks a large blue quote glyph on
 * top, the quote itself, and the attribution (name + role) below it.
 *
 * Authoring model (two cells in one row):
 *   - cell 1: the headshot picture (portrait)
 *   - cell 2: the blue quote-mark glyph picture, then the quote paragraph, then
 *             the attribution paragraphs (name, role)
 */
function decorateQuote(block) {
  const row = block.firstElementChild;
  if (!row) return;

  const cells = [...row.children];

  // classify cells: a picture-only cell is the headshot photo; the cell that also
  // has text is the quote card.
  let photoCell = null;
  let card = null;
  cells.forEach((cell) => {
    const hasText = !!cell.querySelector('h1, h2, h3, h4, h5, h6, p, blockquote');
    if (!hasText && cell.querySelector('picture')) photoCell = cell;
    else card = cell;
  });

  // headshot photo — optimize and tag the left column
  if (photoCell) {
    photoCell.classList.add('columns-quote-photo');
    const img = photoCell.querySelector('img');
    if (img) {
      img.closest('picture').replaceWith(createOptimizedPicture(img.src, img.alt, false, [{ width: '750' }]));
    }
  }

  if (card) {
    card.classList.add('columns-quote-card');

    // the leading picture in the card is the decorative blue quote glyph. It's an
    // SVG, so drop the <source> variants (EDS generates webp sources that fail for
    // SVGs → broken image); keep the plain <img> so the SVG always renders.
    const glyphPic = card.querySelector('picture');
    if (glyphPic) {
      const glyphImg = glyphPic.querySelector('img');
      const glyph = document.createElement('div');
      glyph.className = 'columns-quote-glyph';
      if (glyphImg) {
        glyphImg.removeAttribute('loading');
        glyph.append(glyphImg);
        glyphPic.remove();
      } else {
        glyph.append(glyphPic);
      }
      card.prepend(glyph);
    }

    // drop any empty paragraphs (EDS can wrap the leading glyph <picture> in its
    // own <p>, left empty once we move the picture out).
    card.querySelectorAll('p').forEach((p) => {
      if (!p.textContent.trim() && !p.querySelector('img, picture, a')) p.remove();
    });

    // only text-bearing paragraphs: first is the quote; the rest are attribution
    const paras = [...card.querySelectorAll('p')].filter((p) => p.textContent.trim());
    if (paras.length) {
      paras[0].classList.add('columns-quote-text');
      if (paras.length > 1) {
        const attribution = document.createElement('div');
        attribution.className = 'columns-quote-attribution';
        paras.slice(1).forEach((p) => attribution.append(p));
        card.append(attribution);
      }
    }
  }
}

/*
 * feature (Women's Coaching Cohort) — a two-column row inside a dark rounded
 * panel: an IMAGE on the left and a bordered CARD (heading + paragraph) on the
 * right. Image left / text right on desktop; stacked (image over card) on
 * mobile.
 *
 * Authoring model (two cells in one row):
 *   - cell 1: the image picture
 *   - cell 2: the heading + paragraph(s)
 */
function decorateFeature(block) {
  const row = block.firstElementChild;
  if (!row) return;

  [...row.children].forEach((cell) => {
    const pic = cell.querySelector('picture');
    const hasText = !!cell.querySelector('h1, h2, h3, h4, h5, h6, p:not(.button-container)');
    if (pic && !hasText) {
      cell.classList.add('columns-feature-media');
    } else {
      cell.classList.add('columns-feature-card');
    }
  });

  block.querySelectorAll('.columns-feature-media img').forEach((img) => {
    img.closest('picture').replaceWith(createOptimizedPicture(img.src, img.alt, false, [{ width: '900' }]));
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
  else if (block.classList.contains('feature')) decorateFeature(block);
  else if (block.classList.contains('quote')) decorateQuote(block);
  else decorateDefault(block);
}
