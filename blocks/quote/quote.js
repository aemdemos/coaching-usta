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

  // `marks`: the opening and closing quote marks are set large (source: 64px marks)
  if (quotePara && block.classList.contains('marks')) {
    const host = quotePara.querySelector('em') || quotePara;
    const m = host.textContent.trim().match(/^([“"])\s*([\s\S]*?)\s*([”"])$/);
    if (m) {
      const mark = (c, cls) => {
        const s = document.createElement('span');
        s.className = `quote-mark ${cls}`;
        s.textContent = c;
        return s;
      };
      host.replaceChildren(mark(m[1], 'quote-mark-open'), ` ${m[2]} `, mark(m[3], 'quote-mark-close'));
    }
  }

  // blank paragraphs right after the quote are authored spacing: one quote-size line each
  for (let p = quotePara?.nextElementSibling; p && p.tagName === 'P' && !p.textContent.trim(); p = p.nextElementSibling) {
    p.classList.add('quote-text', 'quote-gap');
  }

  if (attrParas.length) {
    const attribution = document.createElement('div');
    attribution.className = 'quote-attribution';
    attrParas.forEach((p) => attribution.append(p));
    cell.append(attribution);
  }
}
