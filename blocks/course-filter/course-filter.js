/*
 * course-filter — the USTA "Courses and Workshops" browser.
 *
 * Recreated from the source's bespoke Vue component (.v-course-list). Same data
 * model as the source, matched by course `code`:
 *   1. LMS API  — titles, module lists, filter tags, sort order (live, public).
 *   2. Course catalog sheet (DA, one per locale) — the export of the AEM
 *      "Coaching Course" Content Fragments + the component config. Sheets:
 *        courses  — description, logoPath (badge), hideModules, access flags,
 *                   constraint / prerequisite fields, conditionalDescription
 *        filters  — filter groups and options; addToTopFilters rows are the
 *                   persona tabs, appliedByDefault rows are pre-selected
 *        settings — items-to-display, show-more-button-title, empty-message, …
 *      Regenerate from the source with
 *      tools/importer/course-filter/export-course-catalog.mjs.
 * Only courses the API returns are shown (as on the source); a course without a
 * sheet row renders structure-only.
 *
 * UI: persona tabs, a Filter By dropdown (checkbox groups → removable chips), a
 * Sort dropdown (Default / A–Z / Z–A), a responsive card grid where each card
 * expands to a module timeline, and a "See More" pager.
 */
import { localePrefix } from '../../scripts/scripts.js';

// Live LMS API — the endpoint the source calls for signed-out visitors.
// CORS-open; returns { courses: [...] }.
const LMS_API = 'https://services.ustacoaching.com/v1/lms/courses/all';

// Locale catalog (authored data, kept in the locale folders — not under /blocks/,
// which is code): /en/course-catalog.json and /es/course-catalog.json. English
// pages without a locale prefix (e.g. the homepage) read the /en sheet.
const CATALOG_NAME = 'course-catalog.json';
const catalogUrl = () => `${localePrefix() || '/en'}/${CATALOG_NAME}`;

const DEFAULT_SETTINGS = {
  'items-to-display': '16',
  'show-more-button-title': 'See More',
  'empty-message': 'No courses were found',
};

const CHEVRON = '<svg viewBox="0 0 18 12" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false"><path fill-rule="evenodd" clip-rule="evenodd" d="M8.98542 4.74346L2.62146 11.1074L0.500141 8.9861L8.98542 0.500819L17.4707 8.9861L15.3494 11.1074L8.98542 4.74346Z" fill="currentColor"/></svg>';

// module-count label words by the course's language (LMS API `language`); the
// source labels Spanish courses "N módulos"
const MODULE_WORDS = { English: ['module', 'modules'], Spanish: ['módulo', 'módulos'] };

/** Module label: "N modules" / "1 module" (Spanish courses: "N módulos"). */
function moduleLabel(n, language) {
  const [one, many] = MODULE_WORDS[language] || MODULE_WORDS.English;
  return `${n} ${n === 1 ? one : many}`;
}

const isTrue = (v) => v === true || String(v).trim().toLowerCase() === 'true';
const list = (v) => String(v || '').split(',').map((s) => s.trim()).filter(Boolean);

/** Values of a course at a sheet `filtersDataPath` (e.g. "filters.coachTypes", "language"). */
function valuesAt(course, path) {
  const v = String(path || '').split('.').reduce((o, k) => (o == null ? o : o[k]), course.api);
  if (Array.isArray(v)) return v.filter((x) => x !== null && x !== undefined).map(String);
  return v === null || v === undefined ? [] : [String(v)];
}

/**
 * Filter groups from the sheet's `filters` rows, in authored order. An option
 * matches a course when ANY of its comma-separated values is among the course's
 * values at the group's data path. Options no course carries are disabled
 * (the source's "Coming Soon" certifications).
 */
function buildFilterGroups(rows, courses) {
  const groups = [];
  rows.forEach((r) => {
    if (!r.sectionTitle || !r.filterValue) return;
    let group = groups.find((g) => g.legend === r.sectionTitle);
    if (!group) {
      group = { legend: r.sectionTitle, path: r.filtersDataPath, options: [] };
      groups.push(group);
    }
    group.options.push({
      label: r.filterTitle || r.filterValue,
      value: r.filterValue,
      values: list(r.filterValue),
      top: isTrue(r.addToTopFilters),
      byDefault: isTrue(r.appliedByDefault),
      topTitle: r.topFilterTitle || r.filterTitle,
      topDescription: r.topFilterDescription || '',
    });
  });
  groups.forEach((group) => {
    group.match = (course, value) => {
      const opt = group.options.find((o) => o.value === value);
      const have = valuesAt(course, group.path);
      return !!opt && opt.values.some((v) => have.includes(v));
    };
    group.options.forEach((opt) => {
      opt.disabled = !courses.some((c) => group.match(c, opt.value));
    });
  });
  return groups;
}

