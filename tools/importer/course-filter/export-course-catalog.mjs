/*
 * Exports the AEM "Coaching Course" Content Fragments + the course-list component
 * config into ONE EDS spreadsheet per locale. That sheet is the single source of
 * truth for everything AEM authors (the LMS API keeps supplying titles, modules,
 * filter tags and sort order at runtime).
 *
 * Where the data comes from: the source page renders the course list as a Vue
 * component whose props carry the AEM-authored JSON, e.g.
 *   <v-course-list :fragments="[…content fragments…]" :filters="[…]" items-to-display="16" …>
 * There is no separate AEM JSON request — the props ARE the export.
 *
 * Output (EDS multi-sheet JSON, upload to DA as-is and preview/publish):
 *   content/en/course-catalog.json   ← /en/home/courses.html            (PROD sheet)
 *   content/es/course-catalog.json   ← /es/home/courses.html            (PROD sheet)
 * (authored data lives in the locale folders, never under /blocks/, which is code)
 *
 * Environments (repoless: one code base, a DEV site and a PROD site, each with its own
 * content): the block reads `course-catalog-dev.json` on a site whose name contains
 * `-dev` (main--coaching-dev--usta-digital) and `course-catalog.json` everywhere else.
 * With the customer's Content Fragment export (`--fragments <courses.json>`, the
 * pilot/dev environment) the EN course rows come from that file instead of the live
 * page, for BOTH environments:
 *   content/en/course-catalog-dev.json — links as in the file (pilot CSOD)
 *   content/en/course-catalog.json     — every pilot link swapped for its production
 *                                        link (learned from the live page); a link with no
 *                                        known production counterpart is kept and reported
 * The tabs / filters and settings always come from the live page.
 * Sheets:
 *   courses  — one row per content fragment (code, description, logoPath, flags,
 *              constraint / prerequisite fields, conditionalDescription). Descriptions are
 *              PLAIN TEXT with [link text](url) links — no HTML for authors
 *   filters  — one row per filter option (section, data path, value, tab fields)
 *   settings — key/value component settings (page size, See More label, …)
 *
 *   node tools/importer/course-filter/export-course-catalog.mjs [--fragments <courses.json>] [--dry-run]
 */
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../../..');
const SOURCE = 'https://www.ustacoaching.com';
const LMS_API = 'https://services.ustacoaching.com/v1/lms/courses/all';
const LOCALES = [
  { page: '/en/home/courses.html', out: 'content/en/course-catalog.json' },
  { page: '/es/home/courses.html', out: 'content/es/course-catalog.json' },
];
// Badges: the source SVGs were rasterized to 2x PNGs (Asset-Size Rule) and live in DA
// under /assets/media/course-catalog/badges/ — the AEM DAM path without its
// `/content/dam/coaching/` root (user decision 2026-11-19): /content/dam/coaching/
// course-catalog/badges/x.svg → /assets/media/course-catalog/badges/x.png. The AEM DAM
// path is kept in sourceLogoPath.
const damToMedia = (dam) => dam.replace(/^\/content\/dam\/(coaching\/)?/, '/assets/media/').replace(/\.svg$/i, '.png');
const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36';
const dryRun = process.argv.includes('--dry-run');

// Content-fragment values → the labels authors see in the AEM CF editor.
const CONSTRAINTS = {
  isDevelopmentBadgeRequired: 'Development Badge Required',
  isSpecificCourseRequired: 'Specific Course Required',
};
const OPERATORS = { '||': 'OR', '&&': 'AND' };

const unescapeHtml = (s) => s
  .replace(/&#34;|&quot;/g, '"')
  .replace(/&#39;|&apos;/g, "'")
  .replace(/&lt;/g, '<')
  .replace(/&gt;/g, '>')
  .replace(/&amp;/g, '&');

/** Reads every attribute of the first <v-course-list> tag; JSON-bound props are parsed. */
function readProps(html) {
  const tag = html.match(/<v-course-list\b([^>]*)>/s);
  if (!tag) throw new Error('no <v-course-list> on the page');
  const props = {};
  [...tag[1].matchAll(/(:?[\w-]+)="([^"]*)"/g)].forEach(([, name, raw]) => {
    const value = unescapeHtml(raw);
    const key = name.replace(/^:/, '');
    try { props[key] = JSON.parse(value); } catch { props[key] = value; }
  });
  return props;
}

