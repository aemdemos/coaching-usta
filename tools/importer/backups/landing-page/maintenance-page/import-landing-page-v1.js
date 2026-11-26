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
import { featureOptions, cropOptions } from './parsers/feature-options.js';
import cleanupTransformer from './transformers/coaching-usta-cleanup.js';
import parsePricing from './parsers/cards-pricing.js';
import parseEventsBanner from './parsers/columns-cta.js';

const TEMPLATE = 'landing-page';
const BASE = 'https://www.ustacoaching.com';

/* page themes (CSS-only variations, themes/<name>/) by page path without the locale.
   course-catalog: the courses intro's own rhythm + type, and phone / wide image pairs */
const PAGE_THEMES = { '/home/courses': 'course-catalog', '/home/news': 'news-listing', '/home/news/search-results': 'news-search', '/maintenance-page': 'maintenance', '/home/about': 'about' };
const themeOf = (pagePath) => PAGE_THEMES[pagePath.replace(/^\/(en|es)(?=\/)/, '')] || '';
/* themes whose pages keep a phone-only image as the `Image` block's mobile row */
const IMAGE_PAIR_THEMES = ['course-catalog'];

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

function metadata(document, theme) {
  const meta = (sel) => document.querySelector(sel)?.getAttribute('content') || '';
  const cells = { Title: document.title, Description: meta('meta[name="description"]'), Template: TEMPLATE, Theme: theme };
  const og = meta('meta[property="og:image"]');
  if (og) { const img = el(document, 'img'); img.src = og; cells.Image = img; }
  Object.keys(cells).forEach((k) => { if (!cells[k]) delete cells[k]; });
  return block(document, 'Metadata', cells);
}

