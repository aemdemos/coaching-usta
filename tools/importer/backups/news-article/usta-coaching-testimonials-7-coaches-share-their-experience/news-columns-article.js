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

const isHeaderLine = (p) => !!p && p.tagName === 'P' && /font-size:\s*2[0-9]/.test(p.getAttribute('style') || '');

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

export default function parse(element, { document }) {
  const img = element.querySelector('img');
  if (!img) return;
  const isText = (el) => el && el.classList && el.classList.contains('aem-GridColumn')
    && (el.classList.contains('text') || el.classList.contains('container'))
    && el.textContent.trim();
  const prev = element.previousElementSibling;
  const next = element.nextElementSibling;
  const n = spanOf(element, 'default');
  // the text column = the text component(s) beside the image: the adjacent one plus any
  // stacked directly above/below it in the same column (same span) — e.g. a person header
  // component above the body text (testimonials). A full-width image only pairs with one.
  const sameCol = (a, b) => spanOf(a, 'default') === spanOf(b, 'default');
  let cols = [];
  if (isText(prev)) {
    cols = [prev];
    if (n !== 12) for (let x = prev.previousElementSibling; isText(x) && sameCol(x, prev); x = x.previousElementSibling) cols.unshift(x);
  } else if (isText(next)) {
    cols = [next];
    if (n !== 12) for (let x = next.nextElementSibling; isText(x) && sameCol(x, next); x = x.nextElementSibling) cols.push(x);
  }
  if (!cols.length) return; // a standalone image stays default content
  const textFirst = cols[0] !== next;

  // a person row: the text column opens with the source's styled header line
  // (name: inline font-size 22px, bold) → `person` (same row contract as `article`)
  const firstP = cols.flatMap((c) => [...c.querySelectorAll('p')]).find((x) => x.textContent.replace(/[\s\u00a0\uE000]/g, ''));
  const variant = firstP && /font-size:\s*2[0-9]/.test(firstP.getAttribute('style') || '') ? 'person' : 'article';
  // full-width image: plain default content — except for a person (photo above/below the
  // header at every width → person row with media-12, so the header keeps its styling)
  if (n === 12 && variant !== 'person') return;
  if (variant === 'person') normalizePersonHeader(firstP, document);
  const options = [textFirst ? 'media-right' : 'media-left'];
  if (n) options.push(`media-${n}`);

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
  const picture = img.closest('picture') || img;
  const row = textFirst ? [content, picture] : [picture, content];

  const block = WebImporter.Blocks.createBlock(document, {
    name: `Columns (${[variant, ...options].join(', ')})`,
    cells: [row],
  });
  cols[0].replaceWith(block);
  cols.slice(1).forEach((c) => c.remove());
  element.remove();
}
