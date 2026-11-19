/* eslint-disable */
/* global WebImporter */

/**
 * Section-style samples: drafts/section-samples/section-<key>.
 * Takes real sections from a landing page, emitted exactly as the landing importer emits them,
 * and shows each in several versions so the effect of a section style can be compared in the
 * preview:
 *   - `narrow-n` (coach-mentorship): different `narrow-N` values next to the full width;
 *   - `inset-n` (coaching-community): each scenario with several `inset-N` values and without,
 *     keeping the importer's own section split (a narrow heading section + the section it introduces).
 * The sample is picked with a query on the source URL, e.g. `…/coach-mentorship.html?sample=narrow-n`,
 * `…/coaching-community.html?sample=inset-n`.
 */
import cleanupTransformer from './transformers/coaching-usta-cleanup.js';
import landing, {
  emitSection, finalizeOutput, contentRoot, block, el, norm, TEMPLATE,
} from './import-landing-page-v1.js';

const SAMPLES = {
  'narrow-n': {
    title: 'Section style: narrow-N',
    intro: 'Everything in the section sits on <strong>N of the 12 grid columns</strong>, centred, at every screen width — like Columns <code>media-N</code>. Authored as Section Metadata <code>Style: narrow-N</code> (N = 1…12), e.g. <code>narrow-10</code>. The landing importer sets it from the source text component\'s column span (<code>aem-GridColumn--default--10</code> + <code>offset--default--1</code>) and gives such a heading its own section, placed right before the content it introduces. Plain <code>narrow</code> (no number) is the home page intro\'s desktop-only style and is unchanged.',
    examples: [
      { anchor: 'join the usta coaching network today', part: 'heading', spans: [10, 8, 6, null], label: 'A section heading' },
      { anchor: 'How the Program Works', part: 'all', spans: [10, 8, null], label: 'A whole section (heading, intro and a block)' },
    ],
  },
  'inset-n': {
    page: 'coaching-community',
    title: 'Section style: inset-N',
    intro: 'The whole section — and the 12-column grid its content sits on — moves <strong>N px further in on each side</strong>, at every screen width (N = 1…64). Authored as Section Metadata <code>Style: inset-N</code>, e.g. <code>inset-4</code>. The landing importer sets it from the SECTION\'s own source container padding (<code>container--padding--12px-4px</code> → <code>inset-4</code>; a padded column inside the section does not count). It combines with <code>narrow-N</code> (the narrow columns are taken inside the inset) and works on the quote / icon card sections too. Each scenario is shown with different N values and WITHOUT the style: compare the left and right edges and the line wrapping (on wide screens an 8px narrower box can move a word to the next line).',
    prefix: 'inset',
    examples: [
      { anchor: 'Fellowship Program', part: 'all', values: [4, null], label: 'As imported (source = inset-4): narrow heading section + the section it introduces' },
      { anchor: 'Fellowship Program', part: 'all', values: [12, 24], label: 'The same section with larger N' },
      { anchor: 'USTA Coaching Network', part: 'heading', values: [4, null], label: 'A narrow heading on its own (narrow-10 + inset-N)' },
      { anchor: 'WHAT OTHERS ARE SAYING', part: 'all', values: [4, 24, null], label: 'A cards section (quote cards: the section pads itself)' },
    ],
  },
};

const hr = (document) => document.createElement('hr');

export default {
  onLoad: landing.onLoad,

  transform: (payload) => {
    const { document, params } = payload;
    const url = params.originalURL;
    const key = new URL(url).searchParams.get('sample');
    const sample = SAMPLES[key];
    if (!sample) throw new Error(`unknown sample "${key}" (use ?sample=${Object.keys(SAMPLES).join('|')})`);
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
    );
    if (sample.page && !pagePath.includes(sample.page)) throw new Error(`sample "${key}" comes from ${sample.page}`);
    // value samples (`prefix`): each example with several `<prefix>-N` values (null = without),
    // keeping the importer's own section split (each part stays its own section, as imported)
    if (sample.prefix) {
      const own = new RegExp(`^${sample.prefix}-\\d+$`);
      sample.examples.forEach(({ anchor, part, label, values }) => {
        const s = find(anchor);
        values.forEach((n) => {
          const style = n ? `${sample.prefix}-${n}` : null;
          const parts = emitSection(s.cloneNode(true), { document, pagePath });
          const picked = part === 'heading' ? parts.filter((p) => p.name === 'heading') : parts;
          if (!picked.length) throw new Error(`"${anchor}": no ${part} part`);
          if (!parts.some((p) => p.styles.some((x) => own.test(x)))) throw new Error(`"${anchor}": the importer does not emit ${sample.prefix}-N here`);
          const styled = picked.map((p) => ({ nodes: p.nodes, styles: [...p.styles.filter((x) => !own.test(x)), ...(style ? [style] : [])] }));
          out.append(
            hr(document),
            el(document, 'h3', `${label} — ${style ? `<code>${style}</code>` : `without <code>${sample.prefix}-N</code>`}`),
            el(document, 'p', `Section Metadata Style: ${styled.map((p) => `<code>${p.styles.join(', ') || '(none)'}</code>`).join(' + ')}`),
          );
          styled.forEach((p) => out.append(
            hr(document),
            ...p.nodes,
            ...(p.styles.length ? [block(document, 'Section Metadata', { Style: p.styles.join(', ') })] : []),
          ));
        });
      });
    }
    (sample.prefix ? [] : sample.examples).forEach(({ anchor, part, spans, label }) => {
      const s = find(anchor);
      spans.forEach((n) => {
        // emit from a copy: emitting moves source nodes, and each example is emitted several times
        const parts = emitSection(s.cloneNode(true), { document, pagePath });
        const picked = part === 'heading' ? parts.filter((p) => p.name === 'heading') : parts;
        if (!picked.length) throw new Error(`"${anchor}": no ${part} part`);
        // the whole example as ONE section here, so the style visibly reaches everything in it
        const nodes = picked.flatMap((p) => p.nodes);
        const styles = [...new Set(picked.flatMap((p) => p.styles).filter((x) => !/^narrow-\d+$/.test(x)))];
        if (n) styles.push(`narrow-${n}`);
        out.append(
          hr(document),
          el(document, 'h3', `${label} — ${n ? `<code>narrow-${n}</code>` : 'full width (no narrow-N)'}`),
          el(document, 'p', `Section Metadata Style: <code>${styles.join(', ') || '(none)'}</code>`),
          hr(document),
          ...nodes,
          ...(styles.length ? [block(document, 'Section Metadata', { Style: styles.join(', ') })] : []),
        );
      });
    });
    out.append(
      hr(document),
      el(document, 'p', '<em>End of sample.</em>'),
      hr(document),
      block(document, 'Metadata', { Title: `${sample.title} — Section Sample`, Template: TEMPLATE, Robots: 'noindex, nofollow' }),
    );
    finalizeOutput(out, document);
    cleanupTransformer('afterTransform', out, payload);
    WebImporter.rules.adjustImageUrls(out, url, params.originalURL);
    return [{ element: out, path: `/drafts/section-samples/section-${key}`, report: { template: 'section-sample', sample: key } }];
  },
};
