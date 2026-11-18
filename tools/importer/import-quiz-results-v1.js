/* eslint-disable */
/* global WebImporter */

/**
 * Importer — catalog template `quiz-results` (the 6 "what's your coach type" result pages:
 * /en/home/results/{college-coach, ft-pro-coach, pt-pro-coach, school-coach, guardian-coach,
 * volunteer-emerging-coach}). EDS template: landing-page (same source text components as the
 * landing pages), so this importer RUNS THE LANDING IMPORTER and only adds the results-page
 * section kinds in front of the landing ones:
 *   - results-intro        lime panel (title, intro, Join) + photo → Columns (media, media-right, lime)
 *   - results-cards        a heading over a grid of photo cards nested one container deeper
 *                          → Cards (media) (the home page's media cards)
 *   - results-icon-cards   School "why provide tennis": small-icon cards + CTA → Cards (icons)
 *   - results-certification the certification experience fragment (logo, intro, What to
 *                          expect / Package / Equivalent + its course list) → Accordion
 *                          (pathway) when the course list is a 2-up grid (College, FT Pro),
 *                          Accordion (timeline) when it is full-width (PT Pro, Volunteer)
 *   - results-courses      a course list without a certification header (School, Guardian)
 *                          → Accordion (timeline) with no header row
 *   - results-tiers        the tiers fragment → Cards (pricing) (same contract as the home
 *                          parser, tools/importer/parsers/cards-pricing.js)
 * The "Get on the list" lead form (v-leads) is the site footer's subscribe form — not
 * imported. Course lists and tiers are live (API) components on the source: imported as a
 * static snapshot (Phase 2: live data).
 */
import landing, {
  KINDS, block, el, norm, textEls, buttonEl, components, comps, deep, kind,
  isText, isImage, isButton, isContainer, para, fontSize,
} from './import-landing-page-v1.js';

const COURSES_URL = '/en/home/courses';

/* a live <img> → a clean <img> (absolute src, source alt) */
const imgOf = (document, src) => {
  if (!src) return null;
  const img = el(document, 'img');
  img.src = src.currentSrc || src.getAttribute('src') || src.getAttribute('data-src') || '';
  img.alt = src.getAttribute('alt') || '';
  return img;
};
const pWrap = (document, node) => { const p = el(document, 'p'); p.append(node); return p; };
/* the paragraphs of a rich-text node, as fresh <p>s (blank ones dropped) */
const parasOf = (document, root) => (root ? [...root.querySelectorAll('p')] : [])
  .filter((p) => norm(p.textContent))
  .map((p) => { const q = el(document, 'p'); q.innerHTML = p.innerHTML.replace(/&nbsp;/g, ' '); q.querySelectorAll('u').forEach((u) => u.replaceWith(...u.childNodes)); return q; });

/* one source course card (.v-course) → an Accordion row: `pathway` = [badge] | [count, h3,
   description, ul]; `timeline` = ["Title — N modules"] | [badge, description, ol] */
function courseRow(c, document, fmt) {
  const t = (sel) => norm((c.querySelector(sel) || {}).textContent);
  const count = t('.v-course__eyebrow');
  const title = t('.v-course__name');
  const badge = imgOf(document, c.querySelector('.v-course__badge img'));
  const desc = parasOf(document, c.querySelector('.v-course__additional-content .v-course__description') || c.querySelector('.v-course__description'));
  const mods = [...c.querySelectorAll('.v-course__module-text')].map((m) => norm(m.textContent)).filter(Boolean);
  const list = el(document, fmt === 'pathway' ? 'ul' : 'ol');
  mods.forEach((m) => { const li = el(document, 'li'); li.textContent = m; list.append(li); });
  const tail = mods.length ? [list] : [];
  if (fmt === 'pathway') {
    const h3 = el(document, 'h3'); h3.textContent = title;
    return [[badge || ''], [...(count ? [para(document, count)] : []), h3, ...desc, ...tail]];
  }
  return [[para(document, count ? `${title} — ${count}` : title)], [...(badge ? [pWrap(document, badge)] : []), ...desc, ...tail]];
}

/* the "View All Courses" / "View Course Catalog" button of a course list → a footer link row */
function footerRow(scope, document) {
  const btn = [...scope.querySelectorAll('.v-course-list button, .v-course-list a')].find((b) => /^View /i.test(norm(b.textContent)));
  if (!btn) return null;
  const a = el(document, 'a'); a.href = btn.getAttribute('href') || COURSES_URL; a.textContent = norm(btn.textContent);
  return [[a]];
}

/* the copy above a component in its section (heading + intro texts, also inside wrappers) */
function textsBefore(s, target, document) {
  const out = [];
  comps(s).forEach((c) => {
    if (c === target || c.contains(target) || target.contains(c) || kind(c) === 'separator') return;
    if (!(c.compareDocumentPosition(target) & 4)) return;
    if (isText(c)) out.push(...textEls(c, document));
    else if (isContainer(c)) deep(c).filter(isText).forEach((t) => out.push(...textEls(t, document)));
  });
  return out;
}

