/* eslint-disable */
/* global WebImporter */
/**
 * Parser: news-article text + image row → `Columns (article, media-right|media-left, media-N)`.
 * Source (AEM float grid): a text column (`.container`/`.text`, span 12-N) and an
 * `.image` column (span N) that are SIBLINGS in one `.aem-Grid`. The image span is
 * an editorial choice per row, so it is read straight from the source classes:
 *   aem-GridColumn--default--N        → media-N        (≥1280; stacked below)
 * Max three options by decision: the source's 1024–1279 span (desktop-small) is not
 * carried — ~25% of rows stay side by side there on the source, ours stack.
 * A span-12 image is not a row: it sits full width under/over the text at every
 * width, so it stays default content (text, then the image) — no Columns block.
 * `element` = the image column. Its text partner is the adjacent sibling.
 */
const spanOf = (el, bp) => {
  const m = [...el.classList].map((c) => c.match(new RegExp(`^aem-GridColumn--${bp}--(\\d+)$`))).find(Boolean);
  return m ? Number(m[1]) : null;
};

/* the column count of the AEM grid an item sits in (a nested container's grid has as
   many columns as the container spans, e.g. aem-Grid--6) */
const gridCols = (el) => {
  const g = el.parentElement;
  const m = g && [...g.classList].map((c) => c.match(/^aem-Grid--(?:default--)?(\d+)$/)).find(Boolean);
  return m ? Number(m[1]) : 12;
};

const isHeaderLine = (p) => !!p && p.tagName === 'P' && /font-size:\s*2[0-4]/.test(p.getAttribute('style') || '');

/* person header = name, role, location; the block styles them by position (location =
   the source's 16px line + 16px gap). A further 18px line (some authors style the
   location like the role) joins the role paragraph as a second line. */
function normalizePersonHeader(firstP, document) {
  const header = [];
  for (let q = firstP; q && q.tagName === 'P' && /font-size/.test(q.getAttribute('style') || ''); q = q.nextElementSibling) header.push(q);
  header.slice(2).forEach((q) => {
    if (/font-size:\s*16/.test(q.getAttribute('style') || '')) return;
    const role = q.previousElementSibling;
    role.append(document.createElement('br'), ...q.childNodes);
    q.remove();
  });
}

/**
 * A person header WITHOUT a photo (e.g. right under the title, or a testimonial whose
 * image is missing on the source): the header text component and the text stacked under
 * it in the same column → `Columns (person)` (one cell, full width) or, when the column
 * is narrower than the row, `Columns (person, media-right, media-N)` with an empty photo
 * cell so the text keeps its width. `element` = the header text component.
 */
export function parsePersonText(element, { document }) {
  const firstP = [...element.querySelectorAll('p')].find((x) => x.textContent.replace(/[\s\u00a0\uE000]/g, ''));
  if (!isHeaderLine(firstP)) return;
  normalizePersonHeader(firstP, document);
  const span = spanOf(element, 'default') || 12;
  const cols = [element];
  for (let x = element.nextElementSibling; x && x.classList.contains('text') && spanOf(x, 'default') === span; x = x.nextElementSibling) cols.push(x);
  const content = cols.flatMap((c) => [...c.querySelectorAll('h1, h2, h3, h4, h5, h6, p, ul, ol, blockquote')])
    .filter((e) => !e.parentElement.closest('h1, h2, h3, h4, h5, h6, p, ul, ol, blockquote'))
    .filter((e) => e.textContent.trim() || e.querySelector('img'));
  const block = span < 12
    ? WebImporter.Blocks.createBlock(document, { name: `Columns (person, media-right, media-${12 - span})`, cells: [[content, '']] })
    : WebImporter.Blocks.createBlock(document, { name: 'Columns (person)', cells: [[content]] });
  cols[0].replaceWith(block);
  cols.slice(1).forEach((c) => c.remove());
}

/* an embedded post (source `iframetext` component, e.g. a LinkedIn post) → a link to the
   embed URL; its width × height ride in the hash (not sent to the server) */
function embedLink(element, document) {
  const frame = element.querySelector('iframe[src]');
  const a = document.createElement('a');
  const size = frame.getAttribute('width') && frame.getAttribute('height') ? `#${frame.getAttribute('width')}x${frame.getAttribute('height')}` : '';
  a.href = `${frame.getAttribute('src')}${size}`;
  a.textContent = frame.getAttribute('title') || 'Embedded post';
  const para = document.createElement('p');
  para.append(a);
  return para;
}

