/*
 * course-filter — the USTA "Courses and Workshops" browser.
 *
 * Recreated from the source's bespoke Vue component (.v-course-list) for EDS
 * parity. Data is assembled at runtime from a 3-way merge (see loadCourses):
 *   1. LMS API      — fresh STRUCTURED data (name/code/modules/filters/sort).
 *   2. DA sheet      — author-owned ENRICHMENT (badge/description/unlock/Spanish),
 *                      editable in Document Authoring, keyed by course `code`.
 *   3. WORKSHOP_CARDS — the two workshop-only cards the API doesn't return
 *                      (their irreducible structure; enrichment still comes from
 *                      the sheet).
 *
 * UI: 3 persona tabs (Parents / School Tennis / Coaches), a Filter By dropdown
 * (4 checkbox groups → removable chips), a Sort dropdown (Default / A–Z / Z–A),
 * a responsive card grid where each card expands to a module timeline, and a
 * "See More" pager.
 */

const PAGE_SIZE = 16;

// Live LMS API — the same endpoint the source site calls. CORS-open
// (access-control-allow-origin: *); returns { courses: [...] } with STRUCTURED
// data only (name, code, language, filters, modules, sort). No authored copy.
const LMS_API = 'https://services.ustacoaching.com/v1/lms/courses/all';

// Author-editable enrichment sheet in Document Authoring (edit → preview →
// publish in DA). Root-relative so it resolves on every host. EDS serves a
// published sheet as { columns, data:[…] }; each row is keyed by course `code`
// and carries badge/description/unlock/Spanish. All course-filter content lives
// under one folder so authors know where to look:
//   /blocks/course-filter/course-enrichment.json  ← this sheet
//   /blocks/course-filter/media/*.png             ← the badge images it references
const ENRICHMENT_SHEET = '/blocks/course-filter/course-enrichment.json';

// The two workshop cards the LMS API does NOT return. Only their irreducible
// STRUCTURE lives here (code/name/sort/tags/moduleCount) — NOT authored copy,
// which still comes from the enrichment sheet by `code`. This is the sole bit of
// course data left in code, because it's structural and the API can't supply it.
const COACH_ALL = ['COLLEGE_COACH', 'FT_PROF_COACH', 'PT_PROF_COACH', 'VOLUNTEER_OR_EMERGING_COACH'];
const WORKSHOP_CARDS = [
  {
    code: 'INC-W1010',
    name: 'Intro to Coaching Workshop',
    language: 'English',
    safePlay: false,
    sort: 7,
    badgeName: null,
    coachTypes: [...COACH_ALL, 'PARENT_GUARDIAN_COACH', 'SCHOOL_COACH'],
    certifications: [],
    membershipPackages: ['BASELINE', 'RALLY', 'PRO', 'PRO_PLUS'],
    modules: [],
  },
  {
    code: 'CAR-W1010C',
    name: 'Cardio Tennis Workshop',
    language: 'English',
    safePlay: true,
    sort: 31.5,
    badgeName: null,
    coachTypes: COACH_ALL,
    certifications: ['USTA Professional Coach Certification'],
    membershipPackages: ['RALLY', 'PRO', 'PRO_PLUS'],
    modules: [],
  },
];

// Persona tabs → the coachType values each maps to (from the API taxonomy).
const TABS = [
  {
    key: 'PARENT_GUARDIAN_COACH',
    title: 'Parents',
    description: 'I am teaching my child.',
    chip: 'For Parents',
    coachTypes: ['PARENT_GUARDIAN_COACH'],
  },
  {
    key: 'SCHOOL_COACH',
    title: 'School Tennis',
    description: 'I am a PE teacher or coach a school team.',
    chip: 'For School Coaches',
    coachTypes: ['SCHOOL_COACH'],
  },
  {
    key: 'COACHES',
    title: 'Coaches',
    description: 'I coach a team or individuals.',
    chip: 'For Coaches',
    coachTypes: ['COLLEGE_COACH', 'FT_PROF_COACH', 'PT_PROF_COACH', 'VOLUNTEER_OR_EMERGING_COACH'],
  },
];

