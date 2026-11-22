/* eslint-disable */
/* global WebImporter */
/**
 * Parser: the news "featured article" tile at the end of every article
 * (`.aem-featured-article`, Vue `.v-news-related-tile--simple`).
 *
 * The source tile is dynamic (Vue `v-featured-article`, defined on the article page
 * template: featured item 0 — the newest featured story — or item 1 on that story
 * itself). On EDS the shared fragment /fragments/news/featured-article holds ONE
 * `Featured Article` block (blocks/featured-article: reads the news index, skips the
 * page it is shown on), so every article references the fragment and the tile follows
 * the index — a featured-story change needs no page edit (decision 2026-11-21).
 *   - article mode: any non-empty source tile → `Fragment /fragments/news/featured-article`
 *     (the featured story itself included — the block skips the current page);
 *   - ES articles render an empty tile → nothing is imported;
 *   - fragment mode (the fragment page): `Featured Article` — Item 1, Button = the source
 *     tile's CTA label.
 */
export const FEATURED_FRAGMENT_PATH = '/fragments/news/featured-article';

const tileTitle = (element) => element.querySelector('.v-news-related-tile__title')?.textContent.trim() || '';

/** the fragment's content: the index-driven Featured Article block */
export function buildFeaturedBlock(element, document) {
  if (!tileTitle(element)) return null;
  const ctaBtn = [...element.querySelectorAll('button')].find((b) => b.textContent.trim());
  const rows = [['Item', '1']];
  if (ctaBtn) rows.push(['Button', ctaBtn.textContent.trim()]);
  return WebImporter.Blocks.createBlock(document, { name: 'Featured Article', cells: rows });
}

/**
 * Article mode. Returns false when the tile is empty (nothing to import).
 */
export default function parse(element, { document }) {
  if (!tileTitle(element)) { element.remove(); return false; }
  const link = document.createElement('a');
  link.href = FEATURED_FRAGMENT_PATH;
  link.textContent = FEATURED_FRAGMENT_PATH;
  const block = WebImporter.Blocks.createBlock(document, { name: 'Fragment', cells: [[link]] });
  element.replaceWith(block);
  return true;
}
