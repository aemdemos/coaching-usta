/*
 * Accordion Block.
 *
 * DEFAULT variant (audience-pathway "Discover your path"): each authored row is a
 * label cell + a body cell, rendered as a native <details>/<summary>. Exclusive
 * (single-open) — opening one closes the others; the first item is open by default.
 * https://www.hlx.live/developer/block-collection/accordion
 *
 * TIMELINE variant (`accordion timeline`): a badge PATHWAY PANEL matching
 * ustacoaching.com/…/results/volunteer-emerging-coach.html. The panel is a dark
 * rounded-bordered container with:
 *   - a HEADER (first authored row, a single cell): the badge logo image, an intro
 *     paragraph and a meta grid of `<h4>` heading + value `<p>`s (What To Expect /
 *     Minimum Req. Package / Industry Equivalent — headings render lime). The header
 *     has its own chevron that collapses the course list below it.
 *   - COURSE ROWS (`"Title — N modules"` label + body): each a WHITE rounded card
 *     with a module-count eyebrow, bold title and always-visible description, and its
 *     own chevron that reveals a vertical connected-dot timeline of the ordered module
 *     steps (an authored <ol>). Course toggles are independent.
 */

/* Split an authored "Title — N modules" label into [title, count]. */
function splitLabel(raw) {
  const text = (raw || '').trim();
  const idx = text.lastIndexOf('—');
  if (idx === -1) return [text, ''];
  return [text.slice(0, idx).trim(), text.slice(idx + 1).trim()];
}

function decorateDefault(block) {
  // tag the base variant with a positive class so its CSS is opt-in
  // (`.accordion.accordion-default …`) rather than an ever-growing
  // `:not(.timeline, …)` exclusion. New variants never carry this class, so
  // base styles can't leak onto them.
  block.classList.add('accordion-default');
  const rows = [...block.children];
  const items = [];
  rows.forEach((row, i) => {
    // decorate accordion item label
    const label = row.children[0];
    const summary = document.createElement('summary');
    summary.className = 'accordion-item-label';
    if (label) summary.append(...label.childNodes);
    // decorate accordion item body
    const body = row.children[1];
    if (body) body.className = 'accordion-item-body';
    // decorate accordion item
    const details = document.createElement('details');
    details.className = 'accordion-item';
    // the first item is open by default (source)
    if (i === 0) details.open = true;
    details.append(summary);
    if (body) details.append(body);
    row.replaceWith(details);
    items.push(details);
  });

  // single-open: opening one item closes the others (source behaviour)
  items.forEach((details) => {
    details.addEventListener('toggle', () => {
      if (details.open) {
        items.forEach((other) => {
          if (other !== details) other.open = false;
        });
      }
    });
  });
}

/*
 * Build a chevron toggle <button> that shows/hides a collapsible region.
 * Uses an explicit button (not <details>/<summary>) so the always-visible header
 * can contain its own links without nesting interactive controls. The button
 * carries aria-expanded + an accessible label; the caret glyph is drawn in CSS.
 */
function buildToggle({
  label, region, host, open = false, onToggle,
}) {
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'accordion-timeline-chevron';
  btn.setAttribute('aria-label', label);
  const setState = (isOpen) => {
    btn.setAttribute('aria-expanded', String(isOpen));
    // host carries .is-open — drives the chevron flip and (for course cards)
    // the per-breakpoint reveal of the description + timeline via CSS
    host.classList.toggle('is-open', isOpen);
    // when an explicit region is passed (the panel's course list) hide it
    // outright on every breakpoint; course cards rely on CSS instead
    if (region) region.hidden = !isOpen;
    if (onToggle) onToggle(isOpen);
  };
  setState(open);
  btn.addEventListener('click', () => setState(btn.getAttribute('aria-expanded') !== 'true'));
  return btn;
}

