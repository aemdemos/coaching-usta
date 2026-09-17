import { createOptimizedPicture } from '../../scripts/aem.js';

/**
 * cards — a row of repeating cards. Variants share this block:
 *   • default  : bordered image + body tile (boilerplate).
 *   • media    : editorial cards — photo, heading, paragraph (transparent).
 *   • pricing  : membership tiers — label, tier name, price, feature list, CTA.
 *   • logos    : partner/affiliation logo tiles — white rounded squares in a
 *                4-up grid (ustacoaching.com/…/about "Partners & Affiliations").
 * The variant is authored as a class on the block (e.g. `cards (media)`), so we
 * dispatch on it here and keep each variant's own inner class names.
 *
 * @param {Element} block the cards block element
 */
function decorateLogos(block) {
  const ul = document.createElement('ul');

  [...block.children].forEach((row) => {
    const li = document.createElement('li');
    li.className = 'cards-logo-card';
    // the cell holds the logo image, usually wrapped in <p> and optionally a
    // link. Pull out the picture/img and its wrapping <a> (which carries the
    // partner URL) directly; ignore the <p> wrapper and any stray label text.
    const cell = row.children[0] || row;
    const img = cell.querySelector('img');
    if (!img) return;
    const picture = img.closest('picture') || img;
    const link = img.closest('a');
    li.append(link || picture);
    ul.append(li);
  });

  ul.querySelectorAll('picture > img').forEach((img) => {
    img.closest('picture').replaceWith(createOptimizedPicture(img.src, img.alt, false, [{ width: '256' }]));
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

/*
 * course — a grid of course cards (workshops page). Each card: a top image, a
 * bold title, a description, and a blue "duration" pill (3.5 Hours / 2 Days).
 * Authoring (one row per card):
 *   cell 1: image (picture/img)
 *   cell 2: heading + description paragraph(s) + a short duration line (the pill)
 * We tag the parts by class; the LAST short text (≤ a few words, e.g. "2 Days")
 * becomes the pill.
 */
function decorateCourse(block) {
  const ul = document.createElement('ul');

  [...block.children].forEach((row) => {
    const li = document.createElement('li');
    li.className = 'cards-course-card';
    while (row.firstElementChild) li.append(row.firstElementChild);

    // unwrap a single wrapping <div> so the flex column sees the parts directly
    if (li.children.length === 1 && li.firstElementChild.tagName === 'DIV') {
      const wrapper = li.firstElementChild;
      while (wrapper.firstChild) li.insertBefore(wrapper.firstChild, wrapper);
      wrapper.remove();
    }

    // image cell
    const imageDiv = [...li.children].find((d) => d.querySelector && d.querySelector('picture, img'));
    if (imageDiv) imageDiv.className = 'cards-course-image';

    // the remaining content lives in a body wrapper for padding + flex
    const body = document.createElement('div');
    body.className = 'cards-course-body';
    [...li.children].forEach((child) => {
      if (child === imageDiv) return;
      body.append(child);
    });

    // duration pill = the last short paragraph (e.g. "3.5 Hours" / "2 Days")
    const paras = [...body.querySelectorAll('p')];
    const pill = [...paras].reverse().find((p) => {
      const t = p.textContent.trim();
      return t && t.split(/\s+/).length <= 3;
    });
    if (pill) pill.classList.add('cards-course-duration');

    li.append(body);
    ul.append(li);
  });

  ul.querySelectorAll('picture > img').forEach((img) => {
    img.closest('picture').replaceWith(createOptimizedPicture(img.src, img.alt, false, [{ width: '750' }]));
  });

  block.replaceChildren(ul);
}

/*
 * text — a grid of text-only cards ("OUR PURPOSE" on the about page). Each card
 * is just a bold heading + a body paragraph (no image, no CTA). One row per card.
 */
function decorateText(block) {
  const ul = document.createElement('ul');
  [...block.children].forEach((row) => {
    const li = document.createElement('li');
    li.className = 'cards-text-card';
    while (row.firstElementChild) li.append(row.firstElementChild);
    // unwrap a single wrapping div so heading + paragraph sit directly in the li
    if (li.children.length === 1 && li.firstElementChild.tagName === 'DIV') {
      const wrapper = li.firstElementChild;
      while (wrapper.firstChild) li.insertBefore(wrapper.firstChild, wrapper);
      wrapper.remove();
    }
    ul.append(li);
  });
  block.replaceChildren(ul);
}

/*
 * profile — leadership/bio cards with an INTERACTIVE reveal (source: about page
 * "Our Leadership"). Resting: portrait photo on top, then a black bordered panel
 * with the name, a lime role line, and a short bio. On HOVER (desktop) or CLICK
 * (touch) the card animates over 0.3s: the image shrinks, the panel grows and
 * fills lime with black text, a "Bio" label appears, and the bio expands to the
 * full text. Card total height is fixed so the layout never reflows.
 * Authoring (one row per card):
 *   cell 1: portrait image
 *   cell 2: name (heading), role (p), short bio (p), "Bio" (heading), full bio (p)
 *           — the 2nd heading separates the resting short bio from the open state;
 *             paragraphs before it are the short bio, after it the full bio.
 */
function decorateProfile(block) {
  const ul = document.createElement('ul');

  [...block.children].forEach((row) => {
    // the <li> stays a plain listitem; an inner element is the interactive card
    // (role="button" on the <li> itself would strip its listitem role).
    const li = document.createElement('li');
    const card = document.createElement('div');
    card.className = 'cards-profile-card';
    while (row.firstElementChild) card.append(row.firstElementChild);

    // image cell
    const imageDiv = [...card.children].find((d) => d.querySelector && d.querySelector('picture, img'));
    if (imageDiv) imageDiv.className = 'cards-profile-image';

    // body = everything else, wrapped for padding + background
    const body = document.createElement('div');
    body.className = 'cards-profile-body';
    [...card.children].forEach((child) => {
      if (child === imageDiv) return;
      // unwrap a single content div so its parts sit directly in the body
      if (child.tagName === 'DIV') {
        while (child.firstChild) body.append(child.firstChild);
        child.remove();
      } else {
        body.append(child);
      }
    });

    // name = first heading; role = first paragraph after it.
    const headings = [...body.querySelectorAll('h1, h2, h3, h4, h5, h6')];
    const name = headings[0];
    if (name) name.classList.add('cards-profile-name');
    const role = name ? name.nextElementSibling : body.querySelector('p');
    if (role && role.tagName === 'P') role.classList.add('cards-profile-role');

    // a SECOND heading is the "Bio" label; it splits the short bio (paragraphs
    // before it) from the full bio (paragraphs after it).
    const bioLabel = headings[1] || null;
    if (bioLabel) bioLabel.classList.add('cards-profile-bio-label');
    let seenLabel = false;
    [...body.children].forEach((child) => {
      if (child === bioLabel) { seenLabel = true; return; }
      if (child.tagName !== 'P' || child === role) return;
      child.classList.add(seenLabel ? 'cards-profile-desc-full' : 'cards-profile-desc-short');
    });

    // make the card an interactive toggle (touch: tap; desktop also has :hover)
    card.setAttribute('role', 'button');
    card.setAttribute('tabindex', '0');
    card.setAttribute('aria-expanded', 'false');
    const toggle = () => {
      const open = card.classList.toggle('is-open');
      card.setAttribute('aria-expanded', open ? 'true' : 'false');
    };
    card.addEventListener('click', toggle);
    card.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle(); }
    });

    card.append(body);
    li.append(card);
    ul.append(li);
  });

  ul.querySelectorAll('picture > img').forEach((img) => {
    img.closest('picture').replaceWith(createOptimizedPicture(img.src, img.alt, false, [{ width: '750' }]));
  });

  block.replaceChildren(ul);
}

