/*
 * hero — two variants share this block:
 *   • default : CSS-only hero (heading over a background picture; boilerplate,
 *               no JS decoration needed).
 *   • video   : full-bleed hero with a heading above a large rounded video panel
 *               and a play/pause control.
 * The variant is authored as a class on the block (e.g. `hero (video)`), so we
 * dispatch on it here.
 *
 * Video content model (from the fragment/DA table):
 *   row 1: heading (h1)
 *   row 2: a link to an .mp4 (or an existing <video>) used as the feature video
 */

/*
 * The imported content references the video by its original AEM DAM path
 * (`/content/dam/coaching/videos/hero/<file>.mp4`), which resolves neither
 * locally nor on our EDS site. The real asset was downloaded, uploaded to DA
 * and published under the media folder mirroring the page path (homepage `/`
 * -> `/assets/media/<file>.mp4`), so rewrite any DAM video path to that
 * published media URL (DA 301-redirects it to the hashed media_* file).
 */
function resolveVideoSrc(src) {
  if (!src) return src;
  // The importer sometimes mangles the extension dot to a hyphen when a link's
  // text is the filename (`…coaching-video-loop-compressed-mp4`). Normalise a
  // trailing `-mp4` (or `-webm`) back to a real extension so the asset resolves.
  let out = src.replace(/-mp4(?=$|[?#])/i, '.mp4').replace(/-webm(?=$|[?#])/i, '.webm');
  // Original AEM DAM paths resolve neither locally nor on EDS; rewrite them to
  // the published DA media URL (DA 301-redirects `.mp4` to the hashed media_*).
  const m = out.match(/\/content\/dam\/[^"']*\/([^/"']+\.mp4)(?:[?#].*)?$/i);
  if (m) out = `/assets/media/${m[1]}`;
  return out;
}

/* A URL points at a video if it ends in .mp4/.webm OR carries the importer's
   mangled `-mp4`/`-webm` suffix. */
function isVideoHref(href) {
  return /(\.|-)(mp4|webm)(?=$|[?#])/i.test(href || '');
}

const HERO_POSTER = '/assets/media/usta-promo-placeholder.jpg';

function buildVideo(src) {
  const video = document.createElement('video');
  video.className = 'hero-video-media';
  video.setAttribute('autoplay', '');
  video.setAttribute('muted', '');
  video.muted = true;
  video.setAttribute('loop', '');
  video.setAttribute('playsinline', '');
  video.setAttribute('poster', HERO_POSTER);
  const source = document.createElement('source');
  source.src = resolveVideoSrc(src);
  source.type = 'video/mp4';
  video.append(source);
  return video;
}

function decorateVideo(block) {
  const rows = [...block.children];

  // Find a video source: an existing <video>/<source>, or a link/text ending in .mp4
  let videoSrc = null;
  const existingSource = block.querySelector('video source, source[src$=".mp4"]');
  if (existingSource) videoSrc = existingSource.getAttribute('src');
  if (!videoSrc) {
    const mp4Link = [...block.querySelectorAll('a')].find((a) => isVideoHref(a.getAttribute('href')));
    if (mp4Link) videoSrc = mp4Link.getAttribute('href');
  }

  // Heading + supporting text live in the first row(s); collect them into a content wrapper.
  const content = document.createElement('div');
  content.className = 'hero-video-content';
  rows.forEach((row) => {
    // A row is "just the video reference" when its only meaningful content is a
    // link/video pointing at the mp4 (the link is often wrapped in a <p>, so we
    // must check the row's text, not merely for a <p>).
    const hasVideoRef = row.querySelector('video, source[src$=".mp4"]')
      || [...row.querySelectorAll('a')].some((a) => isVideoHref(a.getAttribute('href')));
    const hasHeadingOrCopy = [...row.querySelectorAll('h1, h2, h3, h4, p')]
      .some((el) => el.textContent.trim() && !/(\.|-)(mp4|webm)(?=$|[?#\s])/i.test(el.textContent.trim()));
    if (hasVideoRef && !hasHeadingOrCopy) {
      row.remove();
      return;
    }
    while (row.firstChild) content.append(row.firstChild);
    row.remove();
  });

  block.textContent = '';

  // Source layout: heading on top, then a large rounded video panel below it
  // (the video is a flow element, not a background) with a play/pause control.
  block.append(content);
  if (videoSrc) {
    const media = document.createElement('div');
    media.className = 'hero-video-bg';
    const video = buildVideo(videoSrc);
    media.append(video);

    // play/pause toggle (bottom-left, matches source). aria-pressed=false means
    // "playing" (shows the pause glyph); true means "paused" (shows play glyph).
    const toggle = document.createElement('button');
    toggle.type = 'button';
    toggle.className = 'hero-video-toggle';
    toggle.setAttribute('aria-pressed', 'false');
    toggle.setAttribute('aria-label', 'Pause video');
    toggle.addEventListener('click', () => {
      if (video.paused) {
        video.play();
        toggle.setAttribute('aria-pressed', 'false');
        toggle.setAttribute('aria-label', 'Pause video');
      } else {
        video.pause();
        toggle.setAttribute('aria-pressed', 'true');
        toggle.setAttribute('aria-label', 'Play video');
      }
    });
    media.append(toggle);
    block.append(media);
  }
}

export default function decorate(block) {
  if (block.classList.contains('video')) decorateVideo(block);
  // default hero is CSS-only (boilerplate) — no decoration.
}
