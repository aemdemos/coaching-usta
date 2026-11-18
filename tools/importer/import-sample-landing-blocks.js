/* eslint-disable */
/* global WebImporter */

/**
 * Block-variant samples for the landing pages: drafts/block-samples/<key>.
 * Each sample takes real sections from a landing page, emitted exactly as the landing importer
 * emits them (same blocks, options and section styles), under a short description of the
 * variant and its authoring contract. Pick the sample with a query on the source URL:
 *   https://www.ustacoaching.com/en/home/coach-mentorship.html?sample=cards-icons
 */
import cleanupTransformer from './transformers/coaching-usta-cleanup.js';
import landing, {
  emitSection, finalizeOutput, contentRoot, prepareSections, block, el, norm, TEMPLATE,
} from './import-landing-page-v1.js';

const CM = 'coach-mentorship';
const CC = 'coaching-community';
const CW = 'coaching-workshops';
const FEL = 'fellowship-in-coaching-and-leadership';

const SAMPLES = {
  'hero-content': {
    page: CM,
    title: 'Hero (Content)',
    intro: 'Full-bleed rounded hero: background photo behind a dark overlay, LEFT-aligned copy — a USTA Sans display H1, an H2 subheading, body paragraphs — then up to two CTAs: the first link is the lime button, the second the <strong>outlined</strong> button (black, white border). The two stack on phones/tablets and sit side by side from 1024. Authored as <code>hero (content)</code>: row 1 the image, row 2 the copy with each CTA link in its own paragraph.',
    examples: [{ anchor: 'USTA COACHING NETWORK' }],
  },
  'hero-content-title': {
    page: CC,
    title: 'Hero (Content, Title)',
    intro: 'The content hero with only a title and an intro line, no CTA (<code>hero (content, title)</code>): the intro is a USTA Sans line at line-height 1, 54px under the H1 on phones/tablets (36px from 1024), and the panel runs on 16px → 168px (1024) → 192px (1280) below it.',
    examples: [{ anchor: 'COMMUNITY' }],
  },
  'columns-text-image': {
    page: CM,
    title: 'Columns (text + image)',
    intro: 'Plain <code>columns</code> (no option): a text cell (heading + copy) beside an image cell. Text first on phones/tablets; side by side from 1024 (text 50% − 6px, image 50% + 6px), both vertically centred, image corners 20px. Heading → copy 66px.',
    examples: [{ anchor: 'Why Tennis Coach Mentorship Matters for Professional Development' }],
  },
  'columns-feature-unframed': {
    page: CC,
    title: 'Columns (Feature, Unframed)',
    intro: 'The <code>columns (feature)</code> row — an image beside a grey-bordered text card — without its dark rounded panel (<code>columns (feature, unframed)</code>). Cells in either order: the image may come first or second. Image first on phones, hidden on tablets (source), side by side from 1024 with the image vertically centred.',
    examples: [{ anchor: 'Serving All: Your Career in Tennis Grows Here' }],
  },
  'columns-photos': {
    page: CC,
    title: 'Columns (Photos)',
    intro: 'Two photos side by side at EVERY width (<code>columns (photos)</code>, one row, one image per cell), corners 20px, crop 5:4 on phones → 3:2 (768) → 2:1 (1280). Shown here with its section: the narrow heading section, the lead intro and the CTA after it.',
    examples: [{ anchor: 'USTA Coaching Network' }],
  },
  'columns-checklist': {
    page: CM,
    title: 'Columns (Checklist)',
    intro: 'Rows of side-by-side diamond-bullet items (<code>columns (checklist)</code>): one block row per visual row, one cell per item (a <strong>bold</strong> lead-in + copy). Two items per row at every width; the green diamond is added by CSS.',
    examples: [{ anchor: 'How the Program Works' }],
  },
  'columns-cta': {
    page: CM,
    title: 'Columns (CTA)',
    intro: 'Two mirrored call-to-action columns (<code>columns (cta)</code>, one row, two cells): each cell = a title heading, a line of copy and a button (<strong>bold</strong> link = lime, <em>italic</em> link = outlined). The first column is right-aligned, the second left-aligned; stacked on phones.',
    examples: [{ anchor: 'join the usta coaching network today' }],
  },
  'cards-media-stacked': {
    page: CM,
    title: 'Cards (Media, Stacked)',
    intro: 'Media cards with the image ON TOP at every width (<code>cards (media, stacked)</code>; one row per card: image cell + title/copy cell). 1-up on phones, 3-up from 768; image crop 287/230 (phones) → 3:2 (768–1279) → 2:1 (1280); title Graphik Semibold 28 → 32 (1280); copy 18/24. The plain <code>cards (media)</code> (home page) instead turns horizontal on tablets.',
    examples: [{ anchor: 'Benefits of the usta coaching network' }],
  },
  'cards-icons': {
    page: CM,
    title: 'Cards (Icons)',
    intro: 'Small-icon feature cards (<code>cards (icons)</code>; one row per card, one cell: icon paragraph, title heading, description). Dark #2a2a2a cards with 20px corners, 1-up on phones and 3-up from 768; the icon is 55px (phones) → 49px (768) → 28px (1280). Shown with its narrow heading section and the CTA + note after it.',
    examples: [{ anchor: 'Benefits of Becoming a USTA Tennis Coaching Mentor' }],
  },
  'cards-quote-testimonial': {
    page: CC,
    title: 'Cards (Quote, Testimonial)',
    intro: 'Testimonial cards (<code>cards (quote, testimonial)</code>; one row per card, one cell: quote, name, role). Borderless dark cards, 18px italic quote, a tall gap before a thin grey rule, bold name and white role. The plain <code>cards (quote)</code> is the outlined 16px version (Inclusion Summit).',
    examples: [{ anchor: 'WHAT OTHERS ARE SAYING' }],
  },
  'accordion-closed': {
    page: CM,
    title: 'Accordion (Closed)',
    intro: 'The default FAQ accordion with every item closed on load (<code>accordion (closed)</code>); the plain <code>accordion</code> opens the first item. One row per item: question cell, answer cell.',
    examples: [{ anchor: "FAQ'S" }],
  },
  'banner-spotlight': {
    page: CM,
    title: 'Banner (Spotlight)',
    intro: 'The closing contact band (<code>banner (spotlight)</code>; one row: a cell with the H2 heading + copy, a cell with the CTA link): a blue 32px-radius panel, centred USTA Sans display heading, Graphik 18/24 copy (links underlined) and a content-width lime button. <code>narrow</code> (see banner-spotlight-narrow) sets the copy on 10 of 12 columns.',
    examples: [{ anchor: 'Questions About the USTA Coaching Network?' }],
  },
  'banner-spotlight-narrow': {
    page: CC,
    title: 'Banner (Spotlight, Narrow)',
    intro: 'The spotlight banner with its copy on 10 of the 12 columns (<code>banner (spotlight, narrow)</code>), as on the coaching-community "Professional Career Consulting" band.',
    examples: [{ anchor: 'Professional Career Consulting' }],
  },
  'banner-stacked': {
    page: CC,
    title: 'Banner (Stacked)',
    intro: 'An outlined promo band (<code>banner (stacked)</code>; one row: a cell with the H2 heading + copy, a cell with the CTA link — the same authoring as the base banner): black panel, 1px white outline, 20px radius; the USTA Sans heading (28 → 32 → 40) STACKED over Graphik 18/24 copy in one column, and the lime 56px button (12px radius, label 16 → 18 → 24) alone in a right column — 3 of 12 columns at 768, 2 of 12 from 1024; under the copy on phones. The button fills its column but never squeezes its label.',
    examples: [{ anchor: 'Career Center is Live' }],
  },
  'columns-media-outlined': {
    page: CW,
    title: 'Columns (Media, Outlined)',
    intro: 'The <code>columns (media)</code> row with its card as the source\'s white-OUTLINED container (<code>columns (media, outlined)</code>; one row: a text cell (heading, copy, list) and an image cell, in either order): transparent card, 1px white border, 20px radius, white text; USTA Sans heading 32 / 40 (1024) / 56 (1280) centred, Graphik 16 / 18 copy, an 18/24 bullet list 42px below. Photo 20px radius: above the card on phones, 2:3 at 768, as tall as the card at 1024, 5:6 from 1280.',
    examples: [{ anchor: 'Tennis Coaching Workshops & Webinars' }],
  },
  toc: {
    page: CW,
    title: 'TOC (Tabs over sections)',
    intro: 'A tab set over whole page SECTIONS (<code>toc</code>; one row per tab: label | anchor). Each tab\'s content is its own section after the block, carrying Section Metadata <code>toc-anchor</code> = the anchor, so a tab can hold any blocks (here Columns (promo) rows). Clicking a tab shows only its section; deep links use the source\'s form <code>#tab=upcoming</code> / <code>#tab=recordedwebinars</code>; arrow keys switch tabs. Phones: tabs as wide as their label, 68px, inactive #2d2d2d; from 768: a #2d2d2d track, tabs share the width, 101px (106px at 1024); active lime.',
    examples: [{ anchor: 'ONLINE WEBINARS' }],
  },
  'cards-media-stacked-compact': {
    page: FEL,
    title: 'Cards (Media, Stacked, Compact)',
    intro: 'The landing media cards (<code>cards (media, stacked)</code>: one row per card — photo | title + copy) with the <code>compact</code> option: 1 card per row on phones, 3 from 768; each card is inset 8px (12px from 768) more than plain stacked cards; photos keep their own 3:2 shape (no crop); copy in the source\'s narrow text — Graphik Regular 16/19.2, −0.03em (14/16.8 at 768–1023); title Graphik Semibold 28 → 32 (1280).',
    examples: [{ anchor: 'On-court Coaching' }],
  },
  'banner-header': {
    page: FEL,
    title: 'Banner (Header)',
    intro: 'Section header band (no CTA): one row — heading | subtitle. Heading USTA Sans 32 → 40 (768), centred below 1024; subtitle Graphik Semibold 24/32; side by side on 8 + 4 of 12 columns from 1024. Shown in its default colours and with <strong>blue</strong> appended (the source uses the blue one above a <code>columns (events, dates)</code> list).',
    examples: [{
      anchor: 'IMPORTANT DATES',
      pick: 'Banner',
      pair: {
        base: 'Default: black panel with a 1px white outline and white text. Authored as <code>banner header</code>.',
        blue: 'Blue: append <strong>blue</strong> — blue panel, no outline, black text. Authored as <code>banner header blue</code>.',
      },
    }],
  },
  'columns-events-dates': {
    page: FEL,
    title: 'Columns (Events, Dates)',
    intro: 'The event list with the <code>dates</code> option (same authoring: one row per date — date | eyebrow, title; no chips): 1px white outlined rows, 26px apart, at the page container edge. Phones: date, eyebrow and title stacked; from 768 the date sits on 3 of 12 columns, centred, beside the eyebrow and title. Date Graphik Semibold 28 → 32 (1280); eyebrow Graphik Regular 18/24 bold; title Graphik Semibold 28 → 32 (768) → 40 (1024).',
    examples: [{ anchor: 'IMPORTANT DATES', pick: 'Columns' }],
  },
  'columns-quote-large': {
    page: FEL,
    title: 'Columns (Quote, Large)',
    intro: 'The quote row (<code>columns (quote)</code>: photo | quote glyph, quote, attribution) with the <code>large</code> option: the source\'s large quote, Graphik Semibold 28 → 32 (768) → 40 (1024), normal tracking; the card is as tall as its copy (attribution right below the quote) and the photo is top-aligned beside it; at 768–1023 the card stacks above the photo.',
    examples: [{ anchor: 'Fellowship Participant' }],
  },
  'text-style-lead-subhead': {
    page: CM,
    title: 'Text Style (Lead / Subhead)',
    intro: 'Intro lines under a section heading, set at their own size (plain paragraphs can\'t carry one): <code>text style (lead)</code> — Graphik Regular 16 → 18 (1024) → 24px (1280), line-height 1.2 (source <code>text--font-size--24px…</code>); <code>text style (subhead)</code> — 16 → 18px (1280), line-height 1.2 (source <code>text--font-size--18px-16px</code>). Add <code>center</code> to centre them. Shown with their headings only.',
    examples: [
      { anchor: 'Benefits of the usta coaching network', pick: 'Text Style' },
      { anchor: 'How the Program Works', pick: 'Text Style' },
    ],
  },
};

