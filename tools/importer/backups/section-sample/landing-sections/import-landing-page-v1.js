/* eslint-disable */
/* global WebImporter */

/**
 * Importer — template `landing-page` (catalog: 26 pages, en + es; EN/ES twins are
 * structurally identical, so every page runs through this ONE script, no per-locale code).
 * Source: https://www.ustacoaching.com/{en,es}/home/<landing page>.html
 *
 * How it works: the page's content grid is walked section by section (top-level
 * containers in <main>). Each section is matched — by stable AEM component / container
 * classes only, never by ids — to ONE section kind (see KINDS below), which emits the
 * block table(s) whose authoring contract matches the block samples in
 * drafts/block-samples/*, plus the section's default content. Anything unmatched is
 * imported as default content. Output order = source order.
 *
 * Responsive duplicates: the source often authors a desktop copy and a phone/tablet copy
 * of the same section; the import viewport is desktop, so desktop-hidden copies
 * (`aem-GridColumn--default--hide`) are dropped and the desktop copy is kept (decision
 * 2026-10-07: one copy).
 *
 * Measurements the transform needs (column positions, background colours, alignment,
 * button style) only exist on the live page, so onLoad stamps them as data-* attributes.
 */
import cleanupTransformer from './transformers/coaching-usta-cleanup.js';

const TEMPLATE = 'landing-page';
const BASE = 'https://www.ustacoaching.com';

/* ------------------------------------------------------------------ helpers -- */
const el = (document, tag, html) => { const e = document.createElement(tag); if (html !== undefined) e.innerHTML = html; return e; };
const BLANK = '[[blank-line]]'; // onLoad marker for an authored blank paragraph
const norm = (s) => (s || '').replace(BLANK, '').replace(/\s+/g, ' ').trim();
const cls = (e, c) => !!e && !!e.classList && e.classList.contains(c);
const block = (document, name, cells) => WebImporter.Blocks.createBlock(document, { name, cells });

function pathOf(url) {
  const u = new URL(url);
  return u.pathname.replace(/\.html$/, '').replace(/\/$/, '') || '/index';
}

function metadata(document) {
  const meta = (sel) => document.querySelector(sel)?.getAttribute('content') || '';
  const cells = { Title: document.title, Description: meta('meta[name="description"]'), Template: TEMPLATE };
  const og = meta('meta[property="og:image"]');
  if (og) { const img = el(document, 'img'); img.src = og; cells.Image = img; }
  Object.keys(cells).forEach((k) => { if (!cells[k]) delete cells[k]; });
  return block(document, 'Metadata', cells);
}

/* the content grid: descend through wrappers while one child holds the content */
function contentRoot(main) {
  const skip = (e) => /experiencefragment|aem-header|aem-hidden-component|aem-quiz|aem-wizard|safe-play|footer/.test(e.className || '');
  let root = main.querySelector('.aem-Grid');
  for (let guard = 0; guard < 12 && root; guard += 1) {
    const kids = [...root.children].filter((k) => !skip(k) && Number(k.getAttribute('data-h') || 0) > 0);
    const total = kids.reduce((s, k) => s + Number(k.getAttribute('data-h') || 0), 0);
    const big = kids.find((k) => Number(k.getAttribute('data-h') || 0) >= 0.85 * total);
    if (kids.length > 2 && !big) break;
    const next = big && big.querySelector('.aem-Grid');
    if (!next) break;
    root = next;
  }
  return { root, skip };
}