/* The CSS clamps the description to a WHOLE number of text lines (see
   `.accordion-timeline-desc-clamp` in the CSS) so the clip lands between lines and
   never slices glyphs. That line count must match here so the "…" flag and the clamp
   agree. The clamp height in px differs per breakpoint (the desc font-size steps
   14px -> 18px), so we derive the threshold from the element's OWN line-height at
   measure time rather than a fixed px constant. */
const PATHWAY_CLAMP_LINES = 6;

/*
 * Mark each pathway course card as clamped-with-ellipsis ONLY when its description is
 * TALLER THAN the clamp's max-height; otherwise the copy is short, shows in full, and
 * gets NO "…". BOTH the clamp and the "…" are gated on the resulting
 * `data-clamp-overflow` flag (see CSS), so a card is never cut without also getting a
 * "…". Measured against the description's NATURAL height (the flag is cleared first so
 * the CSS clamp is lifted during measurement) vs `PATHWAY_CLAMP_MAX_PX`.
 * RE-RUN on font-load + resize because heights shift when the web font swaps in or the
 * column width changes — the timing bug that previously left cards cut with no "…".
 * The panel starts collapsed (courses `hidden` → heights read 0), so the first run
 * happens after it's revealed.
 */
function measureClampOverflow(root) {
  root.querySelectorAll('.accordion-timeline-desc-wrapper').forEach((wrapper) => {
    // don't fight a user who has expanded this description
    if (wrapper.closest('.accordion-timeline-course.is-desc-expanded')) return;
    const clamp = wrapper.querySelector('.accordion-timeline-desc-clamp');
    if (!clamp) return;
    // lift the clamp so scrollHeight reports the full natural height, then compare
    delete wrapper.dataset.clampOverflow;
    if (clamp.scrollHeight <= 1) return; // still hidden/unrendered — try again later
    // clamp cap = the description's own line-height × the shared line count, so the
    // threshold tracks the CSS clamp at every breakpoint (14px vs 18px text). Read the
    // line-height off a desc paragraph (the clamp div may report "normal").
    const descP = clamp.querySelector('.accordion-timeline-desc') || clamp;
    const lineHeight = parseFloat(getComputedStyle(descP).lineHeight) || 0;
    const capPx = lineHeight * PATHWAY_CLAMP_LINES;
    // overflow when the natural copy is taller than the cap (few px of slack so a
    // description that fits within a line's rounding isn't needlessly clamped)
    wrapper.dataset.clampOverflow = String(clamp.scrollHeight > capPx + 4);
  });
}

/*
 * The header row is a single cell holding: the badge logo (a <p><img></p>), an intro
 * paragraph, then a repeating [<h4> heading + one-or-more value <p>] meta group. Group
 * the h4 + its following value <p>s into meta columns so they lay out side by side.
 */
function buildPanelHeader(cell) {
  const head = document.createElement('div');
  head.className = 'accordion-timeline-panel-head';

  // text column (intro + meta) sits beside the badge logo
  const body = document.createElement('div');
  body.className = 'accordion-timeline-panel-body';
  const meta = document.createElement('div');
  meta.className = 'accordion-timeline-meta';
  let column = null;

  [...cell.children].forEach((node) => {
    const img = node.tagName === 'P' && node.querySelector('img');
    if (img) {
      // badge logo
      const logo = document.createElement('div');
      logo.className = 'accordion-timeline-badge';
      logo.append(img);
      head.append(logo);
      return;
    }
    if (node.tagName === 'H4') {
      // start a new meta column (its heading renders lime)
      column = document.createElement('div');
      column.className = 'accordion-timeline-meta-col';
      node.className = 'accordion-timeline-meta-heading';
      column.append(node);
      meta.append(column);
      return;
    }
    if (column && node.tagName === 'P') {
      // value line under the current heading
      node.className = 'accordion-timeline-meta-value';
      column.append(node);
      return;
    }
    // pre-meta paragraph = the intro description
    node.classList.add('accordion-timeline-panel-intro');
    body.append(node);
  });

  // meta grid + chevron share a row (source `.v-classification-accordion-content__info`)
  // so the chevron centres on the META block, not the whole badge+intro header
  const info = document.createElement('div');
  info.className = 'accordion-timeline-panel-info';
  if (meta.children.length) {
    // the last meta column absorbs the remaining width (source: What To Expect /
    // Minimum Req. are content-sized, Industry Equivalent fills the rest and wraps)
    meta.lastElementChild.classList.add('accordion-timeline-meta-col-grow');
    info.append(meta);
  }
  body.append(info);
  head.append(body);
  // the chevron is appended into `info` by the caller so it sits beside the meta grid
  return { head, info };
}