// Filter groups. `match(course, value)` decides whether a course carries a value.
const FILTER_GROUPS = [
  {
    legend: 'Coach type',
    options: [
      { label: 'For Parents', value: 'PARENT_GUARDIAN_COACH' },
      { label: 'For School Coaches', value: 'SCHOOL_COACH' },
      { label: 'For Coaches', value: 'COACHES' },
    ],
    match: (course, value) => {
      if (value === 'COACHES') return course.coachTypes.some((c) => TABS[2].coachTypes.includes(c));
      return course.coachTypes.includes(value);
    },
  },
  {
    legend: 'Certification',
    options: [
      { label: 'USTA Coaching Professional', value: 'USTA Professional Coach Certification' },
      { label: 'USTA Coaching Specialist (Coming Soon)', value: '__specialist__', disabled: true },
      { label: 'USTA Coaching Masters (Coming Soon)', value: '__masters__', disabled: true },
    ],
    match: (course, value) => course.certifications.includes(value),
  },
  {
    legend: 'Membership package',
    options: [
      { label: 'Baseline', value: 'BASELINE' },
      { label: 'Rally', value: 'RALLY' },
      { label: 'Pro', value: 'PRO' },
      { label: 'Pro Plus', value: 'PRO_PLUS' },
    ],
    match: (course, value) => course.membershipPackages.includes(value),
  },
  {
    legend: 'Languages',
    options: [
      { label: 'English', value: 'English' },
      { label: 'Spanish', value: 'Spanish' },
    ],
    match: (course, value) => course.language === value,
  },
];

const CHEVRON = '<svg viewBox="0 0 18 12" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false"><path fill-rule="evenodd" clip-rule="evenodd" d="M8.98542 4.74346L2.62146 11.1074L0.500141 8.9861L8.98542 0.500819L17.4707 8.9861L15.3494 11.1074L8.98542 4.74346Z" fill="currentColor"/></svg>';

/** Module label suffix: "N modules" / "1 module" / "0 modules". */
function moduleLabel(n) {
  return `${n} ${n === 1 ? 'module' : 'modules'}`;
}

const clean = (arr) => (arr || []).filter((v) => v !== null && v !== undefined);

/** Normalizes a raw LMS-API course into the block's structural shape. */
function normalizeApiCourse(c) {
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
  };
}

/**
 * Merges a structural course (from the API or WORKSHOP_CARDS) with the
 * author-owned enrichment row from the DA sheet, matched by `code`. If no sheet
 * row exists (e.g. a brand-new API course not yet authored), the card still
 * renders with empty badge/description — it degrades gracefully.
 */
function applyEnrichment(course, enrichmentByCode) {
  const e = enrichmentByCode.get(course.code) || {};
  return {
    ...course,
    moduleCount: course.moduleCount ?? (course.modules || []).length,
    description: e.description || '',
    unlock: e.unlock || '',
    unlockLink: e.unlockLinkText && e.unlockLinkHref
      ? { text: e.unlockLinkText, href: e.unlockLinkHref } : null,
    spanishLink: !!e.spanishHref,
    spanishHref: e.spanishHref || '',
    badge: e.badge || '',
  };
}

/**
 * Loads the author-editable enrichment sheet from DA and returns a Map keyed by
 * course `code`. Returns an empty Map (not an error) if the sheet is unreachable
 * or malformed — cards then render structure-only, never blank the whole block.
 */
async function loadEnrichment() {
  try {
    const res = await fetch(ENRICHMENT_SHEET);
    if (!res.ok) throw new Error(`enrichment sheet ${res.status}`);
    const json = await res.json();
    const rows = Array.isArray(json?.data) ? json.data : [];
    return new Map(rows.filter((r) => r.code).map((r) => [r.code, r]));
  } catch (e) {
    return new Map();
  }
}

/**
 * Assembles the course list at runtime from three sources:
 *   • LMS API      — fresh structured data (always current).
 *   • DA sheet      — author-owned enrichment (badge/description/unlock/Spanish).
 *   • WORKSHOP_CARDS — the two workshop cards the API omits.
 * The API + sheet are fetched in parallel; each course is enriched by `code`.
 * If the API fails, we still render the workshop cards (enriched from the sheet)
 * rather than nothing.
 */
