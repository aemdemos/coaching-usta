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

/*
 * default hero (USTA "Our Core Workshops" pattern): a background image with a
 * two-line display heading centered over a dark overlay, and a lime pill CTA.
 * Content model (from the DA table):
 *   - row 1: a <picture>/<img> for the background (the "basket of tennis balls"
 *     photo). Authored as a real image — DA uploads it as hashed media, which
 *     survives its publish pipeline (unlike a clean-path <img>, which DA used to
 *     rewrite to about:error). A legacy image LINK is still accepted as fallback.
 *   - row 2: one or more headings; a heading wrapped in <em> (or a 2nd heading)
 *     is the LIME accent line (source colours line 2 lime). Plus (2nd cell) a
 *     mobile-only "Education Center" logo image, and the "Find a Workshop" CTA
 *     link (rendered as a pill button).
 * We tag the accent line with a class (never nth-child) and group the text + CTA
 * into an overlay content wrapper so the CSS can center it over the image.
 */
/* True if an href points at an image file (legacy bg-as-link fallback). */
function isImageHref(href) {
  return /\.(jpe?g|png|webp|avif|gif|svg)(?=$|[?#])/i.test(href || '');
}

/* Apply an image source to the .hero-bg frame as a CSS background, with an
   accessible label (the frame is decorative but names the scene for SR users). */
function applyBgImage(bg, url, label) {
  bg.style.backgroundImage = `url("${url}")`;
  if (label) {
    bg.setAttribute('role', 'img');
    bg.setAttribute('aria-label', label);
  }
}

function decorateDefault(block) {
  const bg = document.createElement('div');
  bg.className = 'hero-bg';

  // The background lives in the FIRST row of the block; scoping to that row
  // means it is never confused with the logo image in the content row. Prefer a
  // real <picture>/<img> (the authoring model); fall back to an image LINK.
  const bgRow = block.firstElementChild;
  const bgImg = bgRow ? bgRow.querySelector('img') : null;
  const bgLink = bgRow
    ? [...bgRow.querySelectorAll('a')].find((a) => isImageHref(a.getAttribute('href')))
    : null;
  if (bgImg) {
    applyBgImage(bg, bgImg.currentSrc || bgImg.src, bgImg.getAttribute('alt'));
    bgRow.remove();
  } else if (bgLink) {
    applyBgImage(bg, bgLink.getAttribute('href'), bgLink.textContent.trim());
    bgRow.remove();
  }

  const content = document.createElement('div');
  content.className = 'hero-content';

  // Move the remaining headings + link wrappers (in document order) into the
  // overlay content. The background row is already removed above.
  [...block.querySelectorAll('h1, h2, h3, h4, h5, h6, p')].forEach((el) => {
    if (bg.contains(el)) return;
    if (el.closest('.hero-content')) return;
    // Drop an empty <p> left behind after the background link/image was extracted.
    if (el.tagName === 'P' && !el.textContent.trim() && !el.querySelector('a, img')) {
      el.remove();
      return;
    }
    content.append(el);
  });

  // The "Education Center" logo (2nd content cell) may be authored as a real
  // <img>/<picture>. Pull any remaining images (not yet in .hero-content) in too.
  [...block.querySelectorAll('picture, img')].forEach((el) => {
    if (bg.contains(el) || content.contains(el)) return;
    content.append(el.closest('picture') || el);
  });

  // The lime accent line: an <em> inside a heading, OR the last of multiple
  // headings. Tag it with a class so CSS colours it — no nth-child logic.
  const headings = [...content.querySelectorAll('h1, h2, h3, h4, h5, h6')];
  const emHeading = headings.find((h) => h.querySelector('em'));
  if (emHeading) {
    // Unwrap the <em> to a span.accent (em would italicise the display face).
    emHeading.querySelectorAll('em').forEach((em) => {
      const span = document.createElement('span');
      span.className = 'hero-accent';
      span.append(...em.childNodes);
      em.replaceWith(span);
    });
  } else if (headings.length > 1) {
    headings[headings.length - 1].classList.add('hero-accent-line');
  }

  // Group the heading line(s) into one tight block so the content gap applies
  // only between the heading block and the CTA (source: lines stack with no gap,
  // then a large gap to the button) — not between the two heading lines.
  if (headings.length) {
    const group = document.createElement('div');
    group.className = 'hero-heading';
    headings[0].before(group);
    headings.forEach((h) => group.append(h));
  }

  // The "Education Center" logo lives in the SECOND cell of the content row.
  // Authored as a real image (DA uploads it as hashed media, which survives its
  // publish pipeline). Tag it and place it between the heading block and the CTA;
  // it is shown on mobile only (CSS). A legacy image LINK is still accepted.
  const logoImg = content.querySelector('picture img, img');
  const logoLink = [...content.querySelectorAll('a')].find((a) => isImageHref(a.getAttribute('href')));
  let logo = null;
  if (logoImg) {
    logo = logoImg;
    logo.classList.add('hero-logo');
    logo.loading = 'lazy';
    // Unwrap a <picture>/<p> wrapper so the standalone <img> can be repositioned.
    const pic = logoImg.closest('picture');
    if (pic) pic.replaceWith(logoImg);
    const wrap = logo.closest('p');
    if (wrap && wrap.textContent.trim() === '') wrap.replaceWith(logo);
  } else if (logoLink) {
    logo = document.createElement('img');
    logo.className = 'hero-logo';
    logo.src = logoLink.getAttribute('href');
    logo.alt = logoLink.textContent.trim() || '';
    logo.loading = 'lazy';
    (logoLink.closest('p') || logoLink).replaceWith(logo);
  }
  if (logo) {
    (content.querySelector('.hero-heading') || content.firstElementChild)?.after(logo);
  }

  // The CTA: the first NON-image link becomes a pill button.
  const cta = [...content.querySelectorAll('a[href]')].find((a) => !isImageHref(a.getAttribute('href')));
  if (cta) {
    cta.classList.add('hero-cta');
    const wrap = cta.closest('p');
    if (wrap) wrap.classList.add('hero-cta-wrapper');
  }

  block.textContent = '';
  block.append(bg);
  block.append(content);
}

export default function decorate(block) {
  if (block.classList.contains('video')) decorateVideo(block);
  else decorateDefault(block);
}
