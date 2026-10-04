/* eslint-disable */
/* global WebImporter */

/**
 * Importer — template `news-article` (catalog: 116 pages, en + es).
 * Source: https://www.ustacoaching.com/{en,es}/home/news/*.html
 *
 * Output document:
 *   section 1 (style: bordered) — the article frame: top image, H1, body copy,
 *     text+image rows (Columns article, media-N), section headings, pull-quotes,
 *     separators (Spacer 42px), Tags + Social row
 *   section 2 — the featured tile: Fragment → /fragments/news/featured-article (the
 *     shared tile), or the tile inline when it differs (the featured story); none on ES
 *   Metadata — Title, Description, Tags (from the source meta keywords), Template: news-article,
 *     Breadcrumb Title
 * Not authored: the breadcrumb (auto-built from Breadcrumb Title + placeholders).
 *
 * Fragment mode: the same article URL with `#featured-fragment` emits ONLY the
 * shared featured tile as `Columns (media, dark)` at /fragments/news/featured-article.
 *
 * All block selectors are stable AEM component / Vue widget classes (no hashes).
 */

import columnsArticleParser from './parsers/news-columns-article.js';
import quoteParser from './parsers/news-quote.js';
import tagsSocialParser from './parsers/news-tags-social.js';
import featuredParser, { buildFeaturedTile, FEATURED_FRAGMENT_PATH } from './parsers/news-featured.js';
import cleanupTransformer from './transformers/coaching-usta-cleanup.js';

const TEMPLATE = 'news-article';

/** in-article heading size classes → heading level (generic; see columns.css/styles.css) */
const HEADING_SIZES = [
  { re: /text--font-size--(40|48|56|64)px-/, tag: 'h2' },
  { re: /text--font-size--32px-/, tag: 'h3' },
];

function el(document, tag, text) {
  const e = document.createElement(tag);
  if (text != null) e.textContent = text;
  return e;
}

function spacer(document, px) {
  return WebImporter.Blocks.createBlock(document, {
    name: 'Spacer',
    cells: [['desktop', `${px}px`], ['mobile', `${px}px`]],
  });
}

function metadata(document, frame) {
  const meta = (sel) => document.querySelector(sel)?.getAttribute('content') || '';
  const crumb = document.querySelector('.cmp-breadcrumb__item--active');
  const cells = {
    Title: document.title,
    Description: meta('meta[name="description"]'),
    // the source's meta keywords are its topic tags (shown by the Tags block)
    Tags: meta('meta[name="keywords"]'),
    Template: TEMPLATE,
  };
  const ogImage = meta('meta[property="og:image"]');
  if (ogImage) {
    const img = el(document, 'img');
    img.src = ogImage;
    cells.Image = img;
  }
  if (crumb) cells['Breadcrumb Title'] = crumb.textContent.trim();
  Object.keys(cells).forEach((k) => { if (cells[k] === '') delete cells[k]; });
  return WebImporter.Blocks.createBlock(document, { name: 'Metadata', cells });
}

/** convert the source's sized bold paragraphs into real headings */
function convertHeadings(frame, document) {
  frame.querySelectorAll('.text[class*="text--font-size--"]').forEach((comp) => {
    if (comp.classList.contains('text--font-family--graphic-semibold')) return; // pull-quote
    const level = HEADING_SIZES.find((h) => h.re.test(comp.className));
    if (!level) return;
    comp.querySelectorAll('p').forEach((p) => {
      const text = p.textContent.trim();
      if (!text) { p.remove(); return; }
      const h = el(document, level.tag, text);
      p.replaceWith(h);
    });
  });
}

/*
 * Separator spacing. A source separator is 42px tall at every breakpoint (66px between
 * content with the components' 12px paddings). The template adds that 42px itself where
 * the source almost always has a separator (news-article.css, "section gaps"):
 *   - a heading (h2/h3) right after text (p), a list or an article row;
 *   - an article row right after text, a list or another article row.
 * Measured on all 56 EN articles that rule matches 998 of 1,031 boundaries, so the
 * importer only keeps what the rule can't infer:
 *   - a separator where the rule already gives the gap → dropped;
 *   - a separator the rule doesn't cover → kept as a 42px Spacer;
 *   - no separator where the rule WOULD add a gap → an article row gets the `flush`
 *     variant; a heading gets a 0px Spacer in front (the rule only fires on direct
 *     neighbours).
 * This mirrors the CSS rule exactly; keep both in sync.
 */
