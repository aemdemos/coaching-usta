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
  function parse(element, { document }) {
    const img = element.querySelector("img");
    if (!img) return;
    const isText = (el2) => el2 && el2.classList && el2.classList.contains("aem-GridColumn") && (el2.classList.contains("text") || el2.classList.contains("container")) && el2.textContent.trim();
    const prev = element.previousElementSibling;
    const next = element.nextElementSibling;
    const textEl = isText(prev) ? prev : isText(next) ? next : null;
    if (!textEl) return;
    const textFirst = textEl === prev;
    const n = spanOf(element, "default");
    if (n === 12) return;
    const firstP = [...textEl.querySelectorAll("p")].find((x) => x.textContent.replace(/[\s\u00a0\uE000]/g, ""));
    const variant = firstP && /font-size:\s*2[0-9]/.test(firstP.getAttribute("style") || "") ? "person" : "article";
    if (variant === "person") {
      const header = [];
      for (let p = firstP; p && p.tagName === "P" && /font-size/.test(p.getAttribute("style") || ""); p = p.nextElementSibling) header.push(p);
      header.slice(2).forEach((p) => {
        if (/font-size:\s*16/.test(p.getAttribute("style") || "")) return;
        const role = p.previousElementSibling;
        role.append(document.createElement("br"), ...p.childNodes);
        p.remove();
      });
    }
    const options = [textFirst ? "media-right" : "media-left"];
    if (n) options.push(`media-${n}`);
    const items = [...textEl.querySelectorAll("h1, h2, h3, h4, h5, h6, p, ul, ol, blockquote, .separator")].filter((e) => !e.parentElement.closest("h1, h2, h3, h4, h5, h6, p, ul, ol, blockquote")).filter((e) => e.classList.contains("separator") || e.textContent.trim() || e.querySelector("img"));
    const content = [];
    items.forEach((e) => {
      if (!e.classList.contains("separator")) {
        content.push(e);
        return;
      }
      if (!content.length || content[content.length - 1].tagName === "HR") return;
      content.push(document.createElement("hr"));
    });
    const picture = img.closest("picture") || img;
    const row = textFirst ? [content, picture] : [picture, content];
    const block = WebImporter.Blocks.createBlock(document, {
      name: `Columns (${[variant, ...options].join(", ")})`,
      cells: [row]
    });
    textEl.replaceWith(block);
    element.remove();
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
    const attrEl = element.nextElementSibling && element.nextElementSibling.classList.contains("text") ? element.nextElementSibling : null;
    const attribution = attrEl ? [...attrEl.querySelectorAll("p")].filter((p) => p.textContent.trim()) : [];
    const q = document.createElement("p");
    const em = document.createElement("em");
    em.textContent = quote.textContent.trim();
    q.append(em);
    const block = WebImporter.Blocks.createBlock(document, {
      name: "Quote",
      cells: [[[q, ...gaps, ...attribution]]]
    });
    const container = element.closest(".container") || element;
    container.replaceWith(block);
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
      if (/^Columns \((article|person)/i.test(n)) return "row";
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
  function normalizeTextComponent(cmp, document) {
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
      } else if (!blanks.length && prev.tagName === "P" && next.tagName === "P" && !styleKey(prev) && !styleKey(next)) {
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
      convertHeadings(frame, document);
      frame.querySelectorAll(".text:not(.text--font-family--graphic-semibold) > .cmp-text").forEach((cmp) => normalizeTextComponent(cmp, document));
      [...frame.querySelectorAll(".text.text--font-family--graphic-semibold")].forEach((q) => parse2(q, { document }));
      const images = [...frame.querySelectorAll(".aem-GridColumn.image")].filter((i) => i.querySelector("img"));
      images.slice(1).forEach((i) => parse(i, { document }));
      frame.querySelectorAll(".separator").forEach((s) => s.replaceWith(spacer(
        document,
        42,
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