const RESULTS_KINDS = [
  {
    name: 'results-certification',
    match: (s) => !!s.querySelector('.v-classification-accordion'),
    emit: (s, { document }) => {
      const acc = s.querySelector('.v-classification-accordion');
      const before = textsBefore(s, acc, document);
      const grid = [...acc.querySelectorAll('.aem-course-list')].some((l) => !/courses--full-width/.test(l.className));
      const fmt = grid ? 'pathway' : 'timeline';
      const logo = imgOf(document, acc.querySelector('.v-classification-accordion-content__image img'));
      const intro = parasOf(document, acc.querySelector('.v-classification-accordion-content__description'));
      // meta columns: label (first paragraph, may be a link) + values
      const meta = [...acc.querySelectorAll('.v-classification-accordion-content__info .text')].map((t) => parasOf(document, t)).filter((ps) => ps.length);
      const rows = [];
      if (fmt === 'pathway') {
        rows.push([[logo || ''], intro]);
        if (meta.length) rows.push(meta.map((ps) => ps));
      } else {
        const head = [...(logo ? [pWrap(document, logo)] : []), ...intro];
        meta.forEach(([label, ...values]) => { const h4 = el(document, 'h4'); h4.innerHTML = label.innerHTML; head.push(h4, ...values); });
        rows.push([head]);
      }
      // the modules area, in order: intro copy (pathway only) and course lists
      const area = acc.querySelector('.v-classification-accordion__modules') || acc;
      [...area.querySelectorAll('.text, .aem-course-list')].filter((n) => !n.closest('.v-course')).forEach((n) => {
        if (n.classList.contains('aem-course-list')) n.querySelectorAll('.v-course').forEach((c) => rows.push(courseRow(c, document, fmt)));
        else if (fmt === 'pathway' && norm(n.textContent)) rows.push([parasOf(document, n)]);
      });
      const foot = footerRow(acc, document);
      if (foot) rows.push(foot);
      return [...before, block(document, `Accordion (${fmt})`, rows)];
    },
  },
  {
    name: 'results-courses',
    match: (s) => !!s.querySelector('.aem-course-list') && !s.querySelector('.v-classification-accordion'),
    emit: (s, { document }) => {
      const list = s.querySelector('.aem-course-list');
      const before = textsBefore(s, list, document);
      const rows = [...list.querySelectorAll('.v-course')].map((c) => courseRow(c, document, 'timeline'));
      const foot = footerRow(s, document);
      if (foot) rows.push(foot);
      return [...before, block(document, 'Accordion (timeline)', rows)];
    },
  },
  {
    name: 'results-tiers',
    match: (s) => !!s.querySelector('.v-tiers'),
    emit: (s, { document, pagePath }) => {
      const tiers = s.querySelector('.v-tiers');
      const out = [];
      comps(s).forEach((c) => {
        if (c.contains(tiers) || kind(c) === 'separator') return;
        if (isText(c)) out.push(...textEls(c, document));
        else if (isButton(c)) { const b = buttonEl(c, document, pagePath); if (b) out.push(b); }
      });
      const rows = [...tiers.querySelectorAll('.v-tiers-card')].map((card) => {
        const content = card.querySelector('.v-tiers-card--content') || card;
        const cell = [];
        const title = norm((content.querySelector('.v-tiers-card__title') || {}).textContent);
        if (title) { const h = el(document, 'h3'); h.textContent = title; cell.push(h); }
        const sub = content.querySelector('.v-tiers-card__subtitle');
        if (sub) cell.push(...parasOf(document, sub));
        const price = norm((content.querySelector('.v-tiers-card__price') || {}).textContent);
        if (price) cell.push(para(document, price));
        const ul = content.querySelector('.v-tiers-card__description ul, .v-tiers-card__description ol');
        if (ul) {
          const list = el(document, 'ul');
          [...ul.querySelectorAll('li')].forEach((li) => { const n = el(document, 'li'); n.textContent = norm(li.textContent); if (n.textContent) list.append(n); });
          cell.push(list);
        }
        const cta = content.querySelector('.v-tiers-card__button-wrapper a, .v-tiers-card__button-wrapper button');
        if (cta && norm(cta.textContent)) { const a = el(document, 'a'); a.href = cta.getAttribute('href') || '#'; a.textContent = norm(cta.textContent); cell.push(pWrap(document, a)); }
        return [cell];
      });
      // (the tiers sit below the heading + CTA on the source)
      return [...out, block(document, 'Cards (pricing)', rows)];
    },
  },
  {
    name: 'results-intro',
    match: (s) => { const d = comps(s); return d.some((c) => isContainer(c) && c.getAttribute('data-bg') === 'lime') && d.some(isImage); },
    emit: (s, { document, pagePath }) => {
      const d = comps(s);
      const photo = imgOf(document, d.find(isImage).querySelector('img'));
      const panel = d.find((c) => isContainer(c) && c.getAttribute('data-bg') === 'lime');
      const cell = [];
      deep(panel).forEach((c, i) => {
        if (isText(c)) textEls(c, document, { headingLevel: fontSize(c) >= 40 ? 1 : 0, plain: true }).forEach((k) => cell.push(k));
        else if (isButton(c)) { const b = buttonEl(c, document, pagePath); if (b) cell.push(pWrap(document, b.querySelector('a'))); }
      });
      return [block(document, 'Columns (media, media-right, lime)', [[[photo || ''], cell]])];
    },
  },
  {
    name: 'results-icon-cards',
    match: (s) => deep(s).filter((c) => isImage(c) && Number(c.getAttribute('data-h') || 99) <= 48).length >= 2
      && [...s.querySelectorAll('.container')].filter((c) => components(c).some(isImage) && components(c).filter(isText).length >= 2).length >= 2,
    emit: (s, { document, pagePath }) => {
      const cards = [...s.querySelectorAll('.container')].filter((c) => components(c).some(isImage) && components(c).filter(isText).length >= 2 && !components(c).some(isContainer));
      const before = []; const after = [];
      comps(s).forEach((c) => {
        if (cards.some((k) => k === c || c.contains(k) || k.contains(c)) || kind(c) === 'separator') return;
        const isBefore = !!(c.compareDocumentPosition(cards[0]) & 4);
        if (isText(c)) (isBefore ? before : after).push(...textEls(c, document));
        else if (isButton(c)) { const b = buttonEl(c, document, pagePath); if (b) (isBefore ? before : after).push(b); }
      });
      const rows = cards.map((card) => {
        const cc = components(card);
        const icon = imgOf(document, (cc.find(isImage) || {}).querySelector && cc.find(isImage).querySelector('img'));
        const texts = cc.filter(isText);
        const h = el(document, 'h3'); h.textContent = norm(texts[0].textContent);
        const body = []; texts.slice(1).forEach((t) => body.push(...textEls(t, document, { plain: true })));
        return [[...(icon ? [pWrap(document, icon)] : []), h, ...body]];
      });
      return [...before, block(document, 'Cards (icons)', rows), ...after];
    },
  },
  {
    name: 'results-cards',
    match: (s) => {
      const d = comps(s);
      const grid = d.find((c) => isContainer(c) && components(c).filter((k) => isContainer(k) && components(k).some(isImage)).length >= 2);
      return !!grid;
    },
    emit: (s, { document, pagePath }) => {
      const d = comps(s);
      const grid = d.find((c) => isContainer(c) && components(c).filter((k) => isContainer(k) && components(k).some(isImage)).length >= 2);
      const out = [];
      d.forEach((c) => { if (c !== grid && isText(c)) out.push(...textEls(c, document)); });
      const rows = components(grid).filter((k) => isContainer(k) && components(k).some(isImage)).map((card) => {
        const img = imgOf(document, deep(card).find(isImage).querySelector('img'));
        const texts = deep(card).filter(isText);
        const body = [];
        texts.forEach((t, i) => body.push(...textEls(t, document, { headingLevel: i === 0 ? 3 : 0, plain: true })));
        return [[img || ''], body];
      });
      // the home page's media cards: photo beside the copy below 1280, 3-up from 1280
      out.push(block(document, 'Cards (media)', rows));
      return out;
    },
  },
];
KINDS.unshift(...RESULTS_KINDS);

