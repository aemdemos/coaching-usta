import { createOptimizedPicture } from '../../scripts/aem.js';

/**
 * cards — a row of repeating cards. Variants share this block:
 *   • default  : bordered image + body tile (boilerplate).
 *   • media    : editorial cards — photo, heading, paragraph (transparent).
 *   • pricing  : membership tiers — label, tier name, price, feature list, CTA.
 *   • text     : text-only cards — heading + description, no image
 *                (ustacoaching.com/…/about "OUR PURPOSE" — 3-up on a dark band).
 * The variant is authored as a class on the block (e.g. `cards (media)`), so we
 * dispatch on it here and keep each variant's own inner class names.
 *
 * @param {Element} block the cards block element
 */
function decorateText(block) {
  const ul = document.createElement('ul');

  [...block.children].forEach((row) => {
    const li = document.createElement('li');
    li.className = 'cards-text-card';
    // the cell holds a heading + description paragraph(s). The importer may wrap
    // them in a single <div>; unwrap so the heading and paragraphs are direct
    // children (lets the card's grid rows align headings and bodies across cols).
    const cell = row.children[0] || row;
    while (cell.firstChild) li.append(cell.firstChild);
    if (li.children.length === 1 && li.firstElementChild.tagName === 'DIV') {
      const wrapper = li.firstElementChild;
      while (wrapper.firstChild) li.insertBefore(wrapper.firstChild, wrapper);
      wrapper.remove();
    }
    ul.append(li);
  });

  block.replaceChildren(ul);
}

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
  const tiers = [];

  [...block.children].forEach((row) => {
    const li = document.createElement('li');
    li.className = 'cards-pricing-card';
    while (row.firstElementChild) li.append(row.firstElementChild);

    // The importer wraps a tile's content in a single <div>; unwrap it so the
    // card's own flex column sees the content elements directly (lets the
    // feature list flex-grow and pin the CTA to the card bottom).
    if (li.children.length === 1 && li.firstElementChild.tagName === 'DIV') {
      const wrapper = li.firstElementChild;
      while (wrapper.firstChild) li.insertBefore(wrapper.firstChild, wrapper);
      wrapper.remove();
    }

    // tier name = first heading (h1..h6).
    const heading = li.querySelector('h1, h2, h3, h4, h5, h6');

    // feature list = the ul/ol inside the tile.
    const list = li.querySelector('ul, ol');
    if (list) list.classList.add('cards-pricing-features');

    // price = the standalone paragraph immediately before the feature list
    // (Free / $49/year). Tag it so it (and only it) gets the large price type.
    let price = null;
    if (list) {
      let prev = list.previousElementSibling;
      while (prev && prev.tagName !== 'P') prev = prev.previousElementSibling;
      price = prev;
    }
    if (price) price.classList.add('cards-pricing-price');

    // The last link in a tile is the "select" CTA — mark its container.
    const links = li.querySelectorAll('a');
    const cta = links[links.length - 1];
    if (cta) {
      const container = cta.closest('p') || cta.closest('div') || cta.parentElement;
      if (container) container.classList.add('cards-pricing-cta');
    }

    tiers.push({
      name: heading ? heading.textContent.trim() : '',
      price: price ? price.textContent.trim() : '',
    });
    ul.append(li);
  });

  // Build the mobile tab strip: one button per tier (name + price stacked). On
  // desktop/tablet the strip is hidden (CSS) and all cards show in the grid; on
  // mobile only the active card shows and the strip switches between them.
  const tabs = document.createElement('div');
  tabs.className = 'cards-pricing-tabs';
  tabs.setAttribute('role', 'tablist');
  const cards = [...ul.children];
  tiers.forEach((tier, i) => {
    const tab = document.createElement('button');
    tab.type = 'button';
    tab.className = 'cards-pricing-tab';
    tab.setAttribute('role', 'tab');
    tab.setAttribute('aria-selected', i === 0 ? 'true' : 'false');
    const name = document.createElement('span');
    name.className = 'cards-pricing-tab-name';
    name.textContent = tier.name;
    const price = document.createElement('span');
    price.className = 'cards-pricing-tab-price';
    price.textContent = tier.price;
    tab.append(name, price);
    tab.addEventListener('click', () => {
      [...tabs.children].forEach((t, j) => {
        t.setAttribute('aria-selected', j === i ? 'true' : 'false');
        cards[j].classList.toggle('is-active', j === i);
      });
    });
    tabs.append(tab);
  });

  // first tier active by default (drives the mobile single-panel view)
  cards.forEach((card, i) => card.classList.toggle('is-active', i === 0));

  block.replaceChildren(tabs, ul);
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
  else if (block.classList.contains('text')) decorateText(block);
  else decorateDefault(block);
}
