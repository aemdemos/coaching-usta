import { toClassName } from '../../scripts/aem.js';
import { currentPagePath } from '../../scripts/news.js';

/**
 * Article Search — the news search bar (source: AEM "Search" component,
 * .aem-search-bar / Vue v-search-bar): a topic picker, a text field and a submit
 * button. Submitting opens the results page with the query in the URL hash, in the
 * source's format: `#text=<words>&topic-id=<id>&topic-title=<title>` (so links into
 * the source's results page keep working). On the results page itself only the hash
 * changes (the Article Results block listens), and the bar shows the current query.
 *
 * | Article Search                                   |
 * | Label        | Search Coaching News               |  accessible name of the form + field
 * | Placeholder  | Search Coaching News               |
 * | Button       | Go                                 |
 * | Results Page | /en/home/news/search-results (link)|
 * | All Topics   | All                                |  first option (no topic filter)
 * | Topics Label | Topic                              |  optional accessible name of the picker
 * | Topic        | Tennis Programs                    |  optional, repeatable — matches page Tags
 */

/**
 * The search in the URL hash (source format), e.g. `#text=coach&topic-id=all&topic-title=All`.
 * @param {string} [hash]
 * @returns {{text: string, topicId: string, topicTitle: string}}
 */
export function readSearchHash(hash = window.location.hash) {
  const params = new URLSearchParams(hash.replace(/^#/, ''));
  return {
    text: (params.get('text') || '').trim(),
    topicId: (params.get('topic-id') || 'all').trim() || 'all',
    topicTitle: (params.get('topic-title') || '').trim(),
  };
}

let pickerCount = 0;

/**
 * The topic picker (source v-search-bar__topics): a button showing the current topic
 * that opens a white menu of topics over it. Picking a topic or clicking outside closes
 * it. Keyboard: Enter / Space / arrow keys open it, arrows / Home / End move, Enter /
 * Space pick, Escape closes and Tab leaves.
 * @param {{id: string, title: string}[]} topics the topics, "All" first
 * @param {string} [name] optional label read before the current topic ("Topic: All")
 */
function buildTopicPicker(topics, name) {
  pickerCount += 1;
  const id = `article-search-topics-${pickerCount}`;
  let current = 0;
  let active = 0;

  const element = document.createElement('div');
  element.className = 'article-search-picker';

  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'article-search-topics';
  button.id = `${id}-button`;
  button.setAttribute('aria-haspopup', 'listbox');
  button.setAttribute('aria-expanded', 'false');
  button.setAttribute('aria-controls', `${id}-menu`);
  const buttonLabel = document.createElement('span');
  button.append(buttonLabel);
  if (name) {
    const sr = document.createElement('span');
    sr.className = 'article-search-sr';
    sr.textContent = `${name}: `;
    button.prepend(sr);
  }

  const menu = document.createElement('ul');
  menu.className = 'article-search-menu';
  menu.id = `${id}-menu`;
  menu.setAttribute('role', 'listbox');
  menu.tabIndex = -1;
  menu.setAttribute('aria-labelledby', button.id);
  menu.hidden = true;

  const items = topics.map((t, i) => {
    const li = document.createElement('li');
    li.id = `${id}-${i}`;
    li.className = 'article-search-option';
    li.setAttribute('role', 'option');
    li.textContent = t.title;
    menu.append(li);
    return li;
  });

  const render = () => {
    buttonLabel.textContent = topics[current].title;
    items.forEach((li, i) => {
      li.setAttribute('aria-selected', String(i === current));
      li.classList.toggle('active', i === active);
    });
    menu.setAttribute('aria-activedescendant', items[active].id);
  };

  const isOpen = () => !menu.hidden;
  const close = (focusButton) => {
    if (!isOpen()) return;
    menu.hidden = true;
    button.setAttribute('aria-expanded', 'false');
    if (focusButton) button.focus();
  };
  const open = (at = current) => {
    active = at;
    render();
    menu.hidden = false;
    button.setAttribute('aria-expanded', 'true');
    menu.focus();
  };
  const pick = (i) => {
    current = i;
    render();
    close(true);
  };

  button.addEventListener('click', () => (isOpen() ? close(true) : open()));
  button.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      open();
    }
  });

  items.forEach((li, i) => {
    li.addEventListener('click', () => pick(i));
    li.addEventListener('mousemove', () => {
      if (active !== i) {
        active = i;
        render();
      }
    });
  });

  menu.addEventListener('keydown', (e) => {
    const last = items.length - 1;
    const moves = {
      ArrowDown: Math.min(active + 1, last), ArrowUp: Math.max(active - 1, 0), Home: 0, End: last,
    };
    if (e.key in moves) {
      e.preventDefault();
      active = moves[e.key];
      render();
      items[active].scrollIntoView({ block: 'nearest' });
    } else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      pick(active);
    } else if (e.key === 'Escape') {
      e.preventDefault();
      close(true);
    } else if (e.key === 'Tab') {
      close(false);
    }
  });

  document.addEventListener('click', (e) => {
    if (!element.contains(e.target)) close(false);
  });

  element.append(button, menu);
  render();

  return {
    element,
    select(topicId) {
      const i = topics.findIndex((t) => t.id === topicId);
      if (i >= 0) {
        current = i;
        render();
      }
    },
    value: () => topics[current],
  };
}

