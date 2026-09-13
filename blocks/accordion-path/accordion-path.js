/*
 * accordion-path — expandable audience-pathway rows. Each authored row is a
 * label cell + a body cell, rendered as a native <details>/<summary> so the
 * open/close interaction and accessibility come for free. The +/- toggle glyph
 * is drawn in CSS from the open/closed state.
 */
export default function decorate(block) {
  [...block.children].forEach((row) => {
    // label
    const label = row.children[0];
    const summary = document.createElement('summary');
    summary.className = 'accordion-path-item-label';
    if (label) summary.append(...label.childNodes);
    // body
    const body = row.children[1];
    if (body) body.className = 'accordion-path-item-body';
    // item
    const details = document.createElement('details');
    details.className = 'accordion-path-item';
    details.append(summary);
    if (body) details.append(body);
    row.replaceWith(details);
  });
}
