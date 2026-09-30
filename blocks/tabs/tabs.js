// eslint-disable-next-line import/no-unresolved
import { toClassName, loadBlock } from '../../scripts/aem.js';

/*
 * Compound Tabs -> Form: a tab panel whose only content is a link to a form
 * sheet (/forms/{name}.json) renders that form. EDS never decorates blocks
 * nested inside a block, so build the form block here and load it directly.
 * The tabs block's variant classes (e.g. "application") are passed on, so
 * "Tabs (application)" renders "Form (application)" panels.
 * decorateBlock() is deliberately not used: it would tag the tabs section as a
 * form-container and pull in the standalone form section styles.
 */
function decorateFormPanel(block, panel) {
  const links = panel.querySelectorAll('a[href]');
  if (links.length !== 1 || panel.textContent.trim() !== links[0].textContent.trim()) return null;
  const link = links[0];
  const { pathname } = new URL(link.href, window.location.href);
  if (!/^\/forms\/.+\.json$/.test(pathname)) return null;

  const variants = [...block.classList].filter((c) => !['tabs', 'block'].includes(c));
  const form = document.createElement('div');
  form.classList.add('form', ...variants, 'block');
  form.dataset.blockName = 'form';
  form.dataset.blockStatus = 'initialized';
  const row = document.createElement('div');
  const cell = document.createElement('div');
  cell.append(link);
  row.append(cell);
  form.append(row);
  panel.replaceChildren(form);
  return loadBlock(form);
}

// "#tab=educationequivalencyapplication" (the source site's deep-link format)
// preselects the tab whose id matches, ignoring hyphens.
function getHashTab() {
  const match = window.location.hash.match(/tab=([\w-]+)/);
  return match ? match[1].replace(/-/g, '').toLowerCase() : null;
}

// Normalise a pathname for comparison: drop a trailing ".html" and any trailing
// slash so "/foo", "/foo.html" and "/foo/" all compare equal.
function normalisePath(path) {
  try {
    const { pathname } = new URL(path, window.location.origin);
    return pathname.replace(/\.html$/, '').replace(/\/$/, '') || '/';
  } catch (e) {
    return path;
  }
}

/*
 * Navigation tabs: when each tab label is a link, the tabs behave as a set of
 * sibling pages. The same block is authored identically on every page; the tab
 * whose link matches the current URL is marked active and its panel shown,
 * while the other tabs navigate to their pages when clicked. This keeps the
 * pill control visually consistent across all the sample pages.
 */
function decorateNav(block, rows) {
  const tablist = document.createElement('nav');
  tablist.className = 'tabs-list';
  tablist.setAttribute('aria-label', 'Section navigation');

  const current = normalisePath(window.location.pathname);

  rows.forEach((row, i) => {
    const label = row.firstElementChild;
    const link = label.querySelector('a');
    const id = toClassName(link.textContent);
    const target = normalisePath(link.getAttribute('href'));
    // Match on suffix so the same content resolves whether it is served at the
    // site root (/drafts/...) or behind a mount prefix (/content/drafts/...).
    const isActive = current === target
      || current.endsWith(target)
      || target.endsWith(current);

    // decorate tabpanel
    const tabpanel = block.children[i];
    tabpanel.className = 'tabs-panel';
    tabpanel.id = `tabpanel-${id}`;
    tabpanel.setAttribute('aria-hidden', !isActive);
    tabpanel.setAttribute('aria-labelledby', `tab-${id}`);
    tabpanel.setAttribute('role', 'tabpanel');

    // build tab link (styled like the pill button)
    const tab = link.cloneNode(true);
    tab.className = 'tabs-tab';
    tab.id = `tab-${id}`;
    tab.setAttribute('aria-current', isActive ? 'page' : 'false');
    if (isActive) tab.setAttribute('aria-selected', 'true');
    tablist.append(tab);

    label.remove();
  });

  block.prepend(tablist);
}

// Tab label content without the authored <p> wrapper (a <p> is not valid
// inside a <button>).
function getLabelNodes(tab) {
  const only = tab.children.length === 1 && tab.firstElementChild.tagName === 'P'
    ? tab.firstElementChild : tab;
  return [...only.childNodes];
}

export default async function decorate(block) {
  const rows = [...block.children];

  // If every tab label is a link, render the block as page navigation.
  const isNav = rows.length
    && rows.every((row) => row.firstElementChild && row.firstElementChild.querySelector('a'));
  if (isNav) {
    decorateNav(block, rows);
    return;
  }

  // build tablist (the dark rounded pill track)
  const tablist = document.createElement('div');
  tablist.className = 'tabs-list';
  tablist.setAttribute('role', 'tablist');

  // decorate tabs and tabpanels
  const tabs = rows.map((child) => child.firstElementChild);
  const ids = tabs.map((tab) => toClassName(tab.textContent));
  const buttons = [];
  const panels = [];

  // WAI-ARIA tabs: only the selected tab is in the tab order (roving tabindex).
  const select = (index, { focus = false, updateHash = false } = {}) => {
    buttons.forEach((button, i) => {
      const isSelected = i === index;
      button.setAttribute('aria-selected', isSelected);
      button.tabIndex = isSelected ? 0 : -1;
      panels[i].setAttribute('aria-hidden', !isSelected);
    });
    if (focus) buttons[index].focus();
    // same deep-link format as the source site; replaceState = no jump, no history spam
    if (updateHash) {
      window.history.replaceState(null, '', `#tab=${ids[index].replace(/-/g, '')}`);
    }
  };
  const findHashTab = () => {
    const hashTab = getHashTab();
    return hashTab ? ids.findIndex((id) => id.replace(/-/g, '') === hashTab) : -1;
  };

  const formLoads = [];
  tabs.forEach((tab, i) => {
    const id = ids[i];

    // decorate tabpanel
    const tabpanel = block.children[i];
    tabpanel.className = 'tabs-panel';
    tabpanel.id = `tabpanel-${id}`;
    tabpanel.setAttribute('aria-labelledby', `tab-${id}`);
    tabpanel.setAttribute('role', 'tabpanel');
    panels.push(tabpanel);

    // build tab button
    const button = document.createElement('button');
    button.className = 'tabs-tab';
    button.id = `tab-${id}`;
    button.append(...getLabelNodes(tab));
    button.setAttribute('aria-controls', `tabpanel-${id}`);
    button.setAttribute('role', 'tab');
    button.setAttribute('type', 'button');
    button.addEventListener('click', () => select(i, { updateHash: true }));
    buttons.push(button);
    tablist.append(button);
    tab.remove();

    const formLoad = decorateFormPanel(block, tabpanel);
    if (formLoad) formLoads.push(formLoad);
    // a panel with no focusable content must itself be reachable (APG)
    else if (!tabpanel.querySelector('a[href], button, input, select, textarea, [tabindex]')) {
      tabpanel.tabIndex = 0;
    }
  });

  // Arrow keys move + activate (automatic activation, as on the source); Home/End jump.
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

  // back/forward or an in-page "#tab=…" link switches tabs too
  window.addEventListener('hashchange', () => {
    const index = findHashTab();
    if (index >= 0) select(index);
  });

  select(Math.max(0, findHashTab()));
  block.prepend(tablist);
  await Promise.all(formLoads);
}
