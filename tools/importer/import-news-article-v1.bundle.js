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

  // tools/importer/import-news-article-v1.js
  var import_news_article_v1_exports = {};
  __export(import_news_article_v1_exports, {
    default: () => import_news_article_v1_default
  });

  // tools/importer/parsers/news-columns-article.js
  var spanOf = (el2, bp) => {
    const m = [...el2.classList].map((c) => c.match(new RegExp(`^aem-GridColumn--${bp}--(\\d+)$`))).find(Boolean);
    return m ? Number(m[1]) : null;
  };
  var gridCols = (el2) => {
    const g = el2.parentElement;
    const m = g && [...g.classList].map((c) => c.match(/^aem-Grid--(?:default--)?(\d+)$/)).find(Boolean);
    return m ? Number(m[1]) : 12;
  };
  var isHeaderLine = (p) => !!p && p.tagName === "P" && /font-size:\s*2[0-4]/.test(p.getAttribute("style") || "");
  function normalizePersonHeader(firstP, document) {
    const header = [];
    for (let q = firstP; q && q.tagName === "P" && /font-size/.test(q.getAttribute("style") || ""); q = q.nextElementSibling) header.push(q);
    header.slice(2).forEach((q) => {
      if (/font-size:\s*16/.test(q.getAttribute("style") || "")) return;
      const role = q.previousElementSibling;
      role.append(document.createElement("br"), ...q.childNodes);
      q.remove();
    });
  }
  function parsePersonText(element, { document }) {
    const firstP = [...element.querySelectorAll("p")].find((x) => x.textContent.replace(/[\s\u00a0\uE000]/g, ""));
    if (!isHeaderLine(firstP)) return;
    normalizePersonHeader(firstP, document);
    const span = spanOf(element, "default") || 12;
    const cols = [element];
    for (let x = element.nextElementSibling; x && x.classList.contains("text") && spanOf(x, "default") === span; x = x.nextElementSibling) cols.push(x);
    const content = cols.flatMap((c) => [...c.querySelectorAll("h1, h2, h3, h4, h5, h6, p, ul, ol, blockquote")]).filter((e) => !e.parentElement.closest("h1, h2, h3, h4, h5, h6, p, ul, ol, blockquote")).filter((e) => e.textContent.trim() || e.querySelector("img"));
    const block = span < 12 ? WebImporter.Blocks.createBlock(document, { name: `Columns (person, media-right, media-${12 - span})`, cells: [[content, ""]] }) : WebImporter.Blocks.createBlock(document, { name: "Columns (person)", cells: [[content]] });
    cols[0].replaceWith(block);
    cols.slice(1).forEach((c) => c.remove());
  }
  function embedLink(element, document) {
    const frame = element.querySelector("iframe[src]");
    const a = document.createElement("a");
    const size = frame.getAttribute("width") && frame.getAttribute("height") ? `#${frame.getAttribute("width")}x${frame.getAttribute("height")}` : "";
    a.href = `${frame.getAttribute("src")}${size}`;
    a.textContent = frame.getAttribute("title") || "Embedded post";
    const para = document.createElement("p");
    para.append(a);
    return para;
  }
  function parse(element, { document }) {
    const isEmbed = element.classList.contains("iframetext");
    const img = isEmbed ? element.querySelector("iframe[src]") : element.querySelector("img");
    if (!img) return;
    const isText = (el2) => el2 && el2.classList && el2.classList.contains("aem-GridColumn") && (el2.classList.contains("text") || el2.classList.contains("container")) && el2.textContent.trim();
    const prev = element.previousElementSibling;
    const next = element.nextElementSibling;
    const raw = spanOf(element, "default");
    const n = raw ? Math.round(raw * 12 / gridCols(element)) : raw;
    const sameCol = (a, b) => spanOf(a, "default") === spanOf(b, "default");
    const flexRow = !!element.parentElement?.closest(".container")?.classList.contains("container--display--flex-reset-grid") && element.parentElement.closest(".container").querySelector(".aem-Grid") === element.parentElement;
    const beside = (el2) => isText(el2) && (flexRow || n === 12 || (spanOf(el2, "default") || 12) < gridCols(el2));
    let cols = [];
    if (beside(prev)) {
      cols = [prev];
      if (n !== 12) for (let x = prev.previousElementSibling; isText(x) && sameCol(x, prev); x = x.previousElementSibling) cols.unshift(x);
    } else if (beside(next)) {
      cols = [next];
      if (n !== 12) for (let x = next.nextElementSibling; isText(x) && sameCol(x, next); x = x.nextElementSibling) cols.push(x);
    }
    if (!cols.length) return;
    const textFirst = cols[0] !== next;
    const firstP = cols.flatMap((c) => [...c.querySelectorAll("p")]).find((x) => x.textContent.replace(/[\s\u00a0\uE000]/g, ""));
    const variant = isHeaderLine(firstP) ? "person" : "article";
    if (n === 12 && variant !== "person" && !flexRow) return;
    if (variant === "person") normalizePersonHeader(firstP, document);
    const portrait = !isEmbed && element.classList.contains("image--aspect-ration--portrait");
    const options = textFirst ? [portrait ? "portrait" : "media-right"] : ["media-left", ...portrait ? ["portrait"] : []];
    if (flexRow) options.push("media-6");
    else if (n) options.push(`media-${n}`);
    const items = cols.flatMap((c) => [...c.querySelectorAll("h1, h2, h3, h4, h5, h6, p, ul, ol, blockquote, .separator")]).filter((e) => !e.parentElement.closest("h1, h2, h3, h4, h5, h6, p, ul, ol, blockquote")).filter((e) => e.classList.contains("separator") || e.textContent.trim() || e.querySelector("img"));
    const content = [];
    items.forEach((e) => {
      if (!e.classList.contains("separator")) {
        content.push(e);
        return;
      }
      if (!content.length || content[content.length - 1].tagName === "HR") return;
      content.push(document.createElement("hr"));
    });
    const stacked = [];
    for (let x = element.nextElementSibling; !isEmbed && x && x.classList.contains("image") && x.querySelector("img") && n !== 12 && sameCol(x, element); x = x.nextElementSibling) stacked.push(x);
    const pictures = isEmbed ? [embedLink(element, document)] : [element, ...stacked].map((c) => {
      const i = c.querySelector("img");
      return i.closest("picture") || i;
    });
    const row = textFirst ? [content, pictures] : [pictures, content];
    const block = WebImporter.Blocks.createBlock(document, {
      name: `Columns (${[variant, ...options].join(", ")})`,
      cells: [row]
    });
    cols[0].replaceWith(block);
    cols.slice(1).forEach((c) => c.remove());
    stacked.forEach((c) => c.remove());
    element.remove();
  }
  function parseGrid(element, { document }) {
    const cols = gridCols(element);
    const kind = (x) => {
      if (!x || !x.classList || !x.classList.contains("aem-GridColumn")) return null;
      const span = spanOf(x, "default");
      if (!span || span >= cols) return null;
      if (x.classList.contains("image") && x.querySelector("img")) return "image";
      if (x.classList.contains("text") && ![...x.classList].some((k2) => k2.startsWith("text--")) && x.textContent.trim()) return "text";
      if (x.classList.contains("container") && x.textContent.trim()) return "container";
      return null;
    };
    const k = kind(element);
    if (!k || kind(element.previousElementSibling) === k) return;
    const run = [element];
    let total = spanOf(element, "default");
    for (let x = element.nextElementSibling; kind(x) === k && total + spanOf(x, "default") <= cols; x = x.nextElementSibling) {
      run.push(x);
      total += spanOf(x, "default");
    }
    if (run.length < 2) return;
    const split = (bp) => (spanOf(element, bp) || spanOf(element, "default")) < cols;
    let option = "";
    if (split("mobile")) option = ", mobile";
    else if (split("tablet")) option = ", tablet";
    const cells = run.map((c) => {
      if (k === "image") {
        const i = c.querySelector("img");
        return i.closest("picture") || i;
      }
      if (k === "container") {
        return [...c.querySelectorAll("img, h1, h2, h3, h4, h5, h6, p, ul, ol, blockquote")].filter((e) => !e.parentElement.closest("h1, h2, h3, h4, h5, h6, p, ul, ol, blockquote, table")).filter((e) => e.tagName === "IMG" || e.textContent.trim() || e.querySelector("img")).filter((e) => e.tagName !== "IMG" || !e.closest("p")).map((e) => {
          if (e.tagName !== "IMG") return e;
          const q = document.createElement("p");
          q.append(e.closest("picture") || e);
          return q;
        });
      }
      const icon = c.querySelector(".cmp-text__image-wrapper img");
      const body = [...c.querySelectorAll("h1, h2, h3, h4, h5, h6, p, ul, ol, blockquote")].filter((e) => !e.parentElement.closest("h1, h2, h3, h4, h5, h6, p, ul, ol, blockquote")).filter((e) => e.textContent.trim() || e.querySelector("img"));
      if (icon) {
        const firstP = body.find((e) => e.tagName === "P");
        if (firstP) firstP.prepend(icon, " ");
      }
      return body;
    });
    const spans = run.map((c) => spanOf(c, "default"));
    if (spans.every((x) => x === spans[0]) && total < cols && (cols - total) % spans[0] === 0) {
      for (let e = 0; e < (cols - total) / spans[0]; e += 1) cells.push("");
    }
    const block = WebImporter.Blocks.createBlock(document, { name: `Columns (grid${option})`, cells: [cells] });
    run[0].replaceWith(block);
    run.slice(1).forEach((c) => c.remove());
  }

  // tools/importer/parsers/news-quote.js
  var NBSP_MARK = "\uE000";
  var isBlank = (p) => !p.textContent.replace(/[\s\u00a0\uE000]/g, "") && !p.querySelector("img");
  function parse2(element, { document }) {
    const paras = [...element.querySelectorAll("p")];
    const qi = paras.findIndex((p) => !isBlank(p));
    const quote = paras[qi];
    if (!quote) return;
    const gaps = [];
    for (let i = qi + 1; i < paras.length && isBlank(paras[i]); i += 1) {
      const g = document.createElement("p");
      g.textContent = NBSP_MARK;
      gaps.push(g);
    }
    const container = element.parentElement && element.parentElement.closest(".container");
    const own = !!container && container.querySelectorAll(".aem-GridColumn").length <= 2 && !container.querySelector(".container");
    const attrEl = own && element.nextElementSibling && element.nextElementSibling.classList.contains("text") ? element.nextElementSibling : null;
    const attribution = attrEl ? [...attrEl.querySelectorAll("p")].filter((p) => p.textContent.trim()) : [];
    const q = document.createElement("p");
    const em = document.createElement("em");
    em.textContent = quote.textContent.trim();
    q.append(em);
    const marks = [...quote.querySelectorAll("span[style]")].some((sp) => /font-size:\s*6\d/.test(sp.getAttribute("style")));
    const block = WebImporter.Blocks.createBlock(document, {
      name: marks ? "Quote (marks)" : "Quote",
      cells: [[[q, ...gaps, ...attribution]]]
    });
    (own ? container : element).replaceWith(block);
  }

  // tools/importer/parsers/news-tags-social.js
  var NETWORK = { facebook: "facebook", twitter: "x", x: "x", linkedin: "linkedin" };
  function parse3(element, { document }) {
    const out = [];
    const tagsLabel = element.querySelector(".v-tags__title");
    if (element.querySelector(".tags")) {
      out.push(WebImporter.Blocks.createBlock(document, {
        name: "Tags",
        cells: [[tagsLabel ? tagsLabel.textContent.trim() : ""]]
      }));
    }
    const share = element.querySelector(".v-social-media-sharing");
    if (share) {
      const label = share.querySelector(".v-social-media-sharing__title");
      const nets = [...share.querySelectorAll("[data-id]")].map((i) => NETWORK[(i.getAttribute("data-id") || "").toLowerCase()]).filter(Boolean);
      out.push(WebImporter.Blocks.createBlock(document, {
        name: "Social",
        cells: [[label ? label.textContent.trim() : ""], ...nets.map((n) => [n])]
      }));
    }
    if (out.length) element.replaceWith(...out);
  }

  // tools/importer/parsers/news-featured.js
  var FEATURED_FRAGMENT_PATH = "/fragments/news/featured-article";
  var FRAGMENT_TILE_TITLE = "Serving Gratitude: Celebrating the Coaches Who Shape Our Game";
  var FEATURED_LINKS = {
    // verified 2026-10-04 by clicking the tile on /en/home/news/zina-garrison-…
    "Serving Gratitude: Celebrating the Coaches Who Shape Our Game": "/en/home/news/serving-gratitude-celebrating-tennis-coaches",
    // verified 2026-10-04 by clicking the tile on /en/home/news/serving-gratitude-…
    "Coach\u2019s Journal by Emma Dell \u2013 Part 3: Changing Sides of the Net": "/en/home/news/coachs-journal-emma-dell-part-3-changing-sides-net"
  };
  var tileTitle = (element) => element.querySelector(".v-news-related-tile__title")?.textContent.trim() || "";
  function buildFeaturedTile(element, document) {
    const title = element.querySelector(".v-news-related-tile__title");
    const desc = element.querySelector(".v-news-related-tile__description");
    const img = element.querySelector(".v-news-related-tile__image");
    const ctaBtn = [...element.querySelectorAll("button")].find((b) => b.textContent.trim());
    if (!title || !img) return null;
    const h2 = document.createElement("h2");
    h2.textContent = title.textContent.trim();
    const p = document.createElement("p");
    p.textContent = desc ? desc.textContent.trim() : "";
    const content = [h2, p];
    const href = FEATURED_LINKS[h2.textContent];
    if (ctaBtn && href) {
      const cta = document.createElement("p");
      const a = document.createElement("a");
      a.href = href;
      a.textContent = ctaBtn.textContent.trim();
      cta.append(a);
      content.push(cta);
    }
    const image = document.createElement("img");
    image.src = img.getAttribute("src");
    image.alt = img.getAttribute("alt") || "";
    return WebImporter.Blocks.createBlock(document, {
      name: "Columns (media, dark)",
      cells: [[image, content]]
    });
  }
  function parse4(element, { document }) {
    const title = tileTitle(element);
    if (!title) {
      element.remove();
      return false;
    }
    if (title !== FRAGMENT_TILE_TITLE) {
      const inline = buildFeaturedTile(element, document);
      if (inline) element.replaceWith(inline);
      else element.remove();
      return !!inline;
    }
    const link = document.createElement("a");
    link.href = FEATURED_FRAGMENT_PATH;
    link.textContent = FEATURED_FRAGMENT_PATH;
    const block = WebImporter.Blocks.createBlock(document, { name: "Fragment", cells: [[link]] });
    element.replaceWith(block);
    return true;
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

  // tools/importer/import-news-article-v1.js
  var TEMPLATE = "news-article";
  var HEADING_SIZES = [
    { re: /text--font-size--(40|48|56|64)px-/, tag: "h2" },
    { re: /text--font-size--32px-/, tag: "h3" }
  ];
  function el(document, tag, text) {
    const e = document.createElement(tag);
    if (text != null) e.textContent = text;
    return e;
  }
  var CONTAINER_MARGINS = { 32: { desktop: 32, tablet: 32, mobile: 24 } };
  function containerMarginSpacers(frame, document) {
    frame.querySelectorAll('.container[class*="-margin--"]').forEach((c) => {
      if (c.querySelector(".text--font-family--graphic-semibold, .tags, .socialmediasharing")) return;
      [["top", "before"], ["bottom", "after"]].forEach(([side, where]) => {
        const m = [...c.classList].map((k) => k.match(new RegExp(`^container--${side}-margin--(\\d+)$`))).find(Boolean);
        const h = m && CONTAINER_MARGINS[m[1]];
        if (!h) return;
        c[where](WebImporter.Blocks.createBlock(document, {
          name: "Spacer",
          cells: [["desktop", `${h.desktop}px`], ["tablet", `${h.tablet}px`], ["mobile", `${h.mobile}px`]]
        }));
      });
    });
  }
  function spacer(document, px, variant) {
    return WebImporter.Blocks.createBlock(document, {
      name: variant ? `Spacer (${variant})` : "Spacer",
      cells: [["desktop", `${px}px`], ["mobile", `${px}px`]]
    });
  }
  function metadata(document, frame) {
    const meta = (sel) => document.querySelector(sel)?.getAttribute("content") || "";
    const crumb = document.querySelector(".cmp-breadcrumb__item--active");
    const cells = {
      Title: document.title,
      Description: meta('meta[name="description"]'),
      // the source's meta keywords are its topic tags (shown by the Tags block)
      Tags: meta('meta[name="keywords"]'),
      Template: TEMPLATE
    };
    const ogImage = meta('meta[property="og:image"]');
    if (ogImage) {
      const img = el(document, "img");
      img.src = ogImage;
      cells.Image = img;
    }
    if (crumb) cells["Breadcrumb Title"] = crumb.textContent.trim();
    Object.keys(cells).forEach((k) => {
      if (cells[k] === "") delete cells[k];
    });
    return WebImporter.Blocks.createBlock(document, { name: "Metadata", cells });
  }
  var NATIVE_HEADINGS = { H2: "h4", H3: "h5", H5: "h6" };
  function convertNativeHeadings(frame, document) {
    frame.querySelectorAll('.text:not([class*="text--font-size--"]) > .cmp-text').forEach((cmp) => {
      const heads = [...cmp.querySelectorAll("h2, h3, h5")];
      const before = new Map(heads.map((h) => [h, h.previousElementSibling]));
      heads.forEach((h) => {
        const n = document.createElement(NATIVE_HEADINGS[h.tagName]);
        if (!h.textContent.replace(/[\s\u00a0\uE000]/g, "")) {
          const prev = before.get(h);
          if (prev && prev.tagName === "P" && prev.textContent.replace(/[\s\u00a0\uE000]/g, "")) {
            h.remove();
            return;
          }
          n.textContent = NBSP_MARK2;
        } else n.append(...h.childNodes);
        h.replaceWith(n);
      });
    });
  }
  var LIME = /color:\s*(rgb\(\s*207\s*,\s*255\s*,\s*[0-9]\s*\)|#cfff0[0-9])/i;
  function markLimeLinks(frame, document) {
    frame.querySelectorAll(".cmp-text a[style]").forEach((a) => {
      if (!LIME.test(a.getAttribute("style")) || !a.textContent.trim() || a.querySelector("em, i")) return;
      const em = document.createElement("em");
      em.append(...a.childNodes);
      a.append(em);
    });
  }
  function textStyleBlocks(frame, document) {
    const variantOf = (comp) => {
      const c = comp.classList;
      if (c.contains("label-style")) return "label";
      if (c.contains("text--font-size--24px-16px") && c.contains("text--font-family--graphic-semibold")) return "intro";
      if (c.contains("cmp-text--alignment-center") && ![...c].some((k) => k.startsWith("text--font-"))) return "center";
      return null;
    };
    frame.querySelectorAll(".aem-GridColumn.text").forEach((comp) => {
      const variant = variantOf(comp);
      const cmp = comp.querySelector(".cmp-text");
      if (!variant || !cmp) return;
      const kids = [...cmp.children].filter((e) => !e.classList.contains("cmp-text__icon"));
      const filled = (e) => e.textContent.replace(/[\s\u00a0\uE000]/g, "") || e.querySelector("img");
      if (!kids.some(filled)) return;
      const content = kids.map((e) => {
        if (filled(e)) return e;
        const b = document.createElement("p");
        b.textContent = NBSP_MARK2;
        return b;
      });
      comp.replaceWith(WebImporter.Blocks.createBlock(document, { name: `Text Style (${variant})`, cells: [[content]] }));
    });
    frame.querySelectorAll(".cmp-text p[style]").forEach((p) => {
      if (!/font-size:\s*25(\.0)?px/i.test(p.getAttribute("style"))) return;
      const q = document.createElement("p");
      q.append(...p.childNodes);
      p.replaceWith(WebImporter.Blocks.createBlock(document, { name: "Text Style (large)", cells: [[q]] }));
    });
  }
  function convertHeadings(frame, document) {
    frame.querySelectorAll('.text[class*="text--font-size--"]').forEach((comp) => {
      if (comp.classList.contains("text--font-family--graphic-semibold")) return;
      const level = HEADING_SIZES.find((h) => h.re.test(comp.className));
      if (!level) return;
      comp.querySelectorAll("p").forEach((p) => {
        const text = p.textContent.trim();
        if (!text) {
          p.remove();
          return;
        }
        const h = el(document, level.tag, text);
        p.replaceWith(h);
      });
    });
  }
  var blockName = (t) => (t.querySelector("tr > th, tr > td")?.textContent || "").trim();
  function unitKind(e) {
    if (e.tagName === "TABLE") {
      const n = blockName(e);
      if (/^Spacer/i.test(n)) return "spacer";
      if (/^Columns \(person/i.test(n)) return "person";
      if (/^Columns \(article/i.test(n)) return "row";
      return "block";
    }
    if (/^H[23]$/.test(e.tagName)) return "heading";
    if (e.tagName === "UL" || e.tagName === "OL") return "list";
    if (e.tagName === "P" || e.tagName === "IMG") return "p";
    return "other";
  }
  var ruleGap = (prev, next) => !!prev && !!next && (next === "heading" || next === "row") && ["p", "list", "row"].includes(prev);
  function applySectionGaps(out, document) {
    const units = [...out.querySelectorAll("table, p, h1, h2, h3, h4, h5, h6, ul, ol, img")].filter((e) => {
      if (e.parentElement.closest("table, p, ul, ol, h1, h2, h3, h4, h5, h6")) return false;
      return !(e.tagName === "P" && !e.querySelector("img, picture, iframe") && !e.textContent.trim());
    });
    const kinds = units.map(unitKind);
    const source42 = (t) => t && /^Spacer$/i.test(blockName(t)) && /42px/.test(t.textContent);
    units.forEach((u, i) => {
      if (kinds[i] === "spacer" && /^Spacer \(line\)$/i.test(blockName(u)) && kinds[i + 1] === "person") {
        u.remove();
        return;
      }
      if (kinds[i] === "spacer") {
        if (source42(u) && ruleGap(kinds[i - 1], kinds[i + 1])) u.remove();
        return;
      }
      if (i === 0 || kinds[i - 1] === "spacer" || !ruleGap(kinds[i - 1], kinds[i])) return;
      if (kinds[i] === "row") {
        const th = u.querySelector("tr > th, tr > td");
        th.textContent = th.textContent.trim().replace(/\)$/, ", flush)");
      } else {
        u.before(spacer(document, 0));
      }
    });
  }
  function pathOf(url) {
    const raw = new URL(url).pathname.replace(/\/$/, "").replace(/\.html?$/, "");
    return WebImporter.FileUtils.sanitizePath(raw === "" ? "/index" : raw);
  }
  var NBSP_MARK2 = "\uE000";
  function markNbsp(root, document) {
    const walker = document.createTreeWalker(
      root,
      4
      /* NodeFilter.SHOW_TEXT */
    );
    for (let n = walker.nextNode(); n; n = walker.nextNode()) {
      const block = n.parentElement && n.parentElement.closest("p, li, h1, h2, h3, h4, h5, h6, div");
      const keepBlank = !!block && block.tagName === "P" && block.parentElement?.tagName === "LI";
      if (n.nodeValue.includes("\xA0") && block && (block.textContent.trim() || keepBlank)) {
        n.nodeValue = n.nodeValue.replace(/\u00a0/g, NBSP_MARK2);
      }
    }
  }
  var isListEl = (e) => !!e && (e.tagName === "UL" || e.tagName === "OL");
  var isBlankEl = (e) => e.tagName === "P" && !e.querySelector("img, picture, iframe, video") && !e.textContent.replace(/[\s\u00a0\uE000]/g, "");
  function normalizeTextComponent(cmpEl, document) {
    const cmp = cmpEl.querySelector(":scope > .cmp-text__image-and-paragraph > div:not(.cmp-text__image-wrapper)") || cmpEl;
    const kids = [...cmp.children].filter((e) => !e.classList.contains("cmp-text__icon"));
    const content = kids.map((e, i) => isBlankEl(e) ? -1 : i).filter((i) => i >= 0);
    if (!content.length) return;
    const keep = (b) => {
      b.textContent = NBSP_MARK2;
    };
    const blankLine = () => {
      const b = document.createElement("p");
      keep(b);
      return b;
    };
    kids.slice(0, content[0]).forEach(keep);
    kids.slice(content[content.length - 1] + 1).forEach(keep);
    let prev = kids[content[0]];
    for (let c = 1; c < content.length; c += 1) {
      const next = kids[content[c]];
      const blanks = kids.slice(content[c - 1] + 1, content[c]);
      if (isListEl(prev) || isListEl(next)) {
        blanks.forEach(keep);
        prev = next;
      } else if (!blanks.length && (prev.tagName === "P" && next.tagName === "P" && !styleKey(prev) && !styleKey(next) || /^H[1-6]$/.test(prev.tagName) && prev.tagName === next.tagName)) {
        prev.append(document.createElement("br"), ...next.childNodes);
        next.remove();
      } else {
        blanks.shift()?.remove();
        blanks.forEach(keep);
        prev = next;
      }
    }
    const first = kids[content[0]];
    const last = kids[content[content.length - 1]];
    if (isListEl(first) && content[0] === 0) first.before(blankLine());
    if (isListEl(last) && content[content.length - 1] === kids.length - 1) last.after(blankLine());
    wrapIndentedRuns(cmp, document);
  }
  function styleKey(p) {
    const st = p.getAttribute && p.getAttribute("style") || "";
    return /font-size|margin-left/i.test(st) ? st : "";
  }
  var isIndented = (e) => !!e && e.tagName === "P" && /margin-left:\s*[1-9]/i.test(e.getAttribute("style") || "");
  function wrapIndentedRuns(cmp, document) {
    let el2 = cmp.firstElementChild;
    while (el2) {
      if (!isIndented(el2)) {
        el2 = el2.nextElementSibling;
        continue;
      }
      const bq = document.createElement("blockquote");
      el2.before(bq);
      let cur = el2;
      while (cur) {
        const after = cur.nextElementSibling;
        if (isIndented(cur)) {
          bq.append(cur);
          cur = after;
          continue;
        }
        let probe = cur;
        while (probe && probe.tagName === "P" && isBlankEl(probe) && !isIndented(probe)) probe = probe.nextElementSibling;
        if (cur.tagName === "P" && isBlankEl(cur) && isIndented(probe)) {
          while (cur !== probe) {
            const n = cur.nextElementSibling;
            bq.append(cur);
            cur = n;
          }
          continue;
        }
        break;
      }
      el2 = bq.nextElementSibling;
    }
  }
  function restoreNbspInOutput() {
    const W = window.WebImporter;
    if (!W || typeof W.md2da !== "function" || W.restoresNbsp) return;
    const { md2da } = W;
    window.WebImporter = {
      ...W,
      restoresNbsp: true,
      md2da: (md, ...rest) => md2da(md, ...rest).split(NBSP_MARK2).join("&nbsp;")
    };
  }
  var import_news_article_v1_default = {
    onLoad: ({ document }) => {
      markNbsp(document.body, document);
      document.querySelectorAll(".cmp-text p").forEach((p) => {
        if (!isBlankEl(p)) return;
        if (/[\u00a0\uE000]/.test(p.textContent) || p.querySelector("br")) p.textContent = NBSP_MARK2;
        else p.remove();
      });
      document.querySelectorAll(".separator").forEach((sep) => {
        const h = Math.round(sep.getBoundingClientRect().height);
        if (h) sep.setAttribute("data-height", String(h));
      });
      restoreNbspInOutput();
    },
    transform: (payload) => {
      const { document, params } = payload;
      const url = params.originalURL;
      const main = document.body;
      transform("beforeTransform", main, payload);
      main.querySelectorAll('[class*="aem-GridColumn--default--hide"]').forEach((e) => e.remove());
      if (new URL(url).hash === "#featured-fragment") {
        const tile = main.querySelector(".aem-featured-article");
        const out2 = document.createElement("div");
        const block = tile && buildFeaturedTile(tile, document);
        if (block) out2.append(block);
        WebImporter.rules.adjustImageUrls(out2, url, params.originalURL);
        return [{ element: out2, path: FEATURED_FRAGMENT_PATH, report: { template: `${TEMPLATE}:fragment` } }];
      }
      const frame = main.querySelector(".container.container--border--white > .cmp-container") || main.querySelector(".container--border--white");
      if (!frame) throw new Error("news-article frame (.container--border--white) not found");
      containerMarginSpacers(frame, document);
      convertHeadings(frame, document);
      convertNativeHeadings(frame, document);
      markLimeLinks(frame, document);
      textStyleBlocks(frame, document);
      frame.querySelectorAll(".text:not(.text--font-family--graphic-semibold) > .cmp-text").forEach((cmp) => normalizeTextComponent(cmp, document));
      [...frame.querySelectorAll(".text.text--font-family--graphic-semibold")].forEach((q) => parse2(q, { document }));
      const images = [...frame.querySelectorAll(".aem-GridColumn.image")].filter((i) => i.querySelector("img"));
      images.slice(1).forEach((i) => {
        if (i.parentElement) parse(i, { document });
      });
      [...frame.querySelectorAll(".aem-GridColumn.iframetext")].forEach((i) => parse(i, { document }));
      images.slice(1).forEach((i) => {
        if (i.parentElement) parseGrid(i, { document });
      });
      [...frame.querySelectorAll(".aem-GridColumn.text")].forEach((t) => {
        if (t.parentElement) parseGrid(t, { document });
      });
      [...frame.querySelectorAll(".aem-GridColumn.container")].forEach((c) => {
        if (c.isConnected && c.parentElement) parseGrid(c, { document });
      });
      [...frame.querySelectorAll(".aem-GridColumn.text")].forEach((t) => parsePersonText(t, { document }));
      frame.querySelectorAll(".separator").forEach((s) => s.replaceWith(spacer(
        document,
        Number(s.getAttribute("data-height")) || 42,
        s.classList.contains("separator--border-color--transparent") ? null : "line"
      )));
      const footerRow = frame.querySelector(".tags")?.closest(".container") || frame.querySelector(".socialmediasharing")?.closest(".container");
      if (footerRow) parse3(footerRow, { document });
      const out = document.createElement("div");
      out.append(...frame.childNodes);
      applySectionGaps(out, document);
      out.append(WebImporter.Blocks.createBlock(document, { name: "Section Metadata", cells: { Style: "bordered" } }));
      const featured = main.querySelector(".aem-featured-article");
      if (featured) {
        const holder = document.createElement("div");
        holder.append(featured);
        if (parse4(featured, { document })) out.append(document.createElement("hr"), holder);
      }
      out.append(metadata(document, frame));
      transform("afterTransform", out, payload);
      WebImporter.rules.adjustImageUrls(out, url, params.originalURL);
      return [{
        element: out,
        path: pathOf(url),
        report: { title: document.title, template: TEMPLATE }
      }];
    }
  };
  return __toCommonJS(import_news_article_v1_exports);
})();
