/**
 * Quote block — a highlighted pull-quote callout.
 *
 * Authoring model: a single cell holding the quote as the first paragraph and
 * the attribution (name / role) as the following paragraph(s). Renders the
 * quote large in the brand lime and the attribution smaller in white, matching
 * the source site's article callout.
 *
 *   | quote                                                        |
 *   | "Practice isn't just for practicing your serve…" (quote)     |
 *   | Tara Gidus Collingwood                          (attribution)|
 *
 * @param {Element} block The block element
 */
export default function decorate(block) {
  // the innermost cell carries the authored content
  const cell = block.querySelector(':scope > div > div') || block;

  // only text-bearing paragraphs: first is the quote, the rest is attribution
  const paras = [...cell.querySelectorAll('p')].filter((p) => p.textContent.trim());
  const [quotePara, ...attrParas] = paras;

  if (quotePara) quotePara.classList.add('quote-text');

  if (attrParas.length) {
    const attribution = document.createElement('div');
    attribution.className = 'quote-attribution';
    attrParas.forEach((p) => attribution.append(p));
    cell.append(attribution);
  }
}
