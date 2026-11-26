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
    // the cell holds the logo image, usually wrapped in <p>/<div> and optionally
    // a link. Pull out the picture/img and its wrapping <a> (which carries the
    // partner URL) directly; ignore the wrappers and any stray label text.
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
 * packages — the package cards option of pricing (coachtennis "Packages for Every Tennis
 * Coach"). One row per tier:
 *   cell 1: [label paragraph, e.g. "Most popular"] · icon paragraph · tier name (heading) ·
 *           price paragraph ("$49/yr": the part from "/" is the period) · tagline (heading)
 *           · CTA link · feature list
 *   cell 2: the tier accent — blue, lime or green (empty / anything else = white)
 * A tier with a label is the highlighted card (its CTA filled in the accent colour).
 */
const PACKAGE_ACCENTS = ['blue', 'lime', 'green'];

function decoratePackages(block) {
  const ul = document.createElement('ul');
  [...block.children].forEach((row) => {
    const [cell, accentCell] = row.children;
    if (!cell) return;
    const li = document.createElement('li');
    li.className = 'cards-packages-card';
    const accent = (accentCell?.textContent || '').trim().toLowerCase();
    li.classList.add(`cards-packages-${PACKAGE_ACCENTS.includes(accent) ? accent : 'white'}`);
    const parts = [...cell.children];
    const name = parts.find((e) => /^H[1-6]$/.test(e.tagName));
    const iconP = parts.find((e) => e.tagName === 'P' && e.querySelector('img') && !e.textContent.trim());
    const ctaP = parts.find((e) => e.tagName === 'P' && e.querySelector('a'));
    const list = parts.find((e) => /^(UL|OL)$/.test(e.tagName));
    const textPs = parts.filter((e) => e.tagName === 'P' && e !== iconP && e !== ctaP && e.textContent.trim());
    const at = (e) => parts.indexOf(e);
    const first = iconP || name;
    // the label comes before the icon / name, the price after the name
    const label = first ? textPs.find((p) => at(p) < at(first)) : null;
    const price = name ? textPs.find((p) => p !== label && at(p) > at(name)) : null;
    const tagline = parts.find((e) => /^H[1-6]$/.test(e.tagName) && e !== name);

    if (label) {
      label.className = 'cards-packages-label';
      li.classList.add('featured');
      li.append(label);
    }
    const tier = document.createElement('div');
    tier.className = 'cards-packages-tier';
    if (iconP) { iconP.className = 'cards-packages-icon'; tier.append(iconP); }
    if (name) { name.classList.add('cards-packages-name'); tier.append(name); }
    li.append(tier);
    if (price) {
      price.className = 'cards-packages-price';
      // "$49/yr" → "$49" + the period in its own span
      const text = price.textContent.trim();
      const cut = text.indexOf('/');
      if (cut > 0) {
        const per = document.createElement('span');
        per.className = 'cards-packages-per';
        per.textContent = text.slice(cut);
        price.replaceChildren(text.slice(0, cut), per);
      }
      li.append(price);
    }
    if (tagline) { tagline.classList.add('cards-packages-tagline'); li.append(tagline); }
    if (ctaP) {
      ctaP.className = 'cards-packages-cta';
      const a = ctaP.querySelector('a');
      a.className = 'cards-packages-button';
      ctaP.replaceChildren(a);
      li.append(ctaP);
    }
    if (list) { list.className = 'cards-packages-features'; li.append(list); }
    ul.append(li);
  });
  ul.querySelectorAll('.cards-packages-icon picture > img').forEach((img) => {
    img.closest('picture').replaceWith(createOptimizedPicture(img.src, img.alt, false, [{ width: '80' }]));
  });
  block.replaceChildren(ul);
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
  const rows = [...block.children];

  // The last two rows are the container-level footer: an "Equivalency Chart"
  // strip (has a link) and a "Notes:" paragraph. Pull them out of the card grid
  // and render them below the grid, inside the shared container.
  let notesRow = null;
  let equivRow = null;
  const isSingleCellText = (row) => row.children.length === 1
    && !row.querySelector('picture, img, ul, ol, h1, h2, h3, h4, h5, h6');
  const last = rows[rows.length - 1];
  const penultimate = rows[rows.length - 2];
  if (last && isSingleCellText(last) && /^notes:/i.test(last.textContent.trim())) {
    notesRow = rows.pop();
  }
  if (penultimate && isSingleCellText(penultimate) && penultimate.querySelector('a')) {
    [equivRow] = rows.splice(rows.indexOf(penultimate), 1);
  }

  rows.forEach((row) => {
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
    if (isComingSoon) {
      li.classList.add('is-coming-soon');
      // the flame graphic: an authored body image, else the component's own flame
      // (source: built into the cost-card component, not authored)
      let flame = body.querySelector('picture, img');
      if (!flame) {
        const img = document.createElement('img');
        img.src = `${window.hlx?.codeBasePath || ''}/icons/flame-ball.svg`;
        img.alt = '';
        img.width = 161;
        img.height = 53;
        img.loading = 'lazy';
        const p = document.createElement('p');
        p.append(img);
        const title = body.querySelector('h1, h2, h3, h4, h5, h6');
        if (title) title.after(p); else body.prepend(p);
        flame = img;
      }
      const p = flame.closest('p') || flame;
      p.classList.add('cards-comparison-flame');
    }

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
    let footer = null;
    if (totalLabel) {
      footer = document.createElement('div');
      footer.className = 'cards-comparison-total';
      const totalValue = totalLabel.nextElementSibling;
      body.append(footer);
      footer.append(totalLabel);
      if (totalValue && /\$/.test(totalValue.textContent)) footer.append(totalValue);
    }

    // Rebuild the source's box structure: [title][subtitle][price-row][desc][total].
    // price-row wraps the PER YEAR pill + price; desc wraps the module label, the
    // modules list and the workshop-cost lines in a 6px-gap flex column. The
    // per-block bottom margins + the desc gap give the source's airy rhythm.
    if (perYear && priceEl) {
      const priceRow = document.createElement('div');
      priceRow.className = 'cards-comparison-price-row';
      perYear.replaceWith(priceRow);
      priceRow.append(perYear, priceEl);

      // everything between the price-row and the total footer is the description
      const desc = document.createElement('div');
      desc.className = 'cards-comparison-desc';
      let node = priceRow.nextElementSibling;
      while (node && node !== footer) {
        const next = node.nextElementSibling;
        desc.append(node);
        node = next;
      }
      if (footer) body.insertBefore(desc, footer);
      else body.append(desc);
    }

    li.append(body);
    ul.append(li);
  });

  // desktop shows every tier on one row: the CSS column count = the tier count
  block.style.setProperty('--cards-count', String(ul.children.length || 4));

  // the equivalency strip is the panel's bottom section (stays inside the block).
  const parts = [ul];
  if (equivRow) {
    const equiv = document.createElement('div');
    equiv.className = 'cards-comparison-equivalency';
    while (equivRow.firstElementChild) {
      const cell = equivRow.firstElementChild;
      while (cell.firstChild) equiv.append(cell.firstChild);
      cell.remove();
    }
    parts.push(equiv);
  }

  block.replaceChildren(...parts);

  // the "Notes:" paragraph sits OUTSIDE the grey panel — insert it after the
  // block, in the section wrapper.
  if (notesRow) {
    const notes = document.createElement('div');
    notes.className = 'cards-comparison-notes';
    while (notesRow.firstElementChild) {
      const cell = notesRow.firstElementChild;
      while (cell.firstChild) notes.append(cell.firstChild);
      cell.remove();
    }
    if (block.parentElement) block.after(notes);
    else block.append(notes);
  }

  block.querySelectorAll('picture > img').forEach((img) => {
    // SVG logos/flame stay as-is; only raster images get optimized <picture>.
    if (/\.svg(\?|$)/i.test(img.src)) return;
    img.closest('picture').replaceWith(createOptimizedPicture(img.src, img.alt, false, [{ width: '400' }]));
  });
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

    // the article link (from the title) becomes the card's whole-tile link target;
    // reproduce the source's lime arrow affordance sitting between image and body.
    const titleLink = heading && heading.querySelector('a');
    const cta = document.createElement('div');
    cta.className = 'cards-news-cta-wrapper';
    const arrow = document.createElement(titleLink ? 'a' : 'span');
    arrow.className = 'cards-news-arrow';
    arrow.setAttribute('aria-hidden', 'true');
    arrow.tabIndex = -1;
    if (titleLink) arrow.href = titleLink.href;
    cta.append(arrow);

    if (imageDiv) li.append(cta);
    li.append(body);
    ul.append(li);
  });

  ul.querySelectorAll('picture > img').forEach((img) => {
    img.closest('picture').replaceWith(createOptimizedPicture(img.src, img.alt, false, [{ width: '750' }]));
  });

  block.replaceChildren(ul);
}

