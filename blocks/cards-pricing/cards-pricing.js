/**
 * cards-pricing — a row of repeating pricing tiles. Each authored row becomes
 * one pricing card holding (in order) an audience label, a tier name, a price,
 * a checkmark feature list, and a "select" CTA. Text-only (no images).
 *
 * @param {Element} block the cards-pricing block element
 */
export default function decorate(block) {
  const ul = document.createElement('ul');

  [...block.children].forEach((row) => {
    const li = document.createElement('li');
    li.className = 'cards-pricing-card';
    while (row.firstElementChild) li.append(row.firstElementChild);

    // The last link in a tile is the "select" CTA — mark its container.
    const links = li.querySelectorAll('a');
    const cta = links[links.length - 1];
    if (cta) {
      const container = cta.closest('div') || cta.parentElement;
      if (container) container.classList.add('cards-pricing-cta');
    }

    // A list (feature list) inside the tile is the checkmark feature list.
    li.querySelectorAll('ul, ol').forEach((list) => list.classList.add('cards-pricing-features'));

    ul.append(li);
  });

  block.replaceChildren(ul);
}