export default function parse(element, { document }) {
  const isEmbed = element.classList.contains('iframetext');
  const img = isEmbed ? element.querySelector('iframe[src]') : element.querySelector('img');
  if (!img) return;
  const isText = (el) => el && el.classList && el.classList.contains('aem-GridColumn')
    && (el.classList.contains('text') || el.classList.contains('container'))
    && el.textContent.trim();
  const prev = element.previousElementSibling;
  const next = element.nextElementSibling;
  // the image span on the article's 12-column scale (a nested container's grid has as
  // many columns as the container spans: 4 of an aem-Grid--4 = the full width)
  const raw = spanOf(element, 'default');
  const n = raw ? Math.round((raw * 12) / gridCols(element)) : raw;
  // the text column = the text component(s) beside the image: the adjacent one plus any
  // stacked directly above/below it in the same column (same span) — e.g. a person header
  // component above the body text (testimonials). A full-width image only pairs with one.
  const sameCol = (a, b) => spanOf(a, 'default') === spanOf(b, 'default');
  // the partner must sit BESIDE the image: a full-width (span-12) text above/below a
  // half-width image is not its row partner (only a full-width image pairs with one)
  // a flex container (`container--display--flex-reset-grid`) lays its items side by side
  // whatever their spans: an image + text there are a row (equal halves)
  const flexRow = !!element.parentElement?.closest('.container')?.classList.contains('container--display--flex-reset-grid')
    && element.parentElement.closest('.container').querySelector('.aem-Grid') === element.parentElement;
  const beside = (el) => isText(el) && (flexRow || n === 12 || (spanOf(el, 'default') || 12) < gridCols(el));
  let cols = [];
  if (beside(prev)) {
    cols = [prev];
    if (n !== 12) for (let x = prev.previousElementSibling; isText(x) && sameCol(x, prev); x = x.previousElementSibling) cols.unshift(x);
  } else if (beside(next)) {
    cols = [next];
    if (n !== 12) for (let x = next.nextElementSibling; isText(x) && sameCol(x, next); x = x.nextElementSibling) cols.push(x);
  }
  if (!cols.length) return; // a standalone image stays default content
  const textFirst = cols[0] !== next;

  // a person row: the text column opens with the source's styled header line
  // (name: inline font-size 22px, bold) → `person` (same row contract as `article`)
  const firstP = cols.flatMap((c) => [...c.querySelectorAll('p')]).find((x) => x.textContent.replace(/[\s\u00a0\uE000]/g, ''));
  const variant = isHeaderLine(firstP) ? 'person' : 'article';
  // full-width image: plain default content — except for a person (photo above/below the
  // header at every width → person row with media-12, so the header keeps its styling)
  if (n === 12 && variant !== 'person' && !flexRow) return;
  if (variant === 'person') normalizePersonHeader(firstP, document);
  // the source's portrait crop (image--aspect-ration--portrait) → `portrait`; it takes
  // the place of `media-right`, the default side, to stay within three options
  const portrait = !isEmbed && element.classList.contains('image--aspect-ration--portrait');
  const options = textFirst ? [portrait ? 'portrait' : 'media-right'] : ['media-left', ...(portrait ? ['portrait'] : [])];
  if (flexRow) options.push('media-6');
  else if (n) options.push(`media-${n}`);

  // text cell: every heading/paragraph/list in the text column, in order. A separator in
  // the column (source: a transparent 42px <hr>) becomes an <hr> — the block renders it as
  // the same invisible 42px gap (before a heading too: without one, a heading after copy
  // gets only the normal 24px, exactly as on the source).
  const items = cols.flatMap((c) => [...c.querySelectorAll('h1, h2, h3, h4, h5, h6, p, ul, ol, blockquote, .separator')])
    .filter((e) => !e.parentElement.closest('h1, h2, h3, h4, h5, h6, p, ul, ol, blockquote'))
    .filter((e) => e.classList.contains('separator') || e.textContent.trim() || e.querySelector('img'));
  const content = [];
  items.forEach((e) => {
    if (!e.classList.contains('separator')) { content.push(e); return; }
    if (!content.length || content[content.length - 1].tagName === 'HR') return; // no leading/double gaps
    content.push(document.createElement('hr'));
  });
  // the photo column: this image plus any image stacked directly under it in the same
  // column (same span) — e.g. two photos beside one long text column
  const stacked = [];
  for (let x = element.nextElementSibling; !isEmbed && x && x.classList.contains('image') && x.querySelector('img')
    && n !== 12 && sameCol(x, element); x = x.nextElementSibling) stacked.push(x);
  const pictures = isEmbed ? [embedLink(element, document)]
    : [element, ...stacked].map((c) => { const i = c.querySelector('img'); return i.closest('picture') || i; });
  const row = textFirst ? [content, pictures] : [pictures, content];

  const block = WebImporter.Blocks.createBlock(document, {
    name: `Columns (${[variant, ...options].join(', ')})`,
    cells: [row],
  });
  cols[0].replaceWith(block);
  cols.slice(1).forEach((c) => c.remove());
  stacked.forEach((c) => c.remove());
  element.remove();
}