const hr = (document) => document.createElement('hr');
const blockName = (n) => (n.tagName === 'TABLE' ? norm(n.querySelector('tr')?.textContent || '') : '');

/* the sample builder, shared with import-sample-results-blocks.js (which brings the results
   pages' kinds and onLoad) */
export const sampleImporter = (SAMPLES, onLoad) => ({
  onLoad,

  transform: (payload) => {
    const { document, params } = payload;
    const url = params.originalURL;
    const key = new URL(url).searchParams.get('sample');
    const sample = SAMPLES[key];
    if (!sample) throw new Error(`unknown sample "${key}" (use ?sample=${Object.keys(SAMPLES).join('|')})`);
    if (!new URL(url).pathname.includes(sample.page)) throw new Error(`sample "${key}" comes from ${sample.page}`);
    const pagePath = new URL(url).pathname.replace(/\.html$/, '');

    const main = document.querySelector('main') || document.body;
    cleanupTransformer('beforeTransform', main, payload);
    main.querySelectorAll('[class*="aem-GridColumn--default--hide"]').forEach((e) => e.remove());
    const { root, skip } = contentRoot(main);
    const sections = prepareSections(root, document, skip).filter((s) => !skip(s) && norm(s.textContent));
    const find = (anchor) => {
      const s = sections.find((x) => [...x.querySelectorAll('h1, h2, h3, p')].some((h) => norm(h.textContent).toLowerCase() === anchor.toLowerCase()));
      if (!s) throw new Error(`section "${anchor}" not found on ${url}`);
      return s;
    };

    const out = document.createElement('div');
    out.append(
      el(document, 'h1', sample.title),
      el(document, 'p', sample.intro),
      el(document, 'p', `<em>Source: <a href="${url.split('?')[0]}">${pagePath.split('/home/')[1]}</a> (EN + ES)</em>`),
      hr(document),
      block(document, 'Spacer', [['desktop', '40px'], ['mobile', '24px']]),
    );
    sample.examples.forEach(({ anchor, pick, pair }) => {
      emitSection(find(anchor), { document, pagePath }).forEach(({ nodes, styles, meta }) => {
        // `pick`: keep the headings and the named block only
        const kept = pick ? nodes.filter((n) => /^H[1-6]$/.test(n.tagName) || blockName(n).startsWith(pick)) : nodes;
        if (!kept.length) return;
        // `pair`: the block in its default colours, then with `blue` appended (each under its
        // own heading + note, as the other banner samples)
        const table = pair && kept.find((n) => n.tagName === 'TABLE');
        if (table) {
          const cell = table.querySelector('tr').firstElementChild;
          const opts = (cell.textContent.match(/\(([^)]*)\)/) || [, ''])[1].split(',').map((o) => o.trim()).filter((o) => o && o.toLowerCase() !== 'blue');
          const name = (extra) => `${cell.textContent.replace(/\s*\(.*$/, '')} (${[...opts, ...extra].join(', ')})`;
          const title = (extra) => name(extra).replace(/\b\w/g, (ch) => ch.toUpperCase());
          const variant = (extra) => { const t = table.cloneNode(true); t.querySelector('tr').firstElementChild.textContent = name(extra); return t; };
          out.append(hr(document), el(document, 'h2', title([])), el(document, 'p', pair.base), hr(document), variant([]),
            hr(document), block(document, 'Spacer', [['desktop', '60px'], ['mobile', '40px']]),
            hr(document), el(document, 'h2', title(['blue'])), el(document, 'p', pair.blue), hr(document), variant(['blue']));
          return;
        }
        const cells = { ...(styles.length ? { Style: styles.join(', ') } : {}), ...(meta || {}) };
        out.append(hr(document), ...kept, ...(Object.keys(cells).length ? [block(document, 'Section Metadata', cells)] : []));
      });
    });
    out.append(
      hr(document),
      block(document, 'Spacer', [['desktop', '80px'], ['mobile', '60px']]),
      hr(document),
      block(document, 'Metadata', { Title: `${sample.title} — Block Sample`, Template: TEMPLATE, Robots: 'noindex, nofollow' }),
    );
    finalizeOutput(out, document);
    cleanupTransformer('afterTransform', out, payload);
    WebImporter.rules.adjustImageUrls(out, url, params.originalURL);
    return [{ element: out, path: `/drafts/block-samples/${key}`, report: { template: 'block-sample', sample: key } }];
  },
});

export default sampleImporter(SAMPLES, landing.onLoad);