/**
 * @param {Element} block The block element
 */
export default function decorate(block) {
  const config = {};
  const topics = [];
  [...block.children].forEach((row) => {
    const [keyCell, valueCell] = row.children;
    if (!keyCell || !valueCell) return;
    const key = toClassName(keyCell.textContent);
    if (key === 'topic') {
      const title = valueCell.textContent.trim();
      if (title) topics.push({ id: toClassName(title), title });
    } else if (key === 'results-page') {
      config[key] = valueCell.querySelector('a')?.getAttribute('href') || valueCell.textContent.trim();
    } else {
      config[key] = valueCell.textContent.trim();
    }
  });

  const label = config.label || config.placeholder || '';
  const allLabel = config['all-topics'] || '';
  const resultsPath = (config['results-page'] || '').replace(/\.html$/, '');

  const form = document.createElement('form');
  form.className = 'article-search-form';
  form.setAttribute('role', 'search');
  if (label) form.setAttribute('aria-label', label);

  const picker = buildTopicPicker([{ id: 'all', title: allLabel }, ...topics], config['topics-label']);

  const field = document.createElement('div');
  field.className = 'article-search-field';
  const icon = document.createElement('span');
  icon.className = 'article-search-icon';
  icon.setAttribute('aria-hidden', 'true');
  const input = document.createElement('input');
  input.type = 'search';
  input.name = 'text';
  input.className = 'article-search-input';
  input.autocomplete = 'off';
  if (config.placeholder) input.placeholder = config.placeholder;
  if (label) input.setAttribute('aria-label', label);
  field.append(icon, input);

  const button = document.createElement('button');
  button.type = 'submit';
  button.className = 'article-search-go';
  button.textContent = config.button || '';

  form.append(picker.element, field, button);
  block.replaceChildren(form);

  // show the current query on the results page
  const fill = () => {
    const q = readSearchHash();
    input.value = q.text;
    picker.select(q.topicId);
  };
  fill();
  window.addEventListener('hashchange', fill);

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const topic = picker.value();
    const params = new URLSearchParams({
      text: input.value.trim(),
      'topic-id': topic.id,
      'topic-title': topic.title,
    });
    const hash = `#${params.toString().replace(/\+/g, '%20')}`;
    const here = currentPagePath();
    if (!resultsPath || resultsPath === here) {
      window.location.hash = hash;
    } else {
      // keep the local preview's /content prefix when there is one
      const prefix = window.location.pathname.startsWith('/content/') ? '/content' : '';
      window.location.assign(`${prefix}${resultsPath}${hash}`);
    }
  });
}
