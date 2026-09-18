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

  // Title: the first heading, else the first link.
  const title = content.querySelector('h1, h2, h3, h4, h5, h6') || content.querySelector('a');
  if (title) title.classList.add('columns-list-title');

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
    } else {
      cell.classList.add('columns-embed-content');
    }
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
  else if (block.classList.contains('profile')) decorateProfile(block);
  else if (block.classList.contains('article')) decorateArticle(block);
  else if (block.classList.contains('list')) decorateList(block);
  else if (block.classList.contains('embed')) decorateEmbed(block);
  else decorateDefault(block);
}
