/* eslint-disable */
/* global WebImporter */
/**
 * Parser for accordion. Base block: accordion (default block-collection accordion).
 * Source: https://www.ustacoaching.com/ (.accordion.panelcontainer "Discover your path")
 * Generated for USTA Coaching homepage migration (da project).
 *
 * Accordion convention: 2 columns, one row per item — a mandatory TITLE cell and
 * a mandatory CONTENT cell. Target decorate() (blocks/accordion/accordion.js)
 * turns each row into a <details>/<summary>: children[0] → summary label,
 * children[1] → collapsible body.
 */
export default function parse(element, { document }) {
  const items = [...element.querySelectorAll('.cmp-accordion__item')];

  const cells = [];
  items.forEach((item) => {
    // Title cell — the accordion button/heading text.
    const button = item.querySelector('.cmp-accordion__button, h1, h2, h3, h4, h5, h6');
    const labelText = button ? button.textContent.trim() : '';
    const title = document.createElement('p');
    title.textContent = labelText;

    // Content cell — the collapsible panel content.
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
      cells.push([title, bodyEls.length ? bodyEls : '']);
    }
  });

  // Empty-block guard.
  if (!cells.length) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const block = WebImporter.Blocks.createBlock(document, { name: 'accordion', cells });
  element.replaceWith(block);
}