/** Joins an LMS-API course with its catalog row (matched by `code`). */
function toCourse(api, row = {}) {
  const hideModules = isTrue(row.hideModules);
  const modules = hideModules ? [] : (api.modules || []).map((m) => m.name).filter(Boolean);
  return {
    api,
    code: api.code,
    name: api.name,
    language: api.language,
    sort: api.sortSequence,
    moduleCount: modules.length,
    modules,
    description: row.description || '',
    conditionalDescription: row.conditionalDescription || '',
    badge: row.logoPath || '',
    // Authored access rules, kept for the signed-in states (Start / Continue /
    // Locked / Review), which need the user-status API.
    rules: {
      isAdvancedMembershipRequired: isTrue(row.isAdvancedMembershipRequired),
      ignoreSafePlayForMinors: isTrue(row.ignoreSafePlayForMinors),
      constraint: row.constraint || '',
      requiredCourseCodes: list(row.requiredCourseCode),
      logicalOperator: row.logicalOperator || '',
      courseNameForLocker: row.courseNameForLocker || '',
    },
  };
}

/** Rows of one sheet from a multi-sheet (or single-sheet) EDS JSON. */
const sheetRows = (json, name) => {
  if (Array.isArray(json?.[name]?.data)) return json[name].data;
  if (name === 'courses' && Array.isArray(json?.data)) return json.data;
  return [];
};

/**
 * Loads the API and the locale catalog in parallel. The catalog failing is not
 * fatal (cards render structure-only, no tabs/filters); the API failing leaves
 * nothing to show.
 */
async function loadData() {
  const [apiJson, catalog] = await Promise.all([
    fetch(LMS_API).then((r) => (r.ok ? r.json() : null)).catch(() => null),
    fetch(catalogUrl()).then((r) => (r.ok ? r.json() : null)).catch(() => null),
  ]);
  const settings = { ...DEFAULT_SETTINGS };
  sheetRows(catalog, 'settings').forEach((r) => { if (r.key && r.value !== '') settings[r.key] = r.value; });

  // Source (getMergedCourses): only API courses that HAVE a fragment row are
  // shown — removing a row hides the course. Order = the API's sortSequence when
  // use-response-order is true, else the row order. Without a catalog at all,
  // fall back to every API course, structure-only, in API order.
  const rows = sheetRows(catalog, 'courses').filter((r) => r.code);
  const rowIndex = new Map(rows.map((r, i) => [r.code, i]));
  const byResponse = !catalog || isTrue(settings['use-response-order']);
  const courses = (Array.isArray(apiJson?.courses) ? apiJson.courses : [])
    .filter((c) => c && c.code && c.name && (!catalog || rowIndex.has(c.code)))
    .map((c, i) => {
      const course = toCourse(c, rows[rowIndex.get(c.code)]);
      course.sort = byResponse ? (c.sortSequence ?? i) : rowIndex.get(c.code);
      return course;
    })
    .sort((a, b) => a.sort - b.sort);
  const pageSize = Number.parseInt(settings['items-to-display'], 10);
  return {
    courses,
    groups: buildFilterGroups(sheetRows(catalog, 'filters'), courses),
    labels: { seeMore: settings['show-more-button-title'], empty: settings['empty-message'] },
    pageSize: pageSize > 0 ? pageSize : 16,
  };
}

/** Persona tabs = the options flagged addToTopFilters, with their group. */
const topFilters = (groups) => groups.flatMap((g) => g.options
  .filter((o) => o.top).map((o) => ({ legend: g.legend, option: o })));

/**
 * State for one block instance. The persona tab is NOT separate from the
 * filters (source behaviour): a tab is one option of its filter group, so the
 * tab, the panel checkbox and the removable chip all reflect the same set.
 * Options marked appliedByDefault (Coaches) start selected.
 */
