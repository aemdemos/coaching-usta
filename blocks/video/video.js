/*
 * Video Block
 * Embeds a stand-alone video referenced by a link (YouTube, Vimeo, or a
 * self-hosted mp4). Mirrors the source: the video is NOT embedded on load —
 * a heading sits above a grey placeholder panel (fixed height per breakpoint)
 * whose centred message + link load the player only on click.
 * Based on the AEM Block Collection video block:
 * https://www.aem.live/developer/block-collection/video
 */

const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

/**
 * Determines the video source type from a link.
 * @param {string} link The video link URL
 * @returns {string} 'youtube', 'vimeo', or 'video'
 */
function getVideoSource(link) {
  if (link.includes('youtube') || link.includes('youtu.be')) return 'youtube';
  if (link.includes('vimeo')) return 'vimeo';
  return 'video';
}

/**
 * Gets a human-readable video type label for the play button aria-label.
 * @param {string} source The video source type
 * @returns {string} Human-readable label
 */
function getVideoTypeLabel(source) {
  const labels = {
    youtube: 'YouTube video',
    vimeo: 'Vimeo video',
    video: 'MP4 video',
  };
  return labels[source] || 'video';
}

function embedYoutube(url, autoplay, background) {
  const usp = new URLSearchParams(url.search);
  let suffix = '';
  if (background || autoplay) {
    const suffixParams = {
      autoplay: autoplay ? '1' : '0',
      mute: background ? '1' : '0',
      controls: background ? '0' : '1',
      disablekb: background ? '1' : '0',
      loop: background ? '1' : '0',
      playsinline: background ? '1' : '0',
    };
    suffix = `&${Object.entries(suffixParams).map(([k, v]) => `${k}=${encodeURIComponent(v)}`).join('&')}`;
  }
  let vid = usp.get('v') ? encodeURIComponent(usp.get('v')) : '';
  const embed = url.pathname;
  if (url.origin.includes('youtu.be')) {
    [, vid] = url.pathname.split('/');
  }

  const temp = document.createElement('div');
  temp.innerHTML = `<div class="video-frame">
      <iframe src="https://www.youtube.com${vid ? `/embed/${vid}?rel=0&v=${vid}${suffix}` : embed}"
      allow="autoplay; fullscreen; picture-in-picture; encrypted-media; accelerometer; gyroscope; picture-in-picture" allowfullscreen="" scrolling="no" title="Content from Youtube" loading="lazy"></iframe>
    </div>`;
  return temp.children.item(0);
}

function embedVimeo(url, autoplay, background) {
  const [, video] = url.pathname.split('/');
  let suffix = '';
  if (background || autoplay) {
    const suffixParams = {
      autoplay: autoplay ? '1' : '0',
      background: background ? '1' : '0',
    };
    suffix = `?${Object.entries(suffixParams).map(([k, v]) => `${k}=${encodeURIComponent(v)}`).join('&')}`;
  }
  const temp = document.createElement('div');
  temp.innerHTML = `<div class="video-frame">
      <iframe src="https://player.vimeo.com/video/${video}${suffix}"
      frameborder="0" allow="autoplay; fullscreen; picture-in-picture" allowfullscreen
      title="Content from Vimeo" loading="lazy"></iframe>
    </div>`;
  return temp.children.item(0);
}

function getVideoElement(source, autoplay, background) {
  const video = document.createElement('video');
  video.setAttribute('controls', '');
  if (autoplay) video.setAttribute('autoplay', '');
  if (background) {
    video.setAttribute('loop', '');
    video.setAttribute('playsinline', '');
    video.removeAttribute('controls');
    video.addEventListener('canplay', () => {
      video.muted = true;
      if (autoplay) video.play();
    });
  }

  const sourceEl = document.createElement('source');
  sourceEl.setAttribute('src', source);
  sourceEl.setAttribute('type', `video/${source.split('.').pop()}`);
  video.append(sourceEl);

  return video;
}

