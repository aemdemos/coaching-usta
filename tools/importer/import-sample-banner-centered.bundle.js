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

  // tools/importer/import-sample-banner-centered.js
  var import_sample_banner_centered_exports = {};
  __export(import_sample_banner_centered_exports, {
    default: () => import_sample_banner_centered_default
  });
  var SOURCES = [
    "https://www.ustacoaching.com/en/home/membership-benefits.html",
    "https://www.ustacoaching.com/en/home/learning-pathway.html"
  ];
  var HEADING = "More questions? Visit Coach Care.";
  var el = (document, tag, html) => {
    const e = document.createElement(tag);
    e.innerHTML = html;
    return e;
  };
  var norm = (s) => s.replace(/\s+/g, " ").trim();
  var import_sample_banner_centered_default = {
    transform: ({ document, params }) => {
      const textEl = [...document.querySelectorAll(".cmp-text p, .cmp-text h1, .cmp-text h2, .cmp-text h3, .cmp-text h4")].find((e) => norm(e.textContent) === HEADING);
      if (!textEl) throw new Error(`"${HEADING}" not found on ${params.originalURL}`);
      let band = textEl.parentElement;
      while (band && !band.querySelector("a.cmp-button")) band = band.parentElement;
      const btn = band && band.querySelector("a.cmp-button");
      if (!btn) throw new Error("banner CTA not found");
      const label = norm(btn.textContent);
      const href = btn.getAttribute("href");
      const gap = (d, m) => WebImporter.Blocks.createBlock(document, { name: "Spacer", cells: [["desktop", `${d}px`], ["mobile", `${m}px`]] });
      const banner = (variant) => {
        const heading = document.createElement("h3");
        heading.textContent = norm(textEl.textContent);
        const link = document.createElement("a");
        link.href = href;
        link.textContent = label;
        return WebImporter.Blocks.createBlock(document, { name: `Banner (${variant})`, cells: [[heading, link]] });
      };
      const sources = SOURCES.map((u) => `<a href="${u}">${u.split("/home/")[1].replace(/\.html$/, "")}</a>`).join(", ");
      const out = document.createElement("div");
      out.append(
        el(document, "h1", "Banner (Centered)"),
        el(document, "p", "Centered CTA banner: a centred heading above a centred CTA, no body copy. Shown in its default colours and with <strong>blue</strong> appended (the source uses the blue one)."),
        el(document, "p", `<em>Source: ${sources} (EN + ES)</em>`),
        document.createElement("hr"),
        gap(40, 24),
        document.createElement("hr"),
        el(document, "h2", "Banner (Centered)"),
        el(document, "p", "Default: black panel with a 1px white outline, white text and a lime CTA with a black label. Authored as <code>banner centered</code>."),
        document.createElement("hr"),
        banner("centered"),
        document.createElement("hr"),
        gap(60, 40),
        document.createElement("hr"),
        el(document, "h2", "Banner (Centered, Blue)"),
        el(document, "p", "Blue \u2014 as on the source: append <strong>blue</strong> for a blue panel, no outline, black text and a black CTA with a white label. Authored as <code>banner centered blue</code>."),
        document.createElement("hr"),
        banner("centered, blue"),
        document.createElement("hr"),
        gap(80, 60),
        document.createElement("hr"),
        WebImporter.Blocks.createBlock(document, { name: "Metadata", cells: { Title: "Banner (Centered) \u2014 Block Sample", Robots: "noindex, nofollow" } })
      );
      return [{ element: out, path: "/drafts/block-samples/banner-centered", report: { template: "block-sample" } }];
    }
  };
  return __toCommonJS(import_sample_banner_centered_exports);
})();
