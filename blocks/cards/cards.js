import { createOptimizedPicture } from '../../scripts/aem.js';

/**
 * cards — a row of repeating cards. Three variants share this block:
 *   • default  : bordered image + body tile (boilerplate).
 *   • media    : editorial cards — photo, heading, paragraph (transparent).
 *   • pricing  : membership tiers — label, tier name, price, feature list, CTA.
 * The variant is authored as a class on the block (e.g. `cards (media)`), so we
 * dispatch on it here and keep each variant's own inner class names.
 *
 * @param {Element} block the cards block element
 */
function decorateMedia(block) {
  const ul = document.createElement('ul');

  [...block.children].forEach((row) => {
    const li = document.createElement('li');
    li.className = 'cards-media-card';
    while (row.firstElementChild) li.append(row.firstElementChild);

    [...li.children].forEach((div) => {
      if (div.children.length === 1 && div.querySelector('picture')) {
        div.className = 'cards-media-image';
      } else {
        div.className = 'cards-media-body';
      }
    });

    ul.append(li);
  });

  ul.querySelectorAll('picture > img').forEach((img) => {
    img.closest('picture').replaceWith(createOptimizedPicture(img.src, img.alt, false, [{ width: '750' }]));
  });

  block.replaceChildren(ul);
}

function decoratePricing(block) {
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

function decorateDefault(block) {
  const ul = document.createElement('ul');
  [...block.children].forEach((row) => {
    const li = document.createElement('li');
    while (row.firstElementChild) li.append(row.firstElementChild);
    [...li.children].forEach((div) => {
      if (div.children.length === 1 && div.querySelector('picture')) div.className = 'cards-card-image';
      else div.className = 'cards-card-body';
    });
    ul.append(li);
  });
  ul.querySelectorAll('picture > img').forEach((img) => img.closest('picture').replaceWith(createOptimizedPicture(img.src, img.alt, false, [{ width: '750' }])));
  block.replaceChildren(ul);
}

export default function decorate(block) {
  if (block.classList.contains('media')) decorateMedia(block);
  else if (block.classList.contains('pricing')) decoratePricing(block);
  else decorateDefault(block);
}