/*
 * Assemble a white course card from its already-parsed pieces. Shared by the
 * TIMELINE builder (which parses a "Title — N modules" label + body cell) and the
 * PATHWAY builder (which parses a separate badge cell + a content cell holding an
 * eyebrow <p>, an <h3> title, description <p>s and an <ol>/<ul> module list).
 * Emits the SAME `.accordion-timeline-course*` markup so both variants share CSS.
 */
function assembleCourseCard({
  titleText, countText, badgeImg, descNodes = [], timeline = null, clampDesc = false,
}) {
  const card = document.createElement('div');
  card.className = 'accordion-timeline-course';

  // always-visible header row
  const label = document.createElement('div');
  label.className = 'accordion-timeline-course-label';

  // content row: optional badge image (left) + text column
  const content = document.createElement('div');
  content.className = 'accordion-timeline-course-content';

  const head = document.createElement('div');
  head.className = 'accordion-timeline-head';

  if (countText) {
    const eyebrow = document.createElement('p');
    eyebrow.className = 'accordion-timeline-eyebrow';
    eyebrow.textContent = countText;
    head.append(eyebrow);
  }

  const title = document.createElement('p');
  title.className = 'accordion-timeline-title';
  title.textContent = titleText;
  head.append(title);

  // PATHWAY: build the clamped description wrapper (line-clamped to a fixed max-height with
  // a "…" ellipsis that expands it in place, INDEPENDENT of the chevron). Like TIMELINE, it
  // is appended DIRECTLY to the card, BELOW the header row (label) — NOT nested in the
  // badge/title `head` — so the card reads: row 1 = badge + eyebrow/title + chevron; row 2 =
  // description (full-width); then the rest (timeline). Matches the source `.v-course`.
  let descWrapper = null;
  if (clampDesc && descNodes.length) {
    descWrapper = document.createElement('div');
    descWrapper.className = 'accordion-timeline-desc-wrapper';
    const clamp = document.createElement('div');
    clamp.className = 'accordion-timeline-desc-clamp';
    descNodes.forEach((node) => {
      node.classList.add('accordion-timeline-desc');
      clamp.append(node);
    });
    const ellipsis = document.createElement('button');
    ellipsis.type = 'button';
    ellipsis.className = 'accordion-timeline-desc-ellipsis';
    ellipsis.textContent = '…';
    ellipsis.setAttribute('aria-label', `Show full description for ${titleText}`);
    ellipsis.setAttribute('aria-expanded', 'false');
    ellipsis.addEventListener('click', () => {
      const expanded = card.classList.toggle('is-desc-expanded');
      ellipsis.setAttribute('aria-expanded', String(expanded));
    });
    descWrapper.append(clamp, ellipsis);
  }

  // PATHWAY: the description lives INSIDE the text column, below the eyebrow/title —
  // exactly like the source `.v-course__info > .v-course__description-wrapper`. Sitting
  // in the narrower text column (beside the badge) is what makes the copy wrap enough to
  // overflow the 150.72px clamp so the "…" appears (a full-width desc wraps too short and
  // never overflows). On mobile the whole text column drops below the badge, so the
  // description still reads as "row 2" there — no reparenting needed.
  if (descWrapper) head.append(descWrapper);

  if (badgeImg) {
    const badge = document.createElement('div');
    badge.className = 'accordion-timeline-course-badge';
    badge.append(badgeImg);
    content.append(badge);
    card.classList.add('accordion-timeline-course-badged');
  }
  content.append(head);
  label.append(content);
  card.append(label);

  // TIMELINE: description is a full-width block below the header row.
  if (!clampDesc) {
    descNodes.forEach((node) => {
      node.classList.add('accordion-timeline-desc');
      card.append(node);
    });
  }

  if (timeline) {
    timeline.className = 'accordion-timeline-steps';
    [...timeline.children].forEach((li) => {
      const stepText = document.createElement('span');
      stepText.className = 'accordion-timeline-step-text';
      stepText.append(...li.childNodes);
      const circle = document.createElement('span');
      circle.className = 'accordion-timeline-circle';
      circle.setAttribute('aria-hidden', 'true');
      li.className = 'accordion-timeline-step';
      li.append(circle, stepText);
    });
    card.append(timeline);
    card.classList.add('accordion-timeline-course-has-timeline');
  }

  // Source behaviour is responsive:
  //  - mobile: the card collapses to eyebrow+title; the chevron reveals the
  //    description (+ timeline if any). EVERY card has a chevron.
  //  - desktop: the description is always visible; the chevron reveals only the
  //    timeline, and cards without a timeline have no chevron.
  // The toggle only flips `.is-open` on the card; CSS decides what shows at each
  // breakpoint (no explicit region — so nothing is force-hidden on desktop).
  label.append(buildToggle({
    label: `Toggle details for ${titleText}`,
    host: card,
  }));

  return card;
}