function createState(groups, pageSize) {
  const filters = {}; // legend -> Set(values)
  groups.forEach((g) => g.options.filter((o) => o.byDefault).forEach((o) => {
    filters[g.legend] = filters[g.legend] || new Set();
    filters[g.legend].add(o.value);
  }));
  return {
    filters, sort: 'Default', pageSize, visible: pageSize,
  };
}

/** Returns the courses passing the filter selection, sorted. */
function selectCourses(courses, groups, state) {
  let selected = courses.slice();

  groups.forEach((group) => {
    const chosen = state.filters[group.legend];
    if (chosen && chosen.size) {
      selected = selected.filter((c) => [...chosen].some((v) => group.match(c, v)));
    }
  });

  if (state.sort === 'A to Z') selected.sort((a, b) => a.name.localeCompare(b.name));
  else if (state.sort === 'Z to A') selected.sort((a, b) => b.name.localeCompare(a.name));
  else selected.sort((a, b) => a.sort - b.sort);

  return selected;
}

// Authored description HTML is rebuilt node by node from an allow-list (no
// innerHTML): text, paragraphs, line breaks, inline emphasis and links.
const ALLOWED_TAGS = new Set(['P', 'BR', 'A', 'U', 'STRONG', 'B', 'EM', 'I', 'SPAN', 'UL', 'OL', 'LI']);
const DROPPED_TAGS = new Set(['SCRIPT', 'STYLE', 'IFRAME', 'OBJECT', 'EMBED', 'TEMPLATE', 'NOSCRIPT', 'SVG', 'MATH']);

function safeHref(href) {
  try {
    const url = new URL(href, window.location.href);
    return ['http:', 'https:', 'mailto:'].includes(url.protocol) ? url.href : '';
  } catch (e) {
    return '';
  }
}

function copySafe(from, to) {
  from.childNodes.forEach((node) => {
    if (node.nodeType === Node.TEXT_NODE) {
      to.append(document.createTextNode(node.textContent));
      return;
    }
    if (node.nodeType !== Node.ELEMENT_NODE || DROPPED_TAGS.has(node.tagName)) return;
    if (!ALLOWED_TAGS.has(node.tagName)) {
      copySafe(node, to); // unknown wrapper: keep its content
      return;
    }
    const el = document.createElement(node.tagName.toLowerCase());
    if (node.tagName === 'A') {
      const href = safeHref(node.getAttribute('href') || '');
      if (!href) {
        copySafe(node, to);
        return;
      }
      el.href = href;
      if (node.getAttribute('target') === '_blank') {
        el.target = '_blank';
        el.rel = 'noopener';
      }
    }
    copySafe(node, el);
    to.append(el);
  });
}