async function loadCourses() {
  const [apiResult, enrichmentByCode] = await Promise.all([
    fetch(LMS_API).then((r) => (r.ok ? r.json() : null)).catch(() => null),
    loadEnrichment(),
  ]);

  const apiCourses = Array.isArray(apiResult?.courses) ? apiResult.courses : [];
  const structural = apiCourses.map(normalizeApiCourse);

  // Append workshop cards the API doesn't return (dedupe by code, just in case).
  const apiCodes = new Set(structural.map((c) => c.code));
  const workshops = WORKSHOP_CARDS.filter((w) => !apiCodes.has(w.code));

  return [...structural, ...workshops]
    .map((c) => applyEnrichment(c, enrichmentByCode))
    .sort((a, b) => a.sort - b.sort);
}

/**
 * State for one block instance. The persona is NOT separate from the filters —
 * the "Coach type" filter group IS the persona (source behaviour): the tab, the
 * panel checkbox, and the removable chip all reflect `filters['Coach type']`.
 * Defaults to {COACHES} so the Coaches tab is active, "For Coaches" is checked,
 * and a removable "For Coaches" chip shows on load. Other groups intersect
 * across groups and union within a group.
 */
function createState() {
  return {
    filters: { 'Coach type': new Set(['COACHES']) }, // legend -> Set(values)
    sort: 'Default',
    visible: PAGE_SIZE,
  };
}

/** The tab key whose single value the Coach-type selection currently equals (or null). */
function activeTabKey(state) {
  const chosen = state.filters['Coach type'];
  if (chosen && chosen.size === 1) return [...chosen][0];
  return null;
}

/** Returns the courses passing the filter selection, sorted. */
function selectCourses(courses, state) {
  let list = courses.slice();

  FILTER_GROUPS.forEach((group) => {
    const chosen = state.filters[group.legend];
    if (chosen && chosen.size) {
      list = list.filter((c) => [...chosen].some((v) => group.match(c, v)));
    }
  });

  if (state.sort === 'A to Z') list = [...list].sort((a, b) => a.name.localeCompare(b.name));
  else if (state.sort === 'Z to A') list = [...list].sort((a, b) => b.name.localeCompare(a.name));
  else list = [...list].sort((a, b) => a.sort - b.sort);

  return list;
}

/**
 * Source-parity clamp: the card description is capped (CSS max-height via
 * .is-clamped); when the text overflows that cap, a bottom-right "..." indicator
 * is shown (matching the source's .clamp + description-ellipsis). The clamp
 * persists whether the card is collapsed OR expanded — expanding only reveals
 * the module timeline, it does NOT release the description. Runs after layout
 * since it measures overflow.
 */
function clampDescription(card) {
  // Only the INLINE (desktop) copy is clamped; the mobile full-width copy is
  // expand-only and never clamped.
  const desc = card.querySelector('.course-filter-card-description-inline');
  if (!desc) return;
  desc.querySelector('.course-filter-card-description-ellipsis')?.remove();
  // Source only clamps at tablet+ (>=768). Below that the inline copy is hidden.
  if (window.matchMedia('(width < 768px)').matches) {
    desc.classList.remove('is-clamped');
    return;
  }
  desc.classList.add('is-clamped');
  if (desc.scrollHeight - desc.clientHeight > 1) {
    const ell = document.createElement('span');
    ell.className = 'course-filter-card-description-ellipsis';
    ell.setAttribute('aria-hidden', 'true');
    ell.textContent = '...';
    desc.append(ell);
  } else {
    desc.classList.remove('is-clamped');
  }
}

