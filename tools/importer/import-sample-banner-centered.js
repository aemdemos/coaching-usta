/* eslint-disable */
/* global WebImporter */

/**
 * Block-sample importer: drafts/block-samples/banner-centered.
 * Source: the "More questions? Visit Coach Care." band on membership-benefits (also on
 * learning-pathway, EN + ES). Reads the heading, the CTA label and its link from the
 * live source page and lays out the sample: the variant in its default (black) colours
 * and with `blue` appended — the blue one is the colourway the source uses.
 */
const SOURCES = [
  'https://www.ustacoaching.com/en/home/membership-benefits.html',
  'https://www.ustacoaching.com/en/home/learning-pathway.html',
];
const HEADING = 'More questions? Visit Coach Care.';

const el = (document, tag, html) => { const e = document.createElement(tag); e.innerHTML = html; return e; };
const norm = (s) => s.replace(/\s+/g, ' ').trim();

export default {
  transform: ({ document, params }) => {
    // the source band: the smallest container holding the heading text and a button
    const textEl = [...document.querySelectorAll('.cmp-text p, .cmp-text h1, .cmp-text h2, .cmp-text h3, .cmp-text h4')]
      .find((e) => norm(e.textContent) === HEADING);
    if (!textEl) throw new Error(`"${HEADING}" not found on ${params.originalURL}`);
    let band = textEl.parentElement;
    while (band && !band.querySelector('a.cmp-button')) band = band.parentElement;
    const btn = band && band.querySelector('a.cmp-button');
    if (!btn) throw new Error('banner CTA not found');
    const label = norm(btn.textContent);
    const href = btn.getAttribute('href');

    const gap = (d, m) => WebImporter.Blocks.createBlock(document, { name: 'Spacer', cells: [['desktop', `${d}px`], ['mobile', `${m}px`]] });
    const banner = (variant) => {
      const heading = document.createElement('h3');
      heading.textContent = norm(textEl.textContent);
      const link = document.createElement('a');
      link.href = href;
      link.textContent = label;
      return WebImporter.Blocks.createBlock(document, { name: `Banner (${variant})`, cells: [[heading, link]] });
    };
    const sources = SOURCES.map((u) => `<a href="${u}">${u.split('/home/')[1].replace(/\.html$/, '')}</a>`).join(', ');

    const out = document.createElement('div');
    out.append(
      el(document, 'h1', 'Banner (Centered)'),
      el(document, 'p', 'Centered CTA banner: a centred heading above a centred CTA, no body copy. Shown in its default colours and with <strong>blue</strong> appended (the source uses the blue one).'),
      el(document, 'p', `<em>Source: ${sources} (EN + ES)</em>`),
      document.createElement('hr'),
      gap(40, 24),
      document.createElement('hr'),
      el(document, 'h2', 'Banner (Centered)'),
      el(document, 'p', 'Default: black panel with a 1px white outline, white text and a lime CTA with a black label. Authored as <code>banner centered</code>.'),
      document.createElement('hr'),
      banner('centered'),
      document.createElement('hr'),
      gap(60, 40),
      document.createElement('hr'),
      el(document, 'h2', 'Banner (Centered, Blue)'),
      el(document, 'p', 'Blue — as on the source: append <strong>blue</strong> for a blue panel, no outline, black text and a black CTA with a white label. Authored as <code>banner centered blue</code>.'),
      document.createElement('hr'),
      banner('centered, blue'),
      document.createElement('hr'),
      gap(80, 60),
      document.createElement('hr'),
      WebImporter.Blocks.createBlock(document, { name: 'Metadata', cells: { Title: 'Banner (Centered) — Block Sample', Robots: 'noindex, nofollow' } }),
    );
    return [{ element: out, path: '/drafts/block-samples/banner-centered', report: { template: 'block-sample' } }];
  },
};