/** Appends authored HTML (sheet cell) to `parent`, sanitized. Plain text becomes one <p>. */
function appendAuthoredHtml(parent, html) {
  if (!html) return;
  const doc = new DOMParser().parseFromString(html, 'text/html');
  const holder = document.createElement('div');
  copySafe(doc.body, holder);
  if (![...holder.children].some((c) => c.tagName === 'P' || c.tagName === 'UL' || c.tagName === 'OL')) {
    const p = document.createElement('p');
    p.append(...holder.childNodes);
    parent.append(p);
    return;
  }
  parent.append(...holder.childNodes);
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
  if (!window.matchMedia('(width >= 768px)').matches) {
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
  eyebrow.textContent = moduleLabel(course.moduleCount, course.language);

  const name = document.createElement('span');
  name.className = 'course-filter-card-name';
  name.setAttribute('role', 'heading');
  name.setAttribute('aria-level', '3');
  name.textContent = course.name;

  // The source renders the description in TWO positions, one shown per viewport:
  //  • Desktop (>=768): INLINE inside the info column, beside the badge.
  //  • Mobile (<768): FULL-WIDTH below the badge/title/expand row.
  // Only one is visible at a time (CSS), so build a fresh copy for each place.
  // Content = the fragment's description, then its conditional description (the
  // "To unlock this course…" note, which the source shows to signed-out visitors).
  const buildDescription = () => {
    const desc = document.createElement('div');
    desc.className = 'course-filter-card-description';
    appendAuthoredHtml(desc, course.description);
    appendAuthoredHtml(desc, course.conditionalDescription);
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
    // Badge = the sheet's logoPath, a root-relative content asset
    // (/assets/media/course-catalog/badges/…)
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
function renderCourses(grid, seeMoreWrap, data, state) {
  const selected = selectCourses(data.courses, data.groups, state);
  const shown = selected.slice(0, state.visible);
  const cards = shown.map((c) => buildCard(c));
  grid.replaceChildren(...cards);
  if (!selected.length) {
    const empty = document.createElement('p');
    empty.className = 'course-filter-empty';
    empty.textContent = data.labels.empty;
    grid.append(empty);
  }

  seeMoreWrap.hidden = selected.length <= state.visible;
  // Clamp descriptions after layout (needs measured heights).
  requestAnimationFrame(() => cards.forEach(clampDescription));
}

/** Chip row — one removable chip per ticked filter option (Coach type included). */
function renderChips(chipsWrap, groups, state, onRemove) {
  chipsWrap.replaceChildren();
  const chips = [];

  groups.forEach((group) => {
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
  let data;
  try {
    data = await loadData();
  } catch (e) {
    // Data assembly failed entirely — render nothing rather than error.
    block.textContent = '';
    return;
  }

  block.textContent = '';
  const { groups } = data;
  const state = createState(groups, data.pageSize);
  const tabs = topFilters(groups);
  // A tab is active when its group's selection is exactly that one option.
  const isActiveTab = ({ legend, option }) => {
    const chosen = state.filters[legend];
    return !!chosen && chosen.size === 1 && chosen.has(option.value);
  };

  // ---- Tabs ----
  const tabsWrap = document.createElement('div');
  tabsWrap.className = 'course-filter-tabs';
  const tabsRow = document.createElement('div');
  tabsRow.className = 'course-filter-tabs-row';
  tabsRow.setAttribute('role', 'tablist');

  const tabButtons = tabs.map((t) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'course-filter-tab';
    b.setAttribute('role', 'tab');
    const active = isActiveTab(t);
    b.setAttribute('aria-selected', String(active));
    const title = document.createElement('span');
    title.className = 'course-filter-tab-title';
    title.textContent = t.option.topTitle;
    const desc = document.createElement('span');
    desc.className = 'course-filter-tab-description';
    desc.textContent = t.option.topDescription;
    b.append(title, desc);
    if (active) b.classList.add('is-active');
    tabsRow.append(b);
    return { tab: t, el: b };
  });
  tabsWrap.append(tabsRow);
  tabsWrap.hidden = !tabs.length; // no catalog filter rows → no persona tabs

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
  filterBtn.hidden = !groups.length;
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
  groups.forEach((group) => {
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
  seeMore.textContent = data.labels.seeMore;
  seeMoreWrap.append(seeMore);
  coursesWrap.append(grid, seeMoreWrap);

  block.append(tabsWrap, bar, filterPanel, sortPanel, coursesWrap);

  // ---- Wiring ----
  // Keep the tab pills in sync with the Coach-type selection (they are the same
  // state): a tab is active only when Coach type == exactly that one value.
  const syncTabs = () => {
    tabButtons.forEach(({ tab, el }) => {
      const active = isActiveTab(tab);
      el.classList.toggle('is-active', active);
      el.setAttribute('aria-selected', String(active));
    });
  };

  const rerender = () => {
    renderChips(chipsWrap, groups, state, (legend, value) => {
      state.filters[legend]?.delete(value);
      const input = groupsWrap.querySelector(`input[data-legend="${legend}"][data-value="${value}"]`);
      if (input) input.checked = false;
      state.visible = state.pageSize;
      rerender();
    });
    syncTabs();
    renderCourses(grid, seeMoreWrap, data, state);
  };

  // Selecting a persona tab sets Coach type to exactly that value (replacing any
  // prior coach-type selection) and mirrors it into the panel checkboxes.
  tabButtons.forEach(({ tab, el }) => {
    el.addEventListener('click', () => {
      state.filters[tab.legend] = new Set([tab.option.value]);
      groupsWrap.querySelectorAll('input[data-legend]').forEach((input) => {
        if (input.dataset.legend !== tab.legend) return;
        input.checked = input.dataset.value === tab.option.value;
      });
      state.visible = state.pageSize;
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
    state.visible = state.pageSize;
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
    state.visible = state.pageSize;
    closePanels();
    rerender();
  });

  seeMore.addEventListener('click', () => {
    state.visible += state.pageSize;
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
