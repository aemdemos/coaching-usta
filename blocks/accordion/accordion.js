/*
 * Accordion Block (default block-collection accordion).
 * Each authored row is a label cell + a body cell, rendered as a native
 * <details>/<summary>. This site's design: exclusive (single-open) accordion —
 * opening one item closes the others; the first item is open by default.
 * https://www.hlx.live/developer/block-collection/accordion
 */
export default function decorate(block) {
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