/**
 * Side-by-side grid: two or more photo columns, or two or more plain text columns,
 * sitting next to each other with nothing else beside them (e.g. 3 × 4/12 photos,
 * 2 × 6/12 benefit cards) → `Columns (grid[, tablet|mobile])`, one cell per column.
 * The option = the smallest source breakpoint at which the columns still sit side by
 * side (none: ≥1280 only; `tablet`: ≥768; `mobile`: always); a breakpoint without its
 * own span class inherits the default span, as in the AEM grid. Text cells keep their
 * copy (a text component's icon image comes first). `element` = the first column.
 */
export function parseGrid(element, { document }) {
  const cols = gridCols(element);
  const kind = (x) => {
    if (!x || !x.classList || !x.classList.contains('aem-GridColumn')) return null;
    const span = spanOf(x, 'default');
    if (!span || span >= cols) return null;
    if (x.classList.contains('image') && x.querySelector('img')) return 'image';
    if (x.classList.contains('text') && ![...x.classList].some((k) => k.startsWith('text--')) && x.textContent.trim()) return 'text';
    if (x.classList.contains('container') && x.textContent.trim()) return 'container';
    return null;
  };
  const k = kind(element);
  if (!k || kind(element.previousElementSibling) === k) return;
  const run = [element];
  let total = spanOf(element, 'default');
  for (let x = element.nextElementSibling; kind(x) === k && total + spanOf(x, 'default') <= cols; x = x.nextElementSibling) {
    run.push(x); total += spanOf(x, 'default');
  }
  if (run.length < 2) return;
  const split = (bp) => (spanOf(element, bp) || spanOf(element, 'default')) < cols;
  let option = '';
  if (split('mobile')) option = ', mobile';
  else if (split('tablet')) option = ', tablet';
  const cells = run.map((c) => {
    if (k === 'image') { const i = c.querySelector('img'); return i.closest('picture') || i; }
    if (k === 'container') {
      // a card: its photos and copy in source order (a photo as its own paragraph)
      return [...c.querySelectorAll('img, h1, h2, h3, h4, h5, h6, p, ul, ol, blockquote')]
        .filter((e) => !e.parentElement.closest('h1, h2, h3, h4, h5, h6, p, ul, ol, blockquote, table'))
        .filter((e) => e.tagName === 'IMG' || e.textContent.trim() || e.querySelector('img'))
        .filter((e) => e.tagName !== 'IMG' || !e.closest('p'))
        .map((e) => { if (e.tagName !== 'IMG') return e; const q = document.createElement('p'); q.append(e.closest('picture') || e); return q; });
    }
    const icon = c.querySelector('.cmp-text__image-wrapper img');
    const body = [...c.querySelectorAll('h1, h2, h3, h4, h5, h6, p, ul, ol, blockquote')]
      .filter((e) => !e.parentElement.closest('h1, h2, h3, h4, h5, h6, p, ul, ol, blockquote'))
      .filter((e) => e.textContent.trim() || e.querySelector('img'));
    // the text component's icon starts the first line (an image at the start of a text
    // line = an icon; a paragraph holding only an image = a photo)
    if (icon) {
      const firstP = body.find((e) => e.tagName === 'P');
      if (firstP) firstP.prepend(icon, ' ');
    }
    return body;
  });
  // equal columns that leave the row part-empty on the source (e.g. 2 × 4 of 12): empty
  // cells hold the rest of the row so every column keeps its width
  const spans = run.map((c) => spanOf(c, 'default'));
  if (spans.every((x) => x === spans[0]) && total < cols && (cols - total) % spans[0] === 0) {
    for (let e = 0; e < (cols - total) / spans[0]; e += 1) cells.push('');
  }
  const block = WebImporter.Blocks.createBlock(document, { name: `Columns (grid${option})`, cells: [cells] });
  run[0].replaceWith(block);
  run.slice(1).forEach((c) => c.remove());
}
