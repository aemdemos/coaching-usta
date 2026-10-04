import { getMetadata } from '../../scripts/aem.js';

/**
 * Tags — "Topic Tags:" label above pill tags (source: the news-article
 * `.v-tags` component, driven by the page's keywords meta).
 *
 * Authoring model (one cell per row):
 *
 *   | tags              |
 *   | Topic Tags:       |   ← label (first row)
 *   | tennis coaching   |   ← optional tag rows; none = the page's Tags
 *                             metadata (comma-separated), like the source
 *
 * Page metadata `Tags` is delivered as one `article:tag` meta per tag (local
 * previews: a `tags` meta); `Keywords` is still read for pages authored before.
 *
 * With no tags it renders empty but keeps its box, like the source's empty tags
 * component (24px of padding above the share block on phones). Tags are plain
 * labels, not links (source parity).
 *
 * @param {Element} block The block element
 */
export default function decorate(block) {
  const cells = [...block.children].map((row) => (row.firstElementChild || row).textContent.trim());
  const [label, ...authored] = cells;
  const tags = (authored.filter(Boolean).length
    ? authored.filter(Boolean)
    : (getMetadata('article:tag') || getMetadata('tags') || getMetadata('keywords'))
      .split(',').map((t) => t.trim()).filter(Boolean));

  if (!tags.length) {
    block.replaceChildren();
    return;
  }

  const title = document.createElement('p');
  title.className = 'tags-title';
  title.textContent = label || '';

  const list = document.createElement('ul');
  list.className = 'tags-list';
  tags.forEach((t) => {
    const li = document.createElement('li');
    li.textContent = t;
    list.append(li);
  });

  block.replaceChildren(...(label ? [title] : []), list);
}
