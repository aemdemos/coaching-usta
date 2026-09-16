// eslint-disable-next-line import/no-unresolved
import { toClassName } from '../../scripts/aem.js';

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
  tabs.forEach((tab, i) => {
    const id = toClassName(tab.textContent);

    // decorate tabpanel
    const tabpanel = block.children[i];
    tabpanel.className = 'tabs-panel';
    tabpanel.id = `tabpanel-${id}`;
    tabpanel.setAttribute('aria-hidden', !!i);
    tabpanel.setAttribute('aria-labelledby', `tab-${id}`);
    tabpanel.setAttribute('role', 'tabpanel');

    // build tab button
    const button = document.createElement('button');
    button.className = 'tabs-tab';
    button.id = `tab-${id}`;
    button.innerHTML = tab.innerHTML;
    button.setAttribute('aria-controls', `tabpanel-${id}`);
    button.setAttribute('aria-selected', !i);
    button.setAttribute('role', 'tab');
    button.setAttribute('type', 'button');
    button.addEventListener('click', () => {
      block.querySelectorAll('[role=tabpanel]').forEach((panel) => {
        panel.setAttribute('aria-hidden', true);
      });
      tablist.querySelectorAll('button').forEach((btn) => {
        btn.setAttribute('aria-selected', false);
      });
      tabpanel.setAttribute('aria-hidden', false);
      button.setAttribute('aria-selected', true);
    });
    tablist.append(button);
    tab.remove();
  });

  block.prepend(tablist);
}