/* Build one course card from a "Title — N modules" label + body cell (TIMELINE). */
function buildCourseCard(labelCell, bodyCell) {
  const [titleText, countText] = splitLabel(labelCell && labelCell.textContent);

  // the ordered list is the collapsible timeline; a leading <p><img> is the course
  // badge; the remaining paragraph(s) are the description.
  const timeline = bodyCell ? bodyCell.querySelector('ol, ul') : null;
  let badgeImg = null;
  const descNodes = [];
  if (bodyCell) {
    [...bodyCell.children].forEach((child) => {
      if (child === timeline) return;
      const img = child.tagName === 'P' && child.querySelector('img');
      if (img && !badgeImg) {
        badgeImg = img;
        return;
      }
      descNodes.push(child);
    });
  }

  return assembleCourseCard({
    titleText, countText, badgeImg, descNodes, timeline,
  });
}

/*
 * PATHWAY course card: a badge cell (a single
 * <img>) + a content cell holding an eyebrow <p> ("N modules"), an <h3> title,
 * one-or-more description <p>s, then an <ol>/<ul> module list.
 */
function buildPathwayCard(badgeCell, contentCell) {
  const badgeImg = badgeCell ? badgeCell.querySelector('img') : null;
  const timeline = contentCell ? contentCell.querySelector('ol, ul') : null;
  let titleText = '';
  let countText = '';
  const descNodes = [];
  if (contentCell) {
    [...contentCell.children].forEach((child) => {
      if (child === timeline) return;
      if (child.tagName === 'H3') {
        titleText = child.textContent.trim();
        return;
      }
      // a "6 modules" paragraph before the title is the eyebrow; other <p>s are desc
      if (child.tagName === 'P' && !titleText && /^\s*\d+\s*modules?\s*$/i.test(child.textContent)) {
        countText = child.textContent.trim();
        return;
      }
      descNodes.push(child);
    });
  }

  return assembleCourseCard({
    titleText, countText, badgeImg, descNodes, timeline, clampDesc: true,
  });
}