/* AEM components directly inside a container (skipping grid / cmp wrappers) */
function components(container) {
  const out = [];
  const walk = (e) => [...e.children].forEach((k) => {
    if (cls(k, 'aem-Grid') || cls(k, 'cmp-container') || (k.tagName === 'DIV' && !k.className)) { walk(k); return; }
    if (/aem-GridColumn/.test(k.className || '') || /^(text|image|button|container|separator|accordion|embed|iframetext|tags)\b/.test(k.className || '')) out.push(k);
  });
  walk(container);
  return out;
}
/* a section's components, unwrapping a lone wrapper container (padding/margin shells) */
function comps(section) {
  let list = components(section);
  for (let guard = 0; guard < 6 && list.length === 1 && (list[0].className || '').split(' ')[0] === 'container'; guard += 1) list = components(list[0]);
  return list;
}
/* every text / image / button inside, at any depth (flattens nested containers) */
function deep(container) {
  const out = [];
  components(container).forEach((c) => { if ((c.className || '').split(' ')[0] === 'container') out.push(...deep(c)); else out.push(c); });
  return out;
}
const kind = (c) => (c.className || '').split(' ')[0];
const isText = (c) => kind(c) === 'text';
const isImage = (c) => kind(c) === 'image';
const isButton = (c) => kind(c) === 'button';
const isContainer = (c) => kind(c) === 'container';
const fontSize = (c) => { const m = (c.className || '').match(/text--font-size--(\d+)px/); return m ? Number(m[1]) : 0; };
const isUstaSans = (c) => /text--font-family--usta-sans/.test(c.className || '');