/*
 * comparison — certification-tier comparison cards (courses page). 4 columns.
 * An ACTIVE tier card: logo image, a title + "Annual Package Fee" subtitle, a
 * blue "PER YEAR" pill + price, a checkmarked "included modules" list, workshop
 * cost breakdown lines, and a highlighted blue TOTAL footer bar. A COMING-SOON
 * tier shows a disabled/skeleton state (logo + "COMING 202x").
 * Authoring (one row per tier):
 *   cell 1: logo image
 *   cell 2: everything else — headings/paragraphs/list. A card is "coming soon"
 *           when its only text is a "Coming 202x" line (no price/list).
 * The last list/paragraph pair whose text starts with "TOTAL" becomes the footer.
 */
function decorateComparison(block) {
  const ul = document.createElement('ul');

  [...block.children].forEach((row) => {
    const li = document.createElement('li');
    li.className = 'cards-comparison-card';
    while (row.firstElementChild) li.append(row.firstElementChild);

    // logo cell (first cell with an image)
    const logoDiv = [...li.children].find((d) => d.querySelector && d.querySelector('picture, img'));
    if (logoDiv) logoDiv.className = 'cards-comparison-logo';

    // body = the rest
    const body = document.createElement('div');
    body.className = 'cards-comparison-body';
    [...li.children].forEach((child) => {
      if (child === logoDiv) return;
      if (child.tagName === 'DIV') {
        while (child.firstChild) body.append(child.firstChild);
        child.remove();
      } else {
        body.append(child);
      }
    });

    // coming-soon card: text mentions "Coming 202x" and there is no feature list
    const isComingSoon = /coming\s+202\d/i.test(body.textContent) && !body.querySelector('ul, ol');
    if (isComingSoon) li.classList.add('is-coming-soon');

    // the "Annual Package Fee" subtitle = the paragraph right after the title
    const titleEl = body.querySelector('h1, h2, h3, h4, h5, h6');
    if (titleEl && titleEl.nextElementSibling && titleEl.nextElementSibling.tagName === 'P') {
      titleEl.nextElementSibling.classList.add('cards-comparison-subtitle');
    }

    // the feature (included modules) list gets a class + a check marker
    const list = body.querySelector('ul, ol');
    if (list) list.classList.add('cards-comparison-modules');

    // price = the paragraph/heading that looks like "$0 - $249/year"
    const priceEl = [...body.querySelectorAll('p, h1, h2, h3, h4, h5, h6, strong')]
      .find((el) => /\$\s?\d|\/year/i.test(el.textContent) && el.children.length === 0);
    if (priceEl) priceEl.classList.add('cards-comparison-price');

    // a "PER YEAR" label becomes the blue pill
    const perYear = [...body.querySelectorAll('p, span, strong, em')]
      .find((el) => /^per year$/i.test(el.textContent.trim()));
    if (perYear) perYear.classList.add('cards-comparison-peryear');

    // TOTAL footer: a paragraph starting with "TOTAL" and (optionally) the price
    // line right after it. Wrap them into a highlighted footer bar.
    const totalLabel = [...body.querySelectorAll('p, strong')]
      .find((el) => /^total/i.test(el.textContent.trim()));
    if (totalLabel) {
      const footer = document.createElement('div');
      footer.className = 'cards-comparison-total';
      const totalValue = totalLabel.nextElementSibling;
      body.append(footer);
      footer.append(totalLabel);
      if (totalValue && /\$/.test(totalValue.textContent)) footer.append(totalValue);
    }

    li.append(body);
    ul.append(li);
  });

  ul.querySelectorAll('picture > img').forEach((img) => {
    img.closest('picture').replaceWith(createOptimizedPicture(img.src, img.alt, false, [{ width: '400' }]));
  });

  block.replaceChildren(ul);
}

