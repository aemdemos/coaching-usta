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

  // tools/importer/import-sample-landing-blocks.js
  var import_sample_landing_blocks_exports = {};
  __export(import_sample_landing_blocks_exports, {
    default: () => import_sample_landing_blocks_default,
    sampleImporter: () => sampleImporter
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

  // tools/importer/import-landing-page-v1.js
  var TEMPLATE = "landing-page";
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
  function metadata(document) {
    const meta = (sel) => document.querySelector(sel)?.getAttribute("content") || "";
    const cells = { Title: document.title, Description: meta('meta[name="description"]'), Template: TEMPLATE };
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
    const skip = (e) => /experiencefragment|aem-header|aem-hidden-component|aem-quiz|aem-wizard|safe-play|footer/.test(e.className || "");
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
        return;
      }
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
      if (k.tagName === "P" && (headingLevel || size >= 32)) {
        const lvl = headingLevel || (size >= 40 || isUstaSans(c) ? 2 : 3);
        const h = el(document, `h${lvl}`);
        h.append(...k.childNodes);
        flushBlanks("H");
        out.push(h);
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
        if (i) out.push(el(document, "p")), out[out.length - 1].append(i);
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
    if (lead.length && rest.length) {
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
    const firstText = deep(s).find((c) => isText(c) && norm(c.textContent));
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
    out.push({ name: k ? k.name : "default", nodes, styles });
    return out;
  }
  var KINDS = [
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
      // text column(s) beside an image (the desktop copy of a media row)
      name: "columns-media-row",
      match: (s) => {
        const d = comps(s);
        return d.some(isImage) && d.some((c) => isText(c) || isContainer(c) && components(c).some(isText));
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
      main.querySelectorAll('[class*="aem-GridColumn--default--hide"]').forEach((e) => e.remove());
      const { root, skip } = contentRoot(main);
      if (!root) throw new Error("landing-page content grid not found");
      prepareSections(root, document, skip);
      const out = document.createElement("div");
      const report = [];
      let first = true;
      [...root.children].forEach((s) => {
        if (skip(s) || !norm(s.textContent) && !s.querySelector("img")) return;
        emitSection(s, { document, pagePath }).forEach(({ name, nodes, styles, meta }) => {
          if (!nodes.length) return;
          if (!first) out.append(document.createElement("hr"));
          first = false;
          out.append(...nodes);
          const cells = { ...styles.length ? { Style: styles.join(", ") } : {}, ...meta || {} };
          if (Object.keys(cells).length) out.append(block(document, "Section Metadata", cells));
          report.push(name);
        });
      });
      finalizeOutput(out, document);
      out.append(document.createElement("hr"), metadata(document));
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
      if (kids.length >= 2 && kids.every(headed)) k.replaceWith(...kids);
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

  // tools/importer/import-sample-landing-blocks.js
  var CM = "coach-mentorship";
  var CC = "coaching-community";
  var CW = "coaching-workshops";
  var FEL = "fellowship-in-coaching-and-leadership";
  var SAMPLES = {
    "hero-content": {
      page: CM,
      title: "Hero (Content)",
      intro: "Full-bleed rounded hero: background photo behind a dark overlay, LEFT-aligned copy \u2014 a USTA Sans display H1, an H2 subheading, body paragraphs \u2014 then up to two CTAs: the first link is the lime button, the second the <strong>outlined</strong> button (black, white border). The two stack on phones/tablets and sit side by side from 1024. Authored as <code>hero (content)</code>: row 1 the image, row 2 the copy with each CTA link in its own paragraph.",
      examples: [{ anchor: "USTA COACHING NETWORK" }]
    },
    "hero-content-title": {
      page: CC,
      title: "Hero (Content, Title)",
      intro: "The content hero with only a title and an intro line, no CTA (<code>hero (content, title)</code>): the intro is a USTA Sans line at line-height 1, 54px under the H1 on phones/tablets (36px from 1024), and the panel runs on 16px \u2192 168px (1024) \u2192 192px (1280) below it.",
      examples: [{ anchor: "COMMUNITY" }]
    },
    "columns-text-image": {
      page: CM,
      title: "Columns (text + image)",
      intro: "Plain <code>columns</code> (no option): a text cell (heading + copy) beside an image cell. Text first on phones/tablets; side by side from 1024 (text 50% \u2212 6px, image 50% + 6px), both vertically centred, image corners 20px. Heading \u2192 copy 66px.",
      examples: [{ anchor: "Why Tennis Coach Mentorship Matters for Professional Development" }]
    },
    "columns-feature-unframed": {
      page: CC,
      title: "Columns (Feature, Unframed)",
      intro: "The <code>columns (feature)</code> row \u2014 an image beside a grey-bordered text card \u2014 without its dark rounded panel (<code>columns (feature, unframed)</code>). Cells in either order: the image may come first or second. Image first on phones, hidden on tablets (source), side by side from 1024 with the image vertically centred.",
      examples: [{ anchor: "Serving All: Your Career in Tennis Grows Here" }]
    },
    "columns-photos": {
      page: CC,
      title: "Columns (Photos)",
      intro: "Two photos side by side at EVERY width (<code>columns (photos)</code>, one row, one image per cell), corners 20px, crop 5:4 on phones \u2192 3:2 (768) \u2192 2:1 (1280). Shown here with its section: the narrow heading section, the lead intro and the CTA after it.",
      examples: [{ anchor: "USTA Coaching Network" }]
    },
    "columns-checklist": {
      page: CM,
      title: "Columns (Checklist)",
      intro: "Rows of side-by-side diamond-bullet items (<code>columns (checklist)</code>): one block row per visual row, one cell per item (a <strong>bold</strong> lead-in + copy). Two items per row at every width; the green diamond is added by CSS.",
      examples: [{ anchor: "How the Program Works" }]
    },
    "columns-cta": {
      page: CM,
      title: "Columns (CTA)",
      intro: "Two mirrored call-to-action columns (<code>columns (cta)</code>, one row, two cells): each cell = a title heading, a line of copy and a button (<strong>bold</strong> link = lime, <em>italic</em> link = outlined). The first column is right-aligned, the second left-aligned; stacked on phones.",
      examples: [{ anchor: "join the usta coaching network today" }]
    },
    "cards-media-stacked": {
      page: CM,
      title: "Cards (Media, Stacked)",
      intro: "Media cards with the image ON TOP at every width (<code>cards (media, stacked)</code>; one row per card: image cell + title/copy cell). 1-up on phones, 3-up from 768; image crop 287/230 (phones) \u2192 3:2 (768\u20131279) \u2192 2:1 (1280); title Graphik Semibold 28 \u2192 32 (1280); copy 18/24. The plain <code>cards (media)</code> (home page) instead turns horizontal on tablets.",
      examples: [{ anchor: "Benefits of the usta coaching network" }]
    },
    "cards-icons": {
      page: CM,
      title: "Cards (Icons)",
      intro: "Small-icon feature cards (<code>cards (icons)</code>; one row per card, one cell: icon paragraph, title heading, description). Dark #2a2a2a cards with 20px corners, 1-up on phones and 3-up from 768; the icon is 55px (phones) \u2192 49px (768) \u2192 28px (1280). Shown with its narrow heading section and the CTA + note after it.",
      examples: [{ anchor: "Benefits of Becoming a USTA Tennis Coaching Mentor" }]
    },
    "cards-quote-testimonial": {
      page: CC,
      title: "Cards (Quote, Testimonial)",
      intro: "Testimonial cards (<code>cards (quote, testimonial)</code>; one row per card, one cell: quote, name, role). Borderless dark cards, 18px italic quote, a tall gap before a thin grey rule, bold name and white role. The plain <code>cards (quote)</code> is the outlined 16px version (Inclusion Summit).",
      examples: [{ anchor: "WHAT OTHERS ARE SAYING" }]
    },
    "accordion-closed": {
      page: CM,
      title: "Accordion (Closed)",
      intro: "The default FAQ accordion with every item closed on load (<code>accordion (closed)</code>); the plain <code>accordion</code> opens the first item. One row per item: question cell, answer cell.",
      examples: [{ anchor: "FAQ'S" }]
    },
    "banner-spotlight": {
      page: CM,
      title: "Banner (Spotlight)",
      intro: "The closing contact band (<code>banner (spotlight)</code>; one row: a cell with the H2 heading + copy, a cell with the CTA link): a blue 32px-radius panel, centred USTA Sans display heading, Graphik 18/24 copy (links underlined) and a content-width lime button. <code>narrow</code> (see banner-spotlight-narrow) sets the copy on 10 of 12 columns.",
      examples: [{ anchor: "Questions About the USTA Coaching Network?" }]
    },
    "banner-spotlight-narrow": {
      page: CC,
      title: "Banner (Spotlight, Narrow)",
      intro: 'The spotlight banner with its copy on 10 of the 12 columns (<code>banner (spotlight, narrow)</code>), as on the coaching-community "Professional Career Consulting" band.',
      examples: [{ anchor: "Professional Career Consulting" }]
    },
    "banner-stacked": {
      page: CC,
      title: "Banner (Stacked)",
      intro: "An outlined promo band (<code>banner (stacked)</code>; one row: a cell with the H2 heading + copy, a cell with the CTA link \u2014 the same authoring as the base banner): black panel, 1px white outline, 20px radius; the USTA Sans heading (28 \u2192 32 \u2192 40) STACKED over Graphik 18/24 copy in one column, and the lime 56px button (12px radius, label 16 \u2192 18 \u2192 24) alone in a right column \u2014 3 of 12 columns at 768, 2 of 12 from 1024; under the copy on phones. The button fills its column but never squeezes its label.",
      examples: [{ anchor: "Career Center is Live" }]
    },
    "columns-media-outlined": {
      page: CW,
      title: "Columns (Media, Outlined)",
      intro: "The <code>columns (media)</code> row with its card as the source's white-OUTLINED container (<code>columns (media, outlined)</code>; one row: a text cell (heading, copy, list) and an image cell, in either order): transparent card, 1px white border, 20px radius, white text; USTA Sans heading 32 / 40 (1024) / 56 (1280) centred, Graphik 16 / 18 copy, an 18/24 bullet list 42px below. Photo 20px radius: above the card on phones, 2:3 at 768, as tall as the card at 1024, 5:6 from 1280.",
      examples: [{ anchor: "Tennis Coaching Workshops & Webinars" }]
    },
    toc: {
      page: CW,
      title: "TOC (Tabs over sections)",
      intro: "A tab set over whole page SECTIONS (<code>toc</code>; one row per tab: label | anchor). Each tab's content is its own section after the block, carrying Section Metadata <code>toc-anchor</code> = the anchor, so a tab can hold any blocks (here Columns (promo) rows). Clicking a tab shows only its section; deep links use the source's form <code>#tab=upcoming</code> / <code>#tab=recordedwebinars</code>; arrow keys switch tabs. Phones: tabs as wide as their label, 68px, inactive #2d2d2d; from 768: a #2d2d2d track, tabs share the width, 101px (106px at 1024); active lime.",
      examples: [{ anchor: "ONLINE WEBINARS" }]
    },
    "cards-media-stacked-compact": {
      page: FEL,
      title: "Cards (Media, Stacked, Compact)",
      intro: "The landing media cards (<code>cards (media, stacked)</code>: one row per card \u2014 photo | title + copy) with the <code>compact</code> option: 1 card per row on phones, 3 from 768; each card is inset 8px (12px from 768) more than plain stacked cards; photos keep their own 3:2 shape (no crop); copy in the source's narrow text \u2014 Graphik Regular 16/19.2, \u22120.03em (14/16.8 at 768\u20131023); title Graphik Semibold 28 \u2192 32 (1280).",
      examples: [{ anchor: "On-court Coaching" }]
    },
    "banner-header": {
      page: FEL,
      title: "Banner (Header)",
      intro: "Section header band (no CTA): one row \u2014 heading | subtitle. Heading USTA Sans 32 \u2192 40 (768), centred below 1024; subtitle Graphik Semibold 24/32; side by side on 8 + 4 of 12 columns from 1024. Shown in its default colours and with <strong>blue</strong> appended (the source uses the blue one above a <code>columns (events, dates)</code> list).",
      examples: [{
        anchor: "IMPORTANT DATES",
        pick: "Banner",
        pair: {
          base: "Default: black panel with a 1px white outline and white text. Authored as <code>banner header</code>.",
          blue: "Blue: append <strong>blue</strong> \u2014 blue panel, no outline, black text. Authored as <code>banner header blue</code>."
        }
      }]
    },
    "columns-events-dates": {
      page: FEL,
      title: "Columns (Events, Dates)",
      intro: "The event list with the <code>dates</code> option (same authoring: one row per date \u2014 date | eyebrow, title; no chips): 1px white outlined rows, 26px apart, at the page container edge. Phones: date, eyebrow and title stacked; from 768 the date sits on 3 of 12 columns, centred, beside the eyebrow and title. Date Graphik Semibold 28 \u2192 32 (1280); eyebrow Graphik Regular 18/24 bold; title Graphik Semibold 28 \u2192 32 (768) \u2192 40 (1024).",
      examples: [{ anchor: "IMPORTANT DATES", pick: "Columns" }]
    },
    "columns-quote-large": {
      page: FEL,
      title: "Columns (Quote, Large)",
      intro: "The quote row (<code>columns (quote)</code>: photo | quote glyph, quote, attribution) with the <code>large</code> option: the source's large quote, Graphik Semibold 28 \u2192 32 (768) \u2192 40 (1024), normal tracking; the card is as tall as its copy (attribution right below the quote) and the photo is top-aligned beside it; at 768\u20131023 the card stacks above the photo.",
      examples: [{ anchor: "Fellowship Participant" }]
    },
    "text-style-lead-subhead": {
      page: CM,
      title: "Text Style (Lead / Subhead)",
      intro: "Intro lines under a section heading, set at their own size (plain paragraphs can't carry one): <code>text style (lead)</code> \u2014 Graphik Regular 16 \u2192 18 (1024) \u2192 24px (1280), line-height 1.2 (source <code>text--font-size--24px\u2026</code>); <code>text style (subhead)</code> \u2014 16 \u2192 18px (1280), line-height 1.2 (source <code>text--font-size--18px-16px</code>). Add <code>center</code> to centre them. Shown with their headings only.",
      examples: [
        { anchor: "Benefits of the usta coaching network", pick: "Text Style" },
        { anchor: "How the Program Works", pick: "Text Style" }
      ]
    }
  };
  var hr = (document) => document.createElement("hr");
  var blockName = (n) => n.tagName === "TABLE" ? norm(n.querySelector("tr")?.textContent || "") : "";
  var sampleImporter = (SAMPLES2, onLoad) => ({
    onLoad,
    transform: (payload) => {
      const { document, params } = payload;
      const url = params.originalURL;
      const key = new URL(url).searchParams.get("sample");
      const sample = SAMPLES2[key];
      if (!sample) throw new Error(`unknown sample "${key}" (use ?sample=${Object.keys(SAMPLES2).join("|")})`);
      if (!new URL(url).pathname.includes(sample.page)) throw new Error(`sample "${key}" comes from ${sample.page}`);
      const pagePath = new URL(url).pathname.replace(/\.html$/, "");
      const main = document.querySelector("main") || document.body;
      transform("beforeTransform", main, payload);
      main.querySelectorAll('[class*="aem-GridColumn--default--hide"]').forEach((e) => e.remove());
      const { root, skip } = contentRoot(main);
      const sections = prepareSections(root, document, skip).filter((s) => !skip(s) && norm(s.textContent));
      const find = (anchor) => {
        const s = sections.find((x) => [...x.querySelectorAll("h1, h2, h3, p")].some((h) => norm(h.textContent).toLowerCase() === anchor.toLowerCase()));
        if (!s) throw new Error(`section "${anchor}" not found on ${url}`);
        return s;
      };
      const out = document.createElement("div");
      out.append(
        el(document, "h1", sample.title),
        el(document, "p", sample.intro),
        el(document, "p", `<em>Source: <a href="${url.split("?")[0]}">${pagePath.split("/home/")[1]}</a> (EN + ES)</em>`),
        hr(document),
        block(document, "Spacer", [["desktop", "40px"], ["mobile", "24px"]])
      );
      sample.examples.forEach(({ anchor, pick, pair }) => {
        emitSection(find(anchor), { document, pagePath }).forEach(({ nodes, styles, meta }) => {
          const kept = pick ? nodes.filter((n) => /^H[1-6]$/.test(n.tagName) || blockName(n).startsWith(pick)) : nodes;
          if (!kept.length) return;
          const table = pair && kept.find((n) => n.tagName === "TABLE");
          if (table) {
            const cell = table.querySelector("tr").firstElementChild;
            const opts = (cell.textContent.match(/\(([^)]*)\)/) || [, ""])[1].split(",").map((o) => o.trim()).filter((o) => o && o.toLowerCase() !== "blue");
            const name = (extra) => `${cell.textContent.replace(/\s*\(.*$/, "")} (${[...opts, ...extra].join(", ")})`;
            const title = (extra) => name(extra).replace(/\b\w/g, (ch) => ch.toUpperCase());
            const variant = (extra) => {
              const t = table.cloneNode(true);
              t.querySelector("tr").firstElementChild.textContent = name(extra);
              return t;
            };
            out.append(
              hr(document),
              el(document, "h2", title([])),
              el(document, "p", pair.base),
              hr(document),
              variant([]),
              hr(document),
              block(document, "Spacer", [["desktop", "60px"], ["mobile", "40px"]]),
              hr(document),
              el(document, "h2", title(["blue"])),
              el(document, "p", pair.blue),
              hr(document),
              variant(["blue"])
            );
            return;
          }
          const cells = { ...styles.length ? { Style: styles.join(", ") } : {}, ...meta || {} };
          out.append(hr(document), ...kept, ...Object.keys(cells).length ? [block(document, "Section Metadata", cells)] : []);
        });
      });
      out.append(
        hr(document),
        block(document, "Spacer", [["desktop", "80px"], ["mobile", "60px"]]),
        hr(document),
        block(document, "Metadata", { Title: `${sample.title} \u2014 Block Sample`, Template: TEMPLATE, Robots: "noindex, nofollow" })
      );
      finalizeOutput(out, document);
      transform("afterTransform", out, payload);
      WebImporter.rules.adjustImageUrls(out, url, params.originalURL);
      return [{ element: out, path: `/drafts/block-samples/${key}`, report: { template: "block-sample", sample: key } }];
    }
  });
  var import_sample_landing_blocks_default = sampleImporter(SAMPLES, import_landing_page_v1_default.onLoad);
  return __toCommonJS(import_sample_landing_blocks_exports);
})();
