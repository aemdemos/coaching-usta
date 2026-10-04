/* eslint-disable */
/* global WebImporter */
/**
 * Parser: the news-article footer row (topic tags + share icons) → `Tags` + `Social`.
 * Source: one flex `.container` with a `.tags` component (Vue `.v-tags`) and a
 * `.socialmediasharing` component (Vue `.v-social-media-sharing`).
 *   - Tags: only the label is authored ("Topic Tags:"); the tags themselves come
 *     from the page's Keywords metadata at runtime, exactly like the source.
 *   - Social: label + one row per network, in source order (img[data-id]).
 * `element` = the row container.
 */
const NETWORK = { facebook: 'facebook', twitter: 'x', x: 'x', linkedin: 'linkedin' };

export default function parse(element, { document }) {
  const out = [];
  // the tags component is imported even when the page has no keywords: the source
  // still renders it (an empty 24px box above the share block on phones)
  const tagsLabel = element.querySelector('.v-tags__title');
  if (element.querySelector('.tags')) {
    out.push(WebImporter.Blocks.createBlock(document, {
      name: 'Tags',
      cells: [[tagsLabel ? tagsLabel.textContent.trim() : '']],
    }));
  }
  const share = element.querySelector('.v-social-media-sharing');
  if (share) {
    const label = share.querySelector('.v-social-media-sharing__title');
    const nets = [...share.querySelectorAll('[data-id]')]
      .map((i) => NETWORK[(i.getAttribute('data-id') || '').toLowerCase()])
      .filter(Boolean);
    out.push(WebImporter.Blocks.createBlock(document, {
      name: 'Social',
      cells: [[label ? label.textContent.trim() : ''], ...nets.map((n) => [n])],
    }));
  }
  if (out.length) element.replaceWith(...out);
}