/*
 * news — article/news cards. Each card: a top image (a link over it), a bold
 * title, a publish date, and an excerpt. 2-up grid. Content-driven (authored
 * rows, or auto-populated from a news index elsewhere).
 * Authoring (one row per article):
 *   cell 1: image (optionally wrapped in the article link)
 *   cell 2: title heading (usually a link), a date line, an excerpt paragraph
 * The date is the SHORT paragraph that parses as a date; the rest is the excerpt.
 */
function decorateNews(block) {
  const ul = document.createElement('ul');

  [...block.children].forEach((row) => {
    const li = document.createElement('li');
    li.className = 'cards-news-card';
    while (row.firstElementChild) li.append(row.firstElementChild);

    const imageDiv = [...li.children].find((d) => d.querySelector && d.querySelector('picture, img'));
    if (imageDiv) imageDiv.className = 'cards-news-image';

    const body = document.createElement('div');
    body.className = 'cards-news-body';
    [...li.children].forEach((child) => {
      if (child === imageDiv) return;
      if (child.tagName === 'DIV') {
        while (child.firstChild) body.append(child.firstChild);
        child.remove();
      } else {
        body.append(child);
      }
    });

    const heading = body.querySelector('h1, h2, h3, h4, h5, h6');
    if (heading) heading.classList.add('cards-news-title');

    // date = a short paragraph that parses as a date (e.g. "March 4, 2026")
    const date = [...body.querySelectorAll('p')].find((p) => {
      const t = p.textContent.trim();
      return t.length <= 30 && !Number.isNaN(Date.parse(t));
    });
    if (date) date.classList.add('cards-news-date');

    // remaining paragraph(s) = excerpt
    [...body.querySelectorAll('p')].forEach((p) => {
      if (!p.classList.contains('cards-news-date')) p.classList.add('cards-news-excerpt');
    });

    li.append(body);
    ul.append(li);
  });

  ul.querySelectorAll('picture > img').forEach((img) => {
    img.closest('picture').replaceWith(createOptimizedPicture(img.src, img.alt, false, [{ width: '750' }]));
  });

  block.replaceChildren(ul);
}

function decorateDefault(block) {
  // tag the base variant with a positive class so its CSS is opt-in
  // (`.cards.cards-default …`) rather than an ever-growing
  // `:not(.media, .pricing, …)` exclusion. New variants never carry this class,
  // so base styles can't leak onto them.
  block.classList.add('cards-default');
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
  else if (block.classList.contains('logos')) decorateLogos(block);
  else if (block.classList.contains('course')) decorateCourse(block);
  else if (block.classList.contains('text')) decorateText(block);
  else if (block.classList.contains('profile')) decorateProfile(block);
  else if (block.classList.contains('comparison')) decorateComparison(block);
  else if (block.classList.contains('news')) decorateNews(block);
  else decorateDefault(block);
}