/** Builds one course card (collapsed; expands to its module timeline). */
function buildCard(course) {
  const card = document.createElement('article');
  card.className = 'course-filter-card';

  const content = document.createElement('div');
  content.className = 'course-filter-card-content';

  const info = document.createElement('div');
  info.className = 'course-filter-card-info';

  // The source renders the eyebrow and course name as non-heading elements
  // (generic div/span, not h3/p). We mirror that: it matches the source markup,
  // keeps the block's title sizes off the global h1..h6/body type scale, and
  // avoids a skipped heading level under the page's single <h1>.
  const eyebrow = document.createElement('span');
  eyebrow.className = 'course-filter-card-eyebrow';
  eyebrow.textContent = moduleLabel(course.moduleCount);

  const name = document.createElement('span');
  name.className = 'course-filter-card-name';
  name.setAttribute('role', 'heading');
  name.setAttribute('aria-level', '3');
  name.textContent = course.name;

  // Appends an underlined external link (opens in a new tab) to a container.
  const appendLink = (parent, text, href) => {
    const a = document.createElement('a');
    a.textContent = text;
    a.href = href;
    a.target = '_blank';
    a.rel = 'noopener';
    parent.append(a);
  };

  // The source renders the description in TWO positions, one shown per viewport:
  //  • Desktop (>=768): INLINE inside the info column, beside the badge.
  //  • Mobile (<768): FULL-WIDTH below the badge/title/expand row.
  // Only one is visible at a time (CSS), so build a fresh copy for each place.
  const buildDescription = () => {
    const desc = document.createElement('div');
    desc.className = 'course-filter-card-description';

    const p = document.createElement('p');
    // Source ends the copy with "Also available in Spanish." where "Spanish." is
    // a link. Render the text up to that word, then the linked "Spanish."
    if (course.spanishLink && course.spanishHref && / Spanish\.?$/.test(course.description)) {
      const lead = course.description.replace(/Spanish\.?$/, '');
      p.textContent = lead;
      appendLink(p, 'Spanish.', course.spanishHref);
    } else {
      p.textContent = course.description;
    }
    desc.append(p);

    if (course.unlock) {
      const u = document.createElement('p');
      u.className = 'course-filter-card-unlock';
      // Some unlock lines contain an inline link (e.g. the Development Coach Badge).
      if (course.unlockLink && course.unlock.includes(course.unlockLink.text)) {
        const [before, after] = course.unlock.split(course.unlockLink.text);
        u.append(document.createTextNode(before));
        appendLink(u, course.unlockLink.text, course.unlockLink.href);
        u.append(document.createTextNode(after));
      } else {
        u.textContent = course.unlock;
      }
      desc.append(u);
    }
    return desc;
  };

  // Inline (desktop) copy inside the info column.
  const desc = buildDescription();
  desc.classList.add('course-filter-card-description-inline');

  info.append(eyebrow, name, desc);

  // Content row (source): [badge | info | expand], vertically centered. The
  // badge is the FIRST child, to the LEFT of the text — NOT a stacked block
  // below (which would inflate the card height).
  if (course.badge) {
    const badgeWrap = document.createElement('div');
    badgeWrap.className = 'course-filter-card-badge';
    const img = document.createElement('img');
    // Badge is a root-relative content asset (/assets/media/blocks/course-filter/…)
    // published to DA, so it resolves on every host without a domain or basePath.
    img.src = course.badge;
    img.alt = `${course.name} badge`;
    img.loading = 'lazy';
    img.width = 148;
    img.height = 148;
    badgeWrap.append(img);
    content.append(badgeWrap);
  }

  content.append(info);

  // Every card gets an expand toggle. On mobile it reveals the description (which
  // is collapsed to title-only) + any module timeline; on desktop the description
  // is always shown and the toggle only reveals the timeline. Cards WITHOUT
  // modules are "standalone": their toggle is hidden on desktop (source), where
  // the description already shows inline, but stays on mobile to reveal the copy.
  const hasModules = course.modules && course.modules.length > 0;
  if (!hasModules) card.classList.add('course-filter-card-standalone');

  const toggle = document.createElement('button');
  toggle.type = 'button';
  toggle.className = 'course-filter-card-expand';
  toggle.setAttribute('aria-expanded', 'false');
  toggle.setAttribute('aria-label', `Expand course details for ${course.name}`);
  toggle.innerHTML = CHEVRON;
  content.append(toggle);

  card.append(content);

  // Full-width (mobile) description copy — sits BELOW the content row, spanning
  // the whole card. Hidden at tablet+ (the inline copy shows there instead).
  const descMobile = buildDescription();
  descMobile.classList.add('course-filter-card-description-mobile');
  card.append(descMobile);

  let modules = null;
  if (hasModules) {
    modules = document.createElement('ul');
    modules.className = 'course-filter-card-modules';
    modules.hidden = true;
    course.modules.forEach((m) => {
      const li = document.createElement('li');
      li.className = 'course-filter-card-module';
      const circle = document.createElement('span');
      circle.className = 'course-filter-card-timeline-circle';
      circle.setAttribute('aria-hidden', 'true');
      const text = document.createElement('span');
      text.className = 'course-filter-card-module-text';
      text.textContent = m;
      li.append(circle, text);
      modules.append(li);
    });
    // Timeline sits at the bottom of the card — after the mobile description
    // (source order on mobile: title row → description → module timeline).
    card.append(modules);
  }

  toggle.addEventListener('click', () => {
    const open = toggle.getAttribute('aria-expanded') === 'true';
    toggle.setAttribute('aria-expanded', String(!open));
    toggle.setAttribute('aria-label', `${open ? 'Expand' : 'Collapse'} course details for ${course.name}`);
    if (modules) modules.hidden = open;
    // Toggling .is-expanded reveals the mobile description + timeline (CSS). On
    // desktop the description is already visible; only the timeline reacts.
    card.classList.toggle('is-expanded', !open);
  });

  return card;
}

