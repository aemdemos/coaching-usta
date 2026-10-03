/**
 * Video block — a centred display heading over a rounded, consent-gated
 * YouTube/Vimeo embed (source: the "Get Ahead. Get Experienced…" embed on
 * /en/home/coaching-community/fellowship-in-coaching-and-leadership.html).
 *
 * Authoring model (one cell per row):
 *
 *   | video                                                              |
 *   | Get Ahead. *Get Experienced. Get USTA* Coaching Certified. (title) |
 *   | https://www.youtube.com/watch?v=…                (optional URL row) |
 *   | This video requires Social Media cookies… Please update   (consent |
 *   | your [cookie preferences](video URL) to watch.            message) |
 *
 * The video URL is the first YouTube/Vimeo link in the block — either its own
 * row (removed from the output) or the "cookie preferences" link inside the
 * consent message. Like the source, the consent message is shown in a grey
 * placeholder until the visitor accepts social-media cookies (`consent.update`
 * event from scripts/consent-check.js); then the player replaces it.
 *
 * @param {Element} block The block element
 */

const ID_PATTERN = /^[\w-]{6,20}$/;

/**
 * Resolve an authored link to a safe, whitelisted embed + watch URL.
 * @param {string} href authored link
 * @returns {{embed: string, watch: string}|null}
 */
function getVideo(href) {
  let url;
  try {
    url = new URL(href, window.location.href);
  } catch {
    return null;
  }
  const host = url.hostname.replace(/^www\./, '');
  const parts = url.pathname.split('/').filter(Boolean);
  let id;
  if (host === 'youtu.be') {
    [id] = parts;
  } else if (host === 'youtube.com' || host === 'youtube-nocookie.com' || host === 'm.youtube.com') {
    id = ['embed', 'shorts', 'live'].includes(parts[0]) ? parts[1] : url.searchParams.get('v');
  } else if (host === 'vimeo.com' || host === 'player.vimeo.com') {
    id = parts.find((p) => /^\d+$/.test(p));
    return id ? { embed: `https://player.vimeo.com/video/${id}`, watch: `https://vimeo.com/${id}` } : null;
  }
  if (!id || !ID_PATTERN.test(id)) return null;
  return { embed: `https://www.youtube.com/embed/${id}`, watch: `https://www.youtube.com/watch?v=${id}` };
}

/**
 * Move a cell's content into a wrapper, wrapping bare inline content in a <p>.
 * @param {Element} cell authored cell
 * @param {string} className wrapper class
 * @returns {HTMLDivElement}
 */
function wrapCell(cell, className) {
  const wrapper = document.createElement('div');
  wrapper.className = className;
  if (cell.querySelector(':scope > :is(p, h1, h2, h3, h4, h5, h6, ul, ol)')) {
    wrapper.append(...cell.childNodes);
  } else if (cell.textContent.trim()) {
    const p = document.createElement('p');
    p.append(...cell.childNodes);
    wrapper.append(p);
  }
  return wrapper;
}

export default function decorate(block) {
  const cells = [...block.children].map((row) => row.firstElementChild || row);
  const [titleCell, ...restCells] = cells;

  let video = null;
  const videoLink = [...block.querySelectorAll('a[href]')].find((a) => {
    video = getVideo(a.getAttribute('href'));
    return video;
  });

  const title = titleCell ? wrapCell(titleCell, 'video-title') : null;

  // A row holding only the video link is the URL row — drop it; any other
  // row is the consent message shown in the placeholder.
  const message = document.createElement('div');
  message.className = 'video-consent-message';
  restCells.forEach((cell) => {
    const urlRow = videoLink && cell.contains(videoLink)
      && cell.textContent.trim() === videoLink.textContent.trim();
    if (!urlRow) message.append(...wrapCell(cell, 'tmp').childNodes);
  });

  // The link inside the message is the source's "cookie preferences" control:
  // opens the CMP when one is present, otherwise falls back to the video page.
  if (videoLink && message.contains(videoLink)) {
    videoLink.className = 'video-consent-link';
    videoLink.href = video.watch;
    videoLink.target = '_blank';
    videoLink.rel = 'noopener noreferrer';
    videoLink.removeAttribute('title');
    videoLink.addEventListener('click', (e) => {
      if (typeof window.OneTrust?.ToggleInfoDisplay === 'function') {
        e.preventDefault();
        window.OneTrust.ToggleInfoDisplay();
      }
    });
  }

  const placeholder = document.createElement('div');
  placeholder.className = 'video-consent';
  placeholder.append(message);

  const frame = document.createElement('div');
  frame.className = 'video-frame';
  frame.append(placeholder);

  const setConsent = (consented) => {
    if (!video) return;
    const iframe = frame.querySelector('iframe');
    if (consented && !iframe) {
      const player = document.createElement('iframe');
      player.src = video.embed;
      player.title = title?.textContent.trim() || '';
      player.loading = 'lazy';
      player.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture';
      player.referrerPolicy = 'strict-origin-when-cross-origin';
      player.allowFullscreen = true;
      frame.replaceChildren(player);
    } else if (!consented && iframe) {
      frame.replaceChildren(placeholder);
    }
    block.classList.toggle('is-playing', consented);
  };
  window.addEventListener('consent.update', (e) => setConsent(!!e.detail?.consented));

  block.replaceChildren(...[title, frame].filter(Boolean));
}
