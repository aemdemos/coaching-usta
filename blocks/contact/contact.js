/**
 * contact — the USTA "Get in Touch" panel.
 *
 * A lime rounded panel split into two parts:
 *   • intro  : a big display title + a short subtitle (left column on desktop).
 *   • cards  : a stack of white rounded cards, each with a heading, a short body,
 *              a grey separator and a lime square arrow button linking out
 *              (email/URL). Right column on desktop; stacks under the intro below.
 *
 * Authoring model (one row per part):
 *   Row 1  (intro)  : a single cell holding a heading + paragraph.
 *   Rows 2+ (cards) : three cells — heading | body | link.
 * The intro is detected as the first row that has no link; every other row is a
 * card. Author order is preserved.
 *
 * @param {Element} block the contact block element
 */

// Source arrow glyph (etc.clientlibs/.../icons/arrow-right.svg), inlined so the
// button needs no network round-trip and inherits currentColor for the hover flip.
const ARROW_SVG = `<svg viewBox="0 0 23 12" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">
  <path d="M22.6907 6.03041L16.7585 12H12.3047L16.4965 7.78947H0.496537V4.19649H16.4217L12.3047 0.0608187H16.7585L22.6907 6.03041Z" fill="currentColor"/>
</svg>`;

export default function decorate(block) {
  const rows = [...block.children];

  const intro = document.createElement('div');
  intro.className = 'contact-intro';

  const cards = document.createElement('ul');
  cards.className = 'contact-cards';

  let introTaken = false;

  rows.forEach((row) => {
    const cells = [...row.children];
    const link = row.querySelector('a');

    // First linkless row becomes the intro (title + subtitle).
    if (!introTaken && !link) {
      introTaken = true;
      // Promote a leading paragraph to the display title if no heading exists.
      const cell = cells.length === 1 ? cells[0] : row;
      let title = cell.querySelector('h1, h2, h3, h4, h5, h6');
      const paras = [...cell.querySelectorAll('p')];
      if (!title && paras.length) {
        title = document.createElement('h2');
        title.textContent = paras.shift().textContent;
      }
      if (title) {
        title.classList.add('contact-title');
        intro.append(title);
      }
      paras.forEach((p) => {
        p.classList.add('contact-subtitle');
        intro.append(p);
      });
      return;
    }

    // Every other row is a card: heading | body | link.
    const li = document.createElement('li');
    li.className = 'contact-card';

    const heading = row.querySelector('h1, h2, h3, h4, h5, h6');
    let headingText = '';
    if (heading) headingText = heading.textContent.trim();
    else if (cells[0]) headingText = cells[0].textContent.trim();
    if (heading) {
      heading.classList.add('contact-card-title');
      li.append(heading);
    } else if (headingText) {
      const h = document.createElement('h3');
      h.className = 'contact-card-title';
      h.textContent = headingText;
      li.append(h);
    }

    // Body paragraphs (any cell that is not the heading and not the link).
    cells.forEach((cell) => {
      if (cell.contains(heading) || cell.contains(link)) return;
      [...cell.querySelectorAll('p')].forEach((p) => {
        p.classList.add('contact-card-body');
        li.append(p);
      });
      if (!cell.querySelector('p') && cell.textContent.trim() && cell !== cells[0]) {
        const p = document.createElement('p');
        p.className = 'contact-card-body';
        p.textContent = cell.textContent.trim();
        li.append(p);
      }
    });

    if (link) {
      link.className = 'contact-card-link';
      link.textContent = '';
      link.innerHTML = ARROW_SVG;
      link.setAttribute('aria-label', headingText || link.href);
      li.append(link);
    }

    cards.append(li);
  });

  block.replaceChildren();
  if (intro.children.length) block.append(intro);
  if (cards.children.length) block.append(cards);
}