/** Renders the cards grid + See More for the current state. */
function renderCourses(grid, seeMoreWrap, courses, state) {
  const selected = selectCourses(courses, state);
  const shown = selected.slice(0, state.visible);
  const cards = shown.map((c) => buildCard(c));
  grid.replaceChildren(...cards);

  seeMoreWrap.hidden = selected.length <= state.visible;
  // Clamp descriptions after layout (needs measured heights).
  requestAnimationFrame(() => cards.forEach(clampDescription));
}

/** Chip row — one removable chip per ticked filter option (Coach type included). */
function renderChips(chipsWrap, state, onRemove) {
  chipsWrap.replaceChildren();
  const chips = [];

  FILTER_GROUPS.forEach((group) => {
    const chosen = state.filters[group.legend];
    if (chosen) {
      chosen.forEach((value) => {
        const opt = group.options.find((o) => o.value === value);
        if (opt) chips.push({ label: opt.label, remove: () => onRemove(group.legend, value) });
      });
    }
  });

  chips.forEach(({ label, remove }) => {
    const chip = document.createElement('button');
    chip.type = 'button';
    chip.className = 'course-filter-chip course-filter-chip-removable';
    chip.textContent = label;
    chip.setAttribute('aria-label', `Remove ${label} filter`);
    chip.addEventListener('click', remove);
    chipsWrap.append(chip);
  });
}

