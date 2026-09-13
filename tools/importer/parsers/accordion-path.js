/* eslint-disable */
/* global WebImporter */
/**
 * Parser for accordion-path. Base block: accordion.
 * Source: https://www.ustacoaching.com/ (.accordion.panelcontainer "Discover your path")
 * Generated for USTA Coaching homepage migration (da project).
 *
 * EDS accordion convention: 2 columns, one row per item — a title/label cell
 * and a content (collapsible body) cell. Target decorate()
 * (blocks/accordion-path/accordion-path.js) turns each row into a
 * <details>/<summary>: children[0] → summary label, children[1] → body.
 */
export default function parse(element, { document }) {
  const items = [...element.querySelectorAll('.cmp-accordion__item')];

  const cells = [];
  items.forEach((item) => {
    // Label — the accordion button/heading text.
    const button = item.querySelector('.cmp-accordion__button, h1, h2, h3, h4, h5, h6');
    const labelText = button ? button.textContent.trim() : '';
    const label = document.createElement('p');
    label.textContent = labelText;

    // Body — the collapsible panel content.
    const panel = item.querySelector('.cmp-accordion__panel');
    const bodyEls = [];
    if (panel) {
      [...panel.children].forEach((child) => {
        if (child.textContent.trim() || child.querySelector('img, a')) bodyEls.push(child);
      });
      if (!bodyEls.length && panel.textContent.trim()) {
        const p = document.createElement('p');
        p.textContent = panel.textContent.trim();
        bodyEls.push(p);
      }
    }

    if (labelText || bodyEls.length) {
      cells.push([label, bodyEls.length ? bodyEls : '']);
    }
  });

  // Empty-block guard.
  if (!cells.length) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const block = WebImporter.Blocks.createBlock(document, { name: 'accordion-path', cells });
  element.replaceWith(block);
}