function decorateTimeline(block) {
  const rows = [...block.children];
  // the first row is the panel header (single cell); the rest are course rows
  const [headerRow, ...courseRows] = rows;

  // outer panel — dark bordered container
  const panel = document.createElement('div');
  panel.className = 'accordion-timeline-panel';

  // always-visible header (badge + intro + meta grid) with its own toggle button
  const header = document.createElement('div');
  header.className = 'accordion-timeline-panel-label';
  const { head: panelHead, info: panelInfo } = buildPanelHeader(headerRow.children[0] || headerRow);
  header.append(panelHead);
  panel.append(header);

  // a trailing single-cell row whose only content is a link is the "View All
  // Courses" footer button (not a course card)
  const isFooterRow = (row) => row.children.length === 1
    && !row.children[0].querySelector('ol, ul, img')
    && row.children[0].querySelector('a')
    && !row.children[0].textContent.includes('—');
  const footerRow = courseRows.length && isFooterRow(courseRows[courseRows.length - 1])
    ? courseRows.pop() : null;

  // course cards live in the collapsible region controlled by the panel toggle
  const list = document.createElement('div');
  list.className = 'accordion-timeline-courses';
  courseRows.forEach((row) => {
    list.append(buildCourseCard(row.children[0], row.children[1]));
  });

  // footer CTA (lime pill) sits inside the collapsible region, below the cards
  if (footerRow) {
    const footer = document.createElement('div');
    footer.className = 'accordion-timeline-footer';
    const cta = footerRow.children[0].querySelector('a');
    cta.className = 'accordion-timeline-viewall';
    footer.append(cta);
    list.append(footer);
  }

  panel.append(list);

  // chevron sits beside the meta grid (source `__info` row) so it centres on the
  // meta block; falls back to the header row if there was no meta grid
  (panelInfo || header).append(buildToggle({
    label: 'Toggle course list',
    region: list,
    host: panel,
    open: false,
  }));

  block.replaceChildren(panel);
}

/*
 * PATHWAY variant (`accordion pathway`) — the "Recommended Learning Pathway" card
 * from ustacoaching.com/…/results/college-coach.html. Same dark bordered panel as
 * TIMELINE (badge logo + intro + lime meta grid header, its own chevron revealing
 * the body), but the body is a set of SECTION groups: a full-width centred intro
 * line ("Complete all 6 required courses…" / "Choose and complete at least 2…")
 * followed by a 2-column (>=1024) GRID of white course cards, ending in a
 * "View All Courses" footer button.
 *
 * Authoring model (each authored row = a table row of cells):
 *   row 0: [logo <img>] [intro <p> with a link]           → panel header
 *   row 1: [<p>heading</p><p>value</p>…] × 3               → lime meta grid
 *   section-intro row: a single cell with one paragraph    → full-width heading
 *   course row: [badge <img>] [eyebrow/title/desc/<ol>]    → white card
 *   footer row: a single cell whose only content is a link → View All Courses
 */
