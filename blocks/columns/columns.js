import { createOptimizedPicture } from '../../scripts/aem.js';

/**
 * columns — a two-column layout. Several variants share this block:
 *   • default   : generic N-column layout (boilerplate).
 *   • media     : image beside text (heading + paragraph + CTA); `media-right`
 *                 forces the image to the right (text-first).
 *   • quote     : headshot beside a testimonial quote + attribution.
 *   • events    : the "In-Person Workshops" event list — a repeating list of
 *                 bordered event cards (date + location + title on the left,
 *                 outlined chips on the right) with an optional "View More" CTA.
 *   • profile   : headshot beside a bordered card (name + role + bio + tags).
 *   • article   : news-article body copy beside a photo; `media-left` flips sides.
 *   • list      : news search-result tile — thumbnail + card with a CTA.
 *   • embed     : a LinkedIn post embed beside a text column.
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

/*
 * profile (OUR LEADERSHIP board members) — a two-column row: a square headshot
 * PHOTO on the left and a bordered rounded CARD on the right. The card stacks the
 * person's NAME (large), a lime ROLE subtitle, a BIO paragraph, and a row of
 * outlined pill TAGS.
 *
 * Authoring model (two cells in one row):
 *   - cell 1: the headshot picture (portrait/square)
 *   - cell 2: name (first paragraph/heading), role subtitle(s), bio paragraph(s),
 *             and a trailing list (or paragraphs) of tag labels. The tag group is
 *             authored as a bullet list so it's unambiguous; if authored as bare
 *             paragraphs, the short trailing ones are treated as tags.
 */
function decorateProfile(block) {
  const row = block.firstElementChild;
  if (!row) return;
  const cells = [...row.children];

  // Photo cell = a picture-only cell; card cell = the one with text.
  let photoCell = null;
  let card = null;
  cells.forEach((cell) => {
    const hasText = !!cell.querySelector('h1, h2, h3, h4, h5, h6, p, ul, ol');
    if (!hasText && cell.querySelector('picture, img')) photoCell = cell;
    else card = cell;
  });

  if (photoCell) {
    photoCell.classList.add('columns-profile-photo');
    const img = photoCell.querySelector('img');
    if (img) {
      img.closest('picture')?.replaceWith(createOptimizedPicture(img.src, img.alt, false, [{ width: '750' }]));
    }
  }

  if (!card) return;
  card.classList.add('columns-profile-card');

  // Name: the first heading (falls back to the first paragraph).
  const name = card.querySelector('h1, h2, h3, h4, h5, h6') || card.querySelector('p');
  if (name) name.classList.add('columns-profile-name');

  // Role subtitle is authored in *italic* — the project convention maps <em> →
  // lime; the block CSS additionally renders it in the Graphik Semibold face and
  // tags the wrapping paragraph so its spacing matches the source. This handles
  // single- OR multi-line roles (each italic paragraph is a role line).
  card.querySelectorAll('p').forEach((p) => {
    if (p !== name && p.querySelector('em, i') && p.textContent.trim() === p.querySelector('em, i').textContent.trim()) {
      p.classList.add('columns-profile-role');
    }
  });

  // Tags: a trailing bullet list becomes outlined pills.
  const list = card.querySelector('ul, ol');
  if (list) {
    const tags = document.createElement('div');
    tags.className = 'columns-profile-tags';
    list.querySelectorAll('li').forEach((li) => {
      const pill = document.createElement('span');
      pill.className = 'columns-profile-tag';
      pill.append(...li.childNodes);
      tags.append(pill);
    });
    list.replaceWith(tags);
  }
}

/*
 * article (news article body) — a two-column row from a long-form article: a
 * block of body copy (paragraphs + optional section heading) beside a photo.
 * The photo is 25% wide (text 75%) side-by-side on desktop and stacks below the
 * text on mobile. Image side is controlled by an option class: `media-left`
 * (image on the LEFT / text-right) vs `media-right` (image on the RIGHT /
 * text-left). Image-on-the-right is also the default when no option is set.
 *
 * Authoring model (two cells in one row):
 *   - one cell: the body copy (h2 section heading + paragraphs)
 *   - other cell: the photo (picture)
 * The cell order in the source authors the visual order; `media-left` flips it.
 */
