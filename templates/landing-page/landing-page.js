/**
 * Landing page template (metadata `Template: landing-page`): the source's landing
 * pages (coach-mentorship, coaching-community, …) set section headings and body copy
 * with their own component styles — see landing-page.css. Nothing to restructure.
 * @param {Element} main The page's main element
 */
export default function decorate(main) {
  // authored blank lines are plain one-line gaps, not padded paragraphs. The importer
  // writes each as a paragraph holding a zero-width space (an empty or &nbsp;-only
  // paragraph doesn't survive the markdown conversion of the content pipeline)
  main.querySelectorAll('p').forEach((p) => {
    if (!p.textContent.replace(/[\s\u200b]/g, '') && !p.querySelector('img, picture, a, iframe')) p.classList.add('blank');
    // a paragraph set entirely in italics (source <i>) is italic copy, not the lime accent
    // that *emphasis* stands for elsewhere (styles.css)
    const em = p.children.length === 1 && p.firstElementChild.matches('em, i') ? p.firstElementChild : null;
    if (em && em.textContent.trim() === p.textContent.trim()) em.classList.add('italic');
  });
}