function decoratePathway(block) {
  const rows = [...block.children];

  // outer panel — dark bordered container
  const panel = document.createElement('div');
  panel.className = 'accordion-timeline-panel';

  // ---- header: row 0 (logo + intro) + row 1 (meta grid) ----
  const headerRow = rows.shift();
  const metaRow = rows.shift();

  const header = document.createElement('div');
  header.className = 'accordion-timeline-panel-label';
  const head = document.createElement('div');
  head.className = 'accordion-timeline-panel-head';
  const body = document.createElement('div');
  body.className = 'accordion-timeline-panel-body';

  // logo (first header cell holds the pathway logo image) + intro (second cell)
  const headerCells = headerRow ? [...headerRow.children] : [];
  const logoImg = headerCells[0] && headerCells[0].querySelector('img');
  if (logoImg) {
    const logo = document.createElement('div');
    logo.className = 'accordion-timeline-badge';
    logo.append(logoImg);
    head.append(logo);
  }
  const introCell = headerCells[1] || headerCells[0];
  if (introCell) {
    [...introCell.children].forEach((node) => {
      if (node.querySelector && node.querySelector('img')) return; // skip logo dup
      node.classList.add('accordion-timeline-panel-intro');
      body.append(node);
    });
  }

  // meta grid: each cell = a heading <p> + value <p>s
  const meta = document.createElement('div');
  meta.className = 'accordion-timeline-meta';
  if (metaRow) {
    [...metaRow.children].forEach((cell) => {
      const column = document.createElement('div');
      column.className = 'accordion-timeline-meta-col';
      [...cell.children].forEach((p, i) => {
        if (i === 0) {
          p.className = 'accordion-timeline-meta-heading';
        } else {
          p.className = 'accordion-timeline-meta-value';
        }
        column.append(p);
      });
      meta.append(column);
    });
  }

  const info = document.createElement('div');
  info.className = 'accordion-timeline-panel-info';
  if (meta.children.length) {
    meta.lastElementChild.classList.add('accordion-timeline-meta-col-grow');
    info.append(meta);
  }
  body.append(info);
  head.append(body);
  header.append(head);
  panel.append(header);

  // ---- body: section-intro rows, course grids, footer ----
  // A row is a SECTION INTRO when it has a single cell with no img/list/link and
  // no "— modules" — the "Complete all 6…" / "Choose and complete…" headings.
  const isSectionIntro = (row) => row.children.length === 1
    && !row.children[0].querySelector('img, ol, ul, a, h3');
  // A trailing single-cell row whose only content is a link = the footer CTA.
  const isFooterRow = (row) => row.children.length === 1
    && !row.children[0].querySelector('img, ol, ul, h3')
    && row.children[0].querySelector('a');

  const list = document.createElement('div');
  list.className = 'accordion-timeline-courses';

  let footerRow = null;
  if (rows.length && isFooterRow(rows[rows.length - 1])) {
    footerRow = rows.pop();
  }

  let currentGrid = null;
  rows.forEach((row) => {
    if (isSectionIntro(row)) {
      // full-width centred heading; starts a new card grid after it
      const intro = document.createElement('p');
      intro.className = 'accordion-timeline-section-intro';
      intro.append(...(row.children[0].firstElementChild
        ? row.children[0].firstElementChild.childNodes
        : row.children[0].childNodes));
      list.append(intro);
      currentGrid = null;
      return;
    }
    // course card row: ensure a grid container exists to hold it
    if (!currentGrid) {
      currentGrid = document.createElement('div');
      currentGrid.className = 'accordion-timeline-grid';
      list.append(currentGrid);
    }
    currentGrid.append(buildPathwayCard(row.children[0], row.children[1]));
  });

  // footer CTA (lime pill) inside the collapsible region, below the cards
  if (footerRow) {
    const footer = document.createElement('div');
    footer.className = 'accordion-timeline-footer';
    const cta = footerRow.children[0].querySelector('a');
    cta.className = 'accordion-timeline-viewall';
    footer.append(cta);
    list.append(footer);
  }

  panel.append(list);

  // chevron beside the meta grid; toggles the whole body region. On first open,
  // measure which card descriptions overflow the clamp so only those get a "…".
  (info.children.length ? info : header).append(buildToggle({
    label: 'Toggle course list',
    region: list,
    host: panel,
    open: false,
    onToggle: (isOpen) => { if (isOpen) measureClampOverflow(list); },
  }));

  block.replaceChildren(panel);

  // Re-measure whenever line counts could shift: after the web font swaps in (the
  // timing bug that left cards cut with no "…") and on viewport resize (column width
  // + the 132/150px limit change). measureClampOverflow no-ops on still-hidden cards.
  const remeasure = () => measureClampOverflow(list);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(remeasure);
  window.addEventListener('resize', remeasure);
}

/**
 * loads and decorates the block
 * @param {Element} block The block element
 */
export default function decorate(block) {
  if (block.classList.contains('timeline')) {
    decorateTimeline(block);
    return;
  }
  if (block.classList.contains('pathway')) {
    decoratePathway(block);
    return;
  }
  decorateDefault(block);
}
