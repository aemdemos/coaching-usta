/*
 * Discussion Boards block (custom widget → static, source-faithful).
 * Source: https://www.ustacoaching.com/en/home/coaching-community.html
 * "Now Live: Engage in our Discussion Boards" section.
 *
 * A two-part panel on a dark rounded container: an intro column (heading +
 * description + "Access" CTA) beside a stacked list of dark discussion cards.
 * The content is STATIC (not fed from JSON) — authored in place.
 *
 * Authoring model (table block):
 *   Row 1 (intro)      : a single cell holding the <h2> (with *Live* → lime),
 *                        the description paragraph, and the "Access" link.
 *   Rows 2..n (cards)  : two cells — card title | card body.
 * The intro row is identified by the presence of a heading; every other row
 * is treated as a card.
 */
export default function decorate(block) {
  const rows = [...block.children];

  const intro = document.createElement('div');
  intro.className = 'discussion-boards-intro';

  const cards = document.createElement('div');
  cards.className = 'discussion-boards-cards';

  rows.forEach((row) => {
    const cells = [...row.children];

    if (row.querySelector('h1, h2, h3, h4, h5, h6')) {
      // Intro row: move all content into the intro column.
      intro.append(...cells[0].childNodes);
      return;
    }

    // Card row: title | body.
    const card = document.createElement('div');
    card.className = 'discussion-boards-card';

    const [titleCell, bodyCell] = cells;
    if (titleCell) {
      let title = titleCell.querySelector('h1, h2, h3, h4, h5, h6');
      if (!title) {
        title = document.createElement('h3');
        // Unwrap a single wrapping <p> (EDS wraps loose cell text in <p>) so the
        // heading's own type styles apply — otherwise <h3><p>…</p></h3> renders
        // the inner <p> at body size, shrinking the card title.
        const sole = titleCell.children.length === 1
          && titleCell.firstElementChild.tagName === 'P'
          ? titleCell.firstElementChild : null;
        title.append(...(sole || titleCell).childNodes);
      }
      card.append(title);
    }
    if (bodyCell) {
      let body = bodyCell.querySelector('p');
      if (!body) {
        body = document.createElement('p');
        body.append(...bodyCell.childNodes);
      }
      card.append(body);
    }

    cards.append(card);
  });

  // Style the CTA as the site's lime pill button (in case runtime button
  // decoration didn't fire for a bare link inside the block).
  const cta = intro.querySelector('a[href]');
  if (cta) {
    if (!cta.classList.contains('button')) cta.classList.add('button');
    // Unwrap the CTA's wrapping <p> so the button is a direct flex child of the
    // intro column — otherwise the <p>'s own top margin compounds with the
    // button's, inflating the source's description→CTA gap.
    const ctaParent = cta.parentElement;
    if (ctaParent && ctaParent !== intro && ctaParent.tagName === 'P'
      && ctaParent.children.length === 1) {
      ctaParent.replaceWith(cta);
    }
  }

  block.replaceChildren(intro, cards);

  // Escape the site's 1200px content container: the source panel is nearly
  // full-width (max 1408px, header-tracking side gutters). `.full-width`
  // removes the wrapper's max-width/padding; the block re-imposes the source
  // container in CSS.
  const wrapper = block.closest('.discussion-boards-wrapper');
  if (wrapper) wrapper.classList.add('full-width');
}
