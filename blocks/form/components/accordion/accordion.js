// Form accordion: child fieldsets are items (Label = title); button toggle, collapsed, single-open

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
