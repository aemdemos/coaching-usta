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

  // tools/importer/import-quiz-results-v1.js
  var import_quiz_results_v1_exports = {};
  __export(import_quiz_results_v1_exports, {
    default: () => import_quiz_results_v1_default
  });

  // tools/importer/parsers/feature-options.js
  function cropOptions(imgComp) {
    if (!imgComp) return [];
    const cls2 = imgComp.className || "";
    const opts = [];
    const crop = (cls2.match(/image--aspect-ration--((?:landscape|portrait)(?:-\d)?)(?=\s|$)/) || [])[1];
    if (crop) opts.push(crop);
    const pos = (cls2.match(/image--position--(center|bottom)(?=\s|$)/) || [])[1];
    if (crop && pos) opts.push(`image-${pos}`);
    return opts;
  }
  function featureOptions(imgComp) {
    if (!imgComp) return [];
    const span = ((imgComp.className || "").match(/aem-GridColumn--default--(\d+)/) || [])[1];
    return [...span && span !== "6" && span !== "12" ? [`media-${span}`] : [], ...cropOptions(imgComp)];
  }

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
  var PAGE_THEMES = { "/home/courses": "course-catalog", "/home/news": "news-listing", "/home/news/search-results": "news-search" };
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
      if (big && kids.some((k) => k !== big && (norm(k.textContent) || k.querySelector("img")))) break;
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
  function textEls(c, document, { headingLevel, plain } = {}) {
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
      if (/207,\s*255,\s*[58]\b|#cfff0[58]/i.test(sp.getAttribute("style"))) {
        const em = el(document, "em");
        em.append(...sp.childNodes);
        sp.replaceWith(em);
      }
    });
    let prevP = null;
    let prevH = null;
    let prevPH = null;
    const keepBlanks = !plain && !headingLevel;
    let pending = 0;
    let started = false;
    const flushBlanks = (next) => {
      if (keepBlanks && pending) {
        const last = out[out.length - 1];
        const implicit = started && next === "P" && last && last.tagName === "P" && !last.hasAttribute("data-blank") ? 1 : 0;
        for (let i = implicit; i < pending; i += 1) {
          const b = el(document, "p");
          b.textContent = "\u200B";
          b.setAttribute("data-blank", "");
          out.push(b);
        }
      }
      pending = 0;
      started = true;
    };
    [...cmp.children].forEach((child) => {
      let k = child;
      if (cls(k, "cmp-text__icon")) return;
      if (!norm(k.textContent) && !k.querySelector("img")) {
        if (k.tagName === "P" && !k.hasAttribute("data-collapsed")) pending += 1;
        prevP = null;
        prevH = null;
        prevPH = null;
        return;
      }
      if (k.tagName !== "P") prevPH = null;
      if (/^H[1-6]$/.test(k.tagName) && prevH && prevH.tagName === k.tagName && !pending) {
        prevH.append(el(document, "br"), ...k.childNodes);
        return;
      }
      if (/^H[34]$/.test(k.tagName) && (headingLevel === 2 || !headingLevel && isUstaSans(c) && size >= 40)) {
        const h2 = el(document, "h2");
        h2.append(...k.childNodes);
        k.replaceWith(h2);
        k = h2;
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
        flushBlanks("H");
        out.push(h);
        prevPH = h;
        prevP = null;
        return;
      }
      if (k.tagName === "P" && prevP) {
        prevP.append(el(document, "br"), ...k.childNodes);
        return;
      }
      flushBlanks(k.tagName);
      out.push(k);
      prevP = k.tagName === "P" ? k : null;
    });
    if (started) flushBlanks("END");
    out.forEach((k) => k.removeAttribute && k.removeAttribute("data-blank"));
    const style = { 24: "lead", 18: "subhead" }[size];
    if (style && !plain && !isUstaSans(c) && !headingLevel && out.length && out.every((k) => k.tagName === "P")) {
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
    const action = (c.querySelector("[data-button-action]") || a).getAttribute("data-button-action") || "";
    const href = a.getAttribute("href");
    link.href = /^(wizard|quiz)/.test(action) && (!href || href === "#") ? "/en/home/membership-benefits" : href || pagePath;
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
          const phone = c.getAttribute("data-phone-image");
          if (phone) {
            const m = el(document, "img");
            m.src = phone;
            m.alt = c.getAttribute("data-phone-alt") || i.alt;
            out.push(block(document, "Image", [["desktop", i], ["mobile", m]]));
          } else {
            const p = el(document, "p");
            p.append(i);
            out.push(p);
          }
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
  var isPackageTier = (c) => isContainer(c) && /container--border--white/.test(c.className) && components(c).some((t) => isText(t) && fontSize(t) === 56) && components(c).some(isButton);
  var PACKAGE_ACCENTS = { "#0373F3": "blue", "#CFFF05": "lime", "#A4EE90": "green" };
  var isStat = (c) => isContainer(c) && components(c).filter((t) => isText(t) && norm(t.textContent)).length === 2 && isUstaSans(components(c).find(isText)) && !components(c).some((t) => isImage(t) || isButton(t));
  var isLooseRunBefore = (s) => {
    const p = s.previousElementSibling;
    return !!p && p.hasAttribute("data-loose-text") && !p.hasAttribute("data-heading-only");
  };
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
  var para = (document, text) => {
    const p = el(document, "p");
    p.textContent = text;
    return p;
  };
  var slugOf = (t) => norm(t).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  var isPromoCard = (c) => isContainer(c) && /container--border--white/.test(c.className) && deep(c).some(isButton) && deep(c).filter(isText).length >= 2 && !deep(c).some(isImage);
  function promoBlock(cards, document, pagePath) {
    const rows = cards.map((card) => {
      const d = deep(card);
      const cell = [];
      d.filter(isText).forEach((t, i) => {
        cell.push(...textEls(t, document, { plain: true }));
        const btn = i === 0 && d.find(isButton);
        if (btn) {
          const b = buttonEl(btn, document, pagePath);
          if (b) {
            const p = el(document, "p");
            p.append(b.querySelector("a"));
            cell.push(p);
          }
        }
      });
      return [cell];
    });
    return block(document, "Columns (promo)", rows);
  }
  function eventsBlock(list, viewMore, document, pagePath) {
    const rows = [...list.querySelectorAll(".v-event")].map((ev) => {
      const t = (sel) => norm((ev.querySelector(sel) || {}).textContent);
      const ul = el(document, "ul");
      ev.querySelectorAll(".v-event__chip").forEach((chip) => {
        const li = el(document, "li");
        li.textContent = norm(chip.textContent);
        ul.append(li);
      });
      return [[para(document, t(".v-event__date"))], [para(document, t(".v-event__delivery-method")), para(document, t(".v-event__location")), para(document, t(".v-event__title"))], [ul]];
    });
    if (viewMore) {
      const b = buttonEl(viewMore, document, pagePath);
      if (b) rows.push([b.querySelector("a")]);
    }
    return block(document, "Columns (events)", rows);
  }
  function emitTabs(s, { document, pagePath }) {
    const tabsEl = s.querySelector(".cmp-tabs");
    const host = tabsEl.closest(".core-tabs") || tabsEl;
    const others = comps(s).filter((c) => c !== host && !host.contains(c) && !c.contains(host) && kind(c) !== "separator");
    const lead = others.filter((c) => c.compareDocumentPosition(host) & 4);
    const trail = others.filter((c) => !lead.includes(c));
    const toNodes = (list) => {
      const nodes = [];
      list.forEach((c) => {
        if (isText(c)) nodes.push(...textEls(c, document));
        else if (isButton(c)) {
          const b = buttonEl(c, document, pagePath);
          if (b) nodes.push(b);
        }
      });
      return nodes;
    };
    const leadNodes = toNodes(lead);
    const labels = [...tabsEl.querySelectorAll(".cmp-tabs__tab")].map((t) => norm(t.textContent));
    const centred = lead.some((c) => isText(c) && cls(c, "cmp-text--alignment-center"));
    const out = [{ name: "toc", nodes: [...leadNodes, block(document, "Toc", labels.map((l) => [l, slugOf(l)]))], styles: centred ? ["center"] : [] }];
    [...tabsEl.querySelectorAll(".cmp-tabs__tabpanel")].forEach((panel, i) => {
      const list = comps(panel);
      const cards = list.filter(isPromoCard);
      const nodes = [];
      if (cards.length) {
        list.filter((c) => !cards.includes(c) && isText(c)).forEach((c) => nodes.push(...textEls(c, document)));
        nodes.push(promoBlock(cards, document, pagePath));
      } else nodes.push(...defaultContent(panel, document, pagePath));
      const firstText = deep(panel).find((c) => isText(c) && norm(c.textContent));
      out.push({ name: "toc-panel", nodes, styles: firstText && cls(firstText, "cmp-text--alignment-center") ? ["center"] : [], meta: { "toc-anchor": slugOf(labels[i] || `tab-${i + 1}`) } });
    });
    if (trail.length) {
      const centredTrail = trail.some((c) => isText(c) && cls(c, "cmp-text--alignment-center"));
      out.push({ name: "default", nodes: toNodes(trail), styles: centredTrail ? ["center"] : [] });
    }
    return out;
  }
  function centredSpan(c) {
    const n = Number(((c.className || "").match(/aem-GridColumn--default--(\d+)\b/) || [])[1]);
    const off = Number(((c.className || "").match(/aem-GridColumn--offset--default--(\d+)\b/) || [])[1]);
    return n >= 1 && n < 12 && off * 2 + n === 12 ? n : 0;
  }
  function emitSection(s, { document, pagePath }) {
    const out = [];
    const lead = [];
    let wrap = s;
    let padded = null;
    for (let guard = 0; guard < 6 && wrap; guard += 1) {
      if (/container--padding--/.test(wrap.className || "")) {
        padded = wrap;
        break;
      }
      const list = components(wrap);
      wrap = list.length === 1 && isContainer(list[0]) ? list[0] : null;
    }
    const insetPx = Number((padded && padded.className.match(/\bcontainer--padding--\d+px-(\d+)px\b/) || [])[1] || 0);
    const inset = insetPx >= 1 && insetPx <= 64 ? [`inset-${insetPx}`] : [];
    const texts = comps(s).filter((c) => isText(c) && norm(c.textContent));
    const centredLead = (c) => {
      if (centredSpan(c)) return true;
      const next = texts[texts.indexOf(c) + 1];
      return cls(c, "cmp-text--alignment-center") && isUstaSans(c) && !!next && !cls(next, "cmp-text--alignment-center");
    };
    for (const c of comps(s)) {
      if (!lead.length && kind(c) === "separator") continue;
      if (isText(c) && centredLead(c)) lead.push(c);
      else break;
    }
    const rest = comps(s).filter((c) => !lead.includes(c) && kind(c) !== "separator");
    const headingOnly = lead.length && !rest.length && s.hasAttribute("data-loose-text") && !!s.nextElementSibling && isContainer(s.nextElementSibling);
    if (headingOnly) s.setAttribute("data-heading-only", "");
    if (lead.length && (rest.length || headingOnly)) {
      const n = centredSpan(lead[0]) || 12;
      const nodes2 = [];
      lead.forEach((c) => {
        nodes2.push(...textEls(c, document));
        c.remove();
      });
      const styles2 = [...cls(lead[0], "cmp-text--alignment-center") ? ["center"] : [], `narrow-${n}`, ...fontSize(lead[0]) === 64 ? ["heading-64"] : [], ...inset];
      out.push({ name: "heading", nodes: nodes2, styles: styles2 });
    }
    if (s.querySelector(".cmp-tabs")) return [...out, ...emitTabs(s, { document, pagePath }).map((p) => ({ ...p, styles: [...p.styles, ...inset] }))];
    const k = KINDS.find((kd) => {
      try {
        return kd.match(s);
      } catch (e) {
        return false;
      }
    });
    const deepTexts = deep(s).filter((c) => isText(c) && norm(c.textContent));
    const firstText = deepTexts.find((c) => !(isUstaSans(c) && !cls(c, "cmp-text--alignment-center"))) || deepTexts[0];
    const centred = !!firstText && cls(firstText, "cmp-text--alignment-center") || out.length && out[0].styles.includes("center") && !out[0].styles.includes("narrow-12");
    const nodes = k ? k.emit(s, { document, pagePath }) : defaultContent(s, document, pagePath);
    const styles = [];
    if (centred && !(k && /^(hero|banner|video)/.test(k.name))) styles.push("center");
    const leadText = comps(s).find((c) => isText(c) && norm(c.textContent));
    if (!out.length && leadText && isUstaSans(leadText) && fontSize(leadText) === 64 && !(k && /^(hero|banner)/.test(k.name))) styles.push("heading-64");
    styles.push(...inset);
    const m36 = (e) => !!e && (e.hasAttribute("data-margin-36") || /container--top-margin--36\b/.test(e.className || "") && !/container--border-radius--/.test(e.className) && !e.getAttribute("data-bg"));
    if (m36(s) || m36(padded) || [...s.children].some((c) => c.hasAttribute("data-margin-36"))) {
      styles.push("spacing-36");
      if (out.length && out[0].name === "heading") out[0].styles.push("spacing-36");
    }
    if (!k && !inset.length && padded && /\bcontainer--padding--small\b/.test(padded.className) && !/container--border--/.test(padded.className)) {
      styles.push("inset-12");
      if (out.length && out[0].name === "heading") out[0].styles.push("inset-12");
    }
    const join = !!k && (typeof k.joinPrevious === "function" ? k.joinPrevious(s) : !!k.joinPrevious);
    out.push({ name: k ? k.name : "default", nodes, styles, join });
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
      // the course browser (Vue v-course-list WITH its filter bar — the courses page) → Course
      // Filter; it fills itself from the LMS API + the locale course catalog sheet, so the
      // block has no rows. (learning-pathway's v-course-list is a different instance — the
      // certifications API, no filters, a redirect button — not this block.)
      name: "course-filter",
      match: (s) => !!s.querySelector(".v-course-list__top-filters-wrapper"),
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
      // the membership tiers (Vue v-tiers, an experience fragment) → Cards (pricing). A tiers
      // XF standing alone joins the "PACKAGES FOR EVERY KIND OF COACH" heading section before it
      // (courses, as on home); copy / buttons sharing its section stay default content before
      // the cards and the section stays its own (learning pathway)
      name: "cards-pricing",
      joinPrevious: (s) => !comps(s).some((c) => isText(c) || isButton(c) || isImage(c)),
      match: (s) => !!s.querySelector(".v-tiers"),
      emit: (s, { document, pagePath }) => [
        ...defaultContent(s, document, pagePath),
        ...reparse(s.querySelector(".v-tiers"), parse, "Cards (pricing)", document)
      ]
    },
    {
      // the package cards built from plain containers (coachtennis: 3+ white-outlined tier
      // containers, each with a 56px USTA Sans price and a CTA) → Cards (pricing, packages):
      // one row per tier — cell 1: [label] · icon · tier name (h3) · price · tagline (h4) · CTA ·
      // feature list; cell 2: the tier accent (from the CTA's author colour: blue / lime / green,
      // white = none). The section joins the heading + intro run before it (one section).
      name: "cards-packages",
      joinPrevious: (s) => isLooseRunBefore(s),
      match: (s) => comps(s).filter(isPackageTier).length >= 3,
      emit: (s, { document, pagePath }) => {
        const rows = comps(s).filter(isPackageTier).map((t) => {
          const cell = [];
          const items = [];
          let accent = "";
          components(t).forEach((c) => {
            if (isButton(c)) {
              const a = c.querySelector("a, button");
              if (!a || !a.getAttribute("href")) {
                if (norm(c.textContent)) cell.push(para(document, norm(c.textContent)));
                return;
              }
              const color = ((a.getAttribute("style") || "").match(/border-color:\s*(#[0-9a-f]{6})/i) || [])[1] || "";
              accent = PACKAGE_ACCENTS[color.toUpperCase()] || "";
              const b = buttonEl(c, document, pagePath);
              if (b) {
                const p = el(document, "p");
                p.append(b.querySelector("a"));
                cell.push(p);
              }
              return;
            }
            if (!isText(c) || !norm(c.textContent)) return;
            const img = c.querySelector(".cmp-text__image");
            if (fontSize(c) === 56) cell.push(para(document, norm(c.textContent)));
            else if (/text--style--uppercase/.test(c.className)) {
              const h = el(document, "h4");
              h.textContent = norm(c.textContent);
              cell.push(h);
            } else if (/graphic-semibold/.test(c.className)) {
              if (img) {
                const p = el(document, "p");
                const i = el(document, "img");
                i.src = img.getAttribute("src");
                i.alt = "";
                p.append(i);
                cell.push(p);
              }
              const h = el(document, "h3");
              h.textContent = norm(c.textContent);
              cell.push(h);
            } else {
              const li = el(document, "li");
              li.textContent = norm(c.textContent);
              items.push(li);
            }
          });
          if (items.length) {
            const ul = el(document, "ul");
            ul.append(...items);
            cell.push(ul);
          }
          return [cell, accent];
        });
        return [block(document, "Cards (pricing, packages)", rows)];
      }
    },
    {
      // a grey-gradient strip of figures (coachtennis "16,700+ Community members" …): 2+
      // containers, each a USTA Sans figure over a label → Banner (stats): one row, one cell per
      // figure (figure paragraph + label paragraph)
      name: "banner-stats",
      match: (s) => s.getAttribute("data-bg") === "gradient" && comps(s).filter(isStat).length >= 2,
      emit: (s, { document }) => {
        const cells = comps(s).filter(isStat).map((c) => components(c).filter((t) => isText(t) && norm(t.textContent)).map((t) => para(document, norm(t.textContent))));
        return [block(document, "Banner (stats)", [cells])];
      }
    },
    {
      // icon cards with photo tiles between them, all on one equal-height grid (coachtennis
      // "Why Join USTA Coaching?": card · photo · card / photo · card · photo) → Cards (icons):
      // one row per tile in source order — a card row (icon paragraph, title, copy) or a
      // photo row (the image alone); the source's narrow-text card preset → `compact`. Joins
      // the heading + intro run before it.
      name: "cards-icons-tiles",
      joinPrevious: (s) => isLooseRunBefore(s),
      match: (s) => {
        const d = comps(s);
        return d.some(isImage) && d.filter((c) => isContainer(c) && /container--padding--24px/.test(c.className) && components(c).some(isImage) && components(c).some(isText)).length >= 2;
      },
      emit: (s, { document }) => {
        const rows = [];
        comps(s).forEach((c) => {
          if (isImage(c)) {
            const i = imageEl(c, document);
            if (i) rows.push([[i]]);
            return;
          }
          if (!isContainer(c)) return;
          const cc = components(c);
          const icon = imageEl(cc.find(isImage), document);
          const iconP = el(document, "p");
          if (icon) iconP.append(icon);
          const texts = cc.filter((t) => isText(t) && norm(t.textContent));
          const body = [iconP];
          texts.forEach((t, i) => {
            if (i === 0) {
              const h = el(document, "h3");
              h.textContent = norm(t.textContent);
              body.push(h);
            } else body.push(...textEls(t, document));
          });
          rows.push([body]);
        });
        const compact = comps(s).some((c) => isContainer(c) && components(c).some((t) => isText(t) && /text--letter-spacing--narrow/.test(t.className)));
        const opts = [...compact ? ["compact"] : [], ...cropOptions(comps(s).find(isImage))];
        return [block(document, opts.length ? `Cards (icons, ${opts.join(", ")})` : "Cards (icons)", rows)];
      }
    },
    {
      // the "Explore workshops & events" experience fragment → Banner (blue) (one banner: the
      // `events` variant was removed — see MIGRATION.md 2026-11-18 STANDARDIZED)
      name: "banner-events",
      match: (s) => !!s.querySelector(".experiencefragment .container--display--flex.container--align-items--center"),
      emit: (s, { document }) => reparse(s.querySelector(".container--display--flex.container--align-items--center"), parse2, "Banner (blue)", document)
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
        const panelX = Number(s.querySelector(".cmp-container[data-desktop-background-image]").getAttribute("data-x") || 0);
        const firstCopy = deep(s).find((c) => isText(c) && norm(c.textContent));
        const wide = !title && !!firstCopy && Number(firstCopy.getAttribute("data-x") || 0) - panelX < 48;
        const opts = [...title ? ["title"] : [], ...wide ? ["wide"] : []];
        return [block(document, opts.length ? `Hero (content, ${opts.join(", ")})` : "Hero (content)", [[img], [content]])];
      }
    },
    {
      // a white-outlined text card (heading, copy, list — no CTA, no image) beside an image:
      // `Columns (media, outlined)`, cells in source order (coaching-workshops top)
      name: "columns-media-outlined",
      match: (s) => {
        const d = comps(s);
        const card = d.find((c) => isContainer(c) && /container--border--white/.test(c.className) && deep(c).some(isText) && !deep(c).some((k) => isButton(k) || isImage(k)));
        return d.length === 2 && !!card && d.some(isImage);
      },
      emit: (s, { document }) => {
        const cells = comps(s).map((c) => {
          if (isImage(c)) return [imageEl(c, document)];
          const texts = [];
          deep(c).filter(isText).forEach((t) => texts.push(...textEls(t, document, { plain: true })));
          return texts;
        });
        return [block(document, "Columns (media, outlined)", [cells])];
      }
    },
    {
      // the Vue events list (+ lead heading / copy and the "View More" button)
      name: "events-list",
      match: (s) => !!s.querySelector(".v-events-list"),
      emit: (s, { document, pagePath }) => {
        const list = s.querySelector(".v-events-list");
        const host = list.closest(".aem-events-list") || list;
        const before = [];
        let viewMore = null;
        const after = [];
        comps(s).forEach((c) => {
          if (c === host || c.contains(host) || kind(c) === "separator") return;
          const isBefore = !!(c.compareDocumentPosition(host) & 4);
          if (isButton(c) && !isBefore && !viewMore) {
            viewMore = c;
            return;
          }
          if (isText(c)) (isBefore ? before : after).push(...textEls(c, document));
        });
        return [...before, eventsBlock(list, viewMore, document, pagePath), ...after];
      }
    },
    {
      // white-outlined event / promo cards (title + CTA + details) after a lead heading / copy
      name: "columns-promo",
      match: (s) => comps(s).some(isPromoCard),
      emit: (s, { document, pagePath }) => {
        const list = comps(s);
        const cards = list.filter(isPromoCard);
        const before = [];
        const after = [];
        list.forEach((c) => {
          if (cards.includes(c) || kind(c) === "separator") return;
          const isBefore = !!(c.compareDocumentPosition(cards[0]) & 4);
          if (isText(c)) (isBefore ? before : after).push(...textEls(c, document));
        });
        return [...before, promoBlock(cards, document, pagePath), ...after];
      }
    },
    {
      // page title + full-width photo + intro (fellowship top): default content (not a
      // media row) — the h1, the photo, the intro (Text Style lead)
      name: "title-photo",
      match: (s) => {
        const d = comps(s).filter((c) => kind(c) !== "separator");
        return d.some((c) => isText(c) && c.querySelector("h1")) && d.some((c) => isImage(c) && /aem-GridColumn--default--12\b/.test(c.className)) && !d.some(isContainer);
      },
      emit: (s, { document, pagePath }) => defaultContent(s, document, pagePath)
    },
    {
      // a dates list: a blue header panel (heading + subtitle) over white-outlined rows, each
      // a date beside an eyebrow + title (fellowship "IMPORTANT DATES") → Banner (header, blue)
      // + Columns (events, dates): one row per date — date | eyebrow, title
      name: "dates-list",
      match: (s) => {
        const d = comps(s);
        const rows = d.filter((c) => isContainer(c) && /container--border--white/.test(c.className) && !deep(c).some((k) => isButton(k) || isImage(k)) && deep(c).filter(isText).length >= 2);
        return rows.length >= 2 && d.some((c) => isContainer(c) && c.getAttribute("data-bg") === "blue");
      },
      emit: (s, { document }) => {
        const d = comps(s);
        const head = d.find((c) => isContainer(c) && c.getAttribute("data-bg") === "blue");
        const ht = deep(head).filter(isText);
        const cells = ht.map((t, i) => textEls(t, document, { headingLevel: i === 0 ? 2 : 0, plain: true }));
        const rows = d.filter((c) => isContainer(c) && /container--border--white/.test(c.className)).map((row) => {
          const texts = deep(row).filter((t) => isText(t) && norm(t.textContent));
          return [[para(document, norm(texts[0].textContent))], texts.slice(1).map((t) => para(document, norm(t.textContent)))];
        });
        return [block(document, "Banner (header, blue)", [cells]), block(document, "Columns (events, dates)", rows)];
      }
    },
    {
      // a display heading over a consent-gated YouTube / Vimeo embed → Video (title row, consent
      // message row whose link is the video; block sample contract)
      name: "video",
      match: (s) => !!s.querySelector('.embed iframe[data-src*="youtube"], .embed iframe[src*="youtube"], .embed iframe[data-src*="vimeo"], .embed iframe[src*="vimeo"]'),
      emit: (s, { document }) => {
        const frame = s.querySelector(".embed iframe");
        const src = (frame.getAttribute("data-src") || frame.getAttribute("src") || "").split("?")[0];
        const title = [];
        comps(s).filter(isText).forEach((t) => textEls(t, document, { plain: true }).forEach((k) => {
          const p = el(document, "p");
          p.append(...k.childNodes);
          title.push(p);
        }));
        const ph = s.querySelector(".usta-consent-placeholder");
        const msg = [];
        if (ph) {
          ph.querySelectorAll("p").forEach((p) => {
            if (!norm(p.textContent)) return;
            const q = el(document, "p");
            q.append(...p.childNodes);
            q.querySelectorAll("a, button").forEach((a) => {
              const l = el(document, "a");
              l.href = src;
              l.textContent = norm(a.textContent);
              a.replaceWith(l);
            });
            msg.push(q);
          });
        }
        if (!msg.length) {
          const p = el(document, "p");
          const a = el(document, "a");
          a.href = src;
          a.textContent = src;
          p.append(a);
          msg.push(p);
        }
        return [block(document, "Video", [[title], [msg]])];
      }
    },
    {
      // a photo beside a white-outlined quote card (quote glyph + quote + attribution) →
      // Columns (quote); the source's large quote preset (`text--font-size--40px-28px`) → `large`
      name: "columns-quote",
      match: (s) => {
        const d = comps(s);
        const card = d.find((c) => isContainer(c) && /container--border--white/.test(c.className) && deep(c).some((k) => isImage(k) && /quote/i.test((k.querySelector("img") || {}).src || k.innerHTML)));
        return d.length === 2 && !!card && d.some(isImage);
      },
      emit: (s, { document }) => {
        const d = comps(s);
        const photo = imageEl(d.find(isImage), document);
        const card = d.find(isContainer);
        const cell = [];
        let large = false;
        deep(card).forEach((k) => {
          if (isImage(k)) {
            const i = imageEl(k, document);
            if (i) {
              const p = el(document, "p");
              p.append(i);
              cell.push(p);
            }
          } else if (isText(k)) {
            if (fontSize(k) >= 40) large = true;
            textEls(k, document, { plain: true }).forEach((x) => {
              const p = el(document, "p");
              p.append(...x.childNodes);
              cell.push(p);
            });
          }
        });
        return [block(document, large ? "Columns (quote, large)" : "Columns (quote)", [[[photo], cell]])];
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
      // an outlined (`container--border--white`) rounded panel: heading + copy stacked in
      // one column, a single CTA in its own column at the right ("Career Center is Live")
      name: "banner-stacked",
      match: (s) => {
        if (!/container--border--white/.test(s.className) || deep(s).some(isImage)) return false;
        const d = comps(s);
        const textCol = d.filter((c) => isContainer(c) && components(c).filter(isText).length >= 2 && !deep(c).some((k) => isButton(k) || isImage(k)));
        return d.filter(isButton).length === 1 && textCol.length === 1 && d.every((c) => isButton(c) || textCol.includes(c) || kind(c) === "separator");
      },
      emit: (s, { document, pagePath }) => {
        const d = comps(s);
        const text = [];
        components(d.find(isContainer)).filter(isText).forEach((c, i) => text.push(...textEls(c, document, { headingLevel: i === 0 ? 2 : 0 })));
        const b = buttonEl(d.find(isButton), document, pagePath);
        return [block(document, "Banner (stacked)", [[text, b ? b.querySelector("a") : ""]])];
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
        const compact = comps(s).some((c) => isContainer(c) && components(c).some((t) => isText(t) && /text--letter-spacing--narrow/.test(t.className)));
        out.push(block(document, compact ? "Cards (media, stacked, compact)" : "Cards (media, stacked)", rows));
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
        const opts = framed ? featureOptions(img) : ["unframed"];
        return [block(document, opts.length ? `Columns (feature, ${opts.join(", ")})` : "Columns (feature)", [cells])];
      }
    },
    {
      // heading + intro + two photos side by side + CTA ("USTA Coaching Network"); the heading
      // + intro may already be split off as their own narrow section (coachtennis "Find your
      // perfect fit": only the photos + the CTA are left)
      name: "columns-photos",
      match: (s) => {
        const d = comps(s);
        return d.filter(isImage).length === 2 && d.some((c) => isText(c) || isButton(c)) && !d.some(isContainer);
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
      // a rounded COLOUR panel (blue fill — main's `banner-stacked` handles the white-outlined
      // one): heading + copy on the left, ONE CTA in its own column at the right ("Bring a USTA
      // Coaching Workshop to Your Facility") → Banner (stacked[, blue])
      name: "banner-stacked-colour",
      match: (s) => /container--border-radius--top-left\b/.test(s.className) && s.getAttribute("data-bg") === "blue" && !deep(s).some(isImage) && !deep(s).some(isListRow) && deep(s).filter(isButton).length === 1 && comps(s).some((c) => isContainer(c) && components(c).some(isText) && !components(c).some(isButton)),
      emit: (s, { document, pagePath }) => {
        const cell = [];
        deep(s).filter(isText).forEach((t, i) => textEls(t, document, { headingLevel: i === 0 ? 2 : 0 }).forEach((k) => {
          if (/^H/.test(k.tagName)) k.innerHTML = k.textContent;
          cell.push(k);
        }));
        const b = buttonEl(deep(s).find(isButton), document, pagePath);
        return [block(document, "Banner (stacked, blue)", [[cell, b ? b.querySelector("a") : ""]])];
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
  function markPhoneImages(main) {
    main.querySelectorAll('.image[class*="aem-GridColumn--default--hide"]').forEach((c) => {
      const next = c.nextElementSibling;
      const img = c.querySelector("img");
      if (!img || !isImage(next) || /aem-GridColumn--default--hide/.test(next.className)) return;
      next.setAttribute("data-phone-image", img.getAttribute("src") || img.getAttribute("data-src") || "");
      next.setAttribute("data-phone-alt", img.getAttribute("alt") || "");
    });
  }
  var import_landing_page_v1_default = {
    onLoad: ({ document }) => {
      document.querySelectorAll(".cmp-text p").forEach((q) => {
        if (q.textContent.replace(/\s/g, "") || q.querySelector("img")) return;
        const host = q.closest(".text");
        if (q.getBoundingClientRect().height === 0 && host && host.getBoundingClientRect().height > 0) q.setAttribute("data-collapsed", "");
        q.textContent = BLANK;
      });
      document.querySelectorAll(".aem-GridColumn, .cmp-container, .container").forEach((e) => {
        const r = e.getBoundingClientRect();
        e.setAttribute("data-h", String(Math.round(r.height)));
        e.setAttribute("data-x", String(Math.round(r.left)));
      });
      document.querySelectorAll(".container").forEach((c) => {
        const inner = c.querySelector(":scope > .cmp-container");
        const bg = inner ? getComputedStyle(inner).backgroundColor : "";
        if (inner && /gradient\(/.test(getComputedStyle(inner).backgroundImage)) c.setAttribute("data-bg", "gradient");
        else if (bg === "rgb(3, 115, 243)") c.setAttribute("data-bg", "blue");
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
      if (IMAGE_PAIR_THEMES.includes(theme)) markPhoneImages(main);
      main.querySelectorAll('[class*="aem-GridColumn--default--hide"]').forEach((e) => e.remove());
      const { root, skip } = contentRoot(main);
      if (!root) throw new Error("landing-page content grid not found");
      prepareSections(root, document, skip);
      const out = document.createElement("div");
      const report = [];
      let first = true;
      [...root.children].forEach((s) => {
        if (skip(s) || !norm(s.textContent) && !s.querySelector("img")) return;
        emitSection(s, { document, pagePath }).forEach(({ name, nodes, styles, join, meta }) => {
          if (!nodes.length) return;
          if (join && !first) {
            const last = [...out.children].pop();
            const isMeta = last && last.tagName === "TABLE" && /section metadata/i.test(last.rows[0]?.textContent || "");
            if (isMeta) last.before(...nodes);
            else out.append(...nodes);
            report.push(`+${name}`);
            return;
          }
          if (!first) out.append(document.createElement("hr"));
          first = false;
          out.append(...nodes);
          const cells = { ...styles.length ? { Style: styles.join(", ") } : {}, ...meta || {} };
          if (Object.keys(cells).length) out.append(block(document, "Section Metadata", cells));
          report.push(name);
        });
      });
      finalizeOutput(out, document);
      out.querySelectorAll('a[href^="/content/dam/"]').forEach((a) => {
        a.setAttribute("href", `${BASE}${a.getAttribute("href")}`);
      });
      out.append(document.createElement("hr"), metadata(document, theme));
      transform("afterTransform", out, payload);
      WebImporter.rules.adjustImageUrls(out, url, params.originalURL);
      return [{ element: out, path: pagePath, report: { title: document.title, template: TEMPLATE, sections: report.join(" | ") } }];
    }
  };
  function prepareSections(root, document, skip) {
    [...root.children].forEach((k) => {
      if (!isContainer(k) || skip(k) || !/container--outer-gutter-paddings/.test(k.className)) return;
      const kids = components(k);
      const sectionLike = kids.filter((c) => isContainer(c) && /container--(top|bottom)-margin--/.test(c.className) || /^(core-tabs|aem-events-list)\b/.test(c.className || ""));
      const titled = sectionLike.length === 1 && kids.some((c) => isText(c) && c.querySelector("h1"));
      if (sectionLike.length >= 2 || titled) {
        kids.forEach((c) => c.setAttribute("data-in-wrapper", ""));
        if (titled && /container--(top|bottom)-margin--36\b/.test(k.className)) kids.forEach((c) => c.setAttribute("data-margin-36", ""));
        k.replaceWith(...kids);
      }
    });
    const headed = (c) => isContainer(c) && deep(c).some((t) => isText(t) && isUstaSans(t) && fontSize(t) >= 40);
    [...root.children].forEach((k) => {
      if (!isContainer(k) || skip(k) || /container--(padding|border)--/.test(k.className) || k.getAttribute("data-bg")) return;
      const kids = components(k).filter((c) => kind(c) !== "separator");
      if (kids.length >= 2 && kids.every(headed) && !kids.every(isPackageTier)) k.replaceWith(...kids);
    });
    const loose = (k) => !isContainer(k) && !skip(k) && /^(text|image|button|separator|embed|iframetext|accordion|tags|core-tabs|aem-events-list)\b/.test(k.className || "");
    [...root.children].forEach((k) => {
      if (!loose(k)) return;
      const prev = k.previousElementSibling;
      if (prev && prev.hasAttribute("data-loose-run")) {
        prev.append(k);
        return;
      }
      const run = document.createElement("div");
      run.setAttribute("data-loose-run", "");
      k.replaceWith(run);
      run.append(k);
    });
    root.querySelectorAll(":scope > [data-loose-run]").forEach((r) => {
      if (norm(r.textContent)) r.setAttribute("data-loose-text", "");
    });
    return [...root.children];
  }
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
    out.querySelectorAll("a[href]").forEach((a) => {
      const m = a.getAttribute("href").match(/^(?:https?:\/\/(?:www\.)?ustacoaching\.com)?(\/(?:en|es)(?:\/[^?#]*)?)\.html([?#].*)?$/);
      if (m) a.setAttribute("href", m[1] + (m[2] || ""));
    });
  }

  // tools/importer/import-quiz-results-v1.js
  var COURSES_URL = "/en/home/courses";
  var imgOf = (document, src) => {
    if (!src) return null;
    const img = el(document, "img");
    img.src = src.currentSrc || src.getAttribute("src") || src.getAttribute("data-src") || "";
    img.alt = src.getAttribute("alt") || "";
    return img;
  };
  var pWrap = (document, node) => {
    const p = el(document, "p");
    p.append(node);
    return p;
  };
  var parasOf = (document, root) => (root ? [...root.querySelectorAll("p")] : []).filter((p) => norm(p.textContent)).map((p) => {
    const q = el(document, "p");
    q.innerHTML = p.innerHTML.replace(/&nbsp;/g, " ");
    q.querySelectorAll("u").forEach((u) => u.replaceWith(...u.childNodes));
    return q;
  });
  function courseRow(c, document, fmt) {
    const t = (sel) => norm((c.querySelector(sel) || {}).textContent);
    const count = t(".v-course__eyebrow");
    const title = t(".v-course__name");
    const badge = imgOf(document, c.querySelector(".v-course__badge img"));
    const desc = parasOf(document, c.querySelector(".v-course__additional-content .v-course__description") || c.querySelector(".v-course__description"));
    const mods = [...c.querySelectorAll(".v-course__module-text")].map((m) => norm(m.textContent)).filter(Boolean);
    const list = el(document, fmt === "pathway" ? "ul" : "ol");
    mods.forEach((m) => {
      const li = el(document, "li");
      li.textContent = m;
      list.append(li);
    });
    const tail = mods.length ? [list] : [];
    if (fmt === "pathway") {
      const h3 = el(document, "h3");
      h3.textContent = title;
      return [[badge || ""], [...count ? [para(document, count)] : [], h3, ...desc, ...tail]];
    }
    return [[para(document, count ? `${title} \u2014 ${count}` : title)], [...badge ? [pWrap(document, badge)] : [], ...desc, ...tail]];
  }
  function footerRow(scope, document) {
    const btn = [...scope.querySelectorAll(".v-course-list button, .v-course-list a")].find((b) => /^View /i.test(norm(b.textContent)));
    if (!btn) return null;
    const a = el(document, "a");
    a.href = btn.getAttribute("href") || COURSES_URL;
    a.textContent = norm(btn.textContent);
    return [[a]];
  }
  function textsBefore(s, target, document) {
    const out = [];
    comps(s).forEach((c) => {
      if (c === target || c.contains(target) || target.contains(c) || kind(c) === "separator") return;
      if (!(c.compareDocumentPosition(target) & 4)) return;
      if (isText(c)) out.push(...textEls(c, document));
      else if (isContainer(c)) deep(c).filter(isText).forEach((t) => out.push(...textEls(t, document)));
    });
    return out;
  }
  var RESULTS_KINDS = [
    {
      name: "results-certification",
      match: (s) => !!s.querySelector(".v-classification-accordion"),
      emit: (s, { document }) => {
        const acc = s.querySelector(".v-classification-accordion");
        const before = textsBefore(s, acc, document);
        const grid = [...acc.querySelectorAll(".aem-course-list")].some((l) => !/courses--full-width/.test(l.className));
        const fmt = grid ? "pathway" : "timeline";
        const logo = imgOf(document, acc.querySelector(".v-classification-accordion-content__image img"));
        const intro = parasOf(document, acc.querySelector(".v-classification-accordion-content__description"));
        const meta = [...acc.querySelectorAll(".v-classification-accordion-content__info .text")].map((t) => parasOf(document, t)).filter((ps) => ps.length);
        const rows = [];
        if (fmt === "pathway") {
          rows.push([[logo || ""], intro]);
          if (meta.length) rows.push(meta.map((ps) => ps));
        } else {
          const head = [...logo ? [pWrap(document, logo)] : [], ...intro];
          meta.forEach(([label, ...values]) => {
            const h4 = el(document, "h4");
            h4.innerHTML = label.innerHTML;
            head.push(h4, ...values);
          });
          rows.push([head]);
        }
        const area = acc.querySelector(".v-classification-accordion__modules") || acc;
        [...area.querySelectorAll(".text, .aem-course-list")].filter((n) => !n.closest(".v-course")).forEach((n) => {
          if (n.classList.contains("aem-course-list")) n.querySelectorAll(".v-course").forEach((c) => rows.push(courseRow(c, document, fmt)));
          else if (fmt === "pathway" && norm(n.textContent)) rows.push([parasOf(document, n)]);
        });
        const foot = footerRow(acc, document);
        if (foot) rows.push(foot);
        return [...before, block(document, `Accordion (${fmt})`, rows)];
      }
    },
    {
      name: "results-courses",
      match: (s) => !!s.querySelector(".aem-course-list") && !s.querySelector(".v-classification-accordion"),
      emit: (s, { document }) => {
        const list = s.querySelector(".aem-course-list");
        const before = textsBefore(s, list, document);
        const rows = [...list.querySelectorAll(".v-course")].map((c) => courseRow(c, document, "timeline"));
        const foot = footerRow(s, document);
        if (foot) rows.push(foot);
        return [...before, block(document, "Accordion (timeline)", rows)];
      }
    },
    {
      name: "results-tiers",
      match: (s) => !!s.querySelector(".v-tiers"),
      emit: (s, { document, pagePath }) => {
        const tiers = s.querySelector(".v-tiers");
        const out = [];
        comps(s).forEach((c) => {
          if (c.contains(tiers) || kind(c) === "separator") return;
          if (isText(c)) out.push(...textEls(c, document));
          else if (isButton(c)) {
            const b = buttonEl(c, document, pagePath);
            if (b) out.push(b);
          }
        });
        const rows = [...tiers.querySelectorAll(".v-tiers-card")].map((card) => {
          const content = card.querySelector(".v-tiers-card--content") || card;
          const cell = [];
          const title = norm((content.querySelector(".v-tiers-card__title") || {}).textContent);
          if (title) {
            const h = el(document, "h3");
            h.textContent = title;
            cell.push(h);
          }
          const sub = content.querySelector(".v-tiers-card__subtitle");
          if (sub) cell.push(...parasOf(document, sub));
          const price = norm((content.querySelector(".v-tiers-card__price") || {}).textContent);
          if (price) cell.push(para(document, price));
          const ul = content.querySelector(".v-tiers-card__description ul, .v-tiers-card__description ol");
          if (ul) {
            const list = el(document, "ul");
            [...ul.querySelectorAll("li")].forEach((li) => {
              const n = el(document, "li");
              n.textContent = norm(li.textContent);
              if (n.textContent) list.append(n);
            });
            cell.push(list);
          }
          const cta = content.querySelector(".v-tiers-card__button-wrapper a, .v-tiers-card__button-wrapper button");
          if (cta && norm(cta.textContent)) {
            const a = el(document, "a");
            a.href = cta.getAttribute("href") || "#";
            a.textContent = norm(cta.textContent);
            cell.push(pWrap(document, a));
          }
          return [cell];
        });
        return [...out, block(document, "Cards (pricing)", rows)];
      }
    },
    {
      name: "results-intro",
      match: (s) => {
        const d = comps(s);
        return d.some((c) => isContainer(c) && c.getAttribute("data-bg") === "lime") && d.some(isImage);
      },
      emit: (s, { document, pagePath }) => {
        const d = comps(s);
        const photo = imgOf(document, d.find(isImage).querySelector("img"));
        const panel = d.find((c) => isContainer(c) && c.getAttribute("data-bg") === "lime");
        const cell = [];
        deep(panel).forEach((c, i) => {
          if (isText(c)) textEls(c, document, { headingLevel: fontSize(c) >= 40 ? 1 : 0, plain: true }).forEach((k) => cell.push(k));
          else if (isButton(c)) {
            const b = buttonEl(c, document, pagePath);
            if (b) cell.push(pWrap(document, b.querySelector("a")));
          }
        });
        return [block(document, "Columns (media, media-right, lime)", [[[photo || ""], cell]])];
      }
    },
    {
      name: "results-icon-cards",
      match: (s) => deep(s).filter((c) => isImage(c) && Number(c.getAttribute("data-h") || 99) <= 48).length >= 2 && [...s.querySelectorAll(".container")].filter((c) => components(c).some(isImage) && components(c).filter(isText).length >= 2).length >= 2,
      emit: (s, { document, pagePath }) => {
        const cards = [...s.querySelectorAll(".container")].filter((c) => components(c).some(isImage) && components(c).filter(isText).length >= 2 && !components(c).some(isContainer));
        const before = [];
        const after = [];
        comps(s).forEach((c) => {
          if (cards.some((k) => k === c || c.contains(k) || k.contains(c)) || kind(c) === "separator") return;
          const isBefore = !!(c.compareDocumentPosition(cards[0]) & 4);
          if (isText(c)) (isBefore ? before : after).push(...textEls(c, document));
          else if (isButton(c)) {
            const b = buttonEl(c, document, pagePath);
            if (b) (isBefore ? before : after).push(b);
          }
        });
        const rows = cards.map((card) => {
          const cc = components(card);
          const icon = imgOf(document, (cc.find(isImage) || {}).querySelector && cc.find(isImage).querySelector("img"));
          const texts = cc.filter(isText);
          const h = el(document, "h3");
          h.textContent = norm(texts[0].textContent);
          const body = [];
          texts.slice(1).forEach((t) => body.push(...textEls(t, document, { plain: true })));
          return [[...icon ? [pWrap(document, icon)] : [], h, ...body]];
        });
        return [...before, block(document, "Cards (icons)", rows), ...after];
      }
    },
    {
      name: "results-cards",
      match: (s) => {
        const d = comps(s);
        const grid = d.find((c) => isContainer(c) && components(c).filter((k) => isContainer(k) && components(k).some(isImage)).length >= 2);
        return !!grid;
      },
      emit: (s, { document, pagePath }) => {
        const d = comps(s);
        const grid = d.find((c) => isContainer(c) && components(c).filter((k) => isContainer(k) && components(k).some(isImage)).length >= 2);
        const out = [];
        d.forEach((c) => {
          if (c !== grid && isText(c)) out.push(...textEls(c, document));
        });
        const rows = components(grid).filter((k) => isContainer(k) && components(k).some(isImage)).map((card) => {
          const img = imgOf(document, deep(card).find(isImage).querySelector("img"));
          const texts = deep(card).filter(isText);
          const body = [];
          texts.forEach((t, i) => body.push(...textEls(t, document, { headingLevel: i === 0 ? 3 : 0, plain: true })));
          return [[img || ""], body];
        });
        out.push(block(document, "Cards (media)", rows));
        return out;
      }
    }
  ];
  KINDS.unshift(...RESULTS_KINDS);
  var import_quiz_results_v1_default = {
    onLoad: (payload) => {
      const { document } = payload;
      document.querySelectorAll("v-leads, .v-leads").forEach((v) => {
        const c = v.closest(".container");
        if (c) c.remove();
      });
      const iconCard = (c) => {
        const img = c.querySelector(":scope .image");
        const ih = img ? img.getBoundingClientRect().height : 0;
        return ih > 0 && ih <= 48 && c.querySelectorAll(".text").length >= 2;
      };
      [...document.querySelectorAll(".container")].forEach((c) => {
        const cards = [...c.querySelectorAll(":scope > .cmp-container > .aem-Grid > .container")].filter(iconCard);
        if (cards.length < 2) return;
        const sec = c.parentElement && c.parentElement.closest(".container");
        if (!sec || !sec.querySelector(".image") || [...sec.querySelectorAll(".image")].every((i) => c.contains(i))) return;
        const btns = [];
        for (let n = c.nextElementSibling; n; n = n.nextElementSibling) if (/^button\b/.test(n.className)) btns.push(n);
        const grid = c.querySelector(":scope > .cmp-container > .aem-Grid");
        if (grid) grid.append(...btns);
        sec.after(c);
      });
      const desktopOnly = (e) => /\baem-GridColumn--mobile--hide\b/.test(e.className) && /\baem-GridColumn--tablet--hide\b/.test(e.className);
      document.querySelectorAll('.text[class*="aem-GridColumn--default--hide"]').forEach((t) => {
        const twin = [t.previousElementSibling, t.nextElementSibling].find((s) => s && /^text\b/.test(s.className) && desktopOnly(s) && norm(s.textContent) === norm(t.textContent));
        if (!twin) return;
        twin.remove();
        t.className = t.className.replace(/\baem-GridColumn--default--hide\b/g, "");
      });
      document.querySelectorAll(".text.text--font-family--graphic-semibold p").forEach((p) => {
        if (p.closest("header, footer, .experiencefragment") || p.querySelector("b, strong") || !norm(p.textContent)) return;
        const b = document.createElement("b");
        b.append(...p.childNodes);
        p.append(b);
      });
      import_landing_page_v1_default.onLoad(payload);
      document.querySelectorAll(".experiencefragment").forEach((x) => {
        if (x.querySelector(".v-classification-accordion")) x.className = x.className.replace(/\bexperiencefragment\b/g, "container results-certification");
      });
    },
    transform: (payload) => import_landing_page_v1_default.transform(payload)
  };
  return __toCommonJS(import_quiz_results_v1_exports);
})();
