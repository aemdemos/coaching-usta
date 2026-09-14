/*
 * banner — a contained, rounded full-width promo band with a heading, a short
 * body line, and a pill CTA laid out in a row (stacked on mobile).
 *
 * Colour variants (authored as classes, e.g. `banner (events, blue)`):
 *   • blue  — blue panel, black text, black pill button (the "events" banner).
 *   • black — black panel, white text, lime-green pill button.
 * `blue` is the default when no colour class is present.
 *
 * Authoring model: one row whose cells hold the heading, the body copy, and the
 * CTA link (the importer groups heading+body in one cell and the link in
 * another; this normalises either shape into three tagged parts).
 *
 * @param {Element} block the banner block element
 */
export default function decorate(block) {
  const heading = block.querySelector('h1, h2, h3, h4, h5, h6');
  const link = [...block.querySelectorAll('a')].pop();
  // body = paragraphs that are neither the heading nor the CTA link's paragraph
  const bodyParas = [...block.querySelectorAll('p')].filter((p) => {
    if (link && p.contains(link)) return false;
    return p.textContent.trim().length > 0;
  });

  const inner = document.createElement('div');
  inner.className = 'banner-inner';

  if (heading) {
    heading.classList.add('banner-heading');
    inner.append(heading);
  }
  if (bodyParas.length) {
    const body = document.createElement('div');
    body.className = 'banner-body';
    bodyParas.forEach((p) => body.append(p));
    inner.append(body);
  }
  if (link) {
    link.classList.add('banner-cta');
    const action = document.createElement('div');
    action.className = 'banner-action';
    action.append(link);
    inner.append(action);
  }

  block.replaceChildren(inner);
}
