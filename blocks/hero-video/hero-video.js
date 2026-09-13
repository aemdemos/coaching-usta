/*
 * Hero (video) block
 * Full-bleed hero with a heading over a background/feature video.
 * Content model (from the fragment/DA table):
 *   row 1: heading (h1)
 *   row 2: a link to an .mp4 (or an existing <video>) used as the background video
 */

function buildVideo(src) {
  const video = document.createElement('video');
  video.className = 'hero-video-media';
  video.setAttribute('autoplay', '');
  video.setAttribute('muted', '');
  video.muted = true;
  video.setAttribute('loop', '');
  video.setAttribute('playsinline', '');
  const source = document.createElement('source');
  source.src = src;
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
    // skip rows that only carried the video reference
    const isVideoRow = row.querySelector('video, source[src$=".mp4"]')
      || [...row.querySelectorAll('a')].some((a) => (a.getAttribute('href') || '').includes('.mp4'));
    if (isVideoRow && !row.querySelector('h1, h2, h3, p')) {
      row.remove();
      return;
    }
    while (row.firstChild) content.append(row.firstChild);
    row.remove();
  });

  block.textContent = '';

  if (videoSrc) {
    const media = document.createElement('div');
    media.className = 'hero-video-bg';
    media.append(buildVideo(videoSrc));
    block.append(media);
  }
  block.append(content);
}
