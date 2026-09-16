/*
 * Accordion Block.
 *
 * DEFAULT variant (block-collection accordion): each authored row is a label
 * cell + a body cell, rendered as a native <details>/<summary>. Exclusive
 * (single-open); the first item is open by default.
 * https://www.hlx.live/developer/block-collection/accordion
 *
 * PATHWAY variant (`accordion (pathway)`): the "Recommended Learning Pathway"
 * card from https://www.ustacoaching.com/en/home/results/college-coach.html —
 * a single bordered black card with an always-visible header (logo, description,
 * a 3-column info grid) and a chevron toggle that expands a panel. The panel
 * holds one or more sections; each section is an intro paragraph + a 2-column
 * grid of white course cards (each card has its own chevron), and an optional
 * "View All Courses" CTA closes the panel. See
 * drafts/block-samples/accordion-pathway.plain.html for the authoring contract.
 */

let pathwayCount = 0;

// a chevron toggle button (inline SVG bg is styled in CSS)
function createChevronToggle(className, controlsId, label) {
  const toggle = document.createElement('button');
  toggle.className = className;
  toggle.type = 'button';
  toggle.setAttribute('aria-expanded', 'false');
  if (controlsId) toggle.setAttribute('aria-controls', controlsId);
  toggle.setAttribute('aria-label', label);
  return toggle;
}

// tracks course descriptions whose clamp overflows, checked after layout
const pendingClamps = [];

// build a single white course card from a badge cell + a text cell.
// The text cell holds: an eyebrow <p> ("6 modules"), a heading, description
// paragraph(s), and OPTIONALLY a trailing <ul> whose <li>s become the
// collapsible modules timeline revealed by the card's chevron.
function buildCourseCard(badgeCell, textCell, index) {
  const course = document.createElement('div');
  course.className = 'pathway-course';

  const content = document.createElement('div');
  content.className = 'pathway-course-content';

  if (badgeCell) {
    badgeCell.className = 'pathway-course-badge';
    content.append(badgeCell);
  }

  // pull an authored modules list out of the text cell (the timeline)
  let modulesList = null;
  let desc = null;
  let ellipsis = null;
  if (textCell) {
    modulesList = textCell.querySelector('ul');
    if (modulesList) modulesList.remove();

    textCell.className = 'pathway-course-text';
    const heading = textCell.querySelector('h1,h2,h3,h4,h5,h6');
    if (heading) heading.classList.add('pathway-course-name');
    // a leading paragraph before the heading is the eyebrow ("6 modules")
    const first = textCell.firstElementChild;
    if (first && first.tagName === 'P' && heading && first.nextElementSibling === heading) {
      first.classList.add('pathway-course-eyebrow');
    }

    // wrap the description (everything after the heading) in a clamped wrapper
    // with a "…" ellipsis that expands it
    if (heading) {
      const descWrap = document.createElement('div');
      descWrap.className = 'pathway-course-desc-wrap';
      const descEl = document.createElement('div');
      descEl.className = 'pathway-course-desc';
      let node = heading.nextSibling;
      while (node) {
        const next = node.nextSibling;
        descEl.append(node);
        node = next;
      }
      descWrap.append(descEl);
      const ellipsisEl = document.createElement('span');
      ellipsisEl.className = 'pathway-course-ellipsis';
      ellipsisEl.setAttribute('role', 'button');
      ellipsisEl.setAttribute('tabindex', '0');
      ellipsisEl.textContent = '…';
      const expand = () => {
        descEl.classList.add('is-expanded');
        ellipsisEl.remove();
      };
      ellipsisEl.addEventListener('click', expand);
      ellipsisEl.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); expand(); }
      });
      descWrap.append(ellipsisEl);
      textCell.append(descWrap);
      desc = descEl;
      ellipsis = ellipsisEl;
      // decide after layout whether the ellipsis is needed
      pendingClamps.push({ desc: descEl, ellipsis: ellipsisEl });
    }

    content.append(textCell);
  }

  // build the collapsible detail panel (modules timeline) when authored
  let detail = null;
  const detailId = `pathway-course-${pathwayCount}-${index}`;
  if (modulesList && modulesList.children.length) {
    detail = document.createElement('div');
    detail.className = 'pathway-course-detail';
    detail.id = detailId;
    modulesList.className = 'pathway-course-modules';
    [...modulesList.children].forEach((li) => {
      li.classList.add('pathway-course-module');
      const circle = document.createElement('span');
      circle.className = 'pathway-course-module-circle';
      li.prepend(circle);
    });
    detail.append(modulesList);
  }

  // per-card chevron toggle — every card shows it (source parity); it reveals
  // the modules timeline when one was authored
  const cardToggle = createChevronToggle('pathway-course-toggle', detail ? detailId : null, 'Expand course details');
  cardToggle.addEventListener('click', () => {
    const open = course.hasAttribute('open');
    course.toggleAttribute('open', !open);
    cardToggle.setAttribute('aria-expanded', String(!open));
    cardToggle.setAttribute('aria-label', open ? 'Expand course details' : 'Collapse course details');
    // opening a card also reveals the full (un-clamped) description (source)
    if (desc) desc.classList.toggle('is-expanded', !open);
    if (ellipsis) ellipsis.style.display = open ? '' : 'none';
  });
  content.append(cardToggle);

  course.append(content);
  if (detail) course.append(detail);
  return course;
}

