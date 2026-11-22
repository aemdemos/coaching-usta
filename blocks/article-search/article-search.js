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

  const select = document.createElement('select');
  select.className = 'article-search-topics';
  select.name = 'topic';
  select.setAttribute('aria-label', config['topics-label'] || allLabel || label);
  [{ id: 'all', title: allLabel }, ...topics].forEach((t) => {
    const option = document.createElement('option');
    option.value = t.id;
    option.textContent = t.title;
    select.append(option);
  });

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

  form.append(select, field, button);
  block.replaceChildren(form);

  // show the current query on the results page
  const fill = () => {
    const q = readSearchHash();
    input.value = q.text;
    if ([...select.options].some((o) => o.value === q.topicId)) select.value = q.topicId;
  };
  fill();
  window.addEventListener('hashchange', fill);

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const option = select.selectedOptions[0];
    const params = new URLSearchParams({
      text: input.value.trim(),
      'topic-id': option ? option.value : 'all',
      'topic-title': option ? option.textContent : allLabel,
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
