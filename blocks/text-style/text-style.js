/**
 * Text Style block — a short run of article copy in one of the source's text
 * component styles (news articles). The content is plain rich text; the variant
 * picks the look:
 *   - `label`  : 24/32 Graphik Semibold, uppercase (e.g. "Serve Your Passion…")
 *   - `center` : body copy, centred
 *   - `large`  : 25px line (bold copy stays bold)
 *   - `intro`  : centred lime lead-in, 10 of 12 columns (16 → 18 @1024 → 24 @1280)
 *
 *   | Text Style (label)                 |
 *   | Serve Your Passion. Lead the Game. |
 *
 * @param {Element} block The block element
 */
export default function decorate(block) {
  const cell = block.querySelector(':scope > div > div');
  if (!cell) return;
  cell.classList.add('text-style-content');
  // authored blank lines (<p>&nbsp;</p>) are plain lines, as in the article body
  cell.querySelectorAll('p').forEach((p) => {
    if (!p.textContent.trim() && !p.querySelector('img, picture, a')) p.classList.add('blank');
  });
}