const bool = (v) => String(v === true || v === 'true');
const clean = (s) => (s || '').trim();

/**
 * AEM rich text → the sheet's author-friendly cell text: plain text, one blank line
 * between paragraphs, links as [link text](url) (the course-filter block renders them).
 * Empty spacer paragraphs (<p>&nbsp;</p>) and stray <br>s are dropped — the block adds
 * the blank line before the "To unlock…" note itself.
 */
function htmlToText(html) {
  if (!html) return '';
  const decode = (t) => t.replace(/&nbsp;/g, ' ').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&amp;/g, '&');
  const withLinks = html.replace(/<a\b[^>]*?href="([^"]*)"[^>]*>([\s\S]*?)<\/a>/gi,
    (m, href, inner) => {
      // trailing punctuation inside the source link ("Spanish.") goes after it
      const [, label, punct] = inner.replace(/<[^>]+>/g, '').trim().match(/^(.*?)([.,;:!?]*)$/s);
      return `[${label}](${decode(href)})${punct}`;
    });
  return withLinks.split(/<\/p>/i)
    .map((para) => decode(para.replace(/<br\s*\/?>/gi, ' ').replace(/<[^>]+>/g, ''))
      .replace(/\s+/g, ' ').trim())
    .filter(Boolean)
    .join('\n\n');
}

function courseRows(fragments, names) {
  const rows = [];
  const skipped = [];
  fragments.forEach((f) => {
    // A fragment without a code can never match an LMS course; report it.
    if (!f.code) { skipped.push(clean(f.description).slice(0, 60)); return; }
    const logo = clean(f.logoPath);
    rows.push({
      code: f.code,
      courseName: names.get(f.code) || '',
      description: htmlToText(f.description),
      logoPath: logo ? damToMedia(logo) : '',
      sourceLogoPath: logo,
      isAdvancedMembershipRequired: bool(f.isAdvancedMembershipRequired),
      ignoreSafePlayForMinors: bool(f.ignoreSafePlayForMinors),
      hideModules: bool(f.hideModules),
      isWorkshop: bool(f.isWorkshop),
      constraint: CONSTRAINTS[f.constraint] || clean(f.constraint),
      requiredCourseCode: clean(f.requiredCourseCode),
      logicalOperator: OPERATORS[f.logicalOperator] || clean(f.logicalOperator),
      courseNameForLocker: clean(f.courseNameForLocker),
      conditionalDescription: htmlToText(f.conditionalDescription),
    });
  });
  return { rows, skipped };
}

function filterRows(filters) {
  return filters.flatMap((section) => section.availableFilters.map((opt) => ({
    sectionTitle: section.sectionTitle,
    filtersDataPath: section.filtersDataPath,
    filterTitle: opt.filterTitle,
    filterValue: opt.filterValue,
    addToTopFilters: bool(opt.addToTopFilters),
    appliedByDefault: bool(opt.appliedByDefault),
    topFilterTitle: opt.topFilterTitle || '',
    topFilterDescription: opt.topFilterDescription || '',
  })));
}

function settingRows(props) {
  const keys = ['items-to-display', 'show-more-button-title', 'empty-message', 'url-filter-parameter',
    'use-response-order', 'hide-description', 'hide-badge-path', 'hide-eyebrow', 'hide-modules'];
  return keys.filter((k) => k in props).map((k) => ({ key: k, value: String(props[k]) }));
}

const LINK = /<a\b[^>]*?href="([^"]*)"[^>]*>([\s\S]*?)<\/a>/gi;
const linkText = (t) => t.replace(/<[^>]+>/g, '').trim();

/**
 * pilot URL → production URL, learned by pairing the links of the same course + field +
 * link text in the customer file (pilot) and on the live page (production).
 */
function linkMap(fileFragments, liveFragments) {
  const live = new Map(liveFragments.filter((f) => f.code).map((f) => [f.code, f]));
  const map = new Map();
  fileFragments.forEach((f) => {
    ['description', 'conditionalDescription'].forEach((k) => {
      const prod = [...((live.get(f.code) || {})[k] || '').matchAll(LINK)];
      [...(f[k] || '').matchAll(LINK)].forEach(([, href, text]) => {
        const hit = prod.find(([, , t]) => linkText(t) === linkText(text));
        if (hit && !map.has(href)) map.set(href, hit[1]);
      });
    });
  });
  return map;
}

