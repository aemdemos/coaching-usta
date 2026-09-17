import { createOptimizedPicture } from '../../scripts/aem.js';

/**
 * columns — a two-column layout. Four variants share this block:
 *   • default   : generic N-column layout (boilerplate).
 *   • media     : image beside text (heading + paragraph + CTA); `media-right`
 *                 forces the image to the right (text-first).
 *   • quote     : headshot beside a testimonial quote + attribution.
 *   • events    : the "In-Person Workshops" event list — a repeating list of
 *                 bordered event cards (date + location + title on the left,
 *                 outlined chips on the right) with an optional "View More" CTA.
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
 * events (IN-PERSON WORKSHOPS) — a repeating list of event cards. Each block
 * row is ONE event authored as THREE cells:
 *   1. Date     — e.g. "09.19-09.20"
 *   2. Details  — a stack of lines (one per paragraph): the delivery method,
 *                 the location, then the title. The LAST line is the title; the
 *                 line(s) before it are the delivery method + location, e.g.:
 *                   In-Person
 *                   270 Eagle Point Rd, West Deptford, NJ 08086
 *                   Developing Junior and Adult Players Workshop - West Deptford, NJ
 *   3. Chips    — a bulleted list; each item becomes one outlined pill
 *                 (region, hours, certification, price).
 * A trailing row whose sole content is a link (no other fields) is the
 * "View More" CTA — rendered as a centered lime pill below the list.
 * Missing cells/lines degrade gracefully.
 */
function decorateEvents(block) {
  const list = document.createElement('ul');
  list.className = 'columns-events-list';

  let cta = null;

  // collect the text lines of a cell (one per <p>, else the raw text)
  const lines = (cell) => {
    if (!cell) return [];
    const paras = [...cell.querySelectorAll('p')];
    const raw = paras.length ? paras.map((p) => p.textContent) : [cell.textContent];
    return raw.map((s) => s.trim()).filter(Boolean);
  };

  [...block.children].forEach((row) => {
    const cells = [...row.children];
    if (!cells.length) return;

    // a row whose sole content is a link is the "View More" CTA, not an event
    const onlyLink = cells.length === 1 && cells[0].querySelector('a')
      && cells[0].textContent.trim() === cells[0].querySelector('a').textContent.trim();
    if (onlyLink) {
      cta = cells[0].querySelector('a');
      return;
    }

    const [dateCell, detailsCell, chipsCell] = cells;

    const item = document.createElement('li');
    item.className = 'columns-events-card';

    const inner = document.createElement('div');
    inner.className = 'columns-events-event';

    // left: date + (delivery/location line + title)
    const left = document.createElement('div');
    left.className = 'columns-events-left';

    const date = document.createElement('div');
    date.className = 'columns-events-date';
    date.textContent = dateCell ? dateCell.textContent.trim() : '';
    left.append(date);

    const info = document.createElement('div');
    info.className = 'columns-events-info';

    // details lines: last is the title; the line(s) before are delivery + location
    const detailLines = lines(detailsCell);
    const titleText = detailLines.length ? detailLines[detailLines.length - 1] : '';
    const meta = detailLines.slice(0, -1);
    const delivery = meta.length ? meta[0] : '';
    const place = meta.slice(1).join(', ');

    const location = document.createElement('div');
    location.className = 'columns-events-location-line';
    if (delivery) {
      const dm = document.createElement('span');
      dm.className = 'columns-events-delivery';
      dm.textContent = delivery;
      location.append(dm);
    }
    if (place) {
      const loc = document.createElement('span');
      loc.className = 'columns-events-place';
      loc.textContent = place;
      location.append(loc);
    }
    if (delivery || place) info.append(location);

    const title = document.createElement('div');
    title.className = 'columns-events-title';
    title.textContent = titleText;
    if (title.textContent) info.append(title);

    left.append(info);
    inner.append(left);

    // right: chips from the third cell (bulleted list, else one per line)
    if (chipsCell) {
      const chips = document.createElement('ul');
      chips.className = 'columns-events-chips';
      const sourceItems = chipsCell.querySelectorAll('li');
      const chipTexts = sourceItems.length
        ? [...sourceItems].map((li) => li.textContent.trim())
        : lines(chipsCell);
      chipTexts.filter(Boolean).forEach((label) => {
        const chip = document.createElement('li');
        chip.className = 'columns-events-chip';
        chip.textContent = label;
        chips.append(chip);
      });
      if (chips.children.length) {
        const right = document.createElement('div');
        right.className = 'columns-events-right';
        right.append(chips);
        inner.append(right);
      }
    }

    item.append(inner);
    list.append(item);
  });

  block.replaceChildren(list);

  if (cta) {
    cta.classList.add('columns-events-more');
    const wrapper = document.createElement('div');
    wrapper.className = 'columns-events-more-wrapper';
    wrapper.append(cta);
    block.append(wrapper);
  }
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
  else if (block.classList.contains('events')) decorateEvents(block);
  else decorateDefault(block);
}