/*
 * quote — a grid of testimonial cards (source: "What Others Are Saying" on the
 * coaching-community summit page). Each card is a dark rounded panel holding an
 * italic quote, a full-width divider, then the attribution name + role/org.
 * 3-up from tablet up, 1-up on mobile.
 * Authoring (one row per card): a single cell with
 *   - the quote (first paragraph),
 *   - the attribution name (2nd-to-last paragraph),
 *   - the role/org (last paragraph).
 */
function decorateQuote(block) {
  const ul = document.createElement('ul');

  [...block.children].forEach((row) => {
    const li = document.createElement('li');
    li.className = 'cards-quote-card';
    // pull the paragraphs out of the (single) authored cell
    const cell = row.firstElementChild && row.children.length === 1 ? row.firstElementChild : row;
    const paras = [...cell.querySelectorAll('p')];

    // last two paragraphs = attribution (name + role); the rest = the quote
    const role = paras.pop();
    const name = paras.pop();
    const quoteParas = paras;

    const quote = document.createElement('div');
    quote.className = 'cards-quote-text';
    quoteParas.forEach((p) => quote.append(p));
    li.append(quote);

    const hr = document.createElement('hr');
    hr.className = 'cards-quote-divider';
    li.append(hr);

    const attribution = document.createElement('div');
    attribution.className = 'cards-quote-attribution';
    if (name) { name.classList.add('cards-quote-name'); attribution.append(name); }
    if (role) { role.classList.add('cards-quote-role'); attribution.append(role); }
    li.append(attribution);

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

/**
 * icons — small-icon feature cards on the landing pages ("Benefits of Becoming a USTA
 * Tennis Coaching Mentor", "Summit Benefits & Highlights"): dark rounded cards, each =
 * a small icon, a bold title and a short description. One authored row per card, one
 * cell: icon paragraph, title heading, description paragraph(s).
 * @param {Element} block the cards block
 */
function decorateIcons(block) {
  const ul = document.createElement('ul');
  [...block.children].forEach((row) => {
    const li = document.createElement('li');
    li.className = 'cards-icons-card';
    const cell = row.firstElementChild || row;
    li.append(...cell.childNodes);
    // a row holding only a picture is a PHOTO tile between the cards (coachtennis "Why
    // Join": card · photo · card / photo · card · photo), not an icon card
    const pictures = li.querySelectorAll('picture, img:not(picture img)');
    if (pictures.length === 1 && !li.textContent.trim()) {
      li.className = 'cards-icons-photo';
      li.replaceChildren(pictures[0]);
      ul.append(li);
      return;
    }
    const iconP = [...li.children].find((e) => e.tagName === 'P' && e.querySelector('img, picture') && !e.textContent.trim());
    if (iconP) iconP.className = 'cards-icons-image';
    ul.append(li);
  });
  ul.querySelectorAll('.cards-icons-photo picture > img').forEach((img) => {
    img.closest('picture').replaceWith(createOptimizedPicture(img.src, img.alt, false, [{ width: '750' }]));
  });
  block.replaceChildren(ul);
}

export default function decorate(block) {
  if (block.classList.contains('icons')) decorateIcons(block);
  else if (block.classList.contains('media')) decorateMedia(block);
  else if (block.classList.contains('logos')) decorateLogos(block);
  else if (block.classList.contains('pricing') && block.classList.contains('packages')) decoratePackages(block);
  else if (block.classList.contains('pricing')) decoratePricing(block);
  else if (block.classList.contains('course')) decorateCourse(block);
  else if (block.classList.contains('text')) decorateText(block);
  else if (block.classList.contains('profile')) decorateProfile(block);
  else if (block.classList.contains('comparison')) decorateComparison(block);
  else if (block.classList.contains('news')) decorateNews(block);
  else if (block.classList.contains('quote')) decorateQuote(block);
  else decorateDefault(block);
}