function decoratePathway(block) {
  pathwayCount += 1;
  const rows = [...block.children];

  // row[0] = header (logo image + description); row[1] = 3-column info grid;
  // the rest are panel rows processed IN ORDER:
  //   - a single-cell row whose only child is a link  -> "View All" CTA
  //   - any other single-cell row                     -> new section intro
  //   - a 2-cell row (badge + text)                    -> course card
  const headerRow = rows[0];
  const infoRow = rows[1] && rows[1].children.length >= 3 ? rows[1] : null;
  const panelRows = rows.slice(infoRow ? 2 : 1);

  const card = document.createElement('div');
  card.className = 'accordion-item pathway-card';

  // ---- always-visible header ----
  const header = document.createElement('div');
  header.className = 'pathway-header';

  if (headerRow) {
    const [logoCell, descCell] = [...headerRow.children];
    if (logoCell) {
      logoCell.className = 'pathway-logo';
      header.append(logoCell);
    }
    const container = document.createElement('div');
    container.className = 'pathway-container';
    if (descCell) {
      descCell.className = 'pathway-desc';
      container.append(descCell);
    }
    // the info row holds the 3-column info grid + the chevron toggle (right)
    const infoWrap = document.createElement('div');
    infoWrap.className = 'pathway-info-row';
    if (infoRow) {
      infoRow.className = 'pathway-info';
      [...infoRow.children].forEach((col) => col.classList.add('pathway-info-col'));
      infoWrap.append(infoRow);
    }
    container.append(infoWrap);
    header.append(container);
  }

  // ---- expandable panel ----
  const panelId = `pathway-panel-${pathwayCount}`;
  const panel = document.createElement('div');
  panel.className = 'pathway-panel';
  panel.id = panelId;

  const panelInner = document.createElement('div');
  panelInner.className = 'pathway-panel-inner';

  let grid = null;
  let courseIndex = 0;
  panelRows.forEach((row) => {
    const cells = [...row.children];
    if (cells.length === 1) {
      const cell = cells[0];
      const link = cell.querySelector('a');
      const onlyLink = link && cell.textContent.trim() === link.textContent.trim();
      if (onlyLink) {
        // "View All Courses" CTA — closes the panel
        link.className = 'pathway-view-all';
        link.setAttribute('role', 'button');
        panelInner.append(link);
        grid = null;
      } else {
        // new section: intro paragraph + a fresh course grid
        cell.className = 'pathway-intro';
        panelInner.append(cell);
        grid = document.createElement('div');
        grid.className = 'pathway-courses';
        panelInner.append(grid);
      }
    } else {
      // course card
      if (!grid) {
        grid = document.createElement('div');
        grid.className = 'pathway-courses';
        panelInner.append(grid);
      }
      const [badgeCell, textCell] = cells;
      courseIndex += 1;
      grid.append(buildCourseCard(badgeCell, textCell, courseIndex));
    }
  });
  panel.append(panelInner);

  // the clamps for THIS block (resolved once the panel is first visible)
  const clamps = pendingClamps.splice(0);
  let clampsResolved = false;
  const resolveClamps = () => {
    if (clampsResolved) return;
    clampsResolved = true;
    // hide the "…" ellipsis on descriptions that don't actually overflow
    clamps.forEach(({ desc, ellipsis }) => {
      if (desc.scrollHeight <= desc.clientHeight + 1) ellipsis.remove();
    });
  };

  // ---- header chevron toggle (opens the whole panel) ----
  const toggle = createChevronToggle('pathway-toggle', panelId, 'Show learning pathway details');
  toggle.addEventListener('click', () => {
    const open = card.hasAttribute('open');
    card.toggleAttribute('open', !open);
    toggle.setAttribute('aria-expanded', String(!open));
    // measure clamps the first time the panel becomes visible
    if (!open) requestAnimationFrame(resolveClamps);
  });
  const infoWrap = header.querySelector('.pathway-info-row') || header;
  infoWrap.append(toggle);

  card.append(header, panel);
  block.replaceChildren(card);
}

/**
 * loads and decorates the block
 * @param {Element} block The block element
 */
export default function decorate(block) {
  if (block.classList.contains('pathway')) {
    decoratePathway(block);
    return;
  }

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
