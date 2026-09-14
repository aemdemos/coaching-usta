/* eslint-disable */
var CustomImportScript = (() => {
  var __defProp = Object.defineProperty;
  var __defProps = Object.defineProperties;
  var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
  var __getOwnPropDescs = Object.getOwnPropertyDescriptors;
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __getOwnPropSymbols = Object.getOwnPropertySymbols;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
  var __propIsEnum = Object.prototype.propertyIsEnumerable;
  var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
  var __spreadValues = (a, b) => {
    for (var prop in b || (b = {}))
      if (__hasOwnProp.call(b, prop))
        __defNormalProp(a, prop, b[prop]);
    if (__getOwnPropSymbols)
      for (var prop of __getOwnPropSymbols(b)) {
        if (__propIsEnum.call(b, prop))
          __defNormalProp(a, prop, b[prop]);
      }
    return a;
  };
  var __spreadProps = (a, b) => __defProps(a, __getOwnPropDescs(b));
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

  // tools/importer/import-home.js
  var import_home_exports = {};
  __export(import_home_exports, {
    default: () => import_home_default
  });

  // tools/importer/parsers/hero-video.js
  function parse(element, { document: document2 }) {
    const video = element.querySelector("video");
    let videoSrc = null;
    const source = element.querySelector('video source[src], source[src$=".mp4"]');
    if (source) videoSrc = source.getAttribute("src");
    if (!videoSrc && video) videoSrc = video.getAttribute("data-source") || video.getAttribute("src");
    if (!videoSrc) {
      const mp4Link = [...element.querySelectorAll("a")].find((a) => (a.getAttribute("href") || "").includes(".mp4"));
      if (mp4Link) videoSrc = mp4Link.getAttribute("href");
    }
    const heading = element.querySelector('h1, h2, .hero-title, [class*="heading"]');
    const cta = element.querySelector('a[href]:not([href*=".mp4"])');
    if (!videoSrc && !heading) {
      element.replaceWith(...element.childNodes);
      return;
    }
    const cells = [];
    if (videoSrc) {
      const link = document2.createElement("a");
      link.href = videoSrc;
      link.textContent = videoSrc;
      cells.push([link]);
    }
    if (heading || cta) {
      const contentCell = [];
      if (heading) contentCell.push(heading);
      if (cta) contentCell.push(cta);
      cells.push([contentCell]);
    }
    const block = WebImporter.Blocks.createBlock(document2, { name: "hero-video", cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/columns-media.js
  function parse2(element, { document: document2 }) {
    let columns = [...element.querySelectorAll(":scope > .aem-Grid > .aem-GridColumn")];
    if (columns.length < 2) {
      columns = [...element.querySelectorAll(".aem-Grid > .aem-GridColumn")];
    }
    const isHidden = (col) => [...col.classList].some((c) => /^aem-GridColumn--(default|desktop-small)--hide$/.test(c));
    let mediaEl = null;
    let mediaIndex = -1;
    let mediaHidden = true;
    const contentEls = [];
    let contentFound = false;
    columns.forEach((col, i) => {
      const img = col.querySelector("img, picture");
      const hasText = col.querySelector("h1, h2, h3, h4, h5, h6, p, a");
      if (img && !hasText) {
        const hidden = isHidden(col);
        if (!mediaEl || mediaHidden && !hidden) {
          mediaEl = img.closest("picture") || img;
          mediaIndex = i;
          mediaHidden = hidden;
        }
      } else if (!contentFound && hasText && !isHidden(col)) {
        const heading = col.querySelector("h1, h2, h3, h4, h5, h6");
        const paras = [...col.querySelectorAll("p")].filter((p) => p.textContent.trim());
        const links = [...col.querySelectorAll("a[href]")];
        if (heading) contentEls.push(heading);
        contentEls.push(...paras);
        contentEls.push(...links);
        contentFound = true;
      }
    });
    if (!mediaEl && contentEls.length === 0) {
      element.replaceWith(...element.childNodes);
      return;
    }
    const mediaCell = mediaEl || "";
    const contentCell = contentEls.length ? contentEls : "";
    const contentFirst = mediaIndex > 0;
    const row = contentFirst ? [contentCell, mediaCell] : [mediaCell, contentCell];
    const cells = [row];
    const block = WebImporter.Blocks.createBlock(document2, { name: "columns-media", cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/cards-pricing.js
  function parse3(element, { document: document2 }) {
    const cards = [...element.querySelectorAll(".v-tiers-card")];
    const cells = [];
    cards.forEach((card) => {
      const content = card.querySelector(".v-tiers-card--content") || card;
      const cellContent = [];
      const titleEl = content.querySelector(".v-tiers-card__title");
      if (titleEl && titleEl.textContent.trim()) {
        const h = document2.createElement("h3");
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
        const price = document2.createElement("p");
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
        const link = document2.createElement("a");
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
    const block = WebImporter.Blocks.createBlock(document2, { name: "cards-pricing", cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/cards-media.js
  function parse4(element, { document: document2 }) {
    let cardUnits = [...element.querySelectorAll(":scope > .aem-Grid--4")];
    if (!cardUnits.length) cardUnits = [element];
    const cells = [];
    cardUnits.forEach((card) => {
      const img = card.querySelector("img, picture");
      const imageCell = img ? img.closest("picture") || img : "";
      const bodyEls = [];
      const heading = card.querySelector("h1, h2, h3, h4, h5, h6");
      if (heading) bodyEls.push(heading);
      [...card.querySelectorAll("p")].forEach((p) => {
        if (p.textContent.trim()) bodyEls.push(p);
      });
      if (imageCell || bodyEls.length) {
        cells.push([imageCell, bodyEls.length ? bodyEls : ""]);
      }
    });
    if (!cells.length) {
      element.replaceWith(...element.childNodes);
      return;
    }
    const block = WebImporter.Blocks.createBlock(document2, { name: "cards-media", cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/columns-cta.js
  function parse5(element, { document: document2 }) {
    const paras = [...element.querySelectorAll(".cmp-text p, p")].filter((p) => p.textContent.trim());
    const cta = element.querySelector("a[href]");
    if (!paras.length && !cta) {
      element.replaceWith(...element.childNodes);
      return;
    }
    const textParas = paras.filter((p) => !cta || !cta.contains(p));
    const textCell = [];
    if (textParas[0]) {
      const h = document2.createElement("h2");
      h.textContent = textParas[0].textContent.trim();
      textCell.push(h);
    }
    textParas.slice(1).forEach((p) => textCell.push(p));
    const actionCell = cta || "";
    const cells = [[textCell.length ? textCell : "", actionCell]];
    const block = WebImporter.Blocks.createBlock(document2, { name: "columns-cta", cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/columns-quote.js
  function parse6(element, { document: document2 }) {
    const imgs = [...element.querySelectorAll("img")];
    const portrait = imgs.find((img) => {
      const src = (img.getAttribute("src") || "").toLowerCase();
      const alt = (img.getAttribute("alt") || "").toLowerCase();
      return !src.includes("quote") && !alt.includes("quote");
    });
    const imageEl = portrait || imgs[0] || null;
    const imageCell = imageEl ? imageEl.closest("picture") || imageEl : "";
    const paras = [...element.querySelectorAll(".cmp-text p, p")].filter((p) => p.textContent.trim());
    if (!imageCell && !paras.length) {
      element.replaceWith(...element.childNodes);
      return;
    }
    const bodyCell = paras.length ? paras : "";
    const cells = [[imageCell, bodyCell]];
    const block = WebImporter.Blocks.createBlock(document2, { name: "columns-quote", cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/accordion.js
  function parse7(element, { document: document2 }) {
    const items = [...element.querySelectorAll(".cmp-accordion__item")];
    const cells = [];
    items.forEach((item) => {
      const button = item.querySelector(".cmp-accordion__button, h1, h2, h3, h4, h5, h6");
      const labelText = button ? button.textContent.trim() : "";
      const label = document2.createElement("p");
      label.textContent = labelText;
      const panel = item.querySelector(".cmp-accordion__panel");
      const bodyEls = [];
      if (panel) {
        [...panel.children].forEach((child) => {
          if (child.textContent.trim() || child.querySelector("img, a")) bodyEls.push(child);
        });
        if (!bodyEls.length && panel.textContent.trim()) {
          const p = document2.createElement("p");
          p.textContent = panel.textContent.trim();
          bodyEls.push(p);
        }
      }
      if (labelText || bodyEls.length) {
        cells.push([label, bodyEls.length ? bodyEls : ""]);
      }
    });
    if (!cells.length) {
      element.replaceWith(...element.childNodes);
      return;
    }
    const block = WebImporter.Blocks.createBlock(document2, { name: "accordion", cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/form.js
  function parse8(element, { document: document2 }) {
    const cell = (text) => {
      const div = document2.createElement("div");
      div.textContent = text;
      return div;
    };
    const clean = (s) => (s || "").replace(/^\*+/, "").replace(/\s+/g, " ").trim();
    const cells = [];
    const title = element.querySelector(".v-leads__title, h1, h2, h3");
    if (title && title.textContent.trim()) {
      const h = document2.createElement("h2");
      h.textContent = title.textContent.trim();
      cells.push([[h]]);
    }
    const textFields = element.querySelectorAll(".form-text-input, .v-leads__field");
    textFields.forEach((node) => {
      const labelEl = node.querySelector("label");
      const rawLabel = labelEl ? clean(labelEl.textContent) : "";
      const input = node.querySelector("input");
      const inputType = input ? (input.getAttribute("type") || "").toLowerCase() : "";
      const name = input ? input.getAttribute("name") || "" : "";
      let type = "text";
      if (inputType === "email" || /email/i.test(rawLabel) || /email/i.test(name)) type = "email";
      else if (/zip|postal/i.test(rawLabel) || /zip|postal/i.test(name) || node.querySelector(".form-text-input__counter")) type = "zip";
      const fieldName = name || clean(rawLabel).toLowerCase().replace(/[^a-z0-9]+/g, "-");
      cells.push([cell(type), cell(rawLabel), cell(fieldName)]);
    });
    const group = element.querySelector(".v-checkbox-group, fieldset");
    if (group) {
      const legendEl = group.querySelector(".v-checkbox-group__title, legend");
      const legend = legendEl ? clean(legendEl.textContent) : "";
      let options = [...group.querySelectorAll(".v-checkbox__text")].map((o) => clean(o.textContent));
      if (!options.length) options = [...group.querySelectorAll("label")].map((l) => clean(l.textContent));
      options = options.filter(Boolean);
      if (legend || options.length) {
        cells.push([cell("checkbox-group"), cell(legend), cell("coach-type"), cell(options.join(", "))]);
      }
    }
    const legalNode = element.querySelector(".v-leads__terms-message, .v-leads__legal");
    if (legalNode && legalNode.textContent.trim()) {
      const legal = document2.createElement("div");
      const source = legalNode.querySelector("p") || legalNode;
      legal.append(...source.cloneNode(true).childNodes);
      cells.push([cell("legal"), legal]);
    }
    const submit = element.querySelector('.v-leads__submit, button.coaching-primary-button, button[type="submit"], button');
    if (submit && submit.textContent.trim()) {
      cells.push([cell("submit"), cell(clean(submit.textContent))]);
    }
    if (!cells.length) {
      element.replaceWith(...element.childNodes);
      return;
    }
    const block = WebImporter.Blocks.createBlock(document2, { name: "form", cells });
    element.replaceWith(block);
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
      element.querySelectorAll("*").forEach((el) => {
        el.removeAttribute("data-cmp-data-layer-name");
        el.removeAttribute("data-cmp-link-accessibility-enabled");
        el.removeAttribute("data-cmp-link-accessibility-text");
        [...el.attributes].filter((attr) => attr.name.startsWith("data-cmp-")).forEach((attr) => el.removeAttribute(attr.name));
      });
    }
  }

  // tools/importer/transformers/coaching-usta-sections.js
  var SECTION_MARKER_ATTR = "data-excat-section-id";
  function querySection(root, selectors) {
    for (const sel of selectors || []) {
      const el = root.querySelector(sel);
      if (el) return el;
    }
    return null;
  }
  function transform2(hookName, element, payload) {
    const sections = payload.template && payload.template.sections || [];
    if (hookName === "beforeTransform") {
      for (let i = sections.length - 1; i >= 0; i -= 1) {
        const section = sections[i];
        if (i === 0 && !section.style) continue;
        const sectionEl = querySection(element, section.selector);
        if (!sectionEl) continue;
        const hr = document.createElement("hr");
        if (section.style) hr.setAttribute(SECTION_MARKER_ATTR, String(section.id));
        sectionEl.before(hr);
      }
    }
    if (hookName === "afterTransform") {
      for (let i = sections.length - 1; i >= 0; i -= 1) {
        const section = sections[i];
        if (!section.style) continue;
        const marker = element.querySelector(`[${SECTION_MARKER_ATTR}="${section.id}"]`);
        const anchor = marker || querySection(element, section.selector);
        if (!anchor) continue;
        const metadataBlock = WebImporter.Blocks.createBlock(document, {
          name: "Section Metadata",
          cells: { style: section.style }
        });
        anchor.after(metadataBlock);
        if (marker) {
          marker.removeAttribute(SECTION_MARKER_ATTR);
          if (i === 0) marker.remove();
        }
      }
    }
  }

  // tools/importer/import-home.js
  var parsers = {
    "hero-video": parse,
    "columns-media": parse2,
    "cards-pricing": parse3,
    "cards-media": parse4,
    "columns-cta": parse5,
    "columns-quote": parse6,
    "accordion": parse7,
    "form": parse8
  };
  var PAGE_TEMPLATE = {
    name: "home",
    description: "USTA Coaching homepage",
    urls: ["https://www.ustacoaching.com/"],
    blocks: [
      { name: "hero-video", instances: [".cmp-container__video-container"] },
      { name: "columns-media", instances: [".container--top-margin--52.container--inner-full-height", ".container--top-margin--36.container--bottom-margin--36.container--inner-full-height"] },
      { name: "cards-pricing", instances: [".v-tiers"] },
      { name: "cards-media", instances: [".cmp-container .aem-Grid--4"] },
      { name: "columns-cta", instances: [".container--display--flex.container--align-items--center"] },
      { name: "columns-quote", instances: [".container--border--white:not(.aem-GridColumn--mobile--hide):not(.aem-GridColumn--tablet--hide)"] },
      { name: "accordion", instances: [".accordion.panelcontainer"] },
      { name: "form", instances: [".v-leads"] }
    ],
    sections: [
      { id: 1, name: "Hero", selector: [".cmp-container__video-container"], style: "dark", blocks: ["hero-video"], defaultContent: [] },
      { id: 2, name: "Intro statement", selector: [".container--top-margin--52.container--bottom-margin--52"], style: "dark", blocks: [], defaultContent: [".container--top-margin--52.container--bottom-margin--52"] },
      { id: 3, name: "Quiz finder card", selector: [".container--top-margin--52.container--inner-full-height"], style: null, blocks: ["columns-media"], defaultContent: [] },
      { id: 4, name: "Packages / pricing", selector: [".v-tiers"], style: "dark", blocks: ["cards-pricing"], defaultContent: [] },
      { id: 5, name: "Community", selector: [".cmp-container .aem-Grid--4"], style: "dark", blocks: ["cards-media"], defaultContent: [] },
      { id: 6, name: "Events banner", selector: [".container--display--flex.container--align-items--center"], style: "accent", blocks: ["columns-cta"], defaultContent: [] },
      { id: 7, name: "Success stories", selector: [".container--border--white:not(.aem-GridColumn--mobile--hide):not(.aem-GridColumn--tablet--hide)"], style: "dark", blocks: ["columns-quote"], defaultContent: [] },
      { id: 8, name: "Discover your path", selector: [".accordion.panelcontainer"], style: "dark", blocks: ["accordion"], defaultContent: [] },
      { id: 9, name: "Safe Play", selector: [".container--top-margin--36.container--bottom-margin--36.container--inner-full-height"], style: null, blocks: ["columns-media"], defaultContent: [] },
      { id: 10, name: "Newsletter signup form", selector: [".v-leads"], style: "dark", blocks: ["form"], defaultContent: [] }
    ]
  };
  var transformers = [
    transform,
    ...PAGE_TEMPLATE.sections && PAGE_TEMPLATE.sections.length > 1 ? [transform2] : []
  ];
  function executeTransformers(hookName, element, payload) {
    const enhancedPayload = __spreadProps(__spreadValues({}, payload), { template: PAGE_TEMPLATE });
    transformers.forEach((transformerFn) => {
      try {
        transformerFn.call(null, hookName, element, enhancedPayload);
      } catch (e) {
        console.error(`Transformer failed at ${hookName}:`, e);
      }
    });
  }
  function findBlocksOnPage(document2, template) {
    const pageBlocks = [];
    template.blocks.forEach((blockDef) => {
      blockDef.instances.forEach((selector) => {
        let elements = [];
        try {
          elements = document2.querySelectorAll(selector);
        } catch (e) {
          console.warn(`Invalid selector for "${blockDef.name}": ${selector}`);
          return;
        }
        if (elements.length === 0) {
          console.warn(`Block "${blockDef.name}" selector not found: ${selector}`);
        }
        elements.forEach((element) => {
          pageBlocks.push({ name: blockDef.name, selector, element, section: blockDef.section || null });
        });
      });
    });
    console.log(`Found ${pageBlocks.length} block instances on page`);
    return pageBlocks;
  }
  var import_home_default = {
    transform: (payload) => {
      const { document: document2, url, params } = payload;
      const main = document2.body;
      executeTransformers("beforeTransform", main, payload);
      const pageBlocks = findBlocksOnPage(document2, PAGE_TEMPLATE);
      pageBlocks.forEach((block) => {
        if (!block.element.parentNode) return;
        const parser = parsers[block.name];
        if (parser) {
          try {
            parser(block.element, { document: document2, url, params });
          } catch (e) {
            console.error(`Failed to parse ${block.name} (${block.selector}):`, e);
          }
        } else {
          console.warn(`No parser found for block: ${block.name}`);
        }
      });
      executeTransformers("afterTransform", main, payload);
      const hr = document2.createElement("hr");
      main.appendChild(hr);
      WebImporter.rules.createMetadata(main, document2);
      WebImporter.rules.transformBackgroundImages(main, document2);
      WebImporter.rules.adjustImageUrls(main, url, params.originalURL);
      const rawPath = new URL(params.originalURL).pathname.replace(/\/$/, "").replace(/\.html?$/, "");
      const path = WebImporter.FileUtils.sanitizePath(rawPath === "" ? "/index" : rawPath);
      return [{
        element: main,
        path,
        report: {
          title: document2.title,
          template: PAGE_TEMPLATE.name,
          blocks: pageBlocks.map((b) => b.name)
        }
      }];
    }
  };
  return __toCommonJS(import_home_exports);
})();