/* a text component → its elements (headings by size style, paragraphs, lists) */
function textEls(c, document, { headingLevel } = {}) {
  const cmp = c.querySelector('.cmp-text') || c;
  const out = [];
  const size = fontSize(c);
  // icon + copy rows (.cmp-text__image-and-paragraph) → the copy only
  const rows = cmp.querySelectorAll(':scope > .cmp-text__image-and-paragraph');
  if (rows.length) {
    rows.forEach((r) => {
      const copy = r.querySelector(':scope > div:not(.cmp-text__image-wrapper)') || r;
      [...copy.children].forEach((k) => { if (norm(k.textContent)) out.push(k); });
    });
    return out;
  }
  // paragraphs that touch on the source (no blank line between) are one paragraph with
  // a line break; a blank line between them is kept as a gap (separate paragraphs)
  // a lime-coloured run inside a heading ("Now <span lime>Live</span>") → <em> (the
  // blocks render an emphasised heading word in lime)
  cmp.querySelectorAll('span[style]').forEach((sp) => {
    if (/207,\s*255,\s*5|#cfff05/i.test(sp.getAttribute('style'))) { const em = el(document, 'em'); em.append(...sp.childNodes); sp.replaceWith(em); }
  });
  let prevP = null;
  let prevH = null;
  [...cmp.children].forEach((k) => {
    if (cls(k, 'cmp-text__icon')) return;
    if (!norm(k.textContent) && !k.querySelector('img')) { prevP = null; prevH = null; return; }
    // consecutive headings of one level = one heading set on several lines
    if (/^H[1-6]$/.test(k.tagName) && prevH && prevH.tagName === k.tagName) { prevH.append(el(document, 'br'), ...k.childNodes); return; }
    prevH = /^H[1-6]$/.test(k.tagName) ? k : null;
    if (k.tagName === 'P' && (headingLevel || size >= 32)) {
      const lvl = headingLevel || (size >= 40 || isUstaSans(c) ? 2 : 3);
      const h = el(document, `h${lvl}`);
      h.append(...k.childNodes);
      out.push(h);
      prevP = null;
      return;
    }
    if (k.tagName === 'P' && prevP) { prevP.append(el(document, 'br'), ...k.childNodes); return; }
    out.push(k);
    prevP = k.tagName === 'P' ? k : null;
  });
  // sized intro lines → Text Style: the large lead (`text--font-size--24px…`, 16 → 24)
  // and the smaller subhead (`text--font-size--18px-16px`, 16 → 18); centred on the
  // source → the block's `center` option (a section's centring only reaches default content)
  const style = { 24: 'lead', 18: 'subhead' }[size];
  if (style && !isUstaSans(c) && !headingLevel && out.length && out.every((k) => k.tagName === 'P')) {
    const opts = [style, ...(/cmp-text--alignment-center/.test(c.className) ? ['center'] : [])];
    return [block(document, `Text Style (${opts.join(', ')})`, [[out]])];
  }
  return out;
}

/* image component → <img> (absolute src, source alt) */
function imageEl(c, document) {
  const img = c.querySelector('img');
  if (!img) return null;
  const out = el(document, 'img');
  out.src = img.getAttribute('src') || img.getAttribute('data-src') || '';
  out.alt = img.getAttribute('alt') || '';
  return out;
}

/* button component → <p><a>label</a></p> (no href on the source → the page itself) */
function buttonEl(c, document, pagePath) {
  const a = c.querySelector('a, button');
  if (!a) return null;
  const label = norm(a.textContent);
  if (!label) return null;
  const link = el(document, 'a');
  link.href = a.getAttribute('href') || pagePath;
  link.textContent = label;
  const p = el(document, 'p');
  // filled (lime) source buttons → **bold** link = primary button; outlined → *italic*
  // link = secondary (scripts.js decorateButtons)
  const wrap = el(document, c.getAttribute('data-btn') === 'outline' ? 'em' : 'strong');
  wrap.append(link);
  p.append(wrap);
  return p;
}

/* everything in a container as default content, in order */
function defaultContent(container, document, pagePath) {
  const out = [];
  components(container).forEach((c) => {
    if (isText(c)) out.push(...textEls(c, document));
    else if (isImage(c)) { const i = imageEl(c, document); if (i) out.push(el(document, 'p')), out[out.length - 1].append(i); }
    else if (isButton(c)) { const b = buttonEl(c, document, pagePath); if (b) out.push(b); }
    else if (isContainer(c)) out.push(...defaultContent(c, document, pagePath));
  });
  return out;
}

/* list rows (text components holding .cmp-text__image-and-paragraph) → <ul> */
function listFrom(comps, document) {
  const ul = el(document, 'ul');
  comps.forEach((c) => {
    const li = el(document, 'li');
    textEls(c, document).forEach((k) => { if (k.tagName === 'P') li.append(...k.childNodes); else li.append(k); });
    if (norm(li.textContent)) ul.append(li);
  });
  return ul;
}
const isListRow = (c) => isText(c) && !!c.querySelector('.cmp-text__image-and-paragraph');
/* a container holding only text components (separators aside), at least two */
const isTopicCard = (c) => { const k = components(c).filter((x) => kind(x) !== 'separator'); return k.length >= 2 && k.every(isText); };

/* ------------------------------------------------------------- section kinds -- */
/* one source section → its block/default content + the section styles it needs */
function emitSection(s, { document, pagePath }) {
  const k = KINDS.find((kd) => { try { return kd.match(s); } catch (e) { return false; } });
  // centred section headings (source text component `cmp-text--alignment-center`)
  const firstText = deep(s).find((c) => isText(c) && norm(c.textContent));
  const centred = !!firstText && cls(firstText, 'cmp-text--alignment-center');
  const nodes = k ? k.emit(s, { document, pagePath }) : defaultContent(s, document, pagePath);
  // section styles: centred headings; the source's 24px-padded section container
  // (`container--padding--24px`) → inset
  const styles = [];
  if (centred && !(k && /^(hero|banner)/.test(k.name))) styles.push('center');
  if (/container--padding--24px\b/.test(s.className)) styles.push('inset');
  else if (/container--padding--12px-4px\b/.test(s.className)) styles.push('inset-small');
  // a section heading on 10 of 12 columns (offset 1) → heading-narrow
  if (firstText && /aem-GridColumn--default--10\b/.test(firstText.className) && /aem-GridColumn--offset--default--1\b/.test(firstText.className)) styles.push('heading-narrow');
  // a tighter bottom margin than the standard 52 (`container--bottom-margin--27/32/36`)
  const tail = (s.className.match(/container--bottom-margin--(27|32|36)\b/) || [])[1];
  if (tail) styles.push(`bottom-${tail}`);
  return { name: k ? k.name : 'default', nodes, styles };
}

// each: { name, match(section, ctx) → bool, emit(section, ctx) → nodes[] }
const KINDS = [
  {
    // full-bleed rounded hero: background photo container + H1 (+ subhead, copy, CTA)
    name: 'hero-content',
    match: (s) => !!s.querySelector('.cmp-container[data-desktop-background-image]') && !!s.querySelector('h1'),
    emit: (s, { document, pagePath }) => {
      const bg = s.querySelector('.cmp-container[data-desktop-background-image]').getAttribute('data-desktop-background-image');
      const img = el(document, 'img'); img.src = bg; img.alt = '';
      const content = [];
      deep(s).forEach((c) => {
        if (isText(c)) content.push(...textEls(c, document, { headingLevel: c.querySelector('h1') ? 0 : (fontSize(c) >= 32 ? 2 : 0) }));
        else if (isButton(c)) {
          // the hero styles its own CTAs: a plain link (not a **bold** button)
          const b = buttonEl(c, document, pagePath);
          if (b) { const p = el(document, 'p'); p.append(b.querySelector('a')); content.push(p); }
        }
      });
      // no CTA → the title-only hero (its own spacing)
      const title = !deep(s).some(isButton);
      return [block(document, title ? 'Hero (content, title)' : 'Hero (content)', [[img], [content]])];
    },
  },
  {
    name: 'accordion',
    match: (s) => !!s.querySelector('.cmp-accordion'),
    emit: (s, { document, pagePath }) => {
      const acc = s.querySelector('.accordion');
      const lead = [];
      comps(s).forEach((c) => { if (c !== acc && !acc.contains(c) && isText(c)) lead.push(...textEls(c, document)); });
      const rows = [...acc.querySelectorAll('.cmp-accordion__item')].map((item) => {
        const title = el(document, 'p', '');
        title.textContent = norm(item.querySelector('.cmp-accordion__title, .cmp-accordion__button')?.textContent);
        const panel = item.querySelector('.cmp-accordion__panel');
        const body = panel ? defaultContent(panel, document, pagePath) : [];
        return [title, body.length ? body : ''];
      });
      // the source opens no item by default here → `closed` (the default opens the first)
      const anyOpen = !!acc.querySelector('.cmp-accordion__item[data-cmp-expanded], .cmp-accordion__button--expanded');
      return [...lead, block(document, anyOpen ? 'Accordion' : 'Accordion (closed)', rows)];
    },
  },
  {
    // the Eligibility & Requirements style panel: rounded dark panel + heading + 2 list columns (+ CTA)
    name: 'columns-text-panel',
    match: (s) => /border-radius--top-left-outer/.test(s.className) && comps(s).filter((c) => isContainer(c) && components(c).some(isListRow)).length >= 2,
    emit: (s, { document, pagePath }) => {
      const direct = comps(s);
      const heading = direct.find((c) => isText(c) && fontSize(c) >= 40);
      const cols = direct.filter((c) => isContainer(c) && components(c).some(isListRow));
      const btn = direct.find(isButton);
      const rows = [];
      if (heading) rows.push([textEls(heading, document, { headingLevel: 2 })]);
      rows.push(cols.map((col) => {
        const cc = components(col);
        const cell = [];
        cc.filter((c) => isText(c) && !isListRow(c)).forEach((c) => { textEls(c, document).forEach((k) => { const p = el(document, 'p'); p.append(...k.childNodes); cell.push(p); }); });
        cell.push(listFrom(cc.filter(isListRow), document));
        return cell;
      }));
      if (btn) { const b = buttonEl(btn, document, pagePath); if (b) rows.push([b.querySelector('a')]); }
      return [block(document, 'Columns (text)', rows)];
    },
  },
  {
    // bullet rows laid out in two columns without a panel ("How the program works")
    name: 'columns-text-plain',
    match: (s) => comps(s).filter(isListRow).length >= 2 && !comps(s).some((c) => isContainer(c) && components(c).some(isListRow)),
    emit: (s, { document }) => {
      const list = comps(s);
      const lead = [];
      list.filter((c) => !isListRow(c) && isText(c)).forEach((c) => lead.push(...textEls(c, document)));
      // the source lays the items out in rows of side-by-side columns (a new row starts
      // whenever an item sits no further right than the one before it) — one block row
      // per visual row, one cell per item, so rows keep their alignment
      const rows = [];
      let lastX = Infinity;
      list.filter(isListRow).forEach((c) => {
        const x = Number(c.getAttribute('data-x') || 0);
        if (x <= lastX) rows.push([]);
        lastX = x;
        const cell = [];
        textEls(c, document).forEach((k) => cell.push(k));
        rows[rows.length - 1].push(cell);
      });
      return [...lead, block(document, 'Columns (checklist)', rows)];
    },
  },
  {
    // a rounded colour panel holding only heading / copy / one CTA → centred banner
    name: 'banner-centered',
    match: (s) => /border-radius--top-left-outer/.test(s.className) && !!s.getAttribute('data-bg') && !comps(s).some(isImage) && comps(s).filter(isButton).length === 1,
    emit: (s, { document, pagePath }) => {
      const list = comps(s);
      const text = [];
      list.filter(isText).forEach((c, i) => text.push(...textEls(c, document, { headingLevel: i === 0 ? 2 : 0 })));
      const b = buttonEl(list.find(isButton), document, pagePath);
      // a blue panel with a display (h2) heading, copy and a lime CTA → the closing
      // contact band (spotlight); otherwise the plain centred CTA banner
      const lime = list.find(isButton)?.getAttribute('data-btn') === 'lime';
      // copy set on 10 of 12 columns (offset 1) → the spotlight's `narrow` option
      const narrowBody = list.filter(isText).slice(1).some((c) => /aem-GridColumn--default--10\b/.test(c.className));
      const name = s.getAttribute('data-bg') === 'blue' && lime && text[0]?.tagName === 'H2'
        ? `Banner (spotlight${narrowBody ? ', narrow' : ''})`
        : `Banner (centered${s.getAttribute('data-bg') === 'blue' ? ', blue' : ''})`;
      return [block(document, name, [[text, b ? b.querySelector('a') : '']])];
    },
  },
  {
    // a grid of cards: ≥2 sub-containers each with a (large) image + title + copy
    name: 'cards-media',
    match: (s) => comps(s).filter((c) => isContainer(c) && components(c).some(isImage) && components(c).some(isText) && !components(c).some((k) => isImage(k) && /default--1\b/.test(k.className))).length >= 2,
    emit: (s, { document, pagePath }) => {
      const out = [];
      const rows = [];
      comps(s).forEach((c) => {
        if (isContainer(c) && components(c).some(isImage)) {
          const cc = components(c);
          const img = imageEl(cc.find(isImage), document);
          const body = [];
          cc.filter(isText).forEach((t, i) => body.push(...textEls(t, document, { headingLevel: i === 0 && fontSize(t) >= 24 ? 3 : 0 })));
          rows.push([img || '', body]);
        } else if (!rows.length) {
          if (isText(c)) out.push(...textEls(c, document));
        }
      });
      out.push(block(document, 'Cards (media, stacked)', rows));
      comps(s).filter((c) => !isContainer(c) && rows.length).forEach((c) => {
        // anything after the grid (CTA / note) stays default content after the block
        if (isButton(c)) { const b = buttonEl(c, document, pagePath); if (b) out.push(b); }
      });
      return out;
    },
  },
  {
    // small-icon cards: sub-containers with a 1-column icon image + title/copy text
    name: 'cards-icon',
    match: (s) => comps(s).filter((c) => isContainer(c) && components(c).some((k) => isImage(k) && /default--1\b/.test(k.className))).length >= 2,
    emit: (s, { document, pagePath }) => {
      const before = []; const after = []; const rows = [];
      comps(s).forEach((c) => {
        if (isContainer(c) && components(c).some(isImage)) {
          const cc = components(c);
          const icon = imageEl(cc.find(isImage), document);
          const texts = []; cc.filter(isText).forEach((t) => texts.push(...textEls(t, document)));
          // first paragraph = the card title; the source writes "<b>title</b><br>copy" in
          // one paragraph, so a leading bold run becomes the h3 and the rest its copy
          if (texts[0] && texts[0].tagName === 'P') {
            const first = texts[0];
            const lead = first.firstElementChild;
            const h = el(document, 'h3');
            if (lead && /^(STRONG|B)$/.test(lead.tagName) && !norm(first.textContent.slice(0, first.textContent.indexOf(lead.textContent)))) {
              h.append(...lead.childNodes); lead.remove();
              while (first.firstChild && (first.firstChild.nodeName === 'BR' || (first.firstChild.nodeType === 3 && !norm(first.firstChild.textContent)))) first.firstChild.remove();
              texts.splice(0, 1, h, ...(norm(first.textContent) ? [first] : []));
            } else { h.append(...first.childNodes); texts[0] = h; }
          }
          const iconP = el(document, 'p'); if (icon) iconP.append(icon);
          rows.push([[iconP, ...texts]]);
        } else if (!rows.length) {
          if (isText(c)) before.push(...textEls(c, document));
        } else if (isText(c)) after.push(...textEls(c, document));
        else if (isButton(c)) { const b = buttonEl(c, document, pagePath); if (b) after.push(b); }
      });
      return [...before, block(document, 'Cards (icons)', rows), ...after];
    },
  },
  {
    // two (or more) side-by-side text columns, each with its own CTA ("Join … today")
    name: 'columns-cta',
    match: (s) => comps(s).filter((c) => isContainer(c) && components(c).some(isButton) && components(c).some(isText) && !components(c).some(isImage)).length >= 2,
    emit: (s, { document, pagePath }) => {
      const before = []; const cells = [];
      comps(s).forEach((c) => {
        if (isContainer(c) && components(c).some(isButton)) cells.push(defaultContent(c, document, pagePath));
        else if (!cells.length && isText(c)) before.push(...textEls(c, document));
      });
      // the column titles (32px Graphik Semibold) are h3
      cells.forEach((cell) => { if (cell[0] && /^H[23]$/.test(cell[0].tagName)) { const h = el(document, 'h3'); h.append(...cell[0].childNodes); cell[0] = h; } });
      return [...before, block(document, 'Columns (cta)', [cells])];
    },
  },
  {
    // an image beside a gray-bordered text card (`container--border--gray`): the
    // Columns (feature) row — framed in its dark panel, or `unframed` without one
    name: 'columns-feature',
    match: (s) => deep(s).some(isImage) && !!s.querySelector('.container--border--gray') && !comps(s).some(isButton),
    emit: (s, { document }) => {
      const card = s.querySelector('.container--border--gray');
      const img = deep(s).find((c) => isImage(c) && !card.contains(c));
      const texts = []; deep(card).filter(isText).forEach((t) => texts.push(...textEls(t, document)));
      const i = imageEl(img, document);
      // cells in source order (image first or card first)
      const imgFirst = !!(img.compareDocumentPosition(card) & 4); // the card FOLLOWS the image
      const cells = imgFirst ? [[i], texts] : [texts, [i]];
      const framed = s.getAttribute('data-bg') === 'dark';
      return [block(document, framed ? 'Columns (feature)' : 'Columns (feature, unframed)', [cells])];
    },
  },
  {
    // heading + intro + two photos side by side + CTA ("USTA Coaching Network")
    name: 'columns-photos',
    match: (s) => { const d = comps(s); return d.filter(isImage).length === 2 && d.some(isText) && !d.some(isContainer); },
    emit: (s, { document, pagePath }) => {
      const before = []; const after = []; const imgs = [];
      comps(s).forEach((c) => {
        if (isImage(c)) { const i = imageEl(c, document); if (i) imgs.push([i]); } else if (isText(c)) (imgs.length ? after : before).push(...textEls(c, document));
        else if (isButton(c)) { const b = buttonEl(c, document, pagePath); if (b) (imgs.length ? after : before).push(b); }
      });
      return [...before, block(document, 'Columns (photos)', [imgs]), ...after];
    },
  },
  {
    // dark panel: heading + intro + CTA beside a stack of topic cards → Discussion Boards
    name: 'discussion-boards',
    match: (s) => s.getAttribute('data-bg') === 'dark' && deep(s).some(isButton)
      && [...s.querySelectorAll('.container')].filter(isTopicCard).length >= 2,
    emit: (s, { document }) => {
      const topics = [...s.querySelectorAll('.container')].filter(isTopicCard);
      const intro = [];
      deep(s).filter((c) => !topics.some((t) => t.contains(c))).forEach((c) => {
        if (isText(c)) intro.push(...textEls(c, document));
        else if (isButton(c)) { const a = c.querySelector('a'); if (a) { const p = el(document, 'p'); const l = el(document, 'a'); l.href = a.getAttribute('href'); l.textContent = norm(a.textContent); p.append(l); intro.push(p); } }
      });
      const rows = [[intro]];
      topics.forEach((t) => { const ps = components(t).filter(isText).map((c) => { const p = el(document, 'p'); p.textContent = norm(c.textContent); return p; }); rows.push([[ps[0]], ps.slice(1)]); });
      return [block(document, 'Discussion Boards', rows)];
    },
  },
  {
    // testimonial cards (`container--inner-full-height`, italic quote + name + role)
    name: 'cards-quote',
    match: (s) => [...s.querySelectorAll('.container--inner-full-height')].filter((c) => c.querySelector('i, em')).length >= 2,
    emit: (s, { document }) => {
      const quotes = [...s.querySelectorAll('.container--inner-full-height')].filter((c) => c.querySelector('i, em'));
      const lead = [];
      comps(s).forEach((c) => { if (isText(c) && !quotes.some((q) => q.contains(c))) lead.push(...textEls(c, document)); });
      const rows = quotes.map((q) => [[...q.querySelectorAll('.cmp-text p')].filter((x) => norm(x.textContent)).map((x) => { const p = el(document, 'p'); p.textContent = norm(x.textContent); return p; })]);
      // borderless cards (coaching-community) are the testimonial look; the outlined
      // ones (inclusion summit) the plain quote cards
      const outlined = quotes.some((q) => /container--border--/.test(q.className));
      return [...lead, block(document, outlined ? 'Cards (quote)' : 'Cards (quote, testimonial)', rows)];
    },
  },
  {
    // text column(s) beside an image (the desktop copy of a media row)
    name: 'columns-media-row',
    match: (s) => { const d = comps(s); return d.some(isImage) && d.some((c) => isText(c) || (isContainer(c) && components(c).some(isText))); },
    emit: (s, { document, pagePath }) => {
      const d = comps(s);
      const imgC = d.find(isImage);
      const textCell = [];
      d.filter((c) => c !== imgC).forEach((c) => {
        if (isText(c)) textCell.push(...textEls(c, document, { headingLevel: fontSize(c) >= 40 ? 2 : 0 }));
        else if (isContainer(c)) textCell.push(...defaultContent(c, document, pagePath).map((k) => k));
        else if (isButton(c)) { const b = buttonEl(c, document, pagePath); if (b) textCell.push(b); }
      });
      const img = imageEl(imgC, document);
      const imgFirst = Number(imgC.getAttribute('data-x') || 0) < Number((d.find((c) => c !== imgC) || imgC).getAttribute('data-x') || 0);
      const cells = imgFirst ? [img, textCell] : [textCell, img];
      return [block(document, 'Columns', [cells])];
    },
  },
];

/* ------------------------------------------------------------------- import -- */
export default {
  onLoad: ({ document }) => {
    // authored blank lines (<p>&nbsp;</p>) don't survive the importer's HTML cleanup —
    // mark them so textEls can still see the gap
    document.querySelectorAll('.cmp-text p').forEach((q) => {
      if (!q.textContent.replace(/\s/g, '') && !q.querySelector('img')) q.textContent = BLANK;
    });
    // stamp live-layout facts the transform needs (the transform DOM has no layout)
    document.querySelectorAll('.aem-GridColumn, .cmp-container, .container').forEach((e) => {
      const r = e.getBoundingClientRect();
      e.setAttribute('data-h', String(Math.round(r.height)));
      e.setAttribute('data-x', String(Math.round(r.left)));
    });
    document.querySelectorAll('.container').forEach((c) => {
      const inner = c.querySelector(':scope > .cmp-container');
      const bg = inner ? getComputedStyle(inner).backgroundColor : '';
      if (bg === 'rgb(3, 115, 243)') c.setAttribute('data-bg', 'blue');
      else if (bg === 'rgb(207, 255, 5)') c.setAttribute('data-bg', 'lime');
      else if (bg && bg !== 'rgba(0, 0, 0, 0)' && bg !== 'rgb(0, 0, 0)') c.setAttribute('data-bg', 'dark');
    });
    document.querySelectorAll('.button').forEach((b) => {
      const a = b.querySelector('a, button');
      const bg = a ? getComputedStyle(a).backgroundColor : '';
      // outline = no fill of its own (transparent, or the black page colour + white border)
      if (bg === 'rgba(0, 0, 0, 0)' || bg === 'rgb(0, 0, 0)') b.setAttribute('data-btn', 'outline');
      else if (bg === 'rgb(207, 255, 5)') b.setAttribute('data-btn', 'lime');
    });
  },

  transform: (payload) => {
    const { document, params } = payload;
    const url = params.originalURL;
    const pagePath = pathOf(url);
    const main = document.querySelector('main') || document.body;

    cleanupTransformer('beforeTransform', main, payload);
    // desktop-hidden responsive duplicates (the import viewport is desktop)
    main.querySelectorAll('[class*="aem-GridColumn--default--hide"]').forEach((e) => e.remove());

    const { root, skip } = contentRoot(main);
    if (!root) throw new Error('landing-page content grid not found');

    const out = document.createElement('div');
    const report = [];
    let first = true;
    [...root.children].forEach((s) => {
      if (skip(s) || !norm(s.textContent) && !s.querySelector('img')) return;
      const { name, nodes, styles } = emitSection(s, { document, pagePath });
      if (!nodes.length) return;
      if (!first) out.append(document.createElement('hr'));
      first = false;
      out.append(...nodes);
      if (styles.length) out.append(block(document, 'Section Metadata', { Style: styles.join(', ') }));
      report.push(name);
    });

    finalizeOutput(out, document);
    out.append(document.createElement('hr'), metadata(document));
    cleanupTransformer('afterTransform', out, payload);
    WebImporter.rules.adjustImageUrls(out, url, params.originalURL);
    return [{ element: out, path: pagePath, report: { title: document.title, template: TEMPLATE, sections: report.join(' | ') } }];
  },
};

/* output sweeps shared with the sample importers: nested block tables → their content;
   blank-line markers removed */
function finalizeOutput(out, document) {
  // a block can't nest inside a block cell: keep a nested table's content only
  out.querySelectorAll('table table').forEach((t) => {
    const frag = document.createDocumentFragment();
    [...t.querySelectorAll('tr')].slice(1).forEach((tr) => [...tr.children].forEach((td) => {
      const kids = [...td.childNodes];
      if (kids.some((n) => n.nodeType === 1 && /^(P|H[1-6]|UL|OL)$/.test(n.tagName))) frag.append(...kids);
      else { const q = el(document, 'p'); q.append(...kids); frag.append(q); }
    }));
    t.replaceWith(frag);
  });
  out.querySelectorAll('p').forEach((q) => { if (q.textContent.includes(BLANK)) { q.textContent = q.textContent.replace(BLANK, ''); if (!norm(q.textContent) && !q.querySelector('img')) q.remove(); } });
}

export {
  KINDS, emitSection, finalizeOutput, contentRoot, block, el, norm, TEMPLATE,
};
