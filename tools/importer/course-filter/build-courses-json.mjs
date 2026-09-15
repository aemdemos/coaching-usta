/*
 * Emits the author-editable ENRICHMENT SHEET the course-filter block consumes at
 * runtime (merged with the live LMS API by course `code`):
 *   content/blocks/course-filter/course-enrichment.json   (EDS sheet: { columns, data:[…] })
 *
 * All course-filter content lives under one folder so authors know where to look:
 *   content/blocks/course-filter/course-enrichment.json   ← the sheet
 *   content/blocks/course-filter/media/*.png              ← the badge images
 *
 * The sheet holds ONLY authored copy — badge path, description, unlock text,
 * Spanish link — keyed by `code`. Structured data (modules/tags/sort) comes live
 * from the LMS API at runtime; it is NOT baked here. Every course the source
 * shows (including the two workshop cards the API omits) gets a row so its
 * enrichment is authorable.
 *
 * This is a SEED/REGENERATOR: after running it, upload the sheet to DA and
 * preview+publish it. From then on, authors edit the sheet in DA directly —
 * re-run this only to rebuild from the captured source DOM.
 *
 *   node tools/importer/course-filter/build-courses-json.mjs
 *   → then publish content/course-enrichment.json to DA (source → preview → live)
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const authored = JSON.parse(readFileSync(join(here, 'courses-descriptions.json'), 'utf8'));

// Source badges are heavy illustrative SVGs (up to 93KB). Per the Asset-Size
// Rule they were rasterized to 2x PNGs living in the CONTENT/DAM alongside the
// sheet at content/blocks/course-filter/media/ (published to DA). Reference them
// by root-relative content path, which resolves on every host.
const BADGE_BASE = '/blocks/course-filter/media';
const localBadge = (src) => (src ? `${BADGE_BASE}/${src.split('/').pop().replace(/\.svg$/i, '.png')}` : '');

// Map the captured source-DOM authoring (keyed by course name) → enrichment rows
// keyed by course `code`. Skip the "_note" meta key and any nameless entries.
const COURSE_CODE = JSON.parse(readFileSync(join(here, 'courses-api.json'), 'utf8'))
  .courses.reduce((m, c) => { m[c.name] = c.code; return m; }, {});
// The two workshop cards are not in the API — map their names to codes here.
COURSE_CODE['Intro to Coaching Workshop'] = 'INC-W1010';
COURSE_CODE['Cardio Tennis Workshop'] = 'CAR-W1010C';

const rows = [];
for (const [name, meta] of Object.entries(authored)) {
  if (name.startsWith('_') || !meta) continue;
  const code = COURSE_CODE[name];
  if (!code) {
    // eslint-disable-next-line no-console
    console.warn(`WARN: no code for authored course "${name}" — skipped`);
    continue;
  }
  const badge = localBadge(meta.badge);
  if (!(meta.desc || meta.unlock || badge)) continue; // nothing to enrich
  rows.push({
    code,
    name,
    badge,
    description: meta.desc || '',
    unlock: meta.unlock || '',
    unlockLinkText: meta.unlockLink?.text || '',
    unlockLinkHref: meta.unlockLink?.href || '',
    spanishHref: meta.spanishHref || '',
  });
}

const sheet = {
  total: rows.length,
  offset: 0,
  limit: rows.length,
  columns: ['code', 'name', 'badge', 'description', 'unlock', 'unlockLinkText', 'unlockLinkHref', 'spanishHref'],
  data: rows,
  ':type': 'sheet',
};

const out = join(here, '..', '..', '..', 'content', 'blocks', 'course-filter', 'course-enrichment.json');
writeFileSync(out, `${JSON.stringify(sheet, null, 2)}\n`);
// eslint-disable-next-line no-console
console.log(`Wrote ${rows.length} enrichment rows → ${out}`);
// eslint-disable-next-line no-console
console.log('Next: upload to DA + preview + publish so the block can fetch /blocks/course-filter/course-enrichment.json');
