/**
 * Landing page template (metadata `Template: landing-page`): the source's landing
 * pages (coach-mentorship, coaching-community, …) set section headings and body copy
 * with their own component styles — see landing-page.css. Nothing to restructure.
 * @param {Element} main The page's main element
 */
export default function decorate(main) {
  // authored blank lines (<p>&nbsp;</p>) are plain one-line gaps, not padded paragraphs
  main.querySelectorAll('p').forEach((p) => {
    if (!p.textContent.trim() && !p.querySelector('img, picture, a, iframe')) p.classList.add('blank');
  });
}
