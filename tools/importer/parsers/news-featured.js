/* eslint-disable */
/* global WebImporter */
/**
 * Parser: the news "featured article" tile (`.aem-featured-article`, Vue
 * `.v-news-related-tile--simple`).
 *
 * The source tile is dynamic (Vue `v-featured-article`: the news section's featured
 * story, never the current page). Rendered on all 112 articles (2026-10-04):
 *   - 55 EN articles show the SAME tile (FRAGMENT_TILE_TITLE) → authored ONCE as a
 *     fragment (/fragments/news/featured-article); those articles reference it;
 *   - the featured story itself shows a different tile → built inline on the page;
 *   - ES articles render an empty tile → nothing is imported.
 * Fragment mode builds the shared fragment's `Columns (media, dark)` (image |
 * title, description, CTA).
 *
 * The tile's CTA is a JS <button> with no href (navigation happens in Vue), so its
 * target can't be read from the DOM. Targets are resolved once by clicking the
 * live tile and recorded here (title → path); extend when the featured story changes.
 */
export const FEATURED_FRAGMENT_PATH = '/fragments/news/featured-article';

/** the tile shared by every article except the featured story itself */
const FRAGMENT_TILE_TITLE = 'Serving Gratitude: Celebrating the Coaches Who Shape Our Game';

const FEATURED_LINKS = {
  // verified 2026-10-04 by clicking the tile on /en/home/news/zina-garrison-…
  'Serving Gratitude: Celebrating the Coaches Who Shape Our Game': '/en/home/news/serving-gratitude-celebrating-tennis-coaches',
  // verified 2026-10-04 by clicking the tile on /en/home/news/serving-gratitude-…
  'Coach’s Journal by Emma Dell – Part 3: Changing Sides of the Net': '/en/home/news/coachs-journal-emma-dell-part-3-changing-sides-net',
};

const tileTitle = (element) => element.querySelector('.v-news-related-tile__title')?.textContent.trim() || '';

export function buildFeaturedTile(element, document) {
  const title = element.querySelector('.v-news-related-tile__title');
  const desc = element.querySelector('.v-news-related-tile__description');
  const img = element.querySelector('.v-news-related-tile__image');
  const ctaBtn = [...element.querySelectorAll('button')].find((b) => b.textContent.trim());
  if (!title || !img) return null;

  const h2 = document.createElement('h2');
  h2.textContent = title.textContent.trim();
  const p = document.createElement('p');
  p.textContent = desc ? desc.textContent.trim() : '';
  const content = [h2, p];
  const href = FEATURED_LINKS[h2.textContent];
  if (ctaBtn && href) {
    const cta = document.createElement('p');
    const a = document.createElement('a');
    a.href = href;
    a.textContent = ctaBtn.textContent.trim();
    cta.append(a);
    content.push(cta);
  }
  const image = document.createElement('img');
  image.src = img.getAttribute('src');
  image.alt = img.getAttribute('alt') || '';
  return WebImporter.Blocks.createBlock(document, {
    name: 'Columns (media, dark)',
    cells: [[image, content]],
  });
}

/**
 * Article mode. Returns false when the tile is empty (nothing to import).
 */
export default function parse(element, { document }) {
  const title = tileTitle(element);
  if (!title) { element.remove(); return false; }
  if (title !== FRAGMENT_TILE_TITLE) {
    const inline = buildFeaturedTile(element, document);
    if (inline) element.replaceWith(inline); else element.remove();
    return !!inline;
  }
  const link = document.createElement('a');
  link.href = FEATURED_FRAGMENT_PATH;
  link.textContent = FEATURED_FRAGMENT_PATH;
  const block = WebImporter.Blocks.createBlock(document, { name: 'Fragment', cells: [[link]] });
  element.replaceWith(block);
  return true;
}
