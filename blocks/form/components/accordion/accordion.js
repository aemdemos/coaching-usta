/**
 * Form accordion component — same authoring contract as the upstream
 * aem-boilerplate-forms `accordion`: a panel (fieldset) with `Custom Type:
 * accordion` whose CHILD fieldsets are the accordion items (the child's Label is
 * the item title). Unlike upstream (click on a bare <legend>, first item open),
 * the toggle is a real <button> inside the legend (keyboard + aria-expanded) and
 * every item starts COLLAPSED, single-open — matching the source
 * (ustacoaching.com Gallagher disclaimer). Styling: accordion.css.
 */

function setExpanded(tab, expanded) {
  const button = tab.querySelector(':scope > legend .accordion-toggle');
  const content = tab.querySelector(':scope > .accordion-content');
  tab.classList.toggle('accordion-collapse', !expanded);
  button?.setAttribute('aria-expanded', expanded);
  if (content) content.hidden = !expanded;
}

function toggleItem(panel, tab) {
  const open = tab.classList.contains('accordion-collapse');
  panel.querySelectorAll(':scope > fieldset').forEach((otherTab) => {
    if (otherTab !== tab) setExpanded(otherTab, false);
  });
  setExpanded(tab, open);
}

export default function decorate(panel) {
  panel.classList.add('accordion');
  panel.querySelectorAll(':scope > fieldset').forEach((tab, index) => {
    const legend = tab.querySelector(':scope > legend');
    if (!legend) return;
    tab.dataset.index = index;
    legend.classList.add('accordion-legend');

    const content = document.createElement('div');
    content.className = 'accordion-content';
    content.id = `${tab.id || tab.dataset.id}-content`;
    content.append(...[...tab.children].filter((child) => child !== legend));
    tab.append(content);

    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'accordion-toggle';
    button.setAttribute('aria-controls', content.id);
    const title = document.createElement('span');
    title.className = 'accordion-title';
    title.append(...legend.childNodes);
    const icon = document.createElement('span');
    icon.className = 'accordion-icon';
    icon.setAttribute('aria-hidden', 'true');
    button.append(title, icon);
    legend.replaceChildren(button);

    button.addEventListener('click', () => toggleItem(panel, tab));
    setExpanded(tab, false);
  });
  return panel;
}