const blockName = (t) => (t.querySelector('tr > th, tr > td')?.textContent || '').trim();
function unitKind(e) {
  if (e.tagName === 'TABLE') {
    const n = blockName(e);
    if (/^Spacer/i.test(n)) return 'spacer';
    if (/^Columns \(article/i.test(n)) return 'row';
    return 'block';
  }
  if (/^H[23]$/.test(e.tagName)) return 'heading';
  if (e.tagName === 'UL' || e.tagName === 'OL') return 'list';
  if (e.tagName === 'P' || e.tagName === 'IMG') return 'p';
  return 'other';
}
const ruleGap = (prev, next) => !!prev && !!next
  && (next === 'heading' || next === 'row') && ['p', 'list', 'row'].includes(prev);

function applySectionGaps(out, document) {
  // the frame's content in output order (nested layout divs are flattened by the converter)
  const units = [...out.querySelectorAll('table, p, h1, h2, h3, h4, h5, h6, ul, ol, img')].filter((e) => {
    if (e.parentElement.closest('table, p, ul, ol, h1, h2, h3, h4, h5, h6')) return false;
    // paragraphs the converter drops (blank, unkept) are not neighbours
    return !(e.tagName === 'P' && !e.querySelector('img, picture, iframe') && !e.textContent.trim());
  });
  const kinds = units.map(unitKind);
  const source42 = (t) => t && blockName(t).match(/^Spacer/i) && /42px/.test(t.textContent);
  units.forEach((u, i) => {
    if (kinds[i] === 'spacer') {
      if (source42(u) && ruleGap(kinds[i - 1], kinds[i + 1])) u.remove();
      return;
    }
    if (i === 0 || kinds[i - 1] === 'spacer' || !ruleGap(kinds[i - 1], kinds[i])) return;
    // no source separator here, but the rule would add one
    if (kinds[i] === 'row') {
      const th = u.querySelector('tr > th, tr > td');
      th.textContent = th.textContent.trim().replace(/\)$/, ', flush)');
    } else {
      u.before(spacer(document, 0));
    }
  });
}

function pathOf(url) {
  const raw = new URL(url).pathname.replace(/\/$/, '').replace(/\.html?$/, '');
  return WebImporter.FileUtils.sanitizePath(raw === '' ? '/index' : raw);
}

/*
 * Non-breaking spaces. The source copy uses them ("walk&nbsp; out", "done
 * something.&nbsp; ”") and they change where lines wrap, but the converter's
 * pipeline turns U+00A0 into a plain space (before the transform even runs) and
 * then collapses it. So every nbsp is swapped for a private-use sentinel in the
 * live page (onLoad), and the sentinel is swapped back to &nbsp; in the
 * converter's HTML output (md2da).
 */
const NBSP_MARK = '\uE000';

function markNbsp(root, document) {
  const walker = document.createTreeWalker(root, 4 /* NodeFilter.SHOW_TEXT */);
  for (let n = walker.nextNode(); n; n = walker.nextNode()) {
    // blank paragraphs (<p>&nbsp;</p>) stay blank here — normalizeTextComponent decides
    // which survive — except inside list items: the source writes
    // <li><p>text</p><p>&nbsp;</p></li> and that blank line is the item spacing
    const block = n.parentElement && n.parentElement.closest('p, li, h1, h2, h3, h4, h5, h6, div');
    const keepBlank = !!block && block.tagName === 'P' && block.parentElement?.tagName === 'LI';
    if (n.nodeValue.includes('\u00a0') && block && (block.textContent.trim() || keepBlank)) {
      n.nodeValue = n.nodeValue.replace(/\u00a0/g, NBSP_MARK);
    }
  }
}

/*
 * Paragraph spacing. In the source, paragraphs inside one text component touch
 * (0 gap) unless the author typed blank lines (<p>&nbsp;</p>, 24px each), and the
 * components' 12px paddings put 24px between components. The template pads every
 * default-content element 12px instead (consecutive paragraphs 24px apart), so each
 * component is rewritten to give the same result:
 *   - no blank between two paragraphs → joined with a <br> (0 gap);
 *   - n blanks between paragraphs      → n - 1 kept (the padding supplies one);
 *   - leading/trailing blanks, blanks around a list → all kept;
 *   - a list that starts/ends its component → a blank line for the component edge
 *     (the list itself only carries its 18px margin; see news-article.css).
 * Kept blanks hold the nbsp sentinel so the converter doesn't drop them.
 */
const isListEl = (e) => !!e && (e.tagName === 'UL' || e.tagName === 'OL');
const isBlankEl = (e) => e.tagName === 'P' && !e.querySelector('img, picture, iframe, video')
  && !e.textContent.replace(/[\s\u00a0\uE000]/g, '');

