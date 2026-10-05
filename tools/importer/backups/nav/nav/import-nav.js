/* eslint-disable */
/* global WebImporter */

/**
 * Importer — the header nav documents (/nav, /es/nav).
 * Input: the current nav document itself (served by the local preview as
 * /content[/es]/nav.plain.html), so everything already authored is kept as is.
 *
 * Adds what the source header menu has and the nav document lacks:
 *   - "Shop" (EN) / "Comercio" (ES) → https://ustacoachingshop.com/, right after
 *     "News" / "Noticias" (source: .v-header__flyout-navigation, verified 2026-10-04).
 * Idempotent: an existing ustacoachingshop.com link is left alone.
 */
const SHOP = {
  en: { after: 'News', label: 'Shop' },
  es: { after: 'Noticias', label: 'Comercio' },
};
const SHOP_URL = 'https://ustacoachingshop.com/';

export default {
  transform: ({ document, params }) => {
    const path = new URL(params.originalURL).pathname;
    const locale = /\/es\//.test(path) ? 'es' : 'en';
    const out = document.createElement('div');
    // the plain document: one top-level <div> per nav section
    [...document.body.children].forEach((section) => {
      out.append(section);
      if (section.tagName === 'DIV') out.append(document.createElement('hr'));
    });
    if (out.lastElementChild?.tagName === 'HR') out.lastElementChild.remove();

    const cfg = SHOP[locale];
    if (!out.querySelector(`a[href^="${SHOP_URL}"]`)) {
      const news = [...out.querySelectorAll('li > a')].find((a) => a.textContent.trim() === cfg.after);
      if (!news) throw new Error(`nav: "${cfg.after}" item not found`);
      const li = document.createElement('li');
      const a = document.createElement('a');
      a.href = SHOP_URL;
      a.textContent = cfg.label;
      li.append(a);
      news.parentElement.after(li);
    }
    return [{ element: out, path: locale === 'es' ? '/es/nav' : '/nav', report: { template: 'nav' } }];
  },
};
