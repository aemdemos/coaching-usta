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

export default function parse(element, { document }) {
  const img = element.querySelector('img');
  if (!img) return;
  const isText = (el) => el && el.classList && el.classList.contains('aem-GridColumn')
    && (el.classList.contains('text') || el.classList.contains('container'))
    && el.textContent.trim();
  const prev = element.previousElementSibling;
  const next = element.nextElementSibling;
  const textEl = isText(prev) ? prev : (isText(next) ? next : null);
  if (!textEl) return; // a standalone image stays default content
  const textFirst = textEl === prev;

  const n = spanOf(element, 'default');
  if (n === 12) return; // full-width image: default content
  // a person row: the text column opens with the source's styled header line
  // (name: inline font-size 22px, bold) → `person` (same row contract as `article`)
  const firstP = [...textEl.querySelectorAll('p')].find((x) => x.textContent.replace(/[\s\u00a0\uE000]/g, ''));
  const variant = firstP && /font-size:\s*2[0-9]/.test(firstP.getAttribute('style') || '') ? 'person' : 'article';
  if (variant === 'person') {
    // header = name, role, location; the block styles them by position (location =
    // the source's 16px line + 16px gap). A further 18px line (some authors style the
    // location like the role) joins the role paragraph as a second line.
    const header = [];
    for (let p = firstP; p && p.tagName === 'P' && /font-size/.test(p.getAttribute('style') || ''); p = p.nextElementSibling) header.push(p);
    header.slice(2).forEach((p) => {
      if (/font-size:\s*16/.test(p.getAttribute('style') || '')) return;
      const role = p.previousElementSibling;
      role.append(document.createElement('br'), ...p.childNodes);
      p.remove();
    });
  }
  const options = [textFirst ? 'media-right' : 'media-left'];
  if (n) options.push(`media-${n}`);

  // text cell: every heading/paragraph/list in the text column, in order. A separator in
  // the column (source: a transparent 42px <hr>) becomes an <hr> — the block renders it as
  // the same invisible 42px gap (before a heading too: without one, a heading after copy
  // gets only the normal 24px, exactly as on the source).
  const items = [...textEl.querySelectorAll('h1, h2, h3, h4, h5, h6, p, ul, ol, blockquote, .separator')]
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
  textEl.replaceWith(block);
  element.remove();
}
