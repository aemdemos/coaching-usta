/*
 * Merges the USTA LMS API dataset (tags, modules, language, sort) with the
 * AEM-authored descriptions/badges captured from the live source DOM, and
 * emits the single baked dataset the course-filter block consumes:
 *   blocks/course-filter/courses.json
 *
 * Re-run after refreshing courses-api.json / courses-descriptions.json:
 *   node tools/importer/course-filter/build-courses-json.mjs
 *
 * NOTE: the two "…Workshop" cards (Intro to Coaching Workshop, Cardio Tennis
 * Workshop) render on the source but are NOT top-level API courses — they are
 * appended here from the DOM capture so the baked list matches the page 1:1.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const api = JSON.parse(readFileSync(join(here, 'courses-api.json'), 'utf8'));
const authored = JSON.parse(readFileSync(join(here, 'courses-descriptions.json'), 'utf8'));

const clean = (arr) => (arr || []).filter((v) => v !== null && v !== undefined);

// Source badges are heavy illustrative SVGs (up to 93KB). Per the Asset-Size
// Rule they were rasterized to 2x PNGs. The PNGs live in the CONTENT/DAM at
// content/assets/media/blocks/course-filter/ (published to DA), NOT in the code
// repo — so we reference them by their root-relative content path, which
// resolves on every host (local, preview, production).
const BADGE_BASE = '/assets/media/blocks/course-filter';
const localBadge = (src) => (src ? `${BADGE_BASE}/${src.split('/').pop().replace(/\.svg$/i, '.png')}` : '');

const merged = api.courses.map((c) => {
  const meta = authored[c.name] || {};
  return {
    name: c.name,
    code: c.code,
    language: c.language,
    safePlay: c.isSafePlayRequired,
    sort: c.sortSequence,
    badgeName: c.badgeName,
    coachTypes: clean(c.filters?.coachTypes),
    certifications: clean(c.filters?.certifications),
    membershipPackages: clean(c.filters?.membershipPackages),
    moduleCount: (c.modules || []).length,
    modules: (c.modules || []).map((m) => m.name).filter(Boolean),
    description: meta.desc || '',
    unlock: meta.unlock || '',
    unlockLink: meta.unlockLink || null,
    spanishLink: !!meta.spanishLink,
    spanishHref: meta.spanishHref || '',
    badge: localBadge(meta.badge),
  };
});

// Two workshop-only cards observed in the source DOM (not in the API).
const coachAll = ['COLLEGE_COACH', 'FT_PROF_COACH', 'PT_PROF_COACH', 'VOLUNTEER_OR_EMERGING_COACH'];
const workshopCards = [
  {
    name: 'Intro to Coaching Workshop',
    code: 'INC-W1010',
    language: 'English',
    safePlay: false,
    sort: 7,
    badgeName: null,
    coachTypes: [...coachAll, 'PARENT_GUARDIAN_COACH', 'SCHOOL_COACH'],
    certifications: [],
    membershipPackages: ['BASELINE', 'RALLY', 'PRO', 'PRO_PLUS'],
    moduleCount: 0,
    modules: [],
    description: authored['Intro to Coaching Workshop']?.desc || '',
    unlock: '',
    unlockLink: null,
    spanishLink: false,
    badge: '',
  },
  {
    name: 'Cardio Tennis Workshop',
    code: 'CAR-W1010C',
    language: 'English',
    safePlay: true,
    sort: 31.5,
    badgeName: null,
    coachTypes: coachAll,
    certifications: ['USTA Professional Coach Certification'],
    membershipPackages: ['RALLY', 'PRO', 'PRO_PLUS'],
    moduleCount: 0,
    modules: [],
    description: authored['Cardio Tennis Workshop']?.desc || '',
    unlock: authored['Cardio Tennis Workshop']?.unlock || '',
    unlockLink: null,
    spanishLink: false,
    badge: '',
  },
];

const all = [...merged, ...workshopCards].sort((a, b) => a.sort - b.sort);

// Warn on any course still missing an authored description.
const missing = all.filter((c) => !c.description).map((c) => c.name);
if (missing.length) {
  // eslint-disable-next-line no-console
  console.warn(`WARN: ${missing.length} courses missing description:`, missing);
}

const out = join(here, '..', '..', '..', 'blocks', 'course-filter', 'courses.json');
writeFileSync(out, `${JSON.stringify(all, null, 2)}\n`);
// eslint-disable-next-line no-console
console.log(`Wrote ${all.length} courses → ${out}`);