function decorateArticle(block) {
  const row = block.firstElementChild;
  if (!row) return;
  [...row.children].forEach((cell) => {
    const pic = cell.querySelector('picture, img');
    const hasText = !!cell.querySelector('h1, h2, h3, h4, h5, h6, p');
    if (pic && !hasText) {
      cell.classList.add('columns-article-media');
      const img = cell.querySelector('img');
      if (img) img.closest('picture')?.replaceWith(createOptimizedPicture(img.src, img.alt, false, [{ width: '750' }]));
    } else {
      cell.classList.add('columns-article-content');
    }
  });
}

/*
 * list (news search-results tile) — an article row: a square thumbnail beside a
 * bordered rounded content card holding the article title (link), an excerpt,
 * and a lime "Read Article" CTA pinned bottom-right. Side-by-side ≥1024
 * (thumbnail ≈ fixed width, stretches to card height); stacks on mobile
 * (thumbnail 1:1 on top).
 *
 * Authoring model (two cells in one row):
 *   - one cell: the thumbnail picture
 *   - other cell: the title (link/heading), the excerpt paragraph, and the CTA
 *     link ("Read Article")
 */
function decorateList(block) {
  const row = block.firstElementChild;
  if (!row) return;
  const cells = [...row.children];

  let thumbCell = null;
  let content = null;
  cells.forEach((cell) => {
    const hasText = !!cell.querySelector('h1, h2, h3, h4, h5, h6, p, a');
    const pic = cell.querySelector('picture, img');
    if (pic && !hasText) thumbCell = cell;
    else content = cell;
  });

  if (thumbCell) {
    thumbCell.classList.add('columns-list-thumb');
    const img = thumbCell.querySelector('img');
    if (img) img.closest('picture')?.replaceWith(createOptimizedPicture(img.src, img.alt, false, [{ width: '750' }]));
  }

  if (!content) return;
  content.classList.add('columns-list-content');

  // Title: the first heading, else the first link. If the title is a link
  // wrapped in a <p>, tag that wrapper so we can flatten its default paragraph
  // margins (the card is a flex column that owns the row gaps).
  const title = content.querySelector('h1, h2, h3, h4, h5, h6') || content.querySelector('a');
  if (title) {
    title.classList.add('columns-list-title');
    if (title.tagName === 'A') title.closest('p')?.classList.add('columns-list-title-wrapper');
  }

  // Excerpt: the first paragraph that isn't just the CTA link.
  const excerpt = [...content.querySelectorAll('p')].find((p) => p.textContent.trim() && !p.querySelector('a'));
  if (excerpt) excerpt.classList.add('columns-list-excerpt');

  // CTA "Read Article": the last link (or a link whose text starts with "Read").
  const links = [...content.querySelectorAll('a')].filter((a) => a !== title);
  const cta = links.find((a) => /read/i.test(a.textContent)) || links[links.length - 1];
  if (cta) {
    cta.classList.add('columns-list-cta');
    cta.closest('p')?.classList.add('columns-list-cta-wrapper');
  }
}

/*
 * embed (learning-hub LinkedIn post) — a social-post embed beside a text column
 * (intro paragraph + bullet list + a bold section heading + body paragraphs).
 * The embed is on the LEFT (~40%), text on the RIGHT (~60%) side-by-side on
 * desktop; stacks on mobile (embed on top).
 *
 * Authoring model (two cells in one row):
 *   - one cell: a LINK to the LinkedIn post (any linkedin.com/…/urn:li:… or
 *     /posts/… URL). We convert it to the official LinkedIn embed <iframe>.
 *   - other cell: the text (paragraphs, bullet list, headings).
 * A pre-built <iframe> is also accepted as-is.
 */
