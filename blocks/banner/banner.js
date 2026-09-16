/*
 * banner — a contained, rounded full-width promo band with a heading, a short
 * body line, and a pill CTA laid out in a row (stacked on mobile).
 *
 * Colour variants (authored as classes, e.g. `banner (events, blue)`):
 *   • blue  — blue panel, black text, black pill button (the "events" banner).
 *   • black — black panel, white text, lime-green pill button.
 * `blue` is the default when no colour class is present.
 *
 * Structural variant:
 *   • info  — an INFORMATIONAL panel (no CTA, no fill): an outlined (1px white
 *     border, 20px radius) transparent panel with a CENTERED heading followed by
 *     a stack of label/body detail pairs (e.g. "Profile Update:" + its copy).
 *     Authoring model: first row holds the heading; each subsequent row is a
 *     two-cell pair — cell 1 the bold label, cell 2 the body copy.
 *
 * Authoring model (base/blue/black): one row whose cells hold the heading, the
 * body copy, and the CTA link (the importer groups heading+body in one cell and
 * the link in another; this normalises either shape into two columns).
 *
 * Layout (source): two top-level columns — the HEADING on the left, and a
 * CONTENT column on the right holding the body copy with the CTA stacked below
 * it. On mobile the whole thing stacks into a single column.
 *
 * @param {Element} block the banner block element
 */
function decorateInfo(block) {
  const heading = block.querySelector('h1, h2, h3, h4, h5, h6');
  // every top-level row after the heading's row is a label/body detail pair
  const details = [...block.children].filter((row) => !heading || !row.contains(heading));

  const inner = document.createElement('div');
  inner.className = 'banner-inner';

  if (heading) {
    heading.classList.add('banner-heading');
    inner.append(heading);
  }

  const list = document.createElement('div');
  list.className = 'banner-details';

  // turn a cell into a single <p>: reuse its existing <p> (EDS wraps single-line
  // cells in one) or wrap its raw content, avoiding invalid nested paragraphs.
  const toParagraph = (cell, className) => {
    let p = cell.querySelector('p');
    if (!p) {
      p = document.createElement('p');
      p.append(...cell.childNodes);
    }
    p.className = className;
    return p.textContent.trim() ? p : null;
  };

  details.forEach((row) => {
    const cells = [...row.children];
    if (!cells.length) return;
    const detail = document.createElement('div');
    detail.className = 'banner-detail';

    const label = toParagraph(cells[0], 'banner-label');
    if (label) detail.append(label);

    if (cells[1]) {
      const body = toParagraph(cells[1], 'banner-detail-body');
      if (body) detail.append(body);
    }

    if (detail.childElementCount) list.append(detail);
  });

  if (list.childElementCount) inner.append(list);
  block.replaceChildren(inner);
}

export default function decorate(block) {
  if (block.classList.contains('info')) {
    decorateInfo(block);
    return;
  }

  const heading = block.querySelector('h1, h2, h3, h4, h5, h6');
  const link = [...block.querySelectorAll('a')].pop();
  // body = paragraphs that are neither the heading nor the CTA link's paragraph
  const bodyParas = [...block.querySelectorAll('p')].filter((p) => {
    if (link && p.contains(link)) return false;
    return p.textContent.trim().length > 0;
  });

  const inner = document.createElement('div');
  inner.className = 'banner-inner';

  if (heading) {
    heading.classList.add('banner-heading');
    inner.append(heading);
  }

  // right column: body copy on top, CTA stacked below it
  const content = document.createElement('div');
  content.className = 'banner-content';
  if (bodyParas.length) {
    const body = document.createElement('div');
    body.className = 'banner-body';
    bodyParas.forEach((p) => body.append(p));
    content.append(body);
  }
  if (link) {
    link.classList.add('banner-cta');
    const action = document.createElement('div');
    action.className = 'banner-action';
    action.append(link);
    content.append(action);
  }
  if (content.childElementCount) inner.append(content);

  block.replaceChildren(inner);
}