export default {
  onLoad: (payload) => {
    const { document } = payload;
    // the lead form is the site footer's subscribe form; the Package Required pop-up is
    // a hidden modal — neither is page content
    document.querySelectorAll('v-leads, .v-leads').forEach((v) => { const c = v.closest('.container'); if (c) c.remove(); });
    // School: the small-icon cards ("why provide tennis") + their Join button share a source
    // section with the photo cards — make them their own section (after it)
    // (a small icon = an image COMPONENT at most 48px tall — the lazy <img> itself may not be laid out yet)
    const iconCard = (c) => { const img = c.querySelector(':scope .image'); const ih = img ? img.getBoundingClientRect().height : 0; return ih > 0 && ih <= 48 && c.querySelectorAll('.text').length >= 2; };
    [...document.querySelectorAll('.container')].forEach((c) => {
      const cards = [...c.querySelectorAll(':scope > .cmp-container > .aem-Grid > .container')].filter(iconCard);
      if (cards.length < 2) return;
      // its section = the container it sits in, when that section also holds the photo cards
      const sec = c.parentElement && c.parentElement.closest('.container');
      if (!sec || !sec.querySelector('.image') || [...sec.querySelectorAll('.image')].every((i) => c.contains(i))) return;
      const btns = [];
      for (let n = c.nextElementSibling; n; n = n.nextElementSibling) if (/^button\b/.test(n.className)) btns.push(n);
      const grid = c.querySelector(':scope > .cmp-container > .aem-Grid');
      if (grid) grid.append(...btns);
      sec.after(c);
    });
    landing.onLoad(payload);
    // the certification fragment is page content (the landing importer skips fragments)
    document.querySelectorAll('.experiencefragment').forEach((x) => {
      if (x.querySelector('.v-classification-accordion')) x.className = x.className.replace(/\bexperiencefragment\b/g, 'container results-certification');
    });
  },
  transform: (payload) => landing.transform(payload),
};
