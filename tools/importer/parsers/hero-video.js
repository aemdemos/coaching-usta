/* eslint-disable */
/* global WebImporter */
/**
 * Parser for hero-video. Base block: hero.
 * Source: https://www.ustacoaching.com/ (.cmp-container__video-container)
 * Generated for USTA Coaching homepage migration (da project).
 *
 * EDS hero convention: 1 column, up to 3 rows.
 *   row 1: block name (added by createBlock)
 *   row 2: background media (optional) — here the background video reference (.mp4 link)
 *   row 3: content (optional) — title (heading) + subheading + CTA
 * The target decorate() (blocks/hero-video/hero-video.js) scans rows for a video
 * source (`video source`, `source[src$=".mp4"]`, or an anchor href containing
 * ".mp4") and treats the remaining row(s) as heading/content, so cell order is
 * tolerant. We emit media first, content second, to match the convention.
 */
export default function parse(element, { document }) {
  // Locate the mp4 source: existing <video><source>, a source[src], the video's
  // data-source attribute, or an existing anchor to an .mp4.
  const video = element.querySelector('video');
  let videoSrc = null;
  const source = element.querySelector('video source[src], source[src$=".mp4"]');
  if (source) videoSrc = source.getAttribute('src');
  if (!videoSrc && video) videoSrc = video.getAttribute('data-source') || video.getAttribute('src');
  if (!videoSrc) {
    const mp4Link = [...element.querySelectorAll('a')].find((a) => (a.getAttribute('href') || '').includes('.mp4'));
    if (mp4Link) videoSrc = mp4Link.getAttribute('href');
  }

  // Heading / supporting content (rarely inside the bare video container, but
  // capture it if present so it lands in the content row).
  const heading = element.querySelector('h1, h2, .hero-title, [class*="heading"]');
  const cta = element.querySelector('a[href]:not([href*=".mp4"])');

  // Empty-block guard: nothing meaningful to render.
  if (!videoSrc && !heading) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const cells = [];

  // Row 2 — background media: a link to the mp4 for DA import.
  if (videoSrc) {
    const link = document.createElement('a');
    link.href = videoSrc;
    link.textContent = videoSrc;
    cells.push([link]);
  }

  // Row 3 — content: heading (+ optional CTA), all in one cell.
  if (heading || cta) {
    const contentCell = [];
    if (heading) contentCell.push(heading);
    if (cta) contentCell.push(cta);
    cells.push([contentCell]);
  }

  const block = WebImporter.Blocks.createBlock(document, { name: 'hero-video', cells });
  element.replaceWith(block);
}
