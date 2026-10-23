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
  emitSection, finalizeOutput, contentRoot, block, el, norm, TEMPLATE,
} from './import-landing-page-v1.js';

const CM = 'coach-mentorship';
const CC = 'coaching-community';

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

export default {
  onLoad: landing.onLoad,

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
    const sections = [...root.children].filter((s) => !skip(s) && norm(s.textContent));
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
    sample.examples.forEach(({ anchor, pick }) => {
      emitSection(find(anchor), { document, pagePath }).forEach(({ nodes, styles }) => {
        // `pick`: keep the headings and the named block only
        const kept = pick ? nodes.filter((n) => /^H[1-6]$/.test(n.tagName) || blockName(n).startsWith(pick)) : nodes;
        if (!kept.length) return;
        out.append(hr(document), ...kept, ...(styles.length ? [block(document, 'Section Metadata', { Style: styles.join(', ') })] : []));
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
};