/** The fragments with every mapped link swapped; unmapped links are listed in `missing`. */
function withProductionLinks(fragments, map) {
  const missing = [];
  const swap = (html, code) => (html || '').replace(LINK, (m, href, text) => {
    if (map.has(href)) return m.replace(href, map.get(href));
    missing.push(`${code} "${linkText(text)}"`);
    return m;
  });
  return {
    fragments: fragments.map((f) => ({
      ...f, description: swap(f.description, f.code), conditionalDescription: swap(f.conditionalDescription, f.code),
    })),
    missing,
  };
}

const sheet = (data) => ({
  total: data.length, offset: 0, limit: data.length, columns: Object.keys(data[0] || {}), data,
});

function write(out, workbook) {
  if (dryRun) return;
  const file = join(ROOT, out);
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, `${JSON.stringify(workbook, null, 2)}\n`);
  // eslint-disable-next-line no-console
  console.log(`  → ${out}`);
}

async function main() {
  const api = await fetch(LMS_API).then((r) => r.json());
  const names = new Map((api.courses || []).map((c) => [c.code, c.name]));
  const fragmentsArg = process.argv.indexOf('--fragments');
  const fileFragments = fragmentsArg > 0 ? JSON.parse(readFileSync(process.argv[fragmentsArg + 1], 'utf8')) : null;

  // eslint-disable-next-line no-restricted-syntax
  for (const { page, out } of LOCALES) {
    // eslint-disable-next-line no-await-in-loop
    const html = await fetch(`${SOURCE}${page}`, { headers: { 'user-agent': UA } }).then((r) => r.text());
    const props = readProps(html);
    const book = (rows) => ({
      ':names': ['courses', 'filters', 'settings'],
      ':version': 3,
      ':type': 'multi-sheet',
      courses: sheet(rows),
      filters: sheet(filterRows(props.filters || [])),
      settings: sheet(settingRows(props)),
    });
    if (fileFragments && page.startsWith('/en/')) {
      // the customer's Content Fragment export → DEV (as is) + PROD (production links)
      const dev = courseRows(fileFragments, names);
      const prodFragments = withProductionLinks(fileFragments, linkMap(fileFragments, props.fragments || []));
      const prod = courseRows(prodFragments.fragments, names);
      // eslint-disable-next-line no-console
      console.log(`${page} + ${process.argv[fragmentsArg + 1].split('/').pop()}: ${dev.rows.length} course rows `
        + `(skipped ${dev.skipped.length} without code); not in the public API: `
        + `${dev.rows.filter((r) => !names.has(r.code)).map((r) => r.code).join(', ') || 'none'}`);
      // eslint-disable-next-line no-console
      console.log(`  PROD links with no known production counterpart (kept as pilot): ${prodFragments.missing.join(', ') || 'none'}`);
      write(out.replace(/\.json$/, '-dev.json'), book(dev.rows));
      write(out, book(prod.rows));
      // eslint-disable-next-line no-continue
      continue;
    }
    const { rows, skipped } = courseRows(props.fragments || [], names);
    const workbook = {
      ':names': ['courses', 'filters', 'settings'],
      ':version': 3,
      ':type': 'multi-sheet',
      courses: sheet(rows),
      filters: sheet(filterRows(props.filters || [])),
      settings: sheet(settingRows(props)),
    };
    const notInApi = rows.filter((r) => !names.has(r.code)).map((r) => r.code);
    // eslint-disable-next-line no-console
    console.log(`${page}: ${rows.length} course rows, ${workbook.filters.total} filter rows, `
      + `${workbook.settings.total} settings; skipped ${skipped.length} without code`
      + `${skipped.length ? ` (${skipped.join(' | ')})` : ''}; not in the public API: ${notInApi.join(', ') || 'none'}`);
    write(out, workbook);
  }
}

main().catch((e) => {
  // eslint-disable-next-line no-console
  console.error(e);
  process.exit(1);
});