export default async function decorate(block) {
  let courses = [];
  try {
    courses = await loadCourses();
  } catch (e) {
    // Data assembly failed entirely — render nothing rather than error.
    block.textContent = '';
    return;
  }

  block.textContent = '';
  const state = createState();

  // ---- Tabs ----
  const tabsWrap = document.createElement('div');
  tabsWrap.className = 'course-filter-tabs';
  const tabsRow = document.createElement('div');
  tabsRow.className = 'course-filter-tabs-row';
  tabsRow.setAttribute('role', 'tablist');

  const tabButtons = TABS.map((t) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'course-filter-tab';
    b.setAttribute('role', 'tab');
    const active = t.key === activeTabKey(state);
    b.setAttribute('aria-selected', String(active));
    const title = document.createElement('span');
    title.className = 'course-filter-tab-title';
    title.textContent = t.title;
    const desc = document.createElement('span');
    desc.className = 'course-filter-tab-description';
    desc.textContent = t.description;
    b.append(title, desc);
    if (active) b.classList.add('is-active');
    tabsRow.append(b);
    return { tab: t, el: b };
  });
  tabsWrap.append(tabsRow);

  // ---- Filter bar ----
  const bar = document.createElement('div');
  bar.className = 'course-filter-bar';

  // Three flex children in one nowrap row (source): Filter By | chips | Sort by.
  // The chips group takes the flexible middle space and wraps internally, so
  // Filter By stays pinned left and Sort by stays pinned right on every viewport.
  const leftGroup = document.createElement('div');
  leftGroup.className = 'course-filter-bar-left';

  const filterBtn = document.createElement('button');
  filterBtn.type = 'button';
  filterBtn.className = 'course-filter-toggle course-filter-toggle-filter';
  filterBtn.setAttribute('aria-expanded', 'false');
  filterBtn.innerHTML = `Filter By ${CHEVRON}`;
  leftGroup.append(filterBtn);

  const chipsWrap = document.createElement('div');
  chipsWrap.className = 'course-filter-chips';

  const rightGroup = document.createElement('div');
  rightGroup.className = 'course-filter-bar-right';
  const sortBtn = document.createElement('button');
  sortBtn.type = 'button';
  sortBtn.className = 'course-filter-toggle course-filter-toggle-sort';
  sortBtn.setAttribute('aria-expanded', 'false');
  sortBtn.innerHTML = `Sort by: <span class="course-filter-sort-value">Default</span> ${CHEVRON}`;
  rightGroup.append(sortBtn);

  bar.append(leftGroup, chipsWrap, rightGroup);

  // ---- Filter dropdown panel ----
  const filterPanel = document.createElement('div');
  filterPanel.className = 'course-filter-panel course-filter-panel-filters';
  filterPanel.hidden = true;
  const filterHeader = document.createElement('div');
  filterHeader.className = 'course-filter-panel-header';
  filterHeader.innerHTML = '<span class="course-filter-panel-title">Filters</span>';
  const filterClose = document.createElement('button');
  filterClose.type = 'button';
  filterClose.className = 'course-filter-panel-close';
  filterClose.setAttribute('aria-label', 'Close filters');
  filterHeader.append(filterClose);
  filterPanel.append(filterHeader);

  const groupsWrap = document.createElement('div');
  groupsWrap.className = 'course-filter-groups';
  FILTER_GROUPS.forEach((group) => {
    const fs = document.createElement('fieldset');
    fs.className = 'course-filter-group';
    const legend = document.createElement('legend');
    legend.textContent = group.legend;
    fs.append(legend);
    group.options.forEach((opt) => {
      const id = `cf-${group.legend}-${opt.value}`.replace(/[^a-z0-9]+/gi, '-').toLowerCase();
      const label = document.createElement('label');
      label.className = 'course-filter-option';
      label.setAttribute('for', id);
      const span = document.createElement('span');
      span.textContent = opt.label;
      const input = document.createElement('input');
      input.type = 'checkbox';
      input.id = id;
      input.dataset.legend = group.legend;
      input.dataset.value = opt.value;
      // Reflect initial state (e.g. "For Coaches" checked on load).
      if (state.filters[group.legend]?.has(opt.value)) input.checked = true;
      if (opt.disabled) { input.disabled = true; label.classList.add('is-disabled'); }
      label.append(span, input);
      fs.append(label);
    });
    groupsWrap.append(fs);
  });
  filterPanel.append(groupsWrap);

  const applyWrap = document.createElement('div');
  applyWrap.className = 'course-filter-apply-wrapper';
  const applyBtn = document.createElement('button');
  applyBtn.type = 'button';
  applyBtn.className = 'course-filter-apply';
  applyBtn.textContent = 'Apply filters';
  applyWrap.append(applyBtn);
  filterPanel.append(applyWrap);

  // ---- Sort dropdown panel ----
  const sortPanel = document.createElement('div');
  sortPanel.className = 'course-filter-panel course-filter-panel-sort';
  sortPanel.hidden = true;
  const sortHeader = document.createElement('div');
  sortHeader.className = 'course-filter-panel-header';
  sortHeader.innerHTML = '<span class="course-filter-panel-title">Sort</span>';
  const sortClose = document.createElement('button');
  sortClose.type = 'button';
  sortClose.className = 'course-filter-panel-close';
  sortClose.setAttribute('aria-label', 'Close sort');
  sortHeader.append(sortClose);
  sortPanel.append(sortHeader);
  const sortGroup = document.createElement('div');
  sortGroup.className = 'course-filter-sort-options';
  sortGroup.setAttribute('role', 'radiogroup');
  ['Default', 'A to Z', 'Z to A'].forEach((label) => {
    const opt = document.createElement('button');
    opt.type = 'button';
    opt.className = 'course-filter-sort-option';
    opt.setAttribute('role', 'radio');
    opt.setAttribute('aria-checked', String(label === state.sort));
    if (label === state.sort) opt.classList.add('is-selected');
    opt.textContent = label;
    sortGroup.append(opt);
  });
  sortPanel.append(sortGroup);

  // ---- Courses grid + See More ----
  const coursesWrap = document.createElement('div');
  coursesWrap.className = 'course-filter-courses';
  const grid = document.createElement('div');
  grid.className = 'course-filter-grid';
  const seeMoreWrap = document.createElement('div');
  seeMoreWrap.className = 'course-filter-see-more-wrapper';
  const seeMore = document.createElement('button');
  seeMore.type = 'button';
  seeMore.className = 'course-filter-see-more';
  seeMore.textContent = 'See More';
  seeMoreWrap.append(seeMore);
  coursesWrap.append(grid, seeMoreWrap);

  block.append(tabsWrap, bar, filterPanel, sortPanel, coursesWrap);

  // ---- Wiring ----
  // Keep the tab pills in sync with the Coach-type selection (they are the same
  // state): a tab is active only when Coach type == exactly that one value.
  const syncTabs = () => {
    const key = activeTabKey(state);
    tabButtons.forEach(({ tab, el }) => {
      const active = tab.key === key;
      el.classList.toggle('is-active', active);
      el.setAttribute('aria-selected', String(active));
    });
  };

  const rerender = () => {
    renderChips(chipsWrap, state, (legend, value) => {
      state.filters[legend]?.delete(value);
      const input = groupsWrap.querySelector(`input[data-legend="${legend}"][data-value="${value}"]`);
      if (input) input.checked = false;
      state.visible = PAGE_SIZE;
      rerender();
    });
    syncTabs();
    renderCourses(grid, seeMoreWrap, courses, state);
  };

  // Selecting a persona tab sets Coach type to exactly that value (replacing any
  // prior coach-type selection) and mirrors it into the panel checkboxes.
  tabButtons.forEach(({ tab, el }) => {
    el.addEventListener('click', () => {
      state.filters['Coach type'] = new Set([tab.key]);
      groupsWrap.querySelectorAll('input[data-legend="Coach type"]').forEach((input) => {
        input.checked = input.dataset.value === tab.key;
      });
      state.visible = PAGE_SIZE;
      rerender();
    });
  });

  const closePanels = () => {
    filterPanel.hidden = true;
    sortPanel.hidden = true;
    filterBtn.setAttribute('aria-expanded', 'false');
    sortBtn.setAttribute('aria-expanded', 'false');
  };

  filterBtn.addEventListener('click', () => {
    const open = filterPanel.hidden;
    closePanels();
    filterPanel.hidden = !open;
    filterBtn.setAttribute('aria-expanded', String(open));
  });
  sortBtn.addEventListener('click', () => {
    const open = sortPanel.hidden;
    closePanels();
    sortPanel.hidden = !open;
    sortBtn.setAttribute('aria-expanded', String(open));
  });
  filterClose.addEventListener('click', closePanels);
  sortClose.addEventListener('click', closePanels);

  // Checkboxes stage into state on Apply (source commits on "Apply filters").
  groupsWrap.addEventListener('change', (e) => {
    const input = e.target.closest('input[type="checkbox"]');
    if (!input) return;
    const { legend, value } = input.dataset;
    state.filters[legend] = state.filters[legend] || new Set();
    if (input.checked) state.filters[legend].add(value);
    else state.filters[legend].delete(value);
  });
  applyBtn.addEventListener('click', () => {
    state.visible = PAGE_SIZE;
    closePanels();
    rerender();
  });

  sortGroup.addEventListener('click', (e) => {
    const opt = e.target.closest('.course-filter-sort-option');
    if (!opt) return;
    state.sort = opt.textContent;
    [...sortGroup.children].forEach((o) => {
      const sel = o === opt;
      o.classList.toggle('is-selected', sel);
      o.setAttribute('aria-checked', String(sel));
    });
    sortBtn.querySelector('.course-filter-sort-value').textContent = state.sort;
    state.visible = PAGE_SIZE;
    closePanels();
    rerender();
  });

  seeMore.addEventListener('click', () => {
    state.visible += PAGE_SIZE;
    rerender();
  });

  // Close dropdowns on outside click.
  document.addEventListener('click', (e) => {
    const inside = bar.contains(e.target)
      || filterPanel.contains(e.target)
      || sortPanel.contains(e.target);
    if (!inside) closePanels();
  });

  // Re-clamp descriptions on resize (1-up↔2-up changes overflow) — debounced.
  let resizeTimer;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = window.setTimeout(() => {
      grid.querySelectorAll('.course-filter-card').forEach(clampDescription);
    }, 150);
  });

  rerender();
}
