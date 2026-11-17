/*
 * toc — a tab set over whole page SECTIONS (pattern: foundation-usta `toc-profile`).
 * Reproduces the source's coaching tabs (`core-tabs__coaching`, e.g. coaching-workshops
 * "ONLINE WEBINARS": Upcoming / Recorded Webinars): clicking a tab shows ONLY its target
 * section and hides the other targets. Because the targets are whole sections (not panels
 * nested in one block), a tab can hold ANY blocks (Columns (promo) rows, default content…)
 * with no block nested inside another.
 *
 * Authoring — one row per tab:   label | anchor
 * The anchor is the target section's Section Metadata `toc-anchor` (falls back to a slug of
 * the label; a section whose first heading matches the label's words is also bound).
 *
 * Deep links match the source: `#tab=<label without spaces/punctuation>` (e.g.
 * `#tab=recordedwebinars`) opens that tab on load (no scroll) or on a hash change (the strip
 * is scrolled to the middle of the viewport); the URL is kept in that form as tabs change
 * (history entry replaced, no scroll jump).
 */

function slugify(str) {
  return (str || '')
    .toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

// compact key used in the source's deep links: "Recorded Webinars" → "recordedwebinars"
const tabKey = (str) => slugify(str).replace(/-/g, '');

function entryFromHash(hash, entries) {
  let value = (hash || '').replace(/^#/, '');
  try {
    value = decodeURIComponent(value);
  } catch (e) {
    return null;
  }
  value = value.replace(/^tab=/i, '');
  if (!value) return null;
  const key = tabKey(value);
  return entries.find((entry) => entry.key === key || tabKey(entry.anchor) === key) || null;
}

export default function decorate(block) {
  const entries = [...block.children].map((row) => {
    const [labelCell, anchorCell] = row.children;
    const label = labelCell ? labelCell.textContent.trim() : '';
    if (!label) return null;
    const anchor = slugify(anchorCell && anchorCell.textContent) || slugify(label);
    return { label, anchor, key: tabKey(label) };
  }).filter(Boolean);
  if (!entries.length) return;

  // bind each entry to its target section: `data-toc-anchor` (Section Metadata `toc-anchor`)
  // first, else the first unclaimed section whose leading heading contains the label's words
  const main = block.closest('main') || document;
  const sections = [...main.querySelectorAll(':scope > .section')];
  const own = block.closest('.section');
  const claimed = new Set();
  entries.forEach((entry) => {
    let target = sections.find((s) => s !== own && slugify(s.dataset.tocAnchor) === entry.anchor);
    if (!target) {
      const tokens = entry.anchor.split('-').filter(Boolean);
      target = sections.find((s) => {
        if (s === own || claimed.has(s) || s.dataset.tocAnchor) return false;
        const h = s.querySelector('h1, h2, h3, h4');
        return !!h && tokens.every((t) => slugify(h.textContent).includes(t));
      });
    }
    if (target) { entry.section = target; claimed.add(target); }
  });

  const uid = `toc-${Math.random().toString(36).slice(2, 8)}`;
  const tablist = document.createElement('div');
  tablist.className = 'toc-list';
  tablist.setAttribute('role', 'tablist');

  const buttons = entries.map((entry, i) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'toc-tab';
    button.id = `${uid}-tab-${i}`;
    button.setAttribute('role', 'tab');
    button.textContent = entry.label;
    if (entry.section) {
      const panelId = entry.section.id || `${uid}-panel-${i}`;
      entry.section.id = panelId;
      entry.section.classList.add('toc-panel');
      entry.section.setAttribute('role', 'tabpanel');
      entry.section.setAttribute('aria-labelledby', button.id);
      button.setAttribute('aria-controls', panelId);
    }
    tablist.append(button);
    return button;
  });

  const select = (index, { focus = false, updateHash = false } = {}) => {
    entries.forEach((entry, i) => {
      const on = i === index;
      buttons[i].setAttribute('aria-selected', on);
      buttons[i].tabIndex = on ? 0 : -1;
      if (entry.section) entry.section.hidden = !on;
    });
    if (focus) buttons[index].focus({ preventScroll: true });
    if (updateHash) {
      const hash = `#tab=${entries[index].key}`;
      if (window.location.hash !== hash) {
        window.history.replaceState(window.history.state, '', `${window.location.pathname}${window.location.search}${hash}`);
      }
    }
  };

  buttons.forEach((button, i) => button.addEventListener('click', () => select(i, { updateHash: true })));

  // arrow keys move + activate (automatic activation, as on the source); Home / End jump
  tablist.addEventListener('keydown', (event) => {
    const current = buttons.indexOf(document.activeElement);
    if (current < 0) return;
    const last = buttons.length - 1;
    const next = {
      ArrowRight: current === last ? 0 : current + 1,
      ArrowLeft: current === 0 ? last : current - 1,
      Home: 0,
      End: last,
    }[event.key];
    if (next === undefined) return;
    event.preventDefault();
    select(next, { focus: true, updateHash: true });
  });

  // a hash change on the open page opens the tab. A NEW `#tab=…` (an in-page link) also brings
  // the strip to the middle of the viewport; back / forward leave the browser's restored scroll
  // position alone (both as on the source). Opening the page with a `#tab=…` link selects the
  // tab without scrolling (source). Where the Navigation API is missing, every change scrolls.
  let traversing = false;
  if (window.navigation) {
    window.navigation.addEventListener('navigate', (event) => {
      traversing = event.navigationType === 'traverse';
    });
  }
  window.addEventListener('hashchange', () => {
    const entry = entryFromHash(window.location.hash, entries);
    const scroll = !traversing;
    traversing = false;
    if (!entry) return;
    select(entries.indexOf(entry));
    if (scroll) tablist.scrollIntoView({ block: 'center' });
  });

  block.replaceChildren(tablist);
  const fromHash = entryFromHash(window.location.hash, entries);
  select(fromHash ? entries.indexOf(fromHash) : 0);
}
