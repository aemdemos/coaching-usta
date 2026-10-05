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

  // tools/importer/import-nav.js
  var import_nav_exports = {};
  __export(import_nav_exports, {
    default: () => import_nav_default
  });
  var SHOP = {
    en: { after: "News", label: "Shop" },
    es: { after: "Noticias", label: "Comercio" }
  };
  var SHOP_URL = "https://ustacoachingshop.com/";
  var import_nav_default = {
    transform: ({ document, params }) => {
      const path = new URL(params.originalURL).pathname;
      const locale = /\/es\//.test(path) ? "es" : "en";
      const out = document.createElement("div");
      [...document.body.children].forEach((section) => {
        out.append(section);
        if (section.tagName === "DIV") out.append(document.createElement("hr"));
      });
      if (out.lastElementChild?.tagName === "HR") out.lastElementChild.remove();
      const cfg = SHOP[locale];
      if (!out.querySelector(`a[href^="${SHOP_URL}"]`)) {
        const news = [...out.querySelectorAll("li > a")].find((a2) => a2.textContent.trim() === cfg.after);
        if (!news) throw new Error(`nav: "${cfg.after}" item not found`);
        const li = document.createElement("li");
        const a = document.createElement("a");
        a.href = SHOP_URL;
        a.textContent = cfg.label;
        li.append(a);
        news.parentElement.after(li);
      }
      return [{ element: out, path: locale === "es" ? "/es/nav" : "/nav", report: { template: "nav" } }];
    }
  };
  return __toCommonJS(import_nav_exports);
})();
