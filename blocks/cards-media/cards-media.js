import { createOptimizedPicture } from '../../scripts/aem.js';

/**
 * cards-media — a row of repeating editorial cards, each with a photo, a
 * heading, and a descriptive paragraph. One authored row per card.
 *
 * @param {Element} block the cards-media block element
 */
export default function decorate(block) {
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
