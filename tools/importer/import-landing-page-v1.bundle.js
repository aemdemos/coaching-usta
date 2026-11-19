/* eslint-disable */
var CustomImportScript = (() => {
  var __defProp = Object.defineProperty;
  var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
  var __export = (target, all) => {
    for (var name in all)
      __defProp(target, name, { get: all[name], enumerable: true });
  };
  var __copyProps = (to, from, except, desc) => {
    if (from && typeof from === "object" || typeof from === "function") {
      for (let key of __getOwnPropNames(from))
        if (!__hasOwnProp.call(to, key) && key !== except)
          __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
    }
    return to;
  };
  var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

  // tools/importer/import-landing-page-v1.js
  var import_landing_page_v1_exports = {};
  __export(import_landing_page_v1_exports, {
    KINDS: () => KINDS,
    TEMPLATE: () => TEMPLATE,
    block: () => block,
    contentRoot: () => contentRoot,
    default: () => import_landing_page_v1_default,
    el: () => el,
    emitSection: () => emitSection,
    finalizeOutput: () => finalizeOutput,
    norm: () => norm
  });

  // tools/importer/transformers/coaching-usta-cleanup.js
  var TransformHook = {
    beforeTransform: "beforeTransform",
    afterTransform: "afterTransform"
  };
  function transform(hookName, element, payload) {
    if (hookName === TransformHook.beforeTransform) {
      WebImporter.DOMUtils.remove(element, [
        "#onetrust-consent-sdk",
        ".onetrust-pc-dark-filter",
        '[id^="onetrust-"]',
        '[class*="ot-sdk"]'
      ]);
      WebImporter.DOMUtils.remove(element, [
        ".phe-block",
        ".cmp-text__icon"
      ]);
      WebImporter.DOMUtils.remove(element, [
        ".aem-dynamictable",
        ".container--no-inner-gutter-paddings.container--inner-full-height--vertical-center"
      ]);
    }
    if (hookName === TransformHook.afterTransform) {
      WebImporter.DOMUtils.remove(element, [
        ".cmp-experiencefragment--header-xf",
        ".cmp-experiencefragment--footer-xf",
        ".cmp-experiencefragment--modals-xf",
        ".v-header"
      ]);
      WebImporter.DOMUtils.remove(element, [
        "iframe",
        "noscript",
        "link",
        "source"
      ]);
      element.querySelectorAll("*").forEach((el2) => {
        el2.removeAttribute("data-cmp-data-layer-name");
        el2.removeAttribute("data-cmp-link-accessibility-enabled");
        el2.removeAttribute("data-cmp-link-accessibility-text");
        [...el2.attributes].filter((attr) => attr.name.startsWith("data-cmp-")).forEach((attr) => el2.removeAttribute(attr.name));
      });
    }
  }

  // tools/importer/parsers/cards-pricing.js
  function parse(element, { document }) {
    const cards = [...element.querySelectorAll(".v-tiers-card")];
    const cells = [];
    cards.forEach((card) => {
      const content = card.querySelector(".v-tiers-card--content") || card;
      const cellContent = [];
      const titleEl = content.querySelector(".v-tiers-card__title");
      if (titleEl && titleEl.textContent.trim()) {
        const h = document.createElement("h3");
        h.textContent = titleEl.textContent.trim();
        cellContent.push(h);
      }
      const subtitle = content.querySelector(".v-tiers-card__subtitle");
      if (subtitle) {
        [...subtitle.querySelectorAll("p")].forEach((p) => {
          if (p.textContent.trim()) cellContent.push(p);
        });
      }
      const priceEl = content.querySelector(".v-tiers-card__price");
      if (priceEl && priceEl.textContent.trim()) {
        const price = document.createElement("p");
        price.className = "price";
        price.textContent = priceEl.textContent.trim();
        cellContent.push(price);
      }
      const featureList = content.querySelector(".v-tiers-card__description ul, .v-tiers-card__description ol");
      if (featureList) cellContent.push(featureList);
      const anchor = content.querySelector(".v-tiers-card__button-wrapper a[href]");
      const button = content.querySelector(".v-tiers-card__button-wrapper button, .coaching-primary-button");
      if (anchor) {
        cellContent.push(anchor);
      } else if (button && button.textContent.trim()) {
        const link = document.createElement("a");
        link.href = "#";
        link.textContent = button.textContent.trim();
        cellContent.push(link);
      }
      if (cellContent.length) cells.push([cellContent]);
    });
    if (!cells.length) {
      element.replaceWith(...element.childNodes);
      return;
    }
    const block2 = WebImporter.Blocks.createBlock(document, { name: "cards-pricing", cells });
    element.replaceWith(block2);
  }

  // tools/importer/parsers/columns-cta.js
  function parse2(element, { document }) {
    const paras = [...element.querySelectorAll(".cmp-text p, p")].filter((p) => p.textContent.trim());
    const cta = element.querySelector("a[href]");
    if (!paras.length && !cta) {
      element.replaceWith(...element.childNodes);
      return;
    }
    const textParas = paras.filter((p) => !cta || !cta.contains(p));
    const textCell = [];
    if (textParas[0]) {
      const h = document.createElement("h2");
      h.textContent = textParas[0].textContent.trim();
      textCell.push(h);
    }
    textParas.slice(1).forEach((p) => textCell.push(p));
    const actionCell = cta || "";
    const cells = [[textCell.length ? textCell : "", actionCell]];
    const block2 = WebImporter.Blocks.createBlock(document, { name: "columns-cta", cells });
    element.replaceWith(block2);
  }

  // tools/importer/import-landing-page-v1.js
  var TEMPLATE = "landing-page";
  var BASE = "https://www.ustacoaching.com";
  var PAGE_THEMES = { "/home/courses": "course-catalog" };
  var themeOf = (pagePath) => PAGE_THEMES[pagePath.replace(/^\/(en|es)(?=\/)/, "")] || "";
  var IMAGE_PAIR_THEMES = ["course-catalog"];
  var el = (document, tag, html) => {
    const e = document.createElement(tag);
    if (html !== void 0) e.innerHTML = html;
    return e;
  };
  var BLANK = "[[blank-line]]";
  var norm = (s) => (s || "").replace(BLANK, "").replace(/\s+/g, " ").trim();
  var cls = (e, c) => !!e && !!e.classList && e.classList.contains(c);
  var block = (document, name, cells) => WebImporter.Blocks.createBlock(document, { name, cells });
  function pathOf(url) {
    const u = new URL(url);
    return u.pathname.replace(/\.html$/, "").replace(/\/$/, "") || "/index";
  }
  function metadata(document, theme) {
    const meta = (sel) => document.querySelector(sel)?.getAttribute("content") || "";
    const cells = { Title: document.title, Description: meta('meta[name="description"]'), Template: TEMPLATE, Theme: theme };
    const og = meta('meta[property="og:image"]');
    if (og) {
      const img = el(document, "img");
      img.src = og;
      cells.Image = img;
    }
    Object.keys(cells).forEach((k) => {
      if (!cells[k]) delete cells[k];
    });
    return block(document, "Metadata", cells);
  }
  function contentRoot(main) {
    const skip = (e) => /experiencefragment/.test(e.className || "") && !e.querySelector(".v-tiers") || /aem-header|aem-hidden-component|aem-quiz|aem-wizard|safe-play|footer/.test(e.className || "");
    let root = main.querySelector(".aem-Grid");
    for (let guard = 0; guard < 12 && root; guard += 1) {
      const kids = [...root.children].filter((k) => !skip(k) && Number(k.getAttribute("data-h") || 0) > 0);
      const total = kids.reduce((s, k) => s + Number(k.getAttribute("data-h") || 0), 0);
      const big = kids.find((k) => Number(k.getAttribute("data-h") || 0) >= 0.85 * total);
      if (kids.length > 2 && !big) break;
      const next = big && big.querySelector(".aem-Grid");
      if (!next) break;
      root = next;
    }
    return { root, skip };
  }
  function components(container) {
    const out = [];
    const walk = (e) => [...e.children].forEach((k) => {
      if (cls(k, "aem-Grid") || cls(k, "cmp-container") || k.tagName === "DIV" && !k.className) {
        walk(k);
        return;
      }
      if (/aem-GridColumn/.test(k.className || "") || /^(text|image|button|container|separator|accordion|embed|iframetext|tags)\b/.test(k.className || "")) out.push(k);
    });
    walk(container);
    return out;
  }
  function comps(section) {
    let list = components(section);
    for (let guard = 0; guard < 6 && list.length === 1 && (list[0].className || "").split(" ")[0] === "container"; guard += 1) list = components(list[0]);
    return list;
  }
  function deep(container) {
    const out = [];
    components(container).forEach((c) => {
      if ((c.className || "").split(" ")[0] === "container") out.push(...deep(c));
      else out.push(c);
    });
    return out;
  }
  var kind = (c) => (c.className || "").split(" ")[0];
  var isText = (c) => kind(c) === "text";
  var isImage = (c) => kind(c) === "image";
  var isButton = (c) => kind(c) === "button";
  var isContainer = (c) => kind(c) === "container";
  var fontSize = (c) => {
    const m = (c.className || "").match(/text--font-size--(\d+)px/);
    return m ? Number(m[1]) : 0;
  };
  var isUstaSans = (c) => /text--font-family--usta-sans/.test(c.className || "");
  function textEls(c, document, { headingLevel } = {}) {
    const cmp = c.querySelector(".cmp-text") || c;
    const out = [];
    const size = fontSize(c);
    const rows = cmp.querySelectorAll(":scope > .cmp-text__image-and-paragraph");
    if (rows.length) {
      rows.forEach((r) => {
        const copy = r.querySelector(":scope > div:not(.cmp-text__image-wrapper)") || r;
        [...copy.children].forEach((k) => {
          if (norm(k.textContent)) out.push(k);
        });
      });
      return out;
    }
    cmp.querySelectorAll("span[style]").forEach((sp) => {
      if (/207,\s*255,\s*5|#cfff05/i.test(sp.getAttribute("style"))) {
        const em = el(document, "em");
        em.append(...sp.childNodes);
        sp.replaceWith(em);
      }
    });
    let prevP = null;
    let prevH = null;
    let prevPH = null;
    [...cmp.children].forEach((k) => {
      if (cls(k, "cmp-text__icon")) return;
      if (!norm(k.textContent) && !k.querySelector("img")) {
        prevP = null;
        prevH = null;
        prevPH = null;
        return;
      }
      if (k.tagName !== "P") prevPH = null;
      if (/^H[1-6]$/.test(k.tagName) && prevH && prevH.tagName === k.tagName) {
        prevH.append(el(document, "br"), ...k.childNodes);
        return;
      }
      prevH = /^H[1-6]$/.test(k.tagName) ? k : null;
      if (k.tagName === "P" && (headingLevel || size >= 32 || isUstaSans(c) && !size)) {
        const lvl = headingLevel || (size >= 40 || isUstaSans(c) ? 2 : 3);
        if (prevPH && prevPH.tagName === `H${lvl}`) {
          prevPH.append(el(document, "br"), ...k.childNodes);
          return;
        }
        const h = el(document, `h${lvl}`);
        h.append(...k.childNodes);
        out.push(h);
        prevPH = h;
        prevP = null;
        return;
      }
      if (k.tagName === "P" && prevP) {
        prevP.append(el(document, "br"), ...k.childNodes);
        return;
      }
      out.push(k);
      prevP = k.tagName === "P" ? k : null;
    });
    const style = { 24: "lead", 18: "subhead" }[size];
    if (style && !isUstaSans(c) && !headingLevel && out.length && out.every((k) => k.tagName === "P")) {
      const opts = [style, .../cmp-text--alignment-center/.test(c.className) ? ["center"] : []];
      return [block(document, `Text Style (${opts.join(", ")})`, [[out]])];
    }
    return out;
  }
  function imageEl(c, document) {
    const img = c.querySelector("img");
    if (!img) return null;
    const out = el(document, "img");
    out.src = img.getAttribute("src") || img.getAttribute("data-src") || "";
    out.alt = img.getAttribute("alt") || "";
    return out;
  }
  function buttonEl(c, document, pagePath) {
    const a = c.querySelector("a, button");
    if (!a) return null;
    const label = norm(a.textContent);
    if (!label) return null;
    const link = el(document, "a");
    link.href = a.getAttribute("href") || pagePath;
    link.textContent = label;
    const p = el(document, "p");
    const wrap = el(document, c.getAttribute("data-btn") === "outline" ? "em" : "strong");
    wrap.append(link);
    p.append(wrap);
    return p;
  }
  function defaultContent(container, document, pagePath) {
    const out = [];
    components(container).forEach((c) => {
      if (isText(c)) out.push(...textEls(c, document));
      else if (isImage(c)) {
        const i = imageEl(c, document);
        if (i) {
          const p = el(document, "p");
          p.append(i);
          const phone = c.getAttribute("data-phone-image");
          if (phone) {
            const m = el(document, "img");
            m.src = phone;
            m.alt = c.getAttribute("data-phone-alt") || i.alt;
            p.append(m);
          }
          out.push(p);
        }
      } else if (isButton(c)) {
        const b = buttonEl(c, document, pagePath);
        if (b) out.push(b);
      } else if (isContainer(c)) out.push(...defaultContent(c, document, pagePath));
    });
    return out;
  }
  function listFrom(comps2, document) {
    const ul = el(document, "ul");
    comps2.forEach((c) => {
      const li = el(document, "li");
      textEls(c, document).forEach((k) => {
        if (k.tagName === "P") li.append(...k.childNodes);
        else li.append(k);
      });
      if (norm(li.textContent)) ul.append(li);
    });
    return ul;
  }
  var isListRow = (c) => isText(c) && !!c.querySelector(".cmp-text__image-and-paragraph");
  var isTopicCard = (c) => {
    const k = components(c).filter((x) => kind(x) !== "separator");
    return k.length >= 2 && k.every(isText);
  };
  function reparse(node, parse3, name, document) {
    const holder = el(document, "div");
    holder.append(node);
    parse3(node, { document });
    const table = holder.querySelector("table");
    if (table) table.rows[0].cells[0].textContent = name;
    return [...holder.childNodes];
  }
  function textP(document, source) {
    const p = el(document, "p");
    p.innerHTML = source.innerHTML.replace(/<(\/?)b>/g, "<$1strong>");
    return p;
  }
  function centredSpan(c) {
    const n = Number(((c.className || "").match(/aem-GridColumn--default--(\d+)\b/) || [])[1]);
    const off = Number(((c.className || "").match(/aem-GridColumn--offset--default--(\d+)\b/) || [])[1]);
    return n >= 1 && n < 12 && off * 2 + n === 12 ? n : 0;
  }
  function emitSection(s, { document, pagePath }) {
    const out = [];
    const lead = [];
    for (const c of comps(s)) {
      if (isText(c) && centredSpan(c)) lead.push(c);
      else break;
    }
    const rest = comps(s).filter((c) => !lead.includes(c) && kind(c) !== "separator");
    if (lead.length && rest.length) {
      const n = centredSpan(lead[0]);
      const nodes2 = [];
      lead.forEach((c) => {
        nodes2.push(...textEls(c, document));
        c.remove();
      });
      const styles2 = [...cls(lead[0], "cmp-text--alignment-center") ? ["center"] : [], `narrow-${n}`];
      out.push({ name: "heading", nodes: nodes2, styles: styles2 });
    }
    const k = KINDS.find((kd) => {
      try {
        return kd.match(s);
      } catch (e) {
        return false;
      }
    });
    const texts = deep(s).filter((c) => isText(c) && norm(c.textContent));
    const firstText = texts.find((c) => !(isUstaSans(c) && !cls(c, "cmp-text--alignment-center"))) || texts[0];
    const centred = !!firstText && cls(firstText, "cmp-text--alignment-center") || out.length && out[0].styles.includes("center");
    const nodes = k ? k.emit(s, { document, pagePath }) : defaultContent(s, document, pagePath);
    const styles = [];
    if (centred && !(k && /^(hero|banner)/.test(k.name))) styles.push("center");
    out.push({ name: k ? k.name : "default", nodes, styles, join: !!(k && k.joinPrevious) });
    return out;
  }
  var KINDS = [
    {
      // page sub-navigation (Courses · Workshops · Education Centers) → Tabs in navigation
      // mode: one row per link (no panel); the tab linking to the current page is active
      name: "sub-nav",
      match: (s) => !!s.querySelector(".cmp-navigation"),
      emit: (s, { document }) => {
        const rows = [...s.querySelectorAll(".cmp-navigation__item-link")].map((a) => {
          const link = el(document, "a");
          link.href = a.getAttribute("href");
          link.textContent = norm(a.textContent);
          return [link];
        });
        return rows.length ? [block(document, "Tabs", rows)] : [];
      }
    },
    {
      // the course browser (Vue v-course-list) → Course Filter; it fills itself from the
      // LMS API + the locale course catalog sheet, so the block has no rows
      name: "course-filter",
      match: (s) => cls(s, "aem-course-list") || !!s.querySelector(".aem-course-list, .v-course-list"),
      emit: (s, { document }) => [block(document, "Course Filter", [[""]])]
    },
    {
      // certification cost cards (Vue v-cost-card) → Cards (comparison): one row per tier
      // (logo | title, fee, PER YEAR + price, description, TOTAL); the equivalency line and
      // the "Notes:" paragraph after the cards are the block's last two rows
      name: "cards-comparison",
      match: (s) => !!s.querySelector(".v-cost-card"),
      emit: (s, { document }) => {
        const cards = [...s.querySelectorAll(".v-cost-card")];
        const texts = [...s.querySelectorAll(".text")].filter((t) => isText(t) && norm(t.textContent));
        const before = texts.filter((t) => t.compareDocumentPosition(cards[0]) & 4);
        const after = texts.filter((t) => !before.includes(t));
        const lead = [];
        before.forEach((t) => lead.push(...textEls(t, document, { headingLevel: 2 })));
        const p = (text) => {
          const q = el(document, "p");
          q.textContent = text;
          return q;
        };
        const rows = cards.map((c) => {
          const logo = c.querySelector(".v-cost-card__badge-image img");
          const img = el(document, "img");
          if (logo) {
            img.src = logo.getAttribute("src");
            img.alt = logo.getAttribute("alt") || "";
          }
          const body = [];
          const h = el(document, "h3");
          h.textContent = norm(c.querySelector(".v-cost-card__title")?.textContent);
          body.push(h);
          const overlay = c.querySelector(".v-cost-card__coming-soon-overlay");
          if (overlay) {
            body.push(p(norm(c.querySelector(".v-cost-card__total")?.textContent) || h.textContent));
            return [logo ? img : "", body];
          }
          const sub = c.querySelector(".v-cost-card__subtitle");
          if (sub) body.push(p(norm(sub.textContent)));
          const label = c.querySelector(".v-cost-card__price-label");
          if (label) body.push(p(norm(label.textContent)));
          const value = c.querySelector(".v-cost-card__price-value");
          if (value) body.push(p(norm(value.textContent)));
          const desc = c.querySelector(".v-cost-card__description");
          if (desc) {
            [...desc.children].forEach((k) => {
              if (k.tagName === "UL" || k.tagName === "OL") {
                const list = el(document, k.tagName.toLowerCase());
                k.querySelectorAll("li").forEach((li) => {
                  const item = el(document, "li");
                  item.textContent = norm(li.textContent);
                  list.append(item);
                });
                body.push(list);
              } else if (norm(k.textContent)) body.push(textP(document, k));
            });
          }
          const tl = c.querySelector(".v-cost-card__total-label");
          if (tl) body.push(p(norm(tl.textContent)));
          const tv = c.querySelector(".v-cost-card__total-value");
          if (tv) body.push(p(norm(tv.textContent)));
          return [logo ? img : "", body];
        });
        after.forEach((t) => {
          const ps = textEls(t, document).filter((k) => k.tagName === "P");
          if (ps.length) rows.push([ps]);
        });
        return [...lead, block(document, "Cards (comparison)", rows)];
      }
    },
    {
      // the membership tiers (Vue v-tiers, an experience fragment) → Cards (pricing);
      // joins the "PACKAGES FOR EVERY KIND OF COACH" heading section before it (as on home)
      name: "cards-pricing",
      joinPrevious: true,
      match: (s) => !!s.querySelector(".v-tiers"),
      emit: (s, { document }) => reparse(s.querySelector(".v-tiers"), parse, "Cards (pricing)", document)
    },
    {
      // the "Explore workshops & events" experience fragment → Banner (events, blue), as on home
      name: "banner-events",
      match: (s) => !!s.querySelector(".experiencefragment .container--display--flex.container--align-items--center"),
      emit: (s, { document }) => reparse(s.querySelector(".container--display--flex.container--align-items--center"), parse2, "Banner (events, blue)", document)
    },
    {
      // full-bleed rounded hero: background photo container + H1 (+ subhead, copy, CTA)
      name: "hero-content",
      match: (s) => !!s.querySelector(".cmp-container[data-desktop-background-image]") && !!s.querySelector("h1"),
      emit: (s, { document, pagePath }) => {
        const bg = s.querySelector(".cmp-container[data-desktop-background-image]").getAttribute("data-desktop-background-image");
        const img = el(document, "img");
        img.src = bg;
        img.alt = "";
        const content = [];
        deep(s).forEach((c) => {
          if (isText(c)) content.push(...textEls(c, document, { headingLevel: c.querySelector("h1") ? 0 : fontSize(c) >= 32 ? 2 : 0 }));
          else if (isButton(c)) {
            const b = buttonEl(c, document, pagePath);
            if (b) {
              const p = el(document, "p");
              p.append(b.querySelector("a"));
              content.push(p);
            }
          }
        });
        const title = !deep(s).some(isButton);
        return [block(document, title ? "Hero (content, title)" : "Hero (content)", [[img], [content]])];
      }
    },
    {
      name: "accordion",
      match: (s) => !!s.querySelector(".cmp-accordion"),
      emit: (s, { document, pagePath }) => {
        const acc = s.querySelector(".accordion");
        const lead = [];
        comps(s).forEach((c) => {
          if (c !== acc && !acc.contains(c) && isText(c)) lead.push(...textEls(c, document));
        });
        const rows = [...acc.querySelectorAll(".cmp-accordion__item")].map((item) => {
          const title = el(document, "p", "");
          title.textContent = norm(item.querySelector(".cmp-accordion__title, .cmp-accordion__button")?.textContent);
          const panel = item.querySelector(".cmp-accordion__panel");
          const body = panel ? defaultContent(panel, document, pagePath) : [];
          return [title, body.length ? body : ""];
        });
        const anyOpen = !!acc.querySelector(".cmp-accordion__item[data-cmp-expanded], .cmp-accordion__button--expanded");
        return [...lead, block(document, anyOpen ? "Accordion" : "Accordion (closed)", rows)];
      }
    },
    {
      // the Eligibility & Requirements style panel: rounded dark panel + heading + 2 list columns (+ CTA)
      name: "columns-text-panel",
      match: (s) => /border-radius--top-left-outer/.test(s.className) && comps(s).filter((c) => isContainer(c) && components(c).some(isListRow)).length >= 2,
      emit: (s, { document, pagePath }) => {
        const direct = comps(s);
        const heading = direct.find((c) => isText(c) && fontSize(c) >= 40);
        const cols = direct.filter((c) => isContainer(c) && components(c).some(isListRow));
        const btn = direct.find(isButton);
        const rows = [];
        if (heading) rows.push([textEls(heading, document, { headingLevel: 2 })]);
        rows.push(cols.map((col) => {
          const cc = components(col);
          const cell = [];
          cc.filter((c) => isText(c) && !isListRow(c)).forEach((c) => {
            textEls(c, document).forEach((k) => {
              const p = el(document, "p");
              p.append(...k.childNodes);
              cell.push(p);
            });
          });
          cell.push(listFrom(cc.filter(isListRow), document));
          return cell;
        }));
        if (btn) {
          const b = buttonEl(btn, document, pagePath);
          if (b) rows.push([b.querySelector("a")]);
        }
        return [block(document, "Columns (text)", rows)];
      }
    },
    {
      // bullet rows laid out in two columns without a panel ("How the program works")
      name: "columns-text-plain",
      match: (s) => comps(s).filter(isListRow).length >= 2 && !comps(s).some((c) => isContainer(c) && components(c).some(isListRow)),
      emit: (s, { document }) => {
        const list = comps(s);
        const lead = [];
        list.filter((c) => !isListRow(c) && isText(c)).forEach((c) => lead.push(...textEls(c, document)));
        const rows = [];
        let lastX = Infinity;
        list.filter(isListRow).forEach((c) => {
          const x = Number(c.getAttribute("data-x") || 0);
          if (x <= lastX) rows.push([]);
          lastX = x;
          const cell = [];
          textEls(c, document).forEach((k) => cell.push(k));
          rows[rows.length - 1].push(cell);
        });
        return [...lead, block(document, "Columns (checklist)", rows)];
      }
    },
    {
      // a rounded colour panel holding only heading / copy / one CTA → centred banner
      name: "banner-centered",
      match: (s) => /border-radius--top-left-outer/.test(s.className) && !!s.getAttribute("data-bg") && !comps(s).some(isImage) && comps(s).filter(isButton).length === 1,
      emit: (s, { document, pagePath }) => {
        const list = comps(s);
        const text = [];
        list.filter(isText).forEach((c, i) => text.push(...textEls(c, document, { headingLevel: i === 0 ? 2 : 0 })));
        const b = buttonEl(list.find(isButton), document, pagePath);
        const lime = list.find(isButton)?.getAttribute("data-btn") === "lime";
        const narrowBody = list.filter(isText).slice(1).some((c) => /aem-GridColumn--default--10\b/.test(c.className));
        const name = s.getAttribute("data-bg") === "blue" && lime && text[0]?.tagName === "H2" ? `Banner (spotlight${narrowBody ? ", narrow" : ""})` : `Banner (centered${s.getAttribute("data-bg") === "blue" ? ", blue" : ""})`;
        return [block(document, name, [[text, b ? b.querySelector("a") : ""]])];
      }
    },
    {
      // a grid of cards: ≥2 sub-containers each with a (large) image + title + copy
      name: "cards-media",
      match: (s) => comps(s).filter((c) => isContainer(c) && components(c).some(isImage) && components(c).some(isText) && !components(c).some((k) => isImage(k) && /default--1\b/.test(k.className))).length >= 2,
      emit: (s, { document, pagePath }) => {
        const out = [];
        const rows = [];
        comps(s).forEach((c) => {
          if (isContainer(c) && components(c).some(isImage)) {
            const cc = components(c);
            const img = imageEl(cc.find(isImage), document);
            const body = [];
            cc.filter(isText).forEach((t, i) => body.push(...textEls(t, document, { headingLevel: i === 0 && fontSize(t) >= 24 ? 3 : 0 })));
            rows.push([img || "", body]);
          } else if (!rows.length) {
            if (isText(c)) out.push(...textEls(c, document));
          }
        });
        out.push(block(document, "Cards (media, stacked)", rows));
        comps(s).filter((c) => !isContainer(c) && rows.length).forEach((c) => {
          if (isButton(c)) {
            const b = buttonEl(c, document, pagePath);
            if (b) out.push(b);
          }
        });
        return out;
      }
    },
    {
      // small-icon cards: sub-containers with a 1-column icon image + title/copy text
      name: "cards-icon",
      match: (s) => comps(s).filter((c) => isContainer(c) && components(c).some((k) => isImage(k) && /default--1\b/.test(k.className))).length >= 2,
      emit: (s, { document, pagePath }) => {
        const before = [];
        const after = [];
        const rows = [];
        comps(s).forEach((c) => {
          if (isContainer(c) && components(c).some(isImage)) {
            const cc = components(c);
            const icon = imageEl(cc.find(isImage), document);
            const texts = [];
            cc.filter(isText).forEach((t) => texts.push(...textEls(t, document)));
            if (texts[0] && texts[0].tagName === "P") {
              const first = texts[0];
              const lead = first.firstElementChild;
              const h = el(document, "h3");
              if (lead && /^(STRONG|B)$/.test(lead.tagName) && !norm(first.textContent.slice(0, first.textContent.indexOf(lead.textContent)))) {
                h.append(...lead.childNodes);
                lead.remove();
                while (first.firstChild && (first.firstChild.nodeName === "BR" || first.firstChild.nodeType === 3 && !norm(first.firstChild.textContent))) first.firstChild.remove();
                texts.splice(0, 1, h, ...norm(first.textContent) ? [first] : []);
              } else {
                h.append(...first.childNodes);
                texts[0] = h;
              }
            }
            const iconP = el(document, "p");
            if (icon) iconP.append(icon);
            rows.push([[iconP, ...texts]]);
          } else if (!rows.length) {
            if (isText(c)) before.push(...textEls(c, document));
          } else if (isText(c)) after.push(...textEls(c, document));
          else if (isButton(c)) {
            const b = buttonEl(c, document, pagePath);
            if (b) after.push(b);
          }
        });
        return [...before, block(document, "Cards (icons)", rows), ...after];
      }
    },
    {
      // two (or more) side-by-side text columns, each with its own CTA ("Join … today")
      name: "columns-cta",
      match: (s) => comps(s).filter((c) => isContainer(c) && components(c).some(isButton) && components(c).some(isText) && !components(c).some(isImage)).length >= 2,
      emit: (s, { document, pagePath }) => {
        const before = [];
        const cells = [];
        comps(s).forEach((c) => {
          if (isContainer(c) && components(c).some(isButton)) cells.push(defaultContent(c, document, pagePath));
          else if (!cells.length && isText(c)) before.push(...textEls(c, document));
        });
        cells.forEach((cell) => {
          if (cell[0] && /^H[23]$/.test(cell[0].tagName)) {
            const h = el(document, "h3");
            h.append(...cell[0].childNodes);
            cell[0] = h;
          }
        });
        return [...before, block(document, "Columns (cta)", [cells])];
      }
    },
    {
      // an image beside a gray-bordered text card (`container--border--gray`): the
      // Columns (feature) row — framed in its dark panel, or `unframed` without one
      name: "columns-feature",
      match: (s) => deep(s).some(isImage) && !!s.querySelector(".container--border--gray") && !comps(s).some(isButton),
      emit: (s, { document }) => {
        const card = s.querySelector(".container--border--gray");
        const img = deep(s).find((c) => isImage(c) && !card.contains(c));
        const texts = [];
        deep(card).filter(isText).forEach((t) => texts.push(...textEls(t, document)));
        const i = imageEl(img, document);
        const imgFirst = !!(img.compareDocumentPosition(card) & 4);
        const cells = imgFirst ? [[i], texts] : [texts, [i]];
        const framed = s.getAttribute("data-bg") === "dark";
        return [block(document, framed ? "Columns (feature)" : "Columns (feature, unframed)", [cells])];
      }
    },
    {
      // heading + intro + two photos side by side + CTA ("USTA Coaching Network")
      name: "columns-photos",
      match: (s) => {
        const d = comps(s);
        return d.filter(isImage).length === 2 && d.some(isText) && !d.some(isContainer);
      },
      emit: (s, { document, pagePath }) => {
        const before = [];
        const after = [];
        const imgs = [];
        comps(s).forEach((c) => {
          if (isImage(c)) {
            const i = imageEl(c, document);
            if (i) imgs.push([i]);
          } else if (isText(c)) (imgs.length ? after : before).push(...textEls(c, document));
          else if (isButton(c)) {
            const b = buttonEl(c, document, pagePath);
            if (b) (imgs.length ? after : before).push(b);
          }
        });
        return [...before, block(document, "Columns (photos)", [imgs]), ...after];
      }
    },
    {
      // dark panel: heading + intro + CTA beside a stack of topic cards → Discussion Boards
      name: "discussion-boards",
      match: (s) => s.getAttribute("data-bg") === "dark" && deep(s).some(isButton) && [...s.querySelectorAll(".container")].filter(isTopicCard).length >= 2,
      emit: (s, { document }) => {
        const topics = [...s.querySelectorAll(".container")].filter(isTopicCard);
        const intro = [];
        deep(s).filter((c) => !topics.some((t) => t.contains(c))).forEach((c) => {
          if (isText(c)) intro.push(...textEls(c, document));
          else if (isButton(c)) {
            const a = c.querySelector("a");
            if (a) {
              const p = el(document, "p");
              const l = el(document, "a");
              l.href = a.getAttribute("href");
              l.textContent = norm(a.textContent);
              p.append(l);
              intro.push(p);
            }
          }
        });
        const rows = [[intro]];
        topics.forEach((t) => {
          const ps = components(t).filter(isText).map((c) => {
            const p = el(document, "p");
            p.textContent = norm(c.textContent);
            return p;
          });
          rows.push([[ps[0]], ps.slice(1)]);
        });
        return [block(document, "Discussion Boards", rows)];
      }
    },
    {
      // testimonial cards (`container--inner-full-height`, italic quote + name + role)
      name: "cards-quote",
      match: (s) => [...s.querySelectorAll(".container--inner-full-height")].filter((c) => c.querySelector("i, em")).length >= 2,
      emit: (s, { document }) => {
        const quotes = [...s.querySelectorAll(".container--inner-full-height")].filter((c) => c.querySelector("i, em"));
        const lead = [];
        comps(s).forEach((c) => {
          if (isText(c) && !quotes.some((q) => q.contains(c))) lead.push(...textEls(c, document));
        });
        const rows = quotes.map((q) => [[...q.querySelectorAll(".cmp-text p")].filter((x) => norm(x.textContent)).map((x) => {
          const p = el(document, "p");
          p.textContent = norm(x.textContent);
          return p;
        })]);
        const outlined = quotes.some((q) => /container--border--/.test(q.className));
        return [...lead, block(document, outlined ? "Cards (quote)" : "Cards (quote, testimonial)", rows)];
      }
    },
    {
      // a rounded colour panel: heading + copy on the left, ONE CTA in its own column at the
      // right ("Bring a USTA Coaching Workshop to Your Facility") → Banner (stacked[, blue])
      name: "banner-stacked",
      match: (s) => /container--border-radius--top-left\b/.test(s.className) && !!s.getAttribute("data-bg") && !deep(s).some(isImage) && !deep(s).some(isListRow) && deep(s).filter(isButton).length === 1 && comps(s).some((c) => isContainer(c) && components(c).some(isText) && !components(c).some(isButton)),
      emit: (s, { document, pagePath }) => {
        const cell = [];
        deep(s).filter(isText).forEach((t, i) => textEls(t, document, { headingLevel: i === 0 ? 2 : 0 }).forEach((k) => {
          if (/^H/.test(k.tagName)) k.innerHTML = k.textContent;
          cell.push(k);
        }));
        const b = buttonEl(deep(s).find(isButton), document, pagePath);
        const blue = s.getAttribute("data-bg") === "blue";
        return [block(document, `Banner (stacked${blue ? ", blue" : ""})`, [[cell, b ? b.querySelector("a") : ""]])];
      }
    },
    {
      // a photo tile (container background image, no text) beside a white card with a
      // heading + CTA ("Discover our learning pathway") → Columns (media), in source order
      name: "columns-media-bg",
      match: (s) => {
        const d = comps(s).filter(isContainer);
        return d.length === 2 && !s.querySelector("h1") && d.some((c) => !!c.querySelector(".cmp-container[data-desktop-background-image]") && !deep(c).some(isText)) && d.some((c) => deep(c).some(isText) && deep(c).some(isButton));
      },
      emit: (s, { document, pagePath }) => {
        const cells = comps(s).filter(isContainer).map((c) => {
          const bgC = c.querySelector(".cmp-container[data-desktop-background-image]");
          if (bgC && !deep(c).some(isText)) {
            const img = el(document, "img");
            img.src = bgC.getAttribute("data-desktop-background-image");
            img.alt = "";
            return [img];
          }
          const cell = [];
          deep(c).forEach((k) => {
            if (isText(k)) cell.push(...textEls(k, document));
            else if (isButton(k)) {
              const b = buttonEl(k, document, pagePath);
              if (b) {
                const q = el(document, "p");
                q.append(b.querySelector("a"));
                cell.push(q);
              }
            }
          });
          return cell;
        });
        return [block(document, "Columns (media)", [cells])];
      }
    },
    {
      // text column(s) beside an image (the desktop copy of a media row)
      name: "columns-media-row",
      // the image must sit BESIDE the text (another left edge): an image stacked between
      // copy at the same left edge (the courses intro infographic) is default content
      match: (s) => {
        const d = comps(s);
        const imgs = d.filter(isImage);
        const texts = d.filter((c) => isText(c) || isContainer(c) && components(c).some(isText));
        const x = (c) => c.getAttribute("data-x");
        return imgs.length > 0 && texts.length > 0 && imgs.some((i) => texts.some((t) => x(t) !== x(i)));
      },
      emit: (s, { document, pagePath }) => {
        const d = comps(s);
        const imgC = d.find(isImage);
        const textCell = [];
        d.filter((c) => c !== imgC).forEach((c) => {
          if (isText(c)) textCell.push(...textEls(c, document, { headingLevel: fontSize(c) >= 40 ? 2 : 0 }));
          else if (isContainer(c)) textCell.push(...defaultContent(c, document, pagePath).map((k) => k));
          else if (isButton(c)) {
            const b = buttonEl(c, document, pagePath);
            if (b) textCell.push(b);
          }
        });
        const img = imageEl(imgC, document);
        const imgFirst = Number(imgC.getAttribute("data-x") || 0) < Number((d.find((c) => c !== imgC) || imgC).getAttribute("data-x") || 0);
        const cells = imgFirst ? [img, textCell] : [textCell, img];
        return [block(document, "Columns", [cells])];
      }
    }
  ];
  var import_landing_page_v1_default = {
    onLoad: ({ document }) => {
      document.querySelectorAll(".cmp-text p").forEach((q) => {
        if (!q.textContent.replace(/\s/g, "") && !q.querySelector("img")) q.textContent = BLANK;
      });
      document.querySelectorAll(".aem-GridColumn, .cmp-container, .container").forEach((e) => {
        const r = e.getBoundingClientRect();
        e.setAttribute("data-h", String(Math.round(r.height)));
        e.setAttribute("data-x", String(Math.round(r.left)));
      });
      document.querySelectorAll(".container").forEach((c) => {
        const inner = c.querySelector(":scope > .cmp-container");
        const bg = inner ? getComputedStyle(inner).backgroundColor : "";
        if (bg === "rgb(3, 115, 243)") c.setAttribute("data-bg", "blue");
        else if (bg === "rgb(207, 255, 5)") c.setAttribute("data-bg", "lime");
        else if (bg && bg !== "rgba(0, 0, 0, 0)" && bg !== "rgb(0, 0, 0)") c.setAttribute("data-bg", "dark");
      });
      document.querySelectorAll(".button").forEach((b) => {
        const a = b.querySelector("a, button");
        const bg = a ? getComputedStyle(a).backgroundColor : "";
        if (bg === "rgba(0, 0, 0, 0)" || bg === "rgb(0, 0, 0)") b.setAttribute("data-btn", "outline");
        else if (bg === "rgb(207, 255, 5)") b.setAttribute("data-btn", "lime");
      });
    },
    transform: (payload) => {
      const { document, params } = payload;
      const url = params.originalURL;
      const pagePath = pathOf(url);
      const main = document.querySelector("main") || document.body;
      transform("beforeTransform", main, payload);
      const theme = themeOf(pagePath);
      if (IMAGE_PAIR_THEMES.includes(theme)) {
        main.querySelectorAll('.image[class*="aem-GridColumn--default--hide"]').forEach((c) => {
          const next = c.nextElementSibling;
          const img = c.querySelector("img");
          if (!img || !isImage(next) || /aem-GridColumn--default--hide/.test(next.className)) return;
          next.setAttribute("data-phone-image", img.getAttribute("src") || img.getAttribute("data-src") || "");
          next.setAttribute("data-phone-alt", img.getAttribute("alt") || "");
        });
      }
      main.querySelectorAll('[class*="aem-GridColumn--default--hide"]').forEach((e) => e.remove());
      const { root, skip } = contentRoot(main);
      if (!root) throw new Error("landing-page content grid not found");
      const out = document.createElement("div");
      const report = [];
      let first = true;
      [...root.children].forEach((s) => {
        if (skip(s) || !norm(s.textContent) && !s.querySelector("img")) return;
        emitSection(s, { document, pagePath }).forEach(({ name, nodes, styles, join }) => {
          if (!nodes.length) return;
          if (join && !first) {
            const meta = [...out.children].pop();
            const isMeta = meta && meta.tagName === "TABLE" && /section metadata/i.test(meta.rows[0]?.textContent || "");
            if (isMeta) meta.before(...nodes);
            else out.append(...nodes);
            report.push(`+${name}`);
            return;
          }
          if (!first) out.append(document.createElement("hr"));
          first = false;
          out.append(...nodes);
          if (styles.length) out.append(block(document, "Section Metadata", { Style: styles.join(", ") }));
          report.push(name);
        });
      });
      finalizeOutput(out, document);
      [...out.querySelectorAll("h1")].slice(1).forEach((h) => {
        const h2 = el(document, "h2");
        h2.append(...h.childNodes);
        h.replaceWith(h2);
      });
      out.querySelectorAll('a[href^="/content/dam/"]').forEach((a) => {
        a.setAttribute("href", `${BASE}${a.getAttribute("href")}`);
      });
      out.append(document.createElement("hr"), metadata(document, theme));
      transform("afterTransform", out, payload);
      WebImporter.rules.adjustImageUrls(out, url, params.originalURL);
      return [{ element: out, path: pagePath, report: { title: document.title, template: TEMPLATE, sections: report.join(" | ") } }];
    }
  };
  function finalizeOutput(out, document) {
    out.querySelectorAll("table table").forEach((t) => {
      const frag = document.createDocumentFragment();
      [...t.querySelectorAll("tr")].slice(1).forEach((tr) => [...tr.children].forEach((td) => {
        const kids = [...td.childNodes];
        if (kids.some((n) => n.nodeType === 1 && /^(P|H[1-6]|UL|OL)$/.test(n.tagName))) frag.append(...kids);
        else {
          const q = el(document, "p");
          q.append(...kids);
          frag.append(q);
        }
      }));
      t.replaceWith(frag);
    });
    out.querySelectorAll("p").forEach((q) => {
      if (q.textContent.includes(BLANK)) {
        q.textContent = q.textContent.replace(BLANK, "");
        if (!norm(q.textContent) && !q.querySelector("img")) q.remove();
      }
    });
  }
  return __toCommonJS(import_landing_page_v1_exports);
})();
