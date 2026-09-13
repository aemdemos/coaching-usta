/* eslint-disable */
/* global WebImporter */
/**
 * Parser for cards-pricing. Base block: cards (no-images style).
 * Source: https://www.ustacoaching.com/ (.v-tiers pricing switcher)
 * Generated for USTA Coaching homepage migration (da project).
 *
 * EDS "cards (no images)" convention: 1 column, one row per card. Text-only
 * pricing tiles here, so a single cell per row. Target decorate()
 * (blocks/cards-pricing/cards-pricing.js) moves each cell's children into the
 * card, marks the last link as the select CTA, and any <ul>/<ol> as the feature
 * list. Each cell holds, in order: tier name (heading), audience label ("Best
 * for: …"), price, feature list (ul), and a CTA link.
 */
export default function parse(element, { document }) {
  const cards = [...element.querySelectorAll('.v-tiers-card')];

  const cells = [];
  cards.forEach((card) => {
    const content = card.querySelector('.v-tiers-card--content') || card;
    const cellContent = [];

    // Tier name (heading).
    const titleEl = content.querySelector('.v-tiers-card__title');
    if (titleEl && titleEl.textContent.trim()) {
      const h = document.createElement('h3');
      h.textContent = titleEl.textContent.trim();
      cellContent.push(h);
    }

    // Audience label ("Best for: ...").
    const subtitle = content.querySelector('.v-tiers-card__subtitle');
    if (subtitle) {
      [...subtitle.querySelectorAll('p')].forEach((p) => {
        if (p.textContent.trim()) cellContent.push(p);
      });
    }

    // Price.
    const priceEl = content.querySelector('.v-tiers-card__price');
    if (priceEl && priceEl.textContent.trim()) {
      const price = document.createElement('p');
      price.className = 'price';
      price.textContent = priceEl.textContent.trim();
      cellContent.push(price);
    }

    // Feature list (checkmark list).
    const featureList = content.querySelector('.v-tiers-card__description ul, .v-tiers-card__description ol');
    if (featureList) cellContent.push(featureList);

    // CTA — the source uses a <button>; convert to a link so decorate marks it
    // as the select CTA. Prefer an existing anchor if present.
    const anchor = content.querySelector('.v-tiers-card__button-wrapper a[href]');
    const button = content.querySelector('.v-tiers-card__button-wrapper button, .coaching-primary-button');
    if (anchor) {
      cellContent.push(anchor);
    } else if (button && button.textContent.trim()) {
      const link = document.createElement('a');
      link.href = '#';
      link.textContent = button.textContent.trim();
      cellContent.push(link);
    }

    if (cellContent.length) cells.push([cellContent]);
  });

  // Empty-block guard.
  if (!cells.length) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const block = WebImporter.Blocks.createBlock(document, { name: 'cards-pricing', cells });
  element.replaceWith(block);
}
