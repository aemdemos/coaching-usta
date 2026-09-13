/*
 * Hero (video) block
 * Full-bleed hero with a heading over a background/feature video.
 * Content model (from the fragment/DA table):
 *   row 1: heading (h1)
 *   row 2: a link to an .mp4 (or an existing <video>) used as the background video
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
  const m = src.match(/\/content\/dam\/[^"']*\/([^/"']+\.mp4)(?:[?#].*)?$/i);
  if (m) return `/assets/media/${m[1]}`;
  return src;
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

export default function decorate(block) {
  const rows = [...block.children];

  // Find a video source: an existing <video>/<source>, or a link/text ending in .mp4
  let videoSrc = null;
  const existingSource = block.querySelector('video source, source[src$=".mp4"]');
  if (existingSource) videoSrc = existingSource.getAttribute('src');
  if (!videoSrc) {
    const mp4Link = [...block.querySelectorAll('a')].find((a) => (a.getAttribute('href') || '').includes('.mp4'));
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
      || [...row.querySelectorAll('a')].some((a) => (a.getAttribute('href') || '').includes('.mp4'));
    const hasHeadingOrCopy = [...row.querySelectorAll('h1, h2, h3, h4, p')]
      .some((el) => el.textContent.trim() && !/\.mp4/i.test(el.textContent));
    if (hasVideoRef && !hasHeadingOrCopy) {
      row.remove();
      return;
    }
    while (row.firstChild) content.append(row.firstChild);
    row.remove();
  });

  block.textContent = '';

  // Source layout: heading on top, then a large full-width video panel below it
  // (the video is a flow element, not a background).
  block.append(content);
  if (videoSrc) {
    const media = document.createElement('div');
    media.className = 'hero-video-bg';
    media.append(buildVideo(videoSrc));
    block.append(media);
  }
}