/* the content grid: descend through wrappers while one child holds the content */
function contentRoot(main) {
  // experience fragments are site chrome (header, modals) — except the pricing tiers XF,
  // which is page content on the courses page
  const skip = (e) => (/experiencefragment/.test(e.className || '') && !e.querySelector('.v-tiers'))
    || /aem-header|aem-hidden-component|aem-quiz|aem-wizard|safe-play|footer/.test(e.className || '');
  let root = main.querySelector('.aem-Grid');
  for (let guard = 0; guard < 12 && root; guard += 1) {
    const kids = [...root.children].filter((k) => !skip(k) && Number(k.getAttribute('data-h') || 0) > 0);
    const total = kids.reduce((s, k) => s + Number(k.getAttribute('data-h') || 0), 0);
    const big = kids.find((k) => Number(k.getAttribute('data-h') || 0) >= 0.85 * total);
    if (kids.length > 2 && !big) break;
    // the big child is not the whole page when its siblings carry content (coaching-workshops:
    // the hero row above it and the footnote below) — this grid is the content root
    if (big && kids.some((k) => k !== big && (norm(k.textContent) || k.querySelector('img')))) break;
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
function textEls(c, document, { headingLevel, plain } = {}) {
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
    if (/207,\s*255,\s*[58]\b|#cfff0[58]/i.test(sp.getAttribute('style'))) { const em = el(document, 'em'); em.append(...sp.childNodes); sp.replaceWith(em); }
  });
  let prevP = null;
  let prevH = null;
  // authored blank lines (<p>&nbsp;</p>) in default content are kept as blank paragraphs
  // (the landing template renders each as a 24px line, no margin): leading, trailing and
  // next to a list / heading as authored; between two paragraphs the first one is already
  // the paragraph gap, so only the extra ones are written
  let prevPH = null; // the heading built from the previous (touching) paragraph
  const keepBlanks = !plain && !headingLevel;
  let pending = 0;
  let started = false;
  const flushBlanks = (next) => {
    if (keepBlanks && pending) {
      const last = out[out.length - 1];
      const implicit = started && next === 'P' && last && last.tagName === 'P' && !last.hasAttribute('data-blank') ? 1 : 0;
      for (let i = implicit; i < pending; i += 1) { const b = el(document, 'p'); b.textContent = '\u200b'; b.setAttribute('data-blank', ''); out.push(b); }
    }
    pending = 0;
    started = true;
  };
  [...cmp.children].forEach((child) => {
    let k = child;
    if (cls(k, 'cmp-text__icon')) return;
    if (!norm(k.textContent) && !k.querySelector('img')) { if (k.tagName === 'P' && !k.hasAttribute('data-collapsed')) pending += 1; prevP = null; prevH = null; prevPH = null; return; }
    if (k.tagName !== 'P') prevPH = null;
    // consecutive headings of one level = one heading set on several lines
    if (/^H[1-6]$/.test(k.tagName) && prevH && prevH.tagName === k.tagName && !pending) { prevH.append(el(document, 'br'), ...k.childNodes); return; }
    // a section heading the source marks up as h3 / h4 in the USTA Sans 40px display preset
    // (fellowship) → h2 (the page has no h2 otherwise: h1 → h3 would skip a level)
    if (/^H[34]$/.test(k.tagName) && (headingLevel === 2 || (!headingLevel && isUstaSans(c) && size >= 40))) {
      const h2 = el(document, 'h2'); h2.append(...k.childNodes); k.replaceWith(h2); k = h2;
    }
    prevH = /^H[1-6]$/.test(k.tagName) ? k : null;
    // USTA Sans text without a size class is a display section heading ("SET YOUR PATHWAY")
    if (k.tagName === 'P' && (headingLevel || size >= 32 || (isUstaSans(c) && !size))) {
      const lvl = headingLevel || (size >= 40 || isUstaSans(c) ? 2 : 3);
      // a heading paragraph touching the previous heading paragraph (no blank line)
      // continues it on a new line — one heading, as on the source
      if (prevPH && prevPH.tagName === `H${lvl}`) { prevPH.append(el(document, 'br'), ...k.childNodes); return; }
      const h = el(document, `h${lvl}`);
      h.append(...k.childNodes);
      flushBlanks('H');
      out.push(h);
      prevPH = h;
      prevP = null;
      return;
    }
    if (k.tagName === 'P' && prevP) { prevP.append(el(document, 'br'), ...k.childNodes); return; }
    flushBlanks(k.tagName);
    out.push(k);
    prevP = k.tagName === 'P' ? k : null;
  });
  if (started) flushBlanks('END');
  out.forEach((k) => k.removeAttribute && k.removeAttribute('data-blank'));
  // sized intro lines → Text Style: the large lead (`text--font-size--24px…`, 16 → 24)
  // and the smaller subhead (`text--font-size--18px-16px`, 16 → 18); centred on the
  // source → the block's `center` option (a section's centring only reaches default content)
  const style = { 24: 'lead', 18: 'subhead' }[size];
  // (`plain`: text inside a block cell stays plain paragraphs — a block can't nest a block)
  if (style && !plain && !isUstaSans(c) && !headingLevel && out.length && out.every((k) => k.tagName === 'P')) {
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
  // Join-wizard / quiz buttons have no real href on the source (a script opens a pop-up):
  // Phase 1 links them to the closest real page (MIGRATION ROADMAP; Phase 2 adds the pop-up)
  const action = (c.querySelector('[data-button-action]') || a).getAttribute('data-button-action') || '';
  const href = a.getAttribute('href');
  link.href = /^(wizard|quiz)/.test(action) && (!href || href === '#') ? '/en/home/membership-benefits' : (href || pagePath);
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
    else if (isImage(c)) {
      const i = imageEl(c, document);
      if (i) {
        // a phone-only copy of this image (themed pages) → an `Image` block: the wide
        // image from 768px up, the phone image below (one art-directed picture)
        const phone = c.getAttribute('data-phone-image');
        if (phone) {
          const m = el(document, 'img'); m.src = phone; m.alt = c.getAttribute('data-phone-alt') || i.alt;
          out.push(block(document, 'Image', [['desktop', i], ['mobile', m]]));
        } else {
          const p = el(document, 'p');
          p.append(i);
          out.push(p);
        }
      }
    }
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
/* a section whose own panel carries the background photo (the source container's
   data-desktop-background-image on its first cmp-container): a hero */
const isBgPanel = (s) => { const c = s.querySelector('.cmp-container'); return !!c && c.hasAttribute('data-desktop-background-image'); };
/* workshops course card: a white-outlined container holding a background-photo container
   and a text container */
const isCourseCard = (c) => isContainer(c) && /container--border--white/.test(c.className)
  && !!c.querySelector('.cmp-container[data-desktop-background-image]') && deep(c).some((t) => isText(t) && norm(t.textContent));
/* about page: an executive person card (Vue v-person-card) and a board-member row (an image
   beside a white-outlined card with the name, role lines, bio and tags) */
const isPersonCard = (c) => kind(c) === 'aem-person-card' && !!c.querySelector('.v-person-card');
const isPhotoTile = (k) => isImage(k) || (isContainer(k) && !!k.querySelector('.cmp-container[data-desktop-background-image]') && !deep(k).some((t) => isText(t) && norm(t.textContent)));
const isBoardRow = (c) => isContainer(c) && components(c).some(isPhotoTile)
  && components(c).some((k) => isContainer(k) && /container--border--white/.test(k.className) && deep(k).some((t) => isText(t) && norm(t.textContent)));
/* a partner logo: an image component that links out */
const isLinkedLogo = (c) => isImage(c) && !!c.querySelector('a.cmp-image__link img');
/* a contact card: a white container with a heading text and an (icon) link button */
const isContactCard = (c) => isContainer(c) && c.getAttribute('data-bg-color') === 'rgb(255, 255, 255)'
  && deep(c).some((t) => isText(t) && !!t.querySelector('h1, h2, h3, h4')) && deep(c).some(isButton);
/* every container inside a section, at any depth */
const allContainers = (s) => { const out = []; const walk = (e) => components(e).forEach((c) => { if (isContainer(c)) { out.push(c); walk(c); } }); walk(s); return out; };
/* coachtennis package tier: a white-outlined container with a 56px price text and a CTA */
const isPackageTier = (c) => isContainer(c) && /container--border--white/.test(c.className)
  && components(c).some((t) => isText(t) && fontSize(t) === 56) && components(c).some(isButton);
/* the tier CTA's author border colour → the packages row's accent keyword */
const PACKAGE_ACCENTS = { '#0373F3': 'blue', '#CFFF05': 'lime', '#A4EE90': 'green' };
/* a stats-strip figure: a container of a USTA Sans figure + its label, nothing else */
const isStat = (c) => isContainer(c) && components(c).filter((t) => isText(t) && norm(t.textContent)).length === 2
  && isUstaSans(components(c).find(isText)) && !components(c).some((t) => isImage(t) || isButton(t));
/* the section right after a run of loose heading / intro components (prepareSections) */
const isLooseRunBefore = (s) => { const p = s.previousElementSibling; return !!p && p.hasAttribute('data-loose-text') && !p.hasAttribute('data-heading-only'); };
const isTopicCard = (c) => { const k = components(c).filter((x) => kind(x) !== 'separator'); return k.length >= 2 && k.every(isText); };

/* a parser-built block table, renamed to the current block name (the home parsers
   still emit the pre-consolidation names: cards-pricing, columns-cta) */
function reparse(node, parse, name, document) {
  const holder = el(document, 'div');
  holder.append(node);
  parse(node, { document });
  const table = holder.querySelector('table');
  if (table) table.rows[0].cells[0].textContent = name;
  return [...holder.childNodes];
}

/* a source text node → <p> (bold runs kept as <strong>) */
function textP(document, source) {
  const p = el(document, 'p');
  p.innerHTML = source.innerHTML.replace(/<(\/?)b>/g, '<$1strong>');
  return p;
}

/* a plain <p> with text */
const para = (document, text) => { const p = el(document, 'p'); p.textContent = text; return p; };
/* a URL-safe slug ("Recorded Webinars" → "recorded-webinars") */
const slugOf = (t) => norm(t).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

/* a promo / event card: a white-outlined container with a title, a CTA and a details text,
   no image (coaching-workshops "IN-PERSON EVENTS" + the webinar cards in the tabs) */
const isPromoCard = (c) => isContainer(c) && /container--border--white/.test(c.className)
  && deep(c).some(isButton) && deep(c).filter(isText).length >= 2 && !deep(c).some(isImage);

/* promo cards → ONE `Columns (promo)` block, one row per card (title, CTA link, details) */
function promoBlock(cards, document, pagePath) {
  const rows = cards.map((card) => {
    const d = deep(card);
    const cell = [];
    d.filter(isText).forEach((t, i) => {
      cell.push(...textEls(t, document, { plain: true }));
      const btn = i === 0 && d.find(isButton);
      if (btn) {
        // a plain link paragraph: the block styles its own CTA (block sample contract)
        const b = buttonEl(btn, document, pagePath);
        if (b) { const p = el(document, 'p'); p.append(b.querySelector('a')); cell.push(p); }
      }
    });
    return [cell];
  });
  return block(document, 'Columns (promo)', rows);
}

/* the Vue events list (`v-events-list`, rendered on the live page) → `Columns (events)`:
   one row per event — date | delivery method, location, title | chips — plus a row with
   the "View More" link (block sample contract) */
function eventsBlock(list, viewMore, document, pagePath) {
  const rows = [...list.querySelectorAll('.v-event')].map((ev) => {
    const t = (sel) => norm((ev.querySelector(sel) || {}).textContent);
    const ul = el(document, 'ul');
    ev.querySelectorAll('.v-event__chip').forEach((chip) => { const li = el(document, 'li'); li.textContent = norm(chip.textContent); ul.append(li); });
    return [[para(document, t('.v-event__date'))], [para(document, t('.v-event__delivery-method')), para(document, t('.v-event__location')), para(document, t('.v-event__title'))], [ul]];
  });
  if (viewMore) { const b = buttonEl(viewMore, document, pagePath); if (b) rows.push([b.querySelector('a')]); }
  return block(document, 'Columns (events)', rows);
}

/* a core-tabs component → a `Toc` block (label | anchor per tab) after the section's lead
   copy, then ONE SECTION PER TAB carrying Section Metadata `toc-anchor` (the toc block shows
   one tab's section at a time — tabs hold real blocks, so they can't be nested in a block) */
function emitTabs(s, { document, pagePath }) {
  const tabsEl = s.querySelector('.cmp-tabs');
  const host = tabsEl.closest('.core-tabs') || tabsEl;
  const others = comps(s).filter((c) => c !== host && !host.contains(c) && !c.contains(host) && kind(c) !== 'separator');
  // copy BEFORE the tabs introduces them; copy AFTER them (a footnote in the same run of
  // loose components) becomes its own section after the tab panels
  const lead = others.filter((c) => c.compareDocumentPosition(host) & 4);
  const trail = others.filter((c) => !lead.includes(c));
  const toNodes = (list) => {
    const nodes = [];
    list.forEach((c) => {
      if (isText(c)) nodes.push(...textEls(c, document));
      else if (isButton(c)) { const b = buttonEl(c, document, pagePath); if (b) nodes.push(b); }
    });
    return nodes;
  };
  const leadNodes = toNodes(lead);
  const labels = [...tabsEl.querySelectorAll('.cmp-tabs__tab')].map((t) => norm(t.textContent));
  const centred = lead.some((c) => isText(c) && cls(c, 'cmp-text--alignment-center'));
  const out = [{ name: 'toc', nodes: [...leadNodes, block(document, 'Toc', labels.map((l) => [l, slugOf(l)]))], styles: centred ? ['center'] : [] }];
  [...tabsEl.querySelectorAll('.cmp-tabs__tabpanel')].forEach((panel, i) => {
    const list = comps(panel);
    const cards = list.filter(isPromoCard);
    const nodes = [];
    if (cards.length) {
      list.filter((c) => !cards.includes(c) && isText(c)).forEach((c) => nodes.push(...textEls(c, document)));
      nodes.push(promoBlock(cards, document, pagePath));
    } else nodes.push(...defaultContent(panel, document, pagePath));
    const firstText = deep(panel).find((c) => isText(c) && norm(c.textContent));
    // (the tabs component's 8 / 12px padding around a tab section is in toc.css)
    out.push({ name: 'toc-panel', nodes, styles: firstText && cls(firstText, 'cmp-text--alignment-center') ? ['center'] : [], meta: { 'toc-anchor': slugOf(labels[i] || `tab-${i + 1}`) } });
  });
  if (trail.length) {
    const centredTrail = trail.some((c) => isText(c) && cls(c, 'cmp-text--alignment-center'));
    out.push({ name: 'default', nodes: toNodes(trail), styles: centredTrail ? ['center'] : [] });
  }
  return out;
}

/* ------------------------------------------------------------- section kinds -- */
/* the column span N of a centred text component (`default--N` + `offset--default--(12−N)/2`) */
function centredSpan(c) {
  const n = Number(((c.className || '').match(/aem-GridColumn--default--(\d+)\b/) || [])[1]);
  const off = Number(((c.className || '').match(/aem-GridColumn--offset--default--(\d+)\b/) || [])[1]);
  return n >= 1 && n < 12 && off * 2 + n === 12 ? n : 0;
}

/* one source section → [{ name, nodes, styles }]: usually one section; a leading heading
   set on fewer than 12 columns (centred) becomes its own `narrow-N` section before it */
function emitSection(s, { document, pagePath }) {
  const out = [];
  const lead = [];
  // the SECTION's own padding (the section container or a lone wrapper container, not a
  // column inside it): `container--padding--<v>px-<N>px` (e.g. 12px-4px) sets the whole
  // section N px in each side → `inset-N` (12px-4px → inset-4; a padded column is the
  // block's business, not the section's)
  let wrap = s; let padded = null;
  for (let guard = 0; guard < 6 && wrap; guard += 1) {
    if (/container--padding--/.test(wrap.className || '')) { padded = wrap; break; }
    const list = components(wrap);
    wrap = list.length === 1 && isContainer(list[0]) ? list[0] : null;
  }
  const insetPx = Number(((padded && padded.className.match(/\bcontainer--padding--\d+px-(\d+)px\b/)) || [])[1] || 0);
  const inset = insetPx >= 1 && insetPx <= 64 ? [`inset-${insetPx}`] : [];
  // (the `container--padding--small` preset around a promo section and the wrapper's 8 / 12px
  // inset around full-width display headings are reproduced in CSS: columns.css /
  // landing-page.css — no section style)
  // a centred heading over LEFT-aligned copy (coaching-workshops: the centred section headings
  // above left-aligned intros) is its own section too — on all 12 columns (`narrow-12`), so it
  // joins the next section like a narrow heading does
  const texts = comps(s).filter((c) => isText(c) && norm(c.textContent));
  const centredLead = (c) => {
    if (centredSpan(c)) return true;
    // the copy DIRECTLY under the heading decides (a centred subhead keeps one section)
    const next = texts[texts.indexOf(c) + 1];
    return cls(c, 'cmp-text--alignment-center') && isUstaSans(c) && !!next && !cls(next, 'cmp-text--alignment-center');
  };
  // (an empty separator above the heading — results pages — doesn't end the lead)
  // (a hero panel keeps its centred heading: the heading is the hero's own — workshops)
  if (!(isBgPanel(s) && deep(s).some(isButton))) {
    for (const c of comps(s)) { if (!lead.length && kind(c) === 'separator') continue; if (isText(c) && centredLead(c)) lead.push(c); else break; }
  }
  const rest = comps(s).filter((c) => !lead.includes(c) && kind(c) !== 'separator');
  // a loose heading + intro run that is ALL centred lead (both on the same narrow span) right
  // before a block section → one narrow heading section that introduces it (coachtennis
  // "Packages for Every Tennis Coach"); the next section then doesn't join it
  const headingOnly = lead.length && !rest.length && s.hasAttribute('data-loose-text') && !!s.nextElementSibling && isContainer(s.nextElementSibling);
  if (headingOnly) s.setAttribute('data-heading-only', '');
  if (lead.length && (rest.length || headingOnly)) {
    const n = centredSpan(lead[0]) || 12;
    const nodes = []; lead.forEach((c) => { nodes.push(...textEls(c, document)); c.remove(); });
    // the source's display heading size (`text--font-size--64px-28px`) → `heading-64`
    const styles = [...(cls(lead[0], 'cmp-text--alignment-center') ? ['center'] : []), `narrow-${n}`, ...(fontSize(lead[0]) === 64 ? ['heading-64'] : []), ...inset];
    out.push({ name: 'heading', nodes, styles });
  }
  // tabs: the lead copy + a Toc block, then one section per tab
  if (s.querySelector('.cmp-tabs')) return [...out, ...emitTabs(s, { document, pagePath }).map((p) => ({ ...p, styles: [...p.styles, ...inset] }))];
  const k = KINDS.find((kd) => { try { return kd.match(s); } catch (e) { return false; } });
  // centred copy (source text component `cmp-text--alignment-center`) → center
  // (a display USTA Sans heading has no alignment class — the site CSS centres it — so a
  // section opening with one follows the copy after it)
  const deepTexts = deep(s).filter((c) => isText(c) && norm(c.textContent));
  const firstText = deepTexts.find((c) => !(isUstaSans(c) && !cls(c, 'cmp-text--alignment-center'))) || deepTexts[0];
  // (a narrow heading's section inherits its centring; a full-width centred heading split
  // off LEFT-aligned copy does not)
  const centred = (!!firstText && cls(firstText, 'cmp-text--alignment-center'))
    || (out.length && out[0].styles.includes('center') && !out[0].styles.includes('narrow-12'));
  const nodes = k ? k.emit(s, { document, pagePath }) : defaultContent(s, document, pagePath);
  const styles = [];
  if (centred && !(k && /^(hero|banner|video)/.test(k.name))) styles.push('center');
  // a kind may set section styles of its own (image-cropped: its column span → narrow-N)
  if (k && typeof k.styles === 'function') styles.push(...k.styles(s));
  // a section that opens with the source's display heading size (USTA Sans
  // `text--font-size--64px-…`) and wasn't split → `heading-64` too (results pages)
  const leadText = comps(s).find((c) => isText(c) && norm(c.textContent));
  if (!out.length && leadText && isUstaSans(leadText) && fontSize(leadText) === 64 && !(k && /^(hero|banner)/.test(k.name))) styles.push('heading-64');
  styles.push(...inset);
  // a section container on the source's 36px margin preset (`container--top-margin--36` /
  // `--bottom-margin--36`, fellowship) → `spacing-36` (landing template: 12 / 12 / 20 / 36px
  // section padding instead of the 52px preset) — its split-off heading too
  // (the TOP preset decides; a coloured / rounded panel's spacing is its block's business)
  const m36 = (e) => !!e && (e.hasAttribute('data-margin-36') || (/container--top-margin--36\b/.test(e.className || '') && !/container--border-radius--/.test(e.className) && !e.getAttribute('data-bg')));
  if (m36(s) || m36(padded) || [...s.children].some((c) => c.hasAttribute('data-margin-36'))) {
    styles.push('spacing-36');
    if (out.length && out[0].name === 'heading') out[0].styles.push('spacing-36');
  }
  // default content in the `container--padding--small` preset (sides 16px on phones, 12px
  // from 768; fellowship "APPLICATION DETAILS" / "CANDIDATE QUALIFICATIONS") → the single
  // value `inset-12` (exact from 768, 4px less on phones) — its split-off heading too
  if (!k && !inset.length && padded && /\bcontainer--padding--small\b/.test(padded.className) && !/container--border--/.test(padded.className)) {
    styles.push('inset-12');
    if (out.length && out[0].name === 'heading') out[0].styles.push('inset-12');
  }
  const join = !!k && (typeof k.joinPrevious === 'function' ? k.joinPrevious(s) : !!k.joinPrevious);
  out.push({ name: k ? k.name : 'default', nodes, styles, join });
  return out;
}

// each: { name, match(section, ctx) → bool, emit(section, ctx) → nodes[] }
const KINDS = [
  {
    // page sub-navigation (Courses · Workshops · Education Centers) → Tabs in navigation
    // mode: one row per link (no panel); the tab linking to the current page is active
    name: 'sub-nav',
    match: (s) => !!s.querySelector('.cmp-navigation'),
    emit: (s, { document }) => {
      const rows = [...s.querySelectorAll('.cmp-navigation__item-link')].map((a) => {
        const link = el(document, 'a');
        link.href = a.getAttribute('href');
        link.textContent = norm(a.textContent);
        return [link];
      });
      return rows.length ? [block(document, 'Tabs', rows)] : [];
    },
  },
  {
    // the course browser (Vue v-course-list WITH its filter bar — the courses page) → Course
    // Filter; it fills itself from the LMS API + the locale course catalog sheet, so the
    // block has no rows. (learning-pathway's v-course-list is a different instance — the
    // certifications API, no filters, a redirect button — not this block.)
    name: 'course-filter',
    match: (s) => !!s.querySelector('.v-course-list__top-filters-wrapper'),
    emit: (s, { document }) => [block(document, 'Course Filter', [['']])],
  },
  {
    // certification cost cards (Vue v-cost-card) → Cards (comparison): one row per tier
    // (logo | title, fee, PER YEAR + price, description, TOTAL); the equivalency line and
    // the "Notes:" paragraph after the cards are the block's last two rows
    name: 'cards-comparison',
    match: (s) => !!s.querySelector('.v-cost-card'),
    emit: (s, { document }) => {
      const cards = [...s.querySelectorAll('.v-cost-card')];
      // every text component, including those inside the cost-card experience
      // fragment (the equivalency line + "Notes:"), which deep() doesn't enter
      const texts = [...s.querySelectorAll('.text')].filter((t) => isText(t) && norm(t.textContent));
      const before = texts.filter((t) => t.compareDocumentPosition(cards[0]) & 4);
      const after = texts.filter((t) => !before.includes(t));
      const lead = []; before.forEach((t) => lead.push(...textEls(t, document, { headingLevel: 2 })));
      const p = (text) => { const q = el(document, 'p'); q.textContent = text; return q; };
      const rows = cards.map((c) => {
        const logo = c.querySelector('.v-cost-card__badge-image img');
        const img = el(document, 'img');
        if (logo) { img.src = logo.getAttribute('src'); img.alt = logo.getAttribute('alt') || ''; }
        const body = [];
        const h = el(document, 'h3'); h.textContent = norm(c.querySelector('.v-cost-card__title')?.textContent); body.push(h);
        const overlay = c.querySelector('.v-cost-card__coming-soon-overlay');
        if (overlay) {
          // coming-soon tier: the "COMING 202x" line (the flame graphic is part of the
          // source component, not authored — the block draws it)
          body.push(p(norm(c.querySelector('.v-cost-card__total')?.textContent) || h.textContent));
          return [logo ? img : '', body];
        }
        const sub = c.querySelector('.v-cost-card__subtitle'); if (sub) body.push(p(norm(sub.textContent)));
        const label = c.querySelector('.v-cost-card__price-label'); if (label) body.push(p(norm(label.textContent)));
        const value = c.querySelector('.v-cost-card__price-value'); if (value) body.push(p(norm(value.textContent)));
        const desc = c.querySelector('.v-cost-card__description');
        if (desc) {
          [...desc.children].forEach((k) => {
            if (k.tagName === 'UL' || k.tagName === 'OL') {
              const list = el(document, k.tagName.toLowerCase());
              k.querySelectorAll('li').forEach((li) => { const item = el(document, 'li'); item.textContent = norm(li.textContent); list.append(item); });
              body.push(list);
            } else if (norm(k.textContent)) body.push(textP(document, k));
          });
        }
        const tl = c.querySelector('.v-cost-card__total-label'); if (tl) body.push(p(norm(tl.textContent)));
        const tv = c.querySelector('.v-cost-card__total-value'); if (tv) body.push(p(norm(tv.textContent)));
        return [logo ? img : '', body];
      });
      after.forEach((t) => { const ps = textEls(t, document).filter((k) => k.tagName === 'P'); if (ps.length) rows.push([ps]); });
      return [...lead, block(document, 'Cards (comparison)', rows)];
    },
  },
  {
    // the membership tiers (Vue v-tiers, an experience fragment) → Cards (pricing). A tiers
    // XF standing alone joins the "PACKAGES FOR EVERY KIND OF COACH" heading section before it
    // (courses, as on home); copy / buttons sharing its section stay default content before
    // the cards and the section stays its own (learning pathway)
    name: 'cards-pricing',
    joinPrevious: (s) => !comps(s).some((c) => isText(c) || isButton(c) || isImage(c)),
    match: (s) => !!s.querySelector('.v-tiers'),
    emit: (s, { document, pagePath }) => [...defaultContent(s, document, pagePath),
      ...reparse(s.querySelector('.v-tiers'), parsePricing, 'Cards (pricing)', document)],
  },
  {
    // the package cards built from plain containers (coachtennis: 3+ white-outlined tier
    // containers, each with a 56px USTA Sans price and a CTA) → Cards (pricing, packages):
    // one row per tier — cell 1: [label] · icon · tier name (h3) · price · tagline (h4) · CTA ·
    // feature list; cell 2: the tier accent (from the CTA's author colour: blue / lime / green,
    // white = none). The section joins the heading + intro run before it (one section).
    name: 'cards-packages',
    joinPrevious: (s) => isLooseRunBefore(s),
    match: (s) => comps(s).filter(isPackageTier).length >= 3,
    emit: (s, { document, pagePath }) => {
      const rows = comps(s).filter(isPackageTier).map((t) => {
        const cell = []; const items = [];
        let accent = '';
        components(t).forEach((c) => {
          if (isButton(c)) {
            const a = c.querySelector('a, button');
            if (!a || !a.getAttribute('href')) { if (norm(c.textContent)) cell.push(para(document, norm(c.textContent))); return; }
            const color = ((a.getAttribute('style') || '').match(/border-color:\s*(#[0-9a-f]{6})/i) || [])[1] || '';
            accent = PACKAGE_ACCENTS[color.toUpperCase()] || '';
            const b = buttonEl(c, document, pagePath);
            if (b) { const p = el(document, 'p'); p.append(b.querySelector('a')); cell.push(p); }
            return;
          }
          if (!isText(c) || !norm(c.textContent)) return;
          const img = c.querySelector('.cmp-text__image');
          if (fontSize(c) === 56) cell.push(para(document, norm(c.textContent)));
          else if (/text--style--uppercase/.test(c.className)) { const h = el(document, 'h4'); h.textContent = norm(c.textContent); cell.push(h); } else if (/graphic-semibold/.test(c.className)) {
            if (img) { const p = el(document, 'p'); const i = el(document, 'img'); i.src = img.getAttribute('src'); i.alt = ''; p.append(i); cell.push(p); }
            const h = el(document, 'h3'); h.textContent = norm(c.textContent); cell.push(h);
          } else { const li = el(document, 'li'); li.textContent = norm(c.textContent); items.push(li); }
        });
        if (items.length) { const ul = el(document, 'ul'); ul.append(...items); cell.push(ul); }
        return [cell, accent];
      });
      return [block(document, 'Cards (pricing, packages)', rows)];
    },
  },
  {
    // a grey-gradient strip of figures (coachtennis "16,700+ Community members" …): 2+
    // containers, each a USTA Sans figure over a label → Banner (stats): one row, one cell per
    // figure (figure paragraph + label paragraph)
    name: 'banner-stats',
    match: (s) => s.getAttribute('data-bg') === 'gradient' && comps(s).filter(isStat).length >= 2,
    emit: (s, { document }) => {
      const cells = comps(s).filter(isStat).map((c) => components(c).filter((t) => isText(t) && norm(t.textContent)).map((t) => para(document, norm(t.textContent))));
      return [block(document, 'Banner (stats)', [cells])];
    },
  },
  {
    // icon cards with photo tiles between them, all on one equal-height grid (coachtennis
    // "Why Join USTA Coaching?": card · photo · card / photo · card · photo) → Cards (icons):
    // one row per tile in source order — a card row (icon paragraph, title, copy) or a
    // photo row (the image alone); the source's narrow-text card preset → `compact`. Joins
    // the heading + intro run before it.
    name: 'cards-icons-tiles',
    joinPrevious: (s) => isLooseRunBefore(s),
    match: (s) => { const d = comps(s); return d.some(isImage) && d.filter((c) => isContainer(c) && /container--padding--24px/.test(c.className) && components(c).some(isImage) && components(c).some(isText)).length >= 2; },
    emit: (s, { document }) => {
      const rows = [];
      comps(s).forEach((c) => {
        if (isImage(c)) { const i = imageEl(c, document); if (i) rows.push([[i]]); return; }
        if (!isContainer(c)) return;
        const cc = components(c);
        const icon = imageEl(cc.find(isImage), document);
        const iconP = el(document, 'p'); if (icon) iconP.append(icon);
        const texts = cc.filter((t) => isText(t) && norm(t.textContent));
        const body = [iconP];
        texts.forEach((t, i) => {
          if (i === 0) { const h = el(document, 'h3'); h.textContent = norm(t.textContent); body.push(h); } else body.push(...textEls(t, document));
        });
        rows.push([body]);
      });
      const compact = comps(s).some((c) => isContainer(c) && components(c).some((t) => isText(t) && /text--letter-spacing--narrow/.test(t.className)));
      // the photo tiles' aspect preset → the global image crop option (styles.css)
      const opts = [...(compact ? ['compact'] : []), ...cropOptions(comps(s).find(isImage))];
      return [block(document, opts.length ? `Cards (icons, ${opts.join(', ')})` : 'Cards (icons)', rows)];
    },
  },
  {
    // about "OUR LEADERSHIP": the section heading, then per group its heading + the executive
    // person cards (→ Cards (profile): photo | name, title, short bio, "Bio", full bio — the
    // source shows ONE description, clamped at rest and full when open, so it is written in
    // both places) or the board-member rows (→ Columns (profile): photo | name, the role
    // lines in italic (the lime subtitle), bio, tags list)
    name: 'about-profiles',
    match: (s) => !!s.querySelector('.aem-person-card .v-person-card') || allContainers(s).filter(isBoardRow).length >= 2,
    emit: (s, { document }) => {
      const out = [];
      let group = null; // { name, rows }
      const flush = () => { if (group && group.rows.length) out.push(block(document, group.name, group.rows)); group = null; };
      const add = (name, row) => { if (!group || group.name !== name) { flush(); group = { name, rows: [] }; } group.rows.push(row); };
      const p = (text) => para(document, text);
      let walk = null;
      const visit = (c) => {
        if (isPersonCard(c)) {
          const card = c.querySelector('.v-person-card');
          const name = norm(card.querySelector('.v-person-card__name')?.textContent);
          const url = ((card.querySelector('.v-person-card__image')?.getAttribute('style') || '').match(/url\(["']?([^"')]+)["']?\)/) || [])[1];
          const img = el(document, 'img'); if (url) img.src = url; img.alt = name;
          const h = el(document, 'h3'); h.textContent = name;
          const body = [h];
          const title = norm(card.querySelector('.v-person-card__title')?.textContent); if (title) body.push(p(title));
          // short bio (rest) and full bio (open) from the component's props; else the rendered text
          let props = {};
          try { props = JSON.parse(c.getAttribute('data-person-props') || '{}'); } catch (e) { props = {}; }
          const texts = (h) => [...el(document, 'div', h || '').querySelectorAll('p')].map((q) => norm(q.textContent)).filter(Boolean);
          const rendered = [...card.querySelectorAll('.v-person-card__description p')].map((q) => norm(q.textContent)).filter(Boolean);
          const short = texts(props.short).length ? texts(props.short) : rendered;
          const long = texts(props.long).length ? texts(props.long) : short;
          short.forEach((t) => body.push(p(t)));
          const label = el(document, 'h4'); label.textContent = norm(card.querySelector('.v-person-card__subtitle')?.textContent) || 'Bio';
          body.push(label);
          long.forEach((t) => body.push(p(t)));
          add('Cards (profile)', [url ? img : '', body]);
        } else if (isBoardRow(c)) {
          // the desktop photo: an image component, or a photo container's background image
          const tile = components(c).find(isPhotoTile);
          const cardC = components(c).find((k) => isContainer(k) && /container--border--white/.test(k.className));
          const texts = deep(cardC).filter((t) => isText(t) && norm(t.textContent));
          const name = norm(texts[0]?.textContent);
          let img = null;
          if (isImage(tile)) img = imageEl(tile, document);
          else { img = el(document, 'img'); img.src = tile.querySelector('.cmp-container[data-desktop-background-image]').getAttribute('data-desktop-background-image'); img.alt = ''; }
          if (img && !img.getAttribute('alt')) img.setAttribute('alt', `${name} headshot`);
          const h = el(document, 'h3'); h.textContent = name;
          const body = [h];
          // the lime role line(s) (Graphik Semibold 18px text) → one italic paragraph
          const role = texts.find((t, i) => i > 0 && /graphic-semibold/.test(t.className));
          if (role) { const q = el(document, 'p'); const em = el(document, 'em'); [...role.querySelectorAll('p')].map((x) => norm(x.textContent)).filter(Boolean).forEach((t, i) => { if (i) em.append(el(document, 'br')); em.append(t); }); q.append(em); body.push(q); }
          texts.filter((t, i) => i > 0 && t !== role).forEach((t) => body.push(...textEls(t, document, { plain: true })));
          const tags = [...cardC.querySelectorAll('.aem-tags__tag')].map((x) => norm(x.textContent)).filter(Boolean);
          if (tags.length) { const ul = el(document, 'ul'); tags.forEach((t) => { const li = el(document, 'li'); li.textContent = t; ul.append(li); }); body.push(ul); }
          // one Columns (profile) block per member (the block's contract is one row)
          flush();
          out.push(block(document, 'Columns (profile)', [[img || '', body]]));
          // (the source nests some member rows inside the previous member's row container)
          components(c).filter(isBoardRow).forEach(visit);
        } else if (isContainer(c)) walk(c);
        else if (isText(c) && norm(c.textContent)) { flush(); out.push(...textEls(c, document)); }
      };
      walk = (e) => components(e).forEach(visit);
      walk(s);
      flush();
      return out;
    },
  },
  {
    // about "OUR PURPOSE": a section heading over 3+ text-only cards (title + copy) → the
    // heading, then Cards (text): one row per card, title (h3) + copy
    name: 'cards-text-grid',
    // (only the purpose structure: a 64px USTA Sans section heading over cards whose first
    // text is a short Graphik Semibold title — quote cards and date rows stay theirs)
    match: (s) => {
      if (deep(s).some((c) => isImage(c) || isButton(c))) return false;
      if (!deep(s).some((t) => isText(t) && isUstaSans(t) && fontSize(t) === 64)) return false;
      const cards = allContainers(s).filter(isTopicCard);
      return cards.length >= 3 && cards.every((c) => { const t = components(c).find((k) => isText(k) && norm(k.textContent)); return !!t && /graphic-semibold/.test(t.className) && norm(t.textContent).length < 80; });
    },
    emit: (s, { document }) => {
      const cards = allContainers(s).filter(isTopicCard);
      const out = [];
      deep(s).filter((t) => isText(t) && norm(t.textContent) && !cards.some((c) => c.contains(t))).forEach((t) => out.push(...textEls(t, document)));
      const rows = cards.map((c) => {
        const texts = components(c).filter((t) => isText(t) && norm(t.textContent));
        const body = [];
        texts.forEach((t, i) => body.push(...textEls(t, document, i === 0 ? { headingLevel: 3 } : { plain: true })));
        return [body];
      });
      return [...out, block(document, 'Cards (text)', rows)];
    },
  },
  {
    // a grid of linked partner logos (about "OUR PARTNERS & AFFILIATIONS") → Cards (logos):
    // one row per logo, the image inside its link
    name: 'cards-logos',
    match: (s) => deep(s).filter(isLinkedLogo).length >= 4 && !deep(s).some(isButton),
    emit: (s, { document }) => {
      const out = [];
      deep(s).filter((t) => isText(t) && norm(t.textContent)).forEach((t) => out.push(...textEls(t, document)));
      const rows = deep(s).filter(isLinkedLogo).map((c) => {
        const a = c.querySelector('a.cmp-image__link');
        const link = el(document, 'a'); link.href = a.getAttribute('href');
        const img = imageEl(c, document);
        if (img) link.append(img);
        return [link];
      });
      return [...out, block(document, 'Cards (logos)', rows)];
    },
  },
  {
    // the "Get in Touch" panel: an intro (title + subtitle) beside white cards, each a heading,
    // copy and an icon-only link button → Contact: row 1 the intro paragraphs, then one row per
    // card — heading | copy | the link (labelled "Email <heading>" for a mailto)
    name: 'contact',
    match: (s) => allContainers(s).filter(isContactCard).length >= 2,
    emit: (s, { document, pagePath }) => {
      const cards = allContainers(s).filter(isContactCard);
      const intro = [];
      deep(s).filter((t) => isText(t) && norm(t.textContent) && !cards.some((c) => c.contains(t))).forEach((t) => intro.push(...textEls(t, document, { plain: true })));
      const rows = [[intro]];
      cards.forEach((c) => {
        const texts = deep(c).filter((t) => isText(t) && norm(t.textContent));
        const head = texts.find((t) => t.querySelector('h1, h2, h3, h4'));
        const h = el(document, 'h3'); h.textContent = norm(head?.textContent);
        const copy = []; texts.filter((t) => t !== head).forEach((t) => copy.push(...textEls(t, document, { plain: true })));
        const a = deep(c).find(isButton)?.querySelector('a');
        const link = el(document, 'a');
        if (a) {
          const href = a.getAttribute('href') || '';
          link.href = href;
          link.textContent = norm(a.textContent) || (/^mailto:/.test(href) ? `Email ${h.textContent.toLowerCase()}` : h.textContent);
        }
        const lp = el(document, 'p'); if (a) lp.append(link);
        rows.push([[h], copy, a ? [lp] : '']);
      });
      return [block(document, 'Contact', rows)];
    },
  },
  {
    // the "Explore workshops & events" experience fragment → Banner (blue) (one banner: the
    // `events` variant was removed — see MIGRATION.md 2026-11-18 STANDARDIZED)
    name: 'banner-events',
    match: (s) => !!s.querySelector('.experiencefragment .container--display--flex.container--align-items--center'),
    emit: (s, { document }) => reparse(s.querySelector('.container--display--flex.container--align-items--center'), parseEventsBanner, 'Banner (blue)', document),
  },
  {
    // the centred hero (workshops "Our Core Workshops"): background photo panel, a centred
    // USTA Sans title (lime second line) and one CTA → Hero (default): row 1 the photo, row 2
    // the title + CTA link | the phone-only logo (the source's mobile-only image, kept by
    // markPhoneOnlyImages)
    name: 'hero-default',
    match: (s) => isBgPanel(s) && deep(s).some(isButton)
      && deep(s).some((c) => isText(c) && isUstaSans(c) && cls(c, 'cmp-text--alignment-center') && norm(c.textContent)),
    emit: (s, { document, pagePath }) => {
      const bg = s.querySelector('.cmp-container[data-desktop-background-image]').getAttribute('data-desktop-background-image');
      const img = el(document, 'img'); img.src = bg; img.alt = '';
      const content = [];
      let logo = '';
      deep(s).forEach((c) => {
        if (isText(c) && norm(c.textContent)) content.push(...textEls(c, document));
        else if (isButton(c)) {
          const b = buttonEl(c, document, pagePath);
          if (b) { const p = el(document, 'p'); p.append(b.querySelector('a')); content.push(p); }
        } else if (isImage(c) && c.hasAttribute('data-phone-only') && !logo) logo = imageEl(c, document) || '';
      });
      return [block(document, 'Hero', [[img], [content, logo]])];
    },
  },
  {
    // a section that is ONE image with the source's aspect-ratio preset on a centred span
    // (about: the Executive Board photo, 6 of 12 columns, landscape crop) → Image with the
    // global crop option, in a `narrow-N` section (N = the image's column span)
    name: 'image-cropped',
    match: (s) => { const d = comps(s).filter((c) => kind(c) !== 'separator'); return d.length === 1 && isImage(d[0]) && !d[0].hasAttribute('data-phone-only') && cropOptions(d[0]).length > 0 && centredSpan(d[0]) > 0; },
    styles: (s) => [`narrow-${centredSpan(comps(s).find(isImage))}`],
    emit: (s, { document }) => {
      const c = comps(s).find(isImage);
      const i = imageEl(c, document);
      return i ? [block(document, `Image (${cropOptions(c).join(', ')})`, [[i]])] : [];
    },
  },
  {
    // a section that is ONE phone-only image (workshops: the pathway infographic shown below
    // 768 only, no desktop copy) → Image with just a `mobile` row (the block shows it on
    // phones only)
    name: 'image-phone-only',
    match: (s) => { const d = comps(s); return d.length === 1 && isImage(d[0]) && d[0].hasAttribute('data-phone-only'); },
    emit: (s, { document }) => { const i = imageEl(comps(s)[0], document); return i ? [block(document, 'Image', [['mobile', i]])] : []; },
  },
  {
    // course cards (workshops): white-outlined cards, each a background photo + title, copy
    // (its authored blank lines kept) and a duration line → Cards (course): one row per card,
    // photo | title (h3), copy, duration (the last short line — the block's pill)
    name: 'cards-course',
    match: (s) => comps(s).filter(isCourseCard).length >= 2,
    emit: (s, { document }) => {
      const rows = comps(s).filter(isCourseCard).map((c) => {
        const img = el(document, 'img');
        img.src = c.querySelector('.cmp-container[data-desktop-background-image]').getAttribute('data-desktop-background-image');
        img.alt = '';
        const body = [];
        deep(c).filter((t) => isText(t) && norm(t.textContent)).forEach((t, i) => body.push(...textEls(t, document, i === 0 ? { headingLevel: 3 } : {})));
        // the duration line is plain text (the source sets it bold)
        const last = body[body.length - 1];
        if (last && last.tagName === 'P' && last.children.length === 1 && /^(STRONG|B)$/.test(last.firstElementChild.tagName) && norm(last.textContent) === norm(last.firstElementChild.textContent)) last.replaceChildren(...last.firstElementChild.childNodes);
        return [img, body];
      });
      return [block(document, 'Cards (course)', rows)];
    },
  },
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
      // copy at the panel's own padding (not indented on grid columns) with a centred CTA
      // (coachtennis) → `wide`
      const panelX = Number(s.querySelector('.cmp-container[data-desktop-background-image]').getAttribute('data-x') || 0);
      const firstCopy = deep(s).find((c) => isText(c) && norm(c.textContent));
      const wide = !title && !!firstCopy && Number(firstCopy.getAttribute('data-x') || 0) - panelX < 48;
      const opts = [...(title ? ['title'] : []), ...(wide ? ['wide'] : [])];
      return [block(document, opts.length ? `Hero (content, ${opts.join(', ')})` : 'Hero (content)', [[img], [content]])];
    },
  },
  {
    // a white-outlined text card (heading, copy, list — no CTA, no image) beside an image:
    // `Columns (media, outlined)`, cells in source order (coaching-workshops top)
    name: 'columns-media-outlined',
    match: (s) => {
      const d = comps(s);
      const card = d.find((c) => isContainer(c) && /container--border--white/.test(c.className) && deep(c).some(isText) && !deep(c).some((k) => isButton(k) || isImage(k)));
      return d.length === 2 && !!card && d.some(isImage);
    },
    emit: (s, { document }) => {
      const cells = comps(s).map((c) => {
        if (isImage(c)) return [imageEl(c, document)];
        const texts = []; deep(c).filter(isText).forEach((t) => texts.push(...textEls(t, document, { plain: true })));
        return texts;
      });
      return [block(document, 'Columns (media, outlined)', [cells])];
    },
  },
  {
    // the Vue events list (+ lead heading / copy and the "View More" button)
    name: 'events-list',
    match: (s) => !!s.querySelector('.v-events-list'),
    emit: (s, { document, pagePath }) => {
      const list = s.querySelector('.v-events-list');
      const host = list.closest('.aem-events-list') || list;
      const before = []; let viewMore = null; const after = [];
      comps(s).forEach((c) => {
        if (c === host || c.contains(host) || kind(c) === 'separator') return;
        const isBefore = !!(c.compareDocumentPosition(host) & 4); // host FOLLOWS c
        if (isButton(c) && !isBefore && !viewMore) { viewMore = c; return; }
        if (isText(c)) (isBefore ? before : after).push(...textEls(c, document));
      });
      return [...before, eventsBlock(list, viewMore, document, pagePath), ...after];
    },
  },
  {
    // white-outlined event / promo cards (title + CTA + details) after a lead heading / copy
    name: 'columns-promo',
    match: (s) => comps(s).some(isPromoCard),
    emit: (s, { document, pagePath }) => {
      const list = comps(s);
      const cards = list.filter(isPromoCard);
      const before = []; const after = [];
      list.forEach((c) => {
        if (cards.includes(c) || kind(c) === 'separator') return;
        const isBefore = !!(c.compareDocumentPosition(cards[0]) & 4);
        if (isText(c)) (isBefore ? before : after).push(...textEls(c, document));
      });
      return [...before, promoBlock(cards, document, pagePath), ...after];
    },
  },
  {
    // page title + full-width photo + intro (fellowship top): default content (not a
    // media row) — the h1, the photo, the intro (Text Style lead)
    name: 'title-photo',
    match: (s) => { const d = comps(s).filter((c) => kind(c) !== 'separator'); return d.some((c) => isText(c) && c.querySelector('h1')) && d.some((c) => isImage(c) && /aem-GridColumn--default--12\b/.test(c.className)) && !d.some(isContainer); },
    emit: (s, { document, pagePath }) => defaultContent(s, document, pagePath),
  },
  {
    // a dates list: a blue header panel (heading + subtitle) over white-outlined rows, each
    // a date beside an eyebrow + title (fellowship "IMPORTANT DATES") → Banner (header, blue)
    // + Columns (events, dates): one row per date — date | eyebrow, title
    name: 'dates-list',
    match: (s) => {
      const d = comps(s);
      const rows = d.filter((c) => isContainer(c) && /container--border--white/.test(c.className) && !deep(c).some((k) => isButton(k) || isImage(k)) && deep(c).filter(isText).length >= 2);
      return rows.length >= 2 && d.some((c) => isContainer(c) && c.getAttribute('data-bg') === 'blue');
    },
    emit: (s, { document }) => {
      const d = comps(s);
      const head = d.find((c) => isContainer(c) && c.getAttribute('data-bg') === 'blue');
      const ht = deep(head).filter(isText);
      const cells = ht.map((t, i) => textEls(t, document, { headingLevel: i === 0 ? 2 : 0, plain: true }));
      const rows = d.filter((c) => isContainer(c) && /container--border--white/.test(c.className)).map((row) => {
        const texts = deep(row).filter((t) => isText(t) && norm(t.textContent));
        return [[para(document, norm(texts[0].textContent))], texts.slice(1).map((t) => para(document, norm(t.textContent)))];
      });
      return [block(document, 'Banner (header, blue)', [cells]), block(document, 'Columns (events, dates)', rows)];
    },
  },
  {
    // a display heading over a consent-gated YouTube / Vimeo embed → Video (title row, consent
    // message row whose link is the video; block sample contract)
    name: 'video',
    match: (s) => !!s.querySelector('.embed iframe[data-src*="youtube"], .embed iframe[src*="youtube"], .embed iframe[data-src*="vimeo"], .embed iframe[src*="vimeo"]'),
    emit: (s, { document }) => {
      const frame = s.querySelector('.embed iframe');
      const src = (frame.getAttribute('data-src') || frame.getAttribute('src') || '').split('?')[0];
      const title = [];
      comps(s).filter(isText).forEach((t) => textEls(t, document, { plain: true }).forEach((k) => { const p = el(document, 'p'); p.append(...k.childNodes); title.push(p); }));
      const ph = s.querySelector('.usta-consent-placeholder');
      const msg = [];
      if (ph) {
        ph.querySelectorAll('p').forEach((p) => {
          if (!norm(p.textContent)) return;
          const q = el(document, 'p'); q.append(...p.childNodes);
          q.querySelectorAll('a, button').forEach((a) => { const l = el(document, 'a'); l.href = src; l.textContent = norm(a.textContent); a.replaceWith(l); });
          msg.push(q);
        });
      }
      if (!msg.length) { const p = el(document, 'p'); const a = el(document, 'a'); a.href = src; a.textContent = src; p.append(a); msg.push(p); }
      return [block(document, 'Video', [[title], [msg]])];
    },
  },
  {
    // a photo beside a white-outlined quote card (quote glyph + quote + attribution) →
    // Columns (quote); the source's large quote preset (`text--font-size--40px-28px`) → `large`
    name: 'columns-quote',
    match: (s) => {
      const d = comps(s);
      const card = d.find((c) => isContainer(c) && /container--border--white/.test(c.className) && deep(c).some((k) => isImage(k) && /quote/i.test((k.querySelector('img') || {}).src || k.innerHTML)));
      return d.length === 2 && !!card && d.some(isImage);
    },
    emit: (s, { document }) => {
      const d = comps(s);
      const photo = imageEl(d.find(isImage), document);
      const card = d.find(isContainer);
      const cell = [];
      let large = false;
      deep(card).forEach((k) => {
        if (isImage(k)) { const i = imageEl(k, document); if (i) { const p = el(document, 'p'); p.append(i); cell.push(p); } } else if (isText(k)) {
          if (fontSize(k) >= 40) large = true;
          textEls(k, document, { plain: true }).forEach((x) => { const p = el(document, 'p'); p.append(...x.childNodes); cell.push(p); });
        }
      });
      return [block(document, large ? 'Columns (quote, large)' : 'Columns (quote)', [[[photo], cell]])];
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
    // an outlined (`container--border--white`) rounded panel: heading + copy stacked in
    // one column, a single CTA in its own column at the right ("Career Center is Live")
    name: 'banner-stacked',
    match: (s) => {
      if (!/container--border--white/.test(s.className) || deep(s).some(isImage)) return false;
      const d = comps(s);
      const textCol = d.filter((c) => isContainer(c) && components(c).filter(isText).length >= 2 && !deep(c).some((k) => isButton(k) || isImage(k)));
      return d.filter(isButton).length === 1 && textCol.length === 1 && d.every((c) => isButton(c) || textCol.includes(c) || kind(c) === 'separator');
    },
    emit: (s, { document, pagePath }) => {
      const d = comps(s);
      const text = [];
      components(d.find(isContainer)).filter(isText).forEach((c, i) => text.push(...textEls(c, document, { headingLevel: i === 0 ? 2 : 0 })));
      const b = buttonEl(d.find(isButton), document, pagePath);
      return [block(document, 'Banner (stacked)', [[text, b ? b.querySelector('a') : '']])];
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
      // copy in the source's `text--letter-spacing--narrow` text (16/19.2, 14/16.8 at 768) and
      // photos at their own 3:2 shape → `compact` (fellowship)
      const compact = comps(s).some((c) => isContainer(c) && components(c).some((t) => isText(t) && /text--letter-spacing--narrow/.test(t.className)));
      out.push(block(document, compact ? 'Cards (media, stacked, compact)' : 'Cards (media, stacked)', rows));
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
      // framed: the source image component's author settings → options (feature-options.js)
      const opts = framed ? featureOptions(img) : ['unframed'];
      return [block(document, opts.length ? `Columns (feature, ${opts.join(', ')})` : 'Columns (feature)', [cells])];
    },
  },
  {
    // heading + intro + two photos side by side + CTA ("USTA Coaching Network"); the heading
    // + intro may already be split off as their own narrow section (coachtennis "Find your
    // perfect fit": only the photos + the CTA are left)
    name: 'columns-photos',
    match: (s) => { const d = comps(s); return d.filter(isImage).length === 2 && d.some((c) => isText(c) || isButton(c)) && !d.some(isContainer); },
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
    // a rounded COLOUR panel (blue fill — main's `banner-stacked` handles the white-outlined
    // one): heading + copy on the left, ONE CTA in its own column at the right ("Bring a USTA
    // Coaching Workshop to Your Facility") → Banner (stacked[, blue])
    name: 'banner-stacked-colour',
    match: (s) => /container--border-radius--top-left\b/.test(s.className) && s.getAttribute('data-bg') === 'blue'
      && !deep(s).some(isImage) && !deep(s).some(isListRow) && deep(s).filter(isButton).length === 1
      && comps(s).some((c) => isContainer(c) && components(c).some(isText) && !components(c).some(isButton)),
    emit: (s, { document, pagePath }) => {
      const cell = [];
      deep(s).filter(isText).forEach((t, i) => textEls(t, document, { headingLevel: i === 0 ? 2 : 0 }).forEach((k) => {
        // the heading is set bold on the source (<b>) — the h2 carries the weight
        if (/^H/.test(k.tagName)) k.innerHTML = k.textContent;
        cell.push(k);
      }));
      const b = buttonEl(deep(s).find(isButton), document, pagePath);
      return [block(document, 'Banner (stacked, blue)', [[cell, b ? b.querySelector('a') : '']])];
    },
  },
  {
    // a filled WHITE text card beside an image component, no CTA (maintenance page "We'll be
    // back to serve you soon!") → Columns (media): cells in source order (card copy | image)
    name: 'columns-media-card',
    match: (s) => {
      const d = comps(s).filter((c) => kind(c) !== 'separator');
      return d.length === 2 && d.some(isImage) && d.some((c) => isContainer(c) && c.getAttribute('data-bg-color') === 'rgb(255, 255, 255)' && deep(c).some(isText) && !deep(c).some(isButton));
    },
    emit: (s, { document }) => {
      const cells = comps(s).filter((c) => kind(c) !== 'separator').map((c) => {
        if (isImage(c)) { const i = imageEl(c, document); return i ? [i] : ''; }
        const cell = [];
        deep(c).filter((t) => isText(t) && norm(t.textContent)).forEach((t) => cell.push(...textEls(t, document, { plain: true })));
        return cell;
      });
      // the photo's aspect-ratio preset → the global image crop option (about: portrait-2)
      const crop = cropOptions(comps(s).find(isImage));
      return [block(document, crop.length ? `Columns (media, ${crop.join(', ')})` : 'Columns (media)', [cells])];
    },
  },
  {
    // a photo tile (container background image, no text) beside a white card with a
    // heading + CTA ("Discover our learning pathway") → Columns (media), in source order
    name: 'columns-media-bg',
    match: (s) => {
      const d = comps(s).filter(isContainer);
      return d.length === 2 && !s.querySelector('h1')
        && d.some((c) => !!c.querySelector('.cmp-container[data-desktop-background-image]') && !deep(c).some(isText))
        && d.some((c) => deep(c).some(isText) && deep(c).some(isButton));
    },
    emit: (s, { document, pagePath }) => {
      const cells = comps(s).filter(isContainer).map((c) => {
        const bgC = c.querySelector('.cmp-container[data-desktop-background-image]');
        if (bgC && !deep(c).some(isText)) {
          const img = el(document, 'img');
          img.src = bgC.getAttribute('data-desktop-background-image');
          img.alt = '';
          return [img];
        }
        const cell = [];
        deep(c).forEach((k) => {
          if (isText(k)) cell.push(...textEls(k, document));
          else if (isButton(k)) {
            // the media card styles its own CTA: a plain link (as on home)
            const b = buttonEl(k, document, pagePath);
            if (b) { const q = el(document, 'p'); q.append(b.querySelector('a')); cell.push(q); }
          }
        });
        return cell;
      });
      return [block(document, 'Columns (media)', [cells])];
    },
  },
  {
    // text column(s) beside an image (the desktop copy of a media row)
    name: 'columns-media-row',
    // the image must sit BESIDE the text (another left edge): an image stacked between
    // copy at the same left edge (the courses intro infographic) is default content
    match: (s) => {
      const d = comps(s);
      const imgs = d.filter(isImage);
      const texts = d.filter((c) => isText(c) || (isContainer(c) && components(c).some(isText)));
      const x = (c) => c.getAttribute('data-x');
      return imgs.length > 0 && texts.length > 0 && imgs.some((i) => texts.some((t) => x(t) !== x(i)));
    },
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

/* a desktop-hidden image component right before a visible one is its phone version: keep
   it on the visible image (data-phone-image / -alt) so defaultContent emits an `Image` block
   (desktop / mobile rows) — call BEFORE the desktop-hidden components are removed */
function markPhoneImages(main) {
  main.querySelectorAll('.image[class*="aem-GridColumn--default--hide"]').forEach((c) => {
    const next = c.nextElementSibling;
    const img = c.querySelector('img');
    if (!img || !isImage(next) || /aem-GridColumn--default--hide/.test(next.className)) return;
    next.setAttribute('data-phone-image', img.getAttribute('src') || img.getAttribute('data-src') || '');
    next.setAttribute('data-phone-alt', img.getAttribute('alt') || '');
  });
}

/* phone-only images with no desktop twin, kept for the blocks that use them (Hero logo,
   phone-only Image): inside a background hero panel, or the only component of their own
   container. Marked `data-phone-only` and taken out of the desktop-hidden sweep. */
function markPhoneOnlyImages(main) {
  main.querySelectorAll('.image[class*="aem-GridColumn--default--hide"]').forEach((c) => {
    const siblings = [...c.parentElement.children].filter((k) => k !== c && k.querySelector && (isImage(k) || k.querySelector('img')));
    if (siblings.some((k) => !/aem-GridColumn--default--hide/.test(k.className))) return; // a responsive twin
    const panel = c.closest('.cmp-container[data-desktop-background-image]');
    const own = c.parentElement.closest('.container');
    const alone = own && components(own).length === 1;
    if (!panel && !alone) return;
    c.setAttribute('data-phone-only', '');
    c.className = c.className.replace(/aem-GridColumn--default--hide/g, 'aem-GridColumn--default--phone-only');
  });
}

/* ------------------------------------------------------------------- import -- */
export default {
  onLoad: ({ document }) => {
    // the person cards' Vue props (short `description` + `long-description`) from the raw page
    // HTML — the rendered card swaps one text for the other on hover (about)
    if (document.querySelector('.aem-person-card')) {
      try {
        const xhr = new (document.defaultView || window).XMLHttpRequest();
        xhr.open('GET', document.location.href.split('#')[0], false);
        xhr.send();
        const raw = new DOMParser().parseFromString(xhr.responseText, 'text/html');
        const live = [...document.querySelectorAll('.aem-person-card')];
        [...raw.querySelectorAll('v-person-card')].forEach((v, i) => {
          if (!live[i]) return;
          live[i].setAttribute('data-person-props', JSON.stringify({ short: v.getAttribute('description') || '', long: v.getAttribute('long-description') || '' }));
        });
      } catch (e) { /* the rendered card text is used instead */ }
    }
    // authored blank lines (<p>&nbsp;</p>) don't survive the importer's HTML cleanup —
    // mark them so textEls can still see the gap
    document.querySelectorAll('.cmp-text p').forEach((q) => {
      if (q.textContent.replace(/\s/g, '') || q.querySelector('img')) return;
      // a rendered blank line (it has a line box) is kept as one; a collapsed empty
      // paragraph (0px) only separates the paragraphs around it
      const host = q.closest('.text');
      if (q.getBoundingClientRect().height === 0 && host && host.getBoundingClientRect().height > 0) q.setAttribute('data-collapsed', '');
      q.textContent = BLANK;
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
      if (bg) c.setAttribute('data-bg-color', bg);
      // a gradient panel (coachtennis stats strip) is a panel of its own too
      if (inner && /gradient\(/.test(getComputedStyle(inner).backgroundImage)) c.setAttribute('data-bg', 'gradient');
      else if (bg === 'rgb(3, 115, 243)') c.setAttribute('data-bg', 'blue');
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
    const theme = themeOf(pagePath);
    // phone-only image copies → the `Image` block's mobile row (themed pages only)
    if (IMAGE_PAIR_THEMES.includes(theme)) markPhoneImages(main);
    // phone-only images that have NO desktop copy (not responsive duplicates): the hero's
    // phone logo and a section that is just a phone image (workshops) are kept
    markPhoneOnlyImages(main);
    // desktop-hidden responsive duplicates (the import viewport is desktop)
    main.querySelectorAll('[class*="aem-GridColumn--default--hide"]').forEach((e) => e.remove());

    const { root, skip } = contentRoot(main);
    if (!root) throw new Error('landing-page content grid not found');

    // some pages (membership terms, flag-profile) put their text / embed components straight
    // in the content grid instead of in section containers: a run of such loose components
    // becomes ONE section (a plain wrapper div, which components() walks through)
    prepareSections(root, document, skip);

    const out = document.createElement('div');
    const report = [];
    let first = true;
    // (an EMPTY source spacer container is skipped like any empty container: the gap it adds
    // belongs to the block above it — e.g. the outlined columns card's margin in columns.css)
    [...root.children].forEach((s) => {
      if (skip(s) || !norm(s.textContent) && !s.querySelector('img')) return;
      emitSection(s, { document, pagePath }).forEach(({ name, nodes, styles, join, meta }) => {
        if (!nodes.length) return;
        // a joining kind continues the previous section (before its Section Metadata)
        if (join && !first) {
          const last = [...out.children].pop();
          const isMeta = last && last.tagName === 'TABLE' && /section metadata/i.test(last.rows[0]?.textContent || '');
          if (isMeta) last.before(...nodes); else out.append(...nodes);
          report.push(`+${name}`);
          return;
        }
        if (!first) out.append(document.createElement('hr'));
        first = false;
        out.append(...nodes);
        const cells = { ...(styles.length ? { Style: styles.join(', ') } : {}), ...(meta || {}) };
        if (Object.keys(cells).length) out.append(block(document, 'Section Metadata', cells));
        report.push(name);
      });
    });

    finalizeOutput(out, document);
    // AEM DAM documents (PDFs) have no EDS path yet (no /assets/docs pipeline in this
    // repo): link them to the live source file instead of a broken root-relative path
    out.querySelectorAll('a[href^="/content/dam/"]').forEach((a) => { a.setAttribute('href', `${BASE}${a.getAttribute('href')}`); });
    out.append(document.createElement('hr'), metadata(document, theme));
    cleanupTransformer('afterTransform', out, payload);
    WebImporter.rules.adjustImageUrls(out, url, params.originalURL);
    return [{ element: out, path: pagePath, report: { title: document.title, template: TEMPLATE, sections: report.join(' | ') } }];
  },
};

/* the page sections under the content root: a wrapper container around several page
   sections is replaced by its children, and a run of loose components becomes ONE section
   (shared with the sample importers, so their sections are the landing importer's) */
function prepareSections(root, document, skip) {
  // a wrapper container around several page sections (coaching-workshops
  // `container--outer-gutter-paddings`: two section containers + loose webinar heading,
  // copy and tabs) → its children ARE the page sections
  [...root.children].forEach((k) => {
    if (!isContainer(k) || skip(k) || !/container--outer-gutter-paddings/.test(k.className)) return;
    const kids = components(k);
    const sectionLike = kids.filter((c) => (isContainer(c) && /container--(top|bottom)-margin--/.test(c.className)) || /^(core-tabs|aem-events-list)\b/.test(c.className || ''));
    // (fellowship: the page title + photo + intro above ONE section container (the cards))
    const titled = sectionLike.length === 1 && kids.some((c) => isText(c) && c.querySelector('h1'));
    if (sectionLike.length >= 2 || titled) {
      // mark them: a heading split off such a section sits on the wrapper's 8 / 12px inset
      kids.forEach((c) => c.setAttribute('data-in-wrapper', ''));
      // (the title wrapper's own 36px margin preset carries over to the title copy)
      if (titled && /container--(top|bottom)-margin--36\b/.test(k.className)) kids.forEach((c) => c.setAttribute('data-margin-36', ''));
      k.replaceWith(...kids);
    }
  });

  // a plain grouping container (no padding / border / fill of its own) whose children are 2+
  // sections, EACH with its own display heading (USTA Sans, 40px preset) → those sections
  // (fellowship: "APPLICATION DETAILS" / "IMPORTANT DATES" / "CANDIDATE QUALIFICATIONS")
  const headed = (c) => isContainer(c) && deep(c).some((t) => isText(t) && isUstaSans(t) && fontSize(t) >= 40);
  [...root.children].forEach((k) => {
    if (!isContainer(k) || skip(k) || /container--(padding|border)--/.test(k.className) || k.getAttribute('data-bg')) return;
    const kids = components(k).filter((c) => kind(c) !== 'separator');
    // (package tiers — each with a 56px price — are one cards section, not sections)
    if (kids.length >= 2 && kids.every(headed) && !kids.every(isPackageTier)) k.replaceWith(...kids);
  });

  const loose = (k) => !isContainer(k) && !skip(k) && /^(text|image|button|separator|embed|iframetext|accordion|tags|core-tabs|aem-events-list)\b/.test(k.className || '');
  [...root.children].forEach((k) => {
    if (!loose(k)) return;
    const prev = k.previousElementSibling;
    if (prev && prev.hasAttribute('data-loose-run')) { prev.append(k); return; }
    const run = document.createElement('div');
    run.setAttribute('data-loose-run', '');
    k.replaceWith(run);
    run.append(k);
  });
  // (marked now: emitting a run moves its nodes, so the next section can't read them later)
  root.querySelectorAll(':scope > [data-loose-run]').forEach((r) => { if (norm(r.textContent)) r.setAttribute('data-loose-text', ''); });
  return [...root.children];
}

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
  // links to the site's own pages → root-relative EDS paths (no `.html`): the source
  // writes `/en/home/x.html` or `https://www.ustacoaching.com/en/home/x.html`
  out.querySelectorAll('a[href]').forEach((a) => {
    const m = a.getAttribute('href').match(/^(?:https?:\/\/(?:www\.)?ustacoaching\.com)?(\/(?:en|es)(?:\/[^?#]*)?)\.html([?#].*)?$/);
    if (m) a.setAttribute('href', m[1] + (m[2] || ''));
  });
}

export {
  KINDS, emitSection, finalizeOutput, contentRoot, prepareSections, block, el, norm, TEMPLATE, markPhoneImages,
  // helpers shared with the quiz-results importer
  textEls, imageEl, buttonEl, components, comps, deep, kind, isText, isImage, isButton, isContainer,
  cls, para, fontSize, isUstaSans,
};
