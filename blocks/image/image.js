/*
 * image — one image with an optional phone version (art direction).
 *
 * Authoring (same shape as the Spacer block):
 *   | Image   |               |
 *   | desktop | <wide image>  |
 *   | mobile  | <phone image> |
 * The block renders ONE <picture>: the desktop image from 768px up, the mobile image
 * below — each device downloads only its own image. Rows without a label are taken in
 * order (first = desktop, second = mobile); a single image is shown at every width —
 * except a single row labelled `mobile`: a PHONE-ONLY image (hidden from 768, so it is
 * never downloaded there; workshops pathway infographic).
 * The alt text comes from the desktop image (else the mobile one).
 */
import { createOptimizedPicture } from '../../scripts/aem.js';

const DESKTOP_MEDIA = '(width >= 768px)';

/** The image of the row labelled `label` ("desktop" / "mobile"), if any. */
function labelledImage(rows, label) {
  const row = rows.find((r) => r.children.length > 1
    && r.firstElementChild.textContent.trim().toLowerCase() === label);
  return row ? row.querySelector('img') : null;
}

/** The image's own path (EDS media URLs carry optimisation query params). */
const pathOf = (img) => new URL(img.getAttribute('src'), window.location.href).pathname;

/**
 * The desktop image as media-gated <source> elements (webp + its own format), built
 * directly: a helper <picture> would create an <img> that starts downloading the wide
 * file on phones too.
 */
function desktopSources(img) {
  const url = new URL(img.getAttribute('src'), window.location.href);
  const ext = url.pathname.split('.').pop();
  const [width, height] = [img.getAttribute('width'), img.getAttribute('height')];
  return ['webply', ext].map((format) => {
    const source = document.createElement('source');
    source.setAttribute('media', DESKTOP_MEDIA);
    if (format === 'webply') source.setAttribute('type', 'image/webp');
    source.setAttribute('srcset', `${url.origin}${url.pathname}?width=2000&format=${format}&optimize=medium`);
    // per-source dimensions keep the right aspect ratio before the image loads
    if (width && height) {
      source.setAttribute('width', width);
      source.setAttribute('height', height);
    }
    return source;
  });
}

export default function decorate(block) {
  const rows = [...block.children];
  let desktop = labelledImage(rows, 'desktop');
  let mobile = labelledImage(rows, 'mobile');
  // only a `mobile` row (and no other image): shown on phones only (image.css)
  if (mobile && !desktop && block.querySelectorAll('img').length === 1) block.classList.add('mobile-only');
  if (!desktop && !mobile) [desktop, mobile] = block.querySelectorAll('img');
  if (!desktop) [desktop, mobile] = [mobile, null];
  if (!desktop) return;

  const alt = desktop.getAttribute('alt') || mobile?.getAttribute('alt') || '';
  let picture;
  if (!mobile) {
    picture = desktop.closest('picture') || createOptimizedPicture(pathOf(desktop), alt);
  } else {
    // desktop sources (media-gated) first, then the phone image as the fallback
    picture = createOptimizedPicture(pathOf(mobile), alt, false, [{ width: '750' }]);
    picture.prepend(...desktopSources(desktop));
    const img = picture.querySelector('img');
    if (mobile.getAttribute('width')) img.setAttribute('width', mobile.getAttribute('width'));
    if (mobile.getAttribute('height')) img.setAttribute('height', mobile.getAttribute('height'));
  }
  picture.querySelector('img').setAttribute('alt', alt);
  block.replaceChildren(picture);
}