function linkedInEmbedSrc(href) {
  if (!href) return null;
  // already an embed URL
  if (/linkedin\.com\/embed\//i.test(href)) return href;
  // urn:li:ugcPost / activity id anywhere in the URL
  const urn = href.match(/urn:li:(?:ugcPost|activity|share):\d+/i);
  if (urn) return `https://www.linkedin.com/embed/feed/update/${urn[0]}`;
  const act = href.match(/(?:activity[-:])(\d{6,})/i);
  if (act) return `https://www.linkedin.com/embed/feed/update/urn:li:activity:${act[1]}`;
  return null;
}

function decorateEmbed(block) {
  const row = block.firstElementChild;
  if (!row) return;
  const cells = [...row.children];

  cells.forEach((cell) => {
    const existingIframe = cell.querySelector('iframe');
    const link = cell.querySelector('a[href]');
    let embedSrc = null;
    if (existingIframe) embedSrc = existingIframe.src;
    else if (link) embedSrc = linkedInEmbedSrc(link.getAttribute('href'));
    const hasText = !!cell.querySelector('h1, h2, h3, h4, h5, h6, ul, ol')
      || [...cell.querySelectorAll('p')].some((p) => p.textContent.trim() && !p.querySelector('a[href]'));

    if (embedSrc && !hasText) {
      cell.classList.add('columns-embed-media');
      cell.textContent = '';
      const frame = document.createElement('iframe');
      frame.src = embedSrc;
      frame.title = 'LinkedIn post';
      frame.setAttribute('loading', 'lazy');
      frame.setAttribute('frameborder', '0');
      frame.setAttribute('allowfullscreen', '');
      cell.append(frame);

      // The LinkedIn embed's content height grows LINEARLY with its width
      // (a fixed-height header/footer + a width-scaling video). Measured on the
      // source embed: 263w→674h, 358w→748h, 430w→804h ⇒ height ≈ 0.778·w + 470.
      // A fixed CSS height/aspect-ratio can't match that at every width (it
      // either clips the footer or leaves a gap), so size it from the rendered
      // width and keep it in sync. Matches the source's grown iframe exactly.
      const sizeFrame = () => {
        const w = frame.clientWidth;
        if (w) frame.style.height = `${Math.round(0.778 * w + 470)}px`;
      };
      sizeFrame();
      if (typeof ResizeObserver !== 'undefined') {
        new ResizeObserver(sizeFrame).observe(frame);
      } else {
        window.addEventListener('resize', sizeFrame);
      }
    } else {
      cell.classList.add('columns-embed-content');
    }
  });
}

/*
 * text (ELIGIBILITY AND REQUIREMENTS) — two text columns of requirement lists
 * inside a dark rounded card, with an optional centered lime CTA below.
 * (coach-mentorship.html "Eligibility and Requirements").
 *
 * Authoring model:
 *   - an optional first row: a single cell with only a heading → the card's
 *     centered heading (hoisted to span both columns).
 *   - the columns row: one cell per column, each = a small label (first <p>), a
 *     big lime title (second <p>), then a bullet list (<ul><li>…) of items.
 *   - a trailing row whose sole content is a link → the centered CTA button.
 * Each requirement item gets a white-diamond marker.
 */
function decorateText(block) {
  const rows = [...block.children];

  // a trailing row that is only a link → the centered CTA
  let ctaLink = null;
  const last = rows[rows.length - 1];
  if (last) {
    const cells = [...last.children];
    const onlyLink = cells.length === 1 && cells[0].querySelector('a')
      && cells[0].textContent.trim() === cells[0].querySelector('a').textContent.trim();
    if (onlyLink) {
      ctaLink = cells[0].querySelector('a');
      last.remove();
      rows.pop();
    }
  }

  // an optional first row that is a single cell with only a heading → the
  // card's centered heading (hoisted out of the row so it spans full width).
  let colsRow = rows[0];
  if (colsRow && colsRow.children.length === 1) {
    const heading = colsRow.querySelector('h1, h2, h3, h4, h5, h6');
    const onlyHeading = heading && !colsRow.querySelector('p, ul, ol, a');
    if (onlyHeading) {
      heading.classList.add('columns-text-heading');
      block.prepend(heading);
      colsRow.remove();
      rows.shift();
      [colsRow] = rows;
    }
  }

  // the columns row holds one cell per column
  if (colsRow) {
    [...colsRow.children].forEach((cell) => {
      cell.classList.add('columns-text-col');
      // first paragraph = small label, second = big lime title
      const paras = [...cell.querySelectorAll(':scope > p')].filter((p) => p.textContent.trim());
      if (paras[0]) paras[0].classList.add('columns-text-label');
      if (paras[1]) paras[1].classList.add('columns-text-title');
      // requirement items: <li> in the list, else any remaining <p>
      const list = cell.querySelector('ul, ol');
      if (list) {
        list.classList.add('columns-text-list');
        [...list.children].forEach((li) => li.classList.add('columns-text-item'));
      } else {
        paras.slice(2).forEach((p) => p.classList.add('columns-text-item'));
      }
    });
  }

  // CTA: a lone lime pill, centered below the columns
  if (ctaLink) {
    const wrap = document.createElement('div');
    wrap.className = 'columns-text-cta-wrapper';
    ctaLink.classList.add('columns-text-cta');
    wrap.append(ctaLink);
    block.append(wrap);
  }
}

/*
 * promo — featured event/promo rows (source: coaching-workshops "IN-PERSON
 * EVENTS" + webinar rows). Each row is an outlined rounded panel with a header
 * (bold title on the left, a lime "Register Now" pill on the right — they share
 * the top line on desktop/tablet and stack on mobile), then detail paragraphs
 * (Presenters / Location / Date) below.
 * Authoring (one row per promo panel): a single cell containing
 *   - the title (first paragraph or heading),
 *   - the CTA (a link),
 *   - the detail paragraphs (everything else).
 */
function decoratePromo(block) {
  [...block.children].forEach((row) => {
    row.classList.add('columns-promo-panel');
    const cell = row.children.length === 1 ? row.firstElementChild : row;
    cell.classList.add('columns-promo-content');

    const title = cell.querySelector('h1, h2, h3, h4, h5, h6, :scope > p');
    if (title) title.classList.add('columns-promo-title');

    const cta = cell.querySelector('a');

    // header row = title + CTA on one line (space-between)
    const header = document.createElement('div');
    header.className = 'columns-promo-header';
    if (title) header.append(title);
    if (cta) {
      cta.classList.add('columns-promo-cta');
      // unwrap a paragraph that only wraps the CTA
      const p = cta.closest('p');
      if (p && p.textContent.trim() === cta.textContent.trim()) p.remove();
      header.append(cta);
    }
    cell.prepend(header);

    // remaining paragraphs = details; flatten any wrapping div and drop empties
    const details = document.createElement('div');
    details.className = 'columns-promo-details';
    [...cell.children].forEach((child) => {
      if (child === header) return;
      if (child.tagName === 'DIV') {
        while (child.firstChild) details.append(child.firstChild);
        child.remove();
      } else {
        details.append(child);
      }
    });
    const detailParas = [...details.querySelectorAll('p')].filter((p) => p.textContent.trim());

    // meta lines (Presenters / Moderator / Date / Location …) group together at the
    // top; the remaining paragraphs are the body copy — a gap separates the two,
    // matching the source's spacer between the date and the description.
    const metaRe = /^(presenters?|moderator|date|location|time)\s*:/i;
    const meta = document.createElement('div');
    meta.className = 'columns-promo-meta';
    const body = document.createElement('div');
    body.className = 'columns-promo-body';
    let inBody = false;
    detailParas.forEach((p) => {
      if (!inBody && metaRe.test(p.textContent.trim())) {
        p.classList.add('columns-promo-detail');
        meta.append(p);
      } else {
        inBody = true;
        p.classList.add('columns-promo-detail');
        body.append(p);
      }
    });
    details.replaceChildren();
    if (meta.children.length) details.append(meta);
    if (body.children.length) details.append(body);
    if (details.children.length) cell.append(details);
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
  else if (block.classList.contains('events')) decorateEvents(block);
  else if (block.classList.contains('profile')) decorateProfile(block);
  else if (block.classList.contains('article')) decorateArticle(block);
  else if (block.classList.contains('list')) decorateList(block);
  else if (block.classList.contains('embed')) decorateEmbed(block);
  else if (block.classList.contains('text')) decorateText(block);
  else if (block.classList.contains('promo')) decoratePromo(block);
  else decorateDefault(block);
}
