/*
 * course-filter — the USTA "Courses and Workshops" browser.
 *
 * Recreated from the source's bespoke Vue component (.v-course-list) for EDS
 * parity. Data is baked into ./courses.json (built from the LMS API merged with
 * the AEM-authored descriptions/badges — see tools/importer/course-filter/).
 *
 * UI: 3 persona tabs (Parents / School Tennis / Coaches), a Filter By dropdown
 * (4 checkbox groups → removable chips), a Sort dropdown (Default / A–Z / Z–A),
 * a responsive card grid where each card expands to a module timeline, and a
 * "See More" pager.
 */

const PAGE_SIZE = 16;

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

/**
 * State for one block instance. `activeTab` gates the list to a persona; the
 * checkbox filters (grouped) intersect across groups and union within a group.
 */
function createState() {
  return {
    activeTab: 'COACHES',
    filters: {}, // legend -> Set(values)
    sort: 'Default',
    visible: PAGE_SIZE,
  };
}

/** Returns the courses passing the tab + filter selection, sorted. */
function selectCourses(courses, state) {
  const tab = TABS.find((t) => t.key === state.activeTab);
  let list = courses.filter((c) => c.coachTypes.some((ct) => tab.coachTypes.includes(ct)));

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

/** Builds one course card (collapsed; expands to its module timeline). */
function buildCard(course, basePath) {
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

  const desc = document.createElement('div');
  desc.className = 'course-filter-card-description';

  // Appends an underlined external link (opens in a new tab) to a container.
  const appendLink = (parent, text, href) => {
    const a = document.createElement('a');
    a.textContent = text;
    a.href = href;
    a.target = '_blank';
    a.rel = 'noopener';
    parent.append(a);
  };

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

  info.append(eyebrow, name, desc);
  content.append(info);

  const hasModules = course.modules && course.modules.length > 0;
  let toggle;
  if (hasModules) {
    toggle = document.createElement('button');
    toggle.type = 'button';
    toggle.className = 'course-filter-card-expand';
    toggle.setAttribute('aria-expanded', 'false');
    toggle.setAttribute('aria-label', `Expand course details for ${course.name}`);
    toggle.innerHTML = CHEVRON;
    content.append(toggle);
  }

  card.append(content);

  // Badge (illustrative PNG) sits below the content, bottom-right.
  if (course.badge) {
    const badgeWrap = document.createElement('div');
    badgeWrap.className = 'course-filter-card-badge';
    const img = document.createElement('img');
    img.src = `${basePath}/${course.badge}`;
    img.alt = `${course.name} badge`;
    img.loading = 'lazy';
    img.width = 148;
    img.height = 148;
    badgeWrap.append(img);
    card.append(badgeWrap);
  }

  if (hasModules) {
    const modules = document.createElement('ul');
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
    // Timeline is inserted right after the content so it reads under the name.
    content.after(modules);

    toggle.addEventListener('click', () => {
      const open = toggle.getAttribute('aria-expanded') === 'true';
      toggle.setAttribute('aria-expanded', String(!open));
      toggle.setAttribute('aria-label', `${open ? 'Expand' : 'Collapse'} course details for ${course.name}`);
      modules.hidden = open;
      card.classList.toggle('is-expanded', !open);
    });
  }

  return card;
}

/** Renders the cards grid + See More for the current state. */
function renderCourses(grid, seeMoreWrap, courses, state, basePath) {
  const selected = selectCourses(courses, state);
  const shown = selected.slice(0, state.visible);
  grid.replaceChildren(...shown.map((c) => buildCard(c, basePath)));

  seeMoreWrap.hidden = selected.length <= state.visible;
}

/** Chip row reflecting the active tab + each ticked filter option. */
function renderChips(chipsWrap, state, onRemove) {
  chipsWrap.replaceChildren();
  const chips = [];
  const tab = TABS.find((t) => t.key === state.activeTab);
  chips.push({ label: tab.chip, remove: null }); // tab chip mirrors source (non-removable persona)

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
    chip.className = 'course-filter-chip';
    chip.textContent = label;
    if (remove) {
      chip.classList.add('course-filter-chip-removable');
      chip.setAttribute('aria-label', `Remove ${label} filter`);
      chip.addEventListener('click', remove);
    } else {
      chip.disabled = true;
    }
    chipsWrap.append(chip);
  });
}

export default async function decorate(block) {
  const basePath = new URL('.', import.meta.url).href.replace(/\/$/, '');
  let courses = [];
  try {
    const res = await fetch(`${basePath}/courses.json`);
    courses = await res.json();
  } catch (e) {
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
    b.setAttribute('aria-selected', String(t.key === state.activeTab));
    const title = document.createElement('span');
    title.className = 'course-filter-tab-title';
    title.textContent = t.title;
    const desc = document.createElement('span');
    desc.className = 'course-filter-tab-description';
    desc.textContent = t.description;
    b.append(title, desc);
    if (t.key === state.activeTab) b.classList.add('is-active');
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
  const rerender = () => {
    renderChips(chipsWrap, state, (legend, value) => {
      state.filters[legend]?.delete(value);
      const input = groupsWrap.querySelector(`input[data-legend="${legend}"][data-value="${value}"]`);
      if (input) input.checked = false;
      state.visible = PAGE_SIZE;
      rerender();
    });
    renderCourses(grid, seeMoreWrap, courses, state, basePath);
  };

  tabButtons.forEach(({ tab, el }) => {
    el.addEventListener('click', () => {
      state.activeTab = tab.key;
      state.visible = PAGE_SIZE;
      tabButtons.forEach(({ el: other }) => {
        const active = other === el;
        other.classList.toggle('is-active', active);
        other.setAttribute('aria-selected', String(active));
      });
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

  rerender();
}
