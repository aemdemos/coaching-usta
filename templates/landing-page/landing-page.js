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
  // a Text Style paragraph set entirely in bold is the source's Graphik Semibold text
  // component (results pathway intros); bold runs inside a sentence stay synthesized bold
  main.querySelectorAll('.text-style p, .text-style > div > div').forEach((p) => {
    const strong = p.children.length === 1 && p.firstElementChild.matches('strong, b') ? p.firstElementChild : null;
    if (!strong || strong.textContent.trim() !== p.textContent.trim()) return;
    // (a bold link on its own is a button, not copy)
    const link = strong.children.length === 1 && strong.firstElementChild.matches('a') ? strong.firstElementChild : null;
    if (!link || link.textContent.trim() !== strong.textContent.trim()) strong.classList.add('semibold');
  });
}
