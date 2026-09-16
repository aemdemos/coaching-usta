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
  label, region, host, open = false,
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
  };
  setState(open);
  btn.addEventListener('click', () => setState(btn.getAttribute('aria-expanded') !== 'true'));
  return btn;
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

/* Build one course card from a "Title — N modules" label + body cell. */
function buildCourseCard(labelCell, bodyCell) {
  const [titleText, countText] = splitLabel(labelCell && labelCell.textContent);

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

  // the ordered list is the collapsible timeline; a leading <p><img> is the course
  // badge; the remaining paragraph(s) are the description. In the source
  // (`.v-course`) the description is a FULL-WIDTH block sibling BELOW the header
  // row (`.v-course__content` = badge + eyebrow/title + chevron) — it spans the
  // entire card, flowing under the chevron column too, NOT confined beside the
  // badge. So collect the description here and append it as a sibling of `label`
  // (a direct child of the card) rather than inside the badge/text row.
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
      child.classList.add('accordion-timeline-desc');
      descNodes.push(child);
    });
  }

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

  // description: full-width block below the header row (source `.v-course__description`)
  descNodes.forEach((node) => card.append(node));

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

/**
 * loads and decorates the block
 * @param {Element} block The block element
 */
export default function decorate(block) {
  if (block.classList.contains('timeline')) {
    decorateTimeline(block);
    return;
  }
  decorateDefault(block);
}