function normalizeTextComponent(cmp, document) {
  const kids = [...cmp.children].filter((e) => !e.classList.contains('cmp-text__icon'));
  const content = kids.map((e, i) => (isBlankEl(e) ? -1 : i)).filter((i) => i >= 0);
  if (!content.length) return;
  const keep = (b) => { b.textContent = NBSP_MARK; };
  const blankLine = () => { const b = document.createElement('p'); keep(b); return b; };
  kids.slice(0, content[0]).forEach(keep);
  kids.slice(content[content.length - 1] + 1).forEach(keep);
  let prev = kids[content[0]];
  for (let c = 1; c < content.length; c += 1) {
    const next = kids[content[c]];
    const blanks = kids.slice(content[c - 1] + 1, content[c]);
    if (isListEl(prev) || isListEl(next)) {
      blanks.forEach(keep);
      prev = next;
    } else if (!blanks.length && prev.tagName === 'P' && next.tagName === 'P') {
      prev.append(document.createElement('br'), ...next.childNodes);
      next.remove();
    } else {
      blanks.shift()?.remove();
      blanks.forEach(keep);
      prev = next;
    }
  }
  const first = kids[content[0]];
  const last = kids[content[content.length - 1]];
  if (isListEl(first) && content[0] === 0) first.before(blankLine());
  if (isListEl(last) && content[content.length - 1] === kids.length - 1) last.after(blankLine());
}

function restoreNbspInOutput() {
  const W = window.WebImporter;
  if (!W || typeof W.md2da !== 'function' || W.restoresNbsp) return;
  // the library's exports are read-only getters, so wrap the whole global
  const { md2da } = W;
  window.WebImporter = {
    ...W,
    restoresNbsp: true,
    md2da: (md, ...rest) => md2da(md, ...rest).split(NBSP_MARK).join('&nbsp;'),
  };
}

export default {
  onLoad: ({ document }) => {
    markNbsp(document.body, document);
    // the converter drops blank paragraphs before the transform runs; mark them now
    // so normalizeTextComponent can see (and keep or drop) them
    document.querySelectorAll('.cmp-text p').forEach((p) => { if (isBlankEl(p)) p.textContent = NBSP_MARK; });
    restoreNbspInOutput();
  },

  transform: (payload) => {
    const { document, params } = payload;
    const url = params.originalURL;
    const main = document.body;

    cleanupTransformer('beforeTransform', main, payload);
    // desktop-hidden responsive duplicates (import viewport is desktop)
    main.querySelectorAll('[class*="aem-GridColumn--default--hide"]').forEach((e) => e.remove());

    // ---- fragment mode: the shared featured tile only ----
    if (new URL(url).hash === '#featured-fragment') {
      const tile = main.querySelector('.aem-featured-article');
      const out = document.createElement('div');
      const block = tile && buildFeaturedTile(tile, document);
      if (block) out.append(block);
      WebImporter.rules.adjustImageUrls(out, url, params.originalURL);
      return [{ element: out, path: FEATURED_FRAGMENT_PATH, report: { template: `${TEMPLATE}:fragment` } }];
    }

    const frame = main.querySelector('.container.container--border--white > .cmp-container')
      || main.querySelector('.container--border--white');
    if (!frame) throw new Error('news-article frame (.container--border--white) not found');

    convertHeadings(frame, document);
    frame.querySelectorAll('.text:not(.text--font-family--graphic-semibold) > .cmp-text')
      .forEach((cmp) => normalizeTextComponent(cmp, document));

    // pull-quotes (before rows, so a quote never becomes a column's text cell)
    [...frame.querySelectorAll('.text.text--font-family--graphic-semibold')].forEach((q) => quoteParser(q, { document }));
    // text + image rows (skip the top image: the first image component in the frame)
    const images = [...frame.querySelectorAll('.aem-GridColumn.image')].filter((i) => i.querySelector('img'));
    images.slice(1).forEach((i) => columnsArticleParser(i, { document }));
    // separators → 42px spacers (source .separator is 42px tall at every breakpoint)
    frame.querySelectorAll('.separator').forEach((s) => s.replaceWith(spacer(document, 42)));
    // tags + share row
    const footerRow = frame.querySelector('.tags')?.closest('.container') || frame.querySelector('.socialmediasharing')?.closest('.container');
    if (footerRow) tagsSocialParser(footerRow, { document });

    // ---- assemble the document ----
    const out = document.createElement('div');
    out.append(...frame.childNodes);
    applySectionGaps(out, document);
    out.append(WebImporter.Blocks.createBlock(document, { name: 'Section Metadata', cells: { Style: 'bordered' } }));

    // featured tile: shared fragment, inline tile, or nothing (see news-featured.js)
    const featured = main.querySelector('.aem-featured-article');
    if (featured) {
      const holder = document.createElement('div');
      holder.append(featured);
      if (featuredParser(featured, { document })) out.append(document.createElement('hr'), holder);
    }

    out.append(metadata(document, frame));
    cleanupTransformer('afterTransform', out, payload);
    WebImporter.rules.adjustImageUrls(out, url, params.originalURL);

    return [{
      element: out,
      path: pathOf(url),
      report: { title: document.title, template: TEMPLATE },
    }];
  },
};
