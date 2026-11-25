/* eslint-disable */
/* global WebImporter */
/**
 * Parser: a news-article feature card — a dark rounded card (source
 * `.container.container--padding--medium`, cmp-container background #202020) whose grid
 * holds an image component and a grey-bordered text container
 * (`.container--border--gray`: a heading + copy, with separators between them).
 * First seen on army-veteran-tennis-coach-paul-walker (20 year-by-year cards).
 *
 * → `Columns (feature[, media-N])`: one row, [image] | [heading, copy] — the same block as
 *   the coaching-community "Women's Coaching Cohort" card (blocks/columns/columns.css
 *   "feature"). The only option is the image span (feature-options.js). The source's
 *   per-image crop / focus / visibility settings, its phone-only image copies and the card's
 *   separators are not carried over: in the article frame the block shows the image at its
 *   own shape and uses one standard card rhythm (user decisions 2026-11-23).
 *
 * Two passes, because the card's text components must go through the article's heading
 * and paragraph normalisation first:
 *   markFeatureCards(frame)  — before containerMarginSpacers: tags the cards so their
 *                              container margins don't become Spacers;
 *   parseFeatureCards(frame) — after the text normalisation, before the row parsers
 *                              (which would otherwise take the card image as a row).
 */
import { featureOptions } from './feature-options.js';

const CARD = '.container.container--padding--medium';
const GRAY = 'container--border--gray';

const isPanel = (k) => k.classList.contains('container') && k.classList.contains(GRAY);

const isFeatureCard = (c) => {
  const grid = c.querySelector(':scope > .cmp-container > .aem-Grid');
  if (!grid) return false;
  const kids = [...grid.children];
  return kids.some((k) => k.classList.contains('image') && k.querySelector('img')) && kids.some(isPanel);
};

export function markFeatureCards(frame) {
  frame.querySelectorAll(CARD).forEach((c) => { if (isFeatureCard(c)) c.setAttribute('data-feature-card', ''); });
}

const toImg = (document, src) => {
  const img = document.createElement('img');
  img.src = src.currentSrc || src.getAttribute('src') || '';
  img.alt = src.getAttribute('alt') || '';
  if (src.getAttribute('title')) img.title = src.getAttribute('title');
  return img;
};

export function parseFeatureCards(frame, { document }) {
  frame.querySelectorAll('[data-feature-card]').forEach((card) => {
    const grid = card.querySelector(':scope > .cmp-container > .aem-Grid');
    const imgComp = grid.querySelector(':scope > .image');
    const panel = [...grid.children].find(isPanel);
    const imgDefault = imgComp && (imgComp.querySelector('.cmp-image__image--default') || imgComp.querySelector('img'));
    if (!imgDefault || !panel) return;
    const images = [toImg(document, imgDefault)]; // the default image (a phone-only copy is not carried over)
    // the card's copy in reading order: headings, paragraphs, lists (separators dropped)
    const copy = [];
    panel.querySelectorAll('.cmp-text').forEach((t) => {
      [...t.children].forEach((e) => {
        if (e.classList.contains('cmp-text__icon')) return;
        if (/^(H[1-6]|P|UL|OL|BLOCKQUOTE)$/.test(e.tagName)) copy.push(e);
      });
    });
    // leading / trailing blank lines are the card's authored end spacing — the block has
    // one standard rhythm, so they are dropped (blank lines between paragraphs are already
    // turned into the paragraph gap by the article's text normalisation)
    const blank = (e) => e.tagName === 'P' && !e.querySelector('img, picture') && !e.textContent.replace(/[\s\u00a0\uE000]/g, '');
    while (copy.length && blank(copy[copy.length - 1])) copy.pop();
    while (copy.length && blank(copy[0])) copy.shift();
    if (!copy.length) return;
    const block = WebImporter.Blocks.createBlock(document, {
      name: `Columns (${['feature', ...featureOptions(imgComp)].join(', ')})`,
      cells: [[images, copy]],
    });
    card.replaceWith(block);
  });
}