const loadVideoEmbed = (container, link, autoplay, background) => {
  if (container.dataset.embedLoaded === 'true') {
    return;
  }
  const url = new URL(link);

  const isYoutube = link.includes('youtube') || link.includes('youtu.be');
  const isVimeo = link.includes('vimeo');

  if (isYoutube) {
    const embedWrapper = embedYoutube(url, autoplay, background);
    container.append(embedWrapper);
    embedWrapper.querySelector('iframe').addEventListener('load', () => {
      container.dataset.embedLoaded = true;
    });
  } else if (isVimeo) {
    const embedWrapper = embedVimeo(url, autoplay, background);
    container.append(embedWrapper);
    embedWrapper.querySelector('iframe').addEventListener('load', () => {
      container.dataset.embedLoaded = true;
    });
  } else {
    const videoEl = getVideoElement(link, autoplay, background);
    container.append(videoEl);
    videoEl.addEventListener('canplay', () => {
      container.dataset.embedLoaded = true;
    });
  }
};

/**
 * loads and decorates the video block
 * @param {Element} block The block element
 */
export default async function decorate(block) {
  const anchor = block.querySelector('a[href]');
  if (!anchor) return;
  const link = anchor.href;

  // The block's direct children are the authored rows. Preserve any leading
  // heading/intro rows (every row that is not the one holding the video link
  // or the poster image) as the block's caption.
  const rows = [...block.children];
  const rowContaining = (el) => rows.find((row) => row.contains(el)) || null;
  const posterPicture = block.querySelector('picture');
  const linkRow = rowContaining(anchor);
  const posterRow = posterPicture ? rowContaining(posterPicture) : null;

  // Row roles: the row holding the video link is the MESSAGE shown inside the
  // grey placeholder panel (mirrors the source's "This video requires…" notice
  // whose "cookie preferences" link carries the video URL). Any rows before it
  // (that aren't the poster) form the HEADING above the panel. All kept in
  // content → localizable.
  const headingRows = rows.filter((row) => row !== linkRow && row !== posterRow);

  let heading = null;
  if (headingRows.length) {
    heading = document.createElement('div');
    heading.className = 'video-heading';
    headingRows.forEach((row) => heading.append(...row.childNodes));
  }

  // The message is the link row's content (notice text + the link itself). If
  // the link row is a bare link only, the message is effectively just the link.
  const message = document.createElement('div');
  message.className = 'video-message';
  if (linkRow) message.append(...linkRow.childNodes);

  const autoplay = block.classList.contains('autoplay');

  block.textContent = '';

  if (heading) block.append(heading);

  // Player container drives the fixed per-breakpoint height + loaded state.
  const player = document.createElement('div');
  player.className = 'video-player';
  player.dataset.embedLoaded = false;
  block.append(player);

  const source = getVideoSource(link);

  // Autoplay (e.g. a background/hero-style clip) embeds eagerly once visible.
  if (autoplay) {
    const observer = new IntersectionObserver((entries) => {
      if (entries.some((e) => e.isIntersecting)) {
        observer.disconnect();
        loadVideoEmbed(player, link, !prefersReducedMotion.matches, true);
      }
    });
    observer.observe(player);
    return;
  }

  // Mirror the source: the video is NOT embedded on load. It shows a grey
  // placeholder panel (full content width, fixed height per breakpoint) with
  // the consent-style message centred inside. Our site has no cookie gate, so
  // the message's link loads the player on click (mirrors the source, where
  // only the "cookie preferences" link is interactive).
  player.classList.add('placeholder');
  const panel = document.createElement('div');
  panel.className = 'video-placeholder';

  // An authored poster image (if any) fills the panel behind the message.
  if (posterPicture) panel.append(posterPicture);
  if (message.childNodes.length) panel.append(message);

  // Turn the message's link into the play trigger. Fall back to making the
  // whole panel clickable (with a keyboard-operable button) if there's no link.
  const trigger = message.querySelector('a');
  if (trigger) {
    trigger.setAttribute('role', 'button');
    trigger.setAttribute('aria-label', `Play ${getVideoTypeLabel(source)}`);
    trigger.addEventListener('click', (e) => {
      e.preventDefault();
      panel.remove();
      loadVideoEmbed(player, link, true, false);
    });
  } else {
    panel.classList.add('video-placeholder-button');
    panel.setAttribute('role', 'button');
    panel.setAttribute('tabindex', '0');
    panel.setAttribute('aria-label', `Play ${getVideoTypeLabel(source)}`);
    const activate = () => {
      panel.remove();
      loadVideoEmbed(player, link, true, false);
    };
    panel.addEventListener('click', activate);
    panel.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        activate();
      }
    });
  }
  player.append(panel);
}
