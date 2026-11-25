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
  var tileTitle = (element) => element.querySelector(".v-news-related-tile__title")?.textContent.trim() || "";
  function buildFeaturedBlock(element, document) {
    if (!tileTitle(element)) return null;
    const ctaBtn = [...element.querySelectorAll("button")].find((b) => b.textContent.trim());
    const rows = [["Item", "1"]];
    if (ctaBtn) rows.push(["Button", ctaBtn.textContent.trim()]);
    return WebImporter.Blocks.createBlock(document, { name: "Featured Article", cells: rows });
  }
  function parse4(element, { document }) {
    if (!tileTitle(element)) {
      element.remove();
      return false;
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

  // tools/importer/news/news-articles.json
  var news_articles_default = {
    exported: "2026-11-20T07:02:17.315Z",
    source: "https://www.ustacoaching.com/coaching/news-search.json (en)",
    articles: {
      "army-veteran-tennis-coach-paul-walker": {
        articleDate: "2026-10-19",
        featured: true,
        title: "The Journey of Army Veteran, Wheelchair Tennis Player and Coach Paul Walker",
        pageUrl: "/en/home/news/army-veteran-tennis-coach-paul-walker.html",
        image: "/content/dam/coaching/public-pages/news/paul-walker-header.jpg",
        imageAltText: "Wheelchair tennis coach Paul Walker celebrates with Team USA women's wheelchair tennis athletes holding a trophy and medals on a tournament court.",
        tags: []
      },
      "why-hiring-certified-tennis-coaches-is-good-business": {
        articleDate: "2026-10-14",
        featured: true,
        title: "The Business Case for Hiring Certified Coaches",
        pageUrl: "/en/home/news/why-hiring-certified-tennis-coaches-is-good-business.html",
        image: "/content/dam/coaching/public-pages/news/racquet-sports-development.jpg",
        imageAltText: "Simon Gale, Senior Director of Racquet Sports Development at the USTA National Campus, giving a presentation",
        tags: []
      },
      "coachs-journal-emma-dell-part-3-changing-sides-net": {
        articleDate: "2026-08-28",
        featured: true,
        title: "Coach\u2019s Journal by Emma Dell \u2013 Part 3: Changing Sides of the Net",
        pageUrl: "/en/home/news/coachs-journal-emma-dell-part-3-changing-sides-net.html",
        image: "/content/dam/coaching/public-pages/news/usta-tennis-team-community-event.jpg",
        imageAltText: "2026 USTA Coaching Fellowship participants at a bowling alley",
        tags: []
      },
      "how-usta-coaching-benefits-college-tennis-coaches": {
        articleDate: "2026-08-25",
        featured: true,
        title: "Why USTA Coaching Matters for College Coaches",
        pageUrl: "/en/home/news/how-usta-coaching-benefits-college-tennis-coaches.html",
        image: "/content/dam/coaching/public-pages/news/tennis-coach-david-roditi.jpg",
        imageAltText: "",
        tags: []
      },
      "usta-ceo-craig-tileys-vision-for-american-tennis": {
        articleDate: "2026-07-21",
        featured: true,
        title: "Incoming USTA CEO Craig Tiley Shares His Vision for the Future of American Tennis",
        pageUrl: "/en/home/news/usta-ceo-craig-tileys-vision-for-american-tennis.html",
        image: "/content/dam/coaching/public-pages/news/craig-tiley.jpeg",
        imageAltText: "Craig Tiley, New USTA CEO",
        tags: []
      },
      "coachs-journal-emma-dell-part-2-serve-your-passion": {
        articleDate: "2026-07-14",
        featured: true,
        title: "Coach\u2019s Journal by Emma Dell \u2013 Part 2: What Does It Mean to Serve Your Passion?",
        pageUrl: "/en/home/news/coachs-journal-emma-dell-part-2-serve-your-passion.html",
        image: "/content/dam/coaching/public-pages/news/pic-with-fellowship-at-ks.jpg",
        imageAltText: "Emma Dell with group at 2026 USTA Coaching Coach Inclusion Summit",
        tags: []
      },
      "usta-school-tennis-programs-guide-for-coaches": {
        articleDate: "2026-07-14",
        featured: true,
        title: "Partner With Schools and Put More Kids in the Game",
        pageUrl: "/en/home/news/usta-school-tennis-programs-guide-for-coaches.html",
        image: "/content/dam/coaching/public-pages/news/youth-tennis-program-school-gym.jpg",
        imageAltText: "Tony Stingley leads a youth group learning tennis through the USTA Schools Program",
        tags: []
      },
      "coachs-journal-emma-dell-first-impressions": {
        articleDate: "2026-06-11",
        featured: true,
        title: "Coach\u2019s Journal by Emma Dell \u2013 Part 1: First Impressions",
        pageUrl: "/en/home/news/coachs-journal-emma-dell-first-impressions.html",
        image: "/content/dam/coaching/public-pages/news/emma-dell-fellowship-photo.jpg",
        imageAltText: "2026 USTA Coaching Fellowship in Tennis Coaching & Leadership participants",
        tags: []
      },
      "michael-harpers-advice-for-tennis-parents-and-coaches": {
        articleDate: "2026-06-02",
        featured: true,
        title: "Michael Harper\u2019s Message to Coaches and Parents: Play the Long Game",
        pageUrl: "/en/home/news/michael-harpers-advice-for-tennis-parents-and-coaches.html",
        image: "/content/dam/coaching/public-pages/news/michael-harper.jpeg",
        imageAltText: "coach Michael Harper with his daughter at a tennis event",
        tags: []
      },
      "vania-king-inclusion-culture-pathway-pro": {
        articleDate: "2026-05-04",
        featured: true,
        title: "Vania King: Building Bridges Between Culture, Coaching and Championship Tennis",
        pageUrl: "/en/home/news/vania-king-inclusion-culture-pathway-pro.html",
        image: "/content/dam/coaching/public-pages/news/vania-king-teaching.jpg",
        imageAltText: "Vania King, founder of Serving Up Hope, coaches youth in Uganda",
        tags: []
      },
      "dr-larry-lauer-on-mental-health-and-performance-in-tennis": {
        articleDate: "2026-04-28",
        featured: true,
        title: "Coaching the Whole Player: Mental Health and the Modern Tennis Coach",
        pageUrl: "/en/home/news/dr-larry-lauer-on-mental-health-and-performance-in-tennis.html",
        image: "/content/dam/coaching/public-pages/news/larry-lauer.jpg",
        imageAltText: "Dr. Larry Lauer, Director of Mental Performance for USA Tennis",
        tags: []
      },
      "alison-ojeda-winning-women-coaches": {
        articleDate: "2026-11-19",
        featured: false,
        title: "Alison Ojeda on Winning and Women Coaches",
        pageUrl: "/en/home/news/alison-ojeda-winning-women-coaches.html",
        image: "/content/dam/coaching/public-pages/news/alison-ojeda-tennis-coach-with-players.jpg",
        imageAltText: "Tennis coach Alison Ojeda smiles as she talks with two players at an indoor tennis court.",
        tags: []
      },
      "building-culture-before-chasing-results": {
        articleDate: "2026-10-13",
        featured: false,
        title: "Person Before Product \u2013 Josh Goffi on Building a Culture That Lasts",
        pageUrl: "/en/home/news/building-culture-before-chasing-results.html",
        image: "/content/dam/coaching/public-pages/news/josh-goffi.jpg",
        imageAltText: "University of South Carolina head coach Josh Goffi with players",
        tags: []
      },
      "serving-gratitude-celebrating-tennis-coaches": {
        articleDate: "2026-09-28",
        featured: false,
        title: "Serving Gratitude: Celebrating the Coaches Who Shape Our Game",
        pageUrl: "/en/home/news/serving-gratitude-celebrating-tennis-coaches.html",
        image: "/content/dam/coaching/public-pages/news/ustc-coach-appreciation.jpg",
        imageAltText: "",
        tags: []
      },
      "coaches-open-2026": {
        articleDate: "2026-09-09",
        featured: false,
        title: "Inaugural Coaches Open Brings Energy, Connection and Inspiration to New York",
        pageUrl: "/en/home/news/coaches-open-2026.html",
        image: "/content/dam/coaching/public-pages/news/coaches-open-2026.jpg",
        imageAltText: "2026 Coaches Open attendees at Louis Armstrong Stadium in New York",
        tags: []
      },
      "usta-coaching-butch-staples-award-2026-coaches-open": {
        articleDate: "2026-08-31",
        featured: false,
        title: "A Coach of Coaches \u2013 Celebrating Butch Staples",
        pageUrl: "/en/home/news/usta-coaching-butch-staples-award-2026-coaches-open.html",
        image: "/content/dam/coaching/public-pages/news/usta-coaching-butch-staples-award-2026-coaches-open.jpg",
        imageAltText: "USTA Coaching CEO Craig Morris on stage with Butch Staples after presenting award at Coaches Open",
        tags: []
      },
      "from-qualifier-to-champion-tina-lee-jordan-wimbledon-triumph": {
        articleDate: "2026-08-18",
        featured: false,
        title: "From Qualifier to Champion \u2013 Tina Lee on the Grit Behind Jordan\u2019s Wimbledon Triumph",
        pageUrl: "/en/home/news/from-qualifier-to-champion-tina-lee-jordan-wimbledon-triumph.html",
        image: "/content/dam/coaching/public-pages/news/tina-lee-with-her-son-jordan-lee.jpg",
        imageAltText: "Tina Lee with her son Jordan Lee after his Boys\u2019 Wimbledon win",
        tags: []
      },
      "how-usta-coaching-helps-parks-recreation-coaches": {
        articleDate: "2026-08-18",
        featured: false,
        title: "How USTA Coaching Helps Park & Recreation Coaches",
        pageUrl: "/en/home/news/how-usta-coaching-helps-parks-recreation-coaches.html",
        image: "/content/dam/coaching/public-pages/news/jodie-adams.jpg",
        imageAltText: "Tennis veteran, Parks & Rec administrator and Racquet Sports Industry Magazine\u2019s 2025 Person of the Year, Jodie Adams",
        tags: []
      },
      "junior-usa-tennis-shows-true-sportsmanship-at-world-team-cup": {
        articleDate: "2026-08-17",
        featured: false,
        title: "More Than a Medal \u2013 Junior USA Team Honors Their Opponents",
        pageUrl: "/en/home/news/junior-usa-tennis-shows-true-sportsmanship-at-world-team-cup.html",
        image: "/content/dam/coaching/public-pages/news/usa-junior-tennis-team.jpeg",
        imageAltText: "Screenshot",
        tags: []
      },
      "how-blind-tennis-builds-confidence-independence": {
        articleDate: "2026-07-30",
        featured: false,
        title: "Beyond Sight \u2013 How Blind Tennis Builds Confidence and Independence",
        pageUrl: "/en/home/news/how-blind-tennis-builds-confidence-independence.html",
        image: "/content/dam/coaching/public-pages/news/domiana-practicing-in-a-blind-and-low-vision-tennis-class.jpg",
        imageAltText: "Dana Squelch-Costa\u2019s daughter Domiana practicing in a blind and low vision tennis class",
        tags: []
      },
      "gordon-reid-making-tennis-welcoming": {
        articleDate: "2026-07-29",
        featured: false,
        title: "From Tour Player to Mentor: Gordon Reid on Building a Court for Everyone",
        pageUrl: "/en/home/news/gordon-reid-making-tennis-welcoming.html",
        image: "/content/dam/coaching/public-pages/news/gordon-reid.jpeg",
        imageAltText: "Gordon Reid, Life Time National Tennis Manager",
        tags: []
      },
      "advantage-coaches-celebrating-one-year-of-usta-coaching": {
        articleDate: "2026-07-16",
        featured: false,
        title: "Advantage, Coaches \u2013 Celebrating USTA Coaching\u2019s Breakthrough First Year",
        pageUrl: "/en/home/news/advantage-coaches-celebrating-one-year-of-usta-coaching.html",
        image: "/content/dam/coaching/public-pages/news/coaching-workshop-usta.jpg",
        imageAltText: "USTA Coaching workshop",
        tags: []
      },
      "jim-loehr-lasting-lessons-for-tennis-coaches": {
        articleDate: "2026-07-13",
        featured: false,
        title: "Jim Loehr\u2019s Lasting Lessons for Tennis Coaches",
        pageUrl: "/en/home/news/jim-loehr-lasting-lessons-for-tennis-coaches.html",
        image: "/content/dam/coaching/public-pages/news/co-founders-of-the-human-performance-institutes.jpg",
        imageAltText: "Dr. Jim Loehr and Dr. Jack Groppel, co-founders of the Human Performance Institute",
        tags: []
      },
      "paul-annacone-2026-us-open-american-stars-to-watch": {
        articleDate: "2026-07-13",
        featured: false,
        title: "Paul Annacone\u2019s 2026 US Open Preview: American Stars to Watch",
        pageUrl: "/en/home/news/paul-annacone-2026-us-open-american-stars-to-watch.html",
        image: "/content/dam/coaching/public-pages/news/usta-arthur-ashe-stadium.jpg",
        imageAltText: "Fans cheer at the US Open in Arthur Ashe Stadium",
        tags: []
      },
      "make-tennis-more-welcoming-for-everybody": {
        articleDate: "2026-07-08",
        featured: false,
        title: "How Coaches Can Make Tennis More Welcoming for Everybody",
        pageUrl: "/en/home/news/make-tennis-more-welcoming-for-everybody.html",
        image: "/content/dam/coaching/public-pages/news/laura-puryear-teaching.jpg",
        imageAltText: "Laura Puryear, Senior Manager of Coach Development and Training for USTA Missouri Valley",
        tags: []
      },
      "women-coaches-french-open-immersion-experience": {
        articleDate: "2026-06-22",
        featured: false,
        title: "Women Coaches Build Confidence and Connection at French Open Immersion Experience",
        pageUrl: "/en/home/news/women-coaches-french-open-immersion-experience.html",
        image: "/content/dam/coaching/public-pages/news/roland-garros-award-recipients-group-photo.jpg",
        imageAltText: "",
        tags: []
      },
      "coach-guide-to-tennis-hydration": {
        articleDate: "2026-06-18",
        featured: false,
        title: "10 Hydration Tips Every Tennis Coach Should Know",
        pageUrl: "/en/home/news/coach-guide-to-tennis-hydration.html",
        image: "/content/dam/coaching/public-pages/news/female-tennis-player-drinking-water-on-court.jpg",
        imageAltText: "Tennis player drinks from water bottle",
        tags: []
      },
      "thomas-judd-coaching-across-continents-ncaa-recruiting-and-business-of-tennis": {
        articleDate: "2026-06-02",
        featured: false,
        title: "The Transatlantic Coach: Thomas Judd\u2019s Modern Vision for Player Development",
        pageUrl: "/en/home/news/thomas-judd-coaching-across-continents-ncaa-recruiting-and-business-of-tennis.html",
        image: "/content/dam/coaching/public-pages/news/thomas-judd.jpg",
        imageAltText: "Thomas Judd, Tennis Director at Sportsplex New Windsor in New York",
        tags: []
      },
      "sportimes-playbook-for-the-modern-tennis-coach": {
        articleDate: "2026-05-19",
        featured: false,
        title: "Sportime\u2019s Playbook for the Modern Coach",
        pageUrl: "/en/home/news/sportimes-playbook-for-the-modern-tennis-coach.html",
        image: "/content/dam/coaching/public-pages/news/sportime-roslyn.jpg",
        imageAltText: "Sportime coach feeds tennis balls",
        tags: []
      },
      "southlake-tennis-center-coaching-excellence-world-class-facilities": {
        articleDate: "2026-05-18",
        featured: false,
        title: "Southlake Tennis Center: A Public Facility Built for Coaching Growth",
        pageUrl: "/en/home/news/southlake-tennis-center-coaching-excellence-world-class-facilities.html",
        image: "/content/dam/coaching/public-pages/news/southlake-tennis-center-players.jpg",
        imageAltText: "Group of Southlake Tennis Center players",
        tags: []
      },
      "usta-coaching-collaborates-with-ptm-programs-to-develop-next-generation-tennis-coaches": {
        articleDate: "2026-05-06",
        featured: false,
        title: "The PTM Advantage: Preparing the Next Generation to Grow the Game They Love",
        pageUrl: "/en/home/news/usta-coaching-collaborates-with-ptm-programs-to-develop-next-generation-tennis-coaches.html",
        image: "/content/dam/coaching/public-pages/news/ptm-graphic.png",
        imageAltText: "USTA Coaching graphic showing partnerships with Ferris State University Professional Tennis Management, Hope College Racquet Sports Management, and Methodist University Professional Tennis Management programs",
        tags: []
      },
      "practical-strategies-and-tips-for-tennis-coaches": {
        articleDate: "2026-04-28",
        featured: false,
        title: "Coaching the Mind: Practical Mental Health Strategies for Tennis Coaches",
        pageUrl: "/en/home/news/practical-strategies-and-tips-for-tennis-coaches.html",
        image: "/content/dam/coaching/public-pages/news/michele-cleere.jpg",
        imageAltText: "Dr. Michelle Cleere, performance psychologist, coaches a group of tennis players",
        tags: []
      },
      "how-one-coach-helped-change-community-through-usta-coaching-education": {
        articleDate: "2026-04-20",
        featured: false,
        title: "From Players to Coaches: A Scalable Model for High School Tennis Programs",
        pageUrl: "/en/home/news/how-one-coach-helped-change-community-through-usta-coaching-education.html",
        image: "/content/dam/coaching/public-pages/news/kerriann-jannotte-hinkley.jpg",
        imageAltText: "KerriAnn Jannotte-Hinkley with a group at the US Open",
        tags: []
      },
      "cardio-tennis-makes-business-sense-for-tennis-coaches": {
        articleDate: "2026-04-14",
        featured: false,
        title: "Why Cardio Tennis Makes Business Sense for Tennis Coaches",
        pageUrl: "/en/home/news/cardio-tennis-makes-business-sense-for-tennis-coaches.html",
        image: "/content/dam/coaching/public-pages/news/cardio-tennis.jpg",
        imageAltText: "Cardio Tennis participants on the court before the match between Ajla Tomljanovic and Coco Gauff during a women's singles match at the 2025 US Open on Tuesday, Aug. 26, 2025 in Flushing, NY. (Simon Bruty/USTA)",
        tags: []
      },
      "usta-coaching-wecoach": {
        articleDate: "2026-04-02",
        featured: false,
        title: "Explore a Future in Tennis Coaching with USTA Coaching Serving All: Aspiring Coaches powered by WeCOACH",
        pageUrl: "/en/home/news/usta-coaching-wecoach.html",
        image: "/content/dam/coaching/public-pages/news/aspiring-women-coaches.jpg",
        imageAltText: "USTA Coaching Serving All: Aspiring Coaches powered by WeCOACH Program - Player getting ready to hit a tennis ball",
        tags: []
      },
      "janet-pinkett-building-opportunity-and-joy-in-youth-tennis-thro": {
        articleDate: "2026-04-01",
        featured: false,
        title: "Janet Pinkett\u2019s Playbook: Fun First, Access Always and a Pathway for Every Kid",
        pageUrl: "/en/home/news/janet-pinkett--building-opportunity-and-joy-in-youth-tennis-thro.html",
        image: "/content/dam/coaching/public-pages/news/janet-pinket-on-court.jpg",
        imageAltText: "Janet Pinkett of USTA Mid-Atlantic on court with group of tennis players",
        tags: []
      },
      "emilio-sanchez-academy-building-coaches-and-players-through-spanish-system": {
        articleDate: "2026-03-31",
        featured: false,
        title: "Inside Emilio S\xE1nchez Academy: A Proven System for Developing Players and Coaches",
        pageUrl: "/en/home/news/emilio-sanchez-academy-building-coaches-and-players-through-spanish-system.html",
        image: "/content/dam/coaching/public-pages/news/emilio-sanchez.jpg",
        imageAltText: "Emilio S\xE1nchez smiling in front of a Spanish flag at his tennis academy",
        tags: []
      },
      "new-usta-coaching-upgrades": {
        articleDate: "2026-03-24",
        featured: false,
        title: "Level Up with New USTA Coaching Upgrades",
        pageUrl: "/en/home/news/new-usta-coaching-upgrades.html",
        image: "/content/dam/coaching/decorative/get-early-access.jpg",
        imageAltText: "",
        tags: []
      },
      "sportsmen-tennis-enrichment-center-njtl-leader-boston": {
        articleDate: "2026-03-17",
        featured: false,
        title: "Building Community Through Tennis and Education",
        pageUrl: "/en/home/news/sportsmen-tennis-enrichment-center-njtl-leader-boston.html",
        image: "/content/dam/coaching/public-pages/news/marton-balla.jpg",
        imageAltText: "Marton Balla, Director of Tennis at Sportsmen\u2019s Tennis & Enrichment Center, in snowy neighborhood",
        tags: []
      },
      "love-serving-autism-coaches-lead-with-acceptance-on-tennis-court": {
        articleDate: "2026-03-17",
        featured: false,
        title: "More Than Awareness \u2013 Coaching with Acceptance",
        pageUrl: "/en/home/news/love-serving-autism-coaches-lead-with-acceptance-on-tennis-court.html",
        image: "/content/dam/coaching/public-pages/news/lisa-love-serving-autism.jpg",
        imageAltText: "Love Serving Autism founder Lisa Pugliese-LaCroix on the tennis court",
        tags: []
      },
      "coaching-promising-junior-tennis-players-troy-hahn": {
        articleDate: "2026-03-16",
        featured: false,
        title: "Trust the Process: Troy Hahn\u2019s Advice for Parents of Promising Junior Players",
        pageUrl: "/en/home/news/coaching-promising-junior-tennis-players-troy-hahn.html",
        image: "/content/dam/coaching/public-pages/news/troy-hahn.jpg",
        imageAltText: "Troy Hahn, USTA Lead National Coach, Men\u2019s Tennis Programs, on court",
        tags: []
      },
      "10-tennis-coaching-tips-for-coaches-and-parents": {
        articleDate: "2026-03-11",
        featured: false,
        title: "10 Coach-Approved Tips to Help High School Players Thrive",
        pageUrl: "/en/home/news/10-tennis-coaching-tips-for-coaches-and-parents.html",
        image: "/content/dam/coaching/public-pages/news/coach-mike-moriarty-with-players.jpg",
        imageAltText: "Tennis Coach Mike Moriarty, Director of Racquet Sports at Dalton Ranch Golf Club in Durango, Colorado, on court, with players",
        tags: []
      },
      "women-coaches-on-the-mentors-who-shaped-them": {
        articleDate: "2026-02-18",
        featured: false,
        title: "11 Women Coaches on the Mentors Who Inspired Them",
        pageUrl: "/en/home/news/women-coaches-on-the-mentors-who-shaped-them.html",
        image: "/content/dam/coaching/public-pages/news/alex-pointing.jpeg",
        imageAltText: "Alexandra de Guzman, Founder and Head Coach, APEX Performance Center",
        tags: []
      },
      "how-dana-matthewson-relearned-the-game-as-a-coach": {
        articleDate: "2026-02-12",
        featured: false,
        title: "From Tour to Teaching: How Dana Mathewson Relearned the Game as a Coach",
        pageUrl: "/en/home/news/how-dana-matthewson-relearned-the-game-as-a-coach.html",
        image: "/content/dam/coaching/public-pages/news/relearned-the-game-as-a-coach.jpg",
        imageAltText: "Wheelchair tennis coach Dana Mathewson coaching on court",
        tags: []
      },
      "usta-dinkins-hbcu-coaching-grant-helped-2-student-athletes-become-coaches": {
        articleDate: "2026-02-09",
        featured: false,
        title: "The USTA Dinkins Grant\u2019s Impact",
        pageUrl: "/en/home/news/usta-dinkins-hbcu-coaching-grant-helped-2-student-athletes-become-coaches.html",
        image: "/content/dam/coaching/public-pages/news/hbcu-student-athlete.jpg",
        imageAltText: "A female HBCU student athlete smiling holding a tennis racquet on the court",
        tags: []
      },
      "black-girls-tennis-club-redefining-who-belongs-on-court": {
        articleDate: "2026-02-04",
        featured: false,
        title: "Black Girls Tennis Club Is Redefining Who Belongs on the Court",
        pageUrl: "/en/home/news/black-girls-tennis-club-redefining-who-belongs-on-court.html",
        image: "/content/dam/coaching/public-pages/news/bgtc-aug-niantic-park-clinic.jpg",
        imageAltText: 'The Black Girls Tennis Club smiling and posing in front of a sign saying "Black Girls Tennis Club" on a tennis court.',
        tags: []
      },
      "ghanaian-coachs-journey-through-coach-inclusion-summit": {
        articleDate: "2026-02-03",
        featured: false,
        title: "From Ball Boy to Coach: Emmanuel Kwesi Frimpong\u2019s Tennis Origin Story",
        pageUrl: "/en/home/news/ghanaian-coachs-journey-through-coach-inclusion-summit.html",
        image: "/content/dam/coaching/public-pages/news/ghana-coach-story.jpg",
        imageAltText: "Emmanuel Kwesi Frimpong smiles while holding a tennis racquet on a tennis court.",
        tags: []
      },
      "usta-coaching-launches-inaugural-women-coaching-cohort": {
        articleDate: "2026-02-02",
        featured: false,
        title: "New USTA Coaching Women in Coaching Cohort Aims to Strengthen Pathways and Leadership",
        pageUrl: "/en/home/news/usta-coaching-launches-inaugural-women-coaching-cohort.html",
        image: "/content/dam/coaching/public-pages/news/inaugural-women-in-coaching-cohort.jpg",
        imageAltText: "USTA Coaching\u2019s new national program brings together 25 women coaches to overcome career barriers, build community and strengthen leadership pathways in tennis.",
        tags: []
      },
      "john-wilkersons-50-year-coaching-legacy": {
        articleDate: "2026-02-02",
        featured: false,
        title: "The Enduring Impact of John Wilkerson\u2019s 50-Year Coaching Career",
        pageUrl: "/en/home/news/john-wilkersons-50-year-coaching-legacy.html",
        image: "/content/dam/coaching/public-pages/news/john-wilkerson.jpg",
        imageAltText: "A community tennis coach talks with two young Black women players at MacGregor Park, holding a tennis racket and ball during a coaching moment in Houston.",
        tags: []
      },
      "growth-and-success-of-wta-female-coaching-initiatives": {
        articleDate: "2026-01-29",
        featured: false,
        title: "Building Pathways, Changing the Game: The WTA Coach Inclusion Program",
        pageUrl: "/en/home/news/growth-and-success-of-wta-female-coaching-initiatives.html",
        image: "/content/dam/coaching/public-pages/news/wta-female-coaching-initiatives.jpg",
        imageAltText: "Group standing on a blue tennis court in front of large lettering reading \u2018I \u2665 Tennis,\u2019 with the heart shown as a tennis ball, highlighting pathways and opportunities for women coaches in tennis.",
        tags: []
      },
      "inspiring-story-of-brittany-odom-dennis-quaye": {
        articleDate: "2026-01-29",
        featured: false,
        title: "Serving Love: How Brittany Odom and Dennis Quaye Lead With Heart",
        pageUrl: "/en/home/news/inspiring-story-of-brittany-odom-dennis-quaye.html",
        image: "/content/dam/coaching/public-pages/news/brittany-odom-dennis-quaye.jpg",
        imageAltText: "Brittany Odom & Dennis Quaye embracing each other as they lead with heart on and off the court.",
        tags: []
      },
      "inside-the-coach-inclusion-summit-powered-by-usta-coaching": {
        articleDate: "2026-01-28",
        featured: false,
        title: "A New Name, A Shared Mission \u2013 Coach Inclusion Summit",
        pageUrl: "/en/home/news/inside-the-coach-inclusion-summit-powered-by-usta-coaching.html",
        image: "/content/dam/coaching/public-pages/news/coach-summit-group-picture.jpg",
        imageAltText: "From Los Angeles to Orlando, the 2025 Coach Inclusion Summit provided coaches with advanced drills, business acumen and a powerful network to help tennis thrive.",
        tags: []
      },
      "how-coach-developer-lois-arterberry-is-shaping-the-future-of-coaching": {
        articleDate: "2026-01-06",
        featured: false,
        title: "From Grenada to the Big Ten: How Coach Developer Lois Arterberry Is Shaping the Future of Coaching",
        pageUrl: "/en/home/news/how-coach-developer-lois-arterberry-is-shaping-the-future-of-coaching.html",
        image: "/content/dam/coaching/public-pages/news/tennis-coach-lois-arterberry.jpg",
        imageAltText: "Tennis coach Lois Arterberry, participant in USTA Coaching\u2019s Coach Developer Pathway",
        tags: []
      },
      "coaches-reveal-their-game-changing-goals-for-2026": {
        articleDate: "2026-01-06",
        featured: false,
        title: "Net Gains \u2013 Coaches Reveal Their Game-Changing Goals for 2026",
        pageUrl: "/en/home/news/coaches-reveal-their-game-changing-goals-for-2026.html",
        image: "/content/dam/coaching/public-pages/news/larry-dillon.jpg",
        imageAltText: "Tennis coach Larry Dillon shares his 2026 coaching goals with USTA Coaching",
        tags: []
      },
      "women-in-coaching-advancing-female-tennis-coach-development": {
        articleDate: "2026-01-06",
        featured: false,
        title: "Building a Bench of Women Coaches: Inside USTA Coaching\u2019s New Women in Coaching Cohort",
        pageUrl: "/en/home/news/women-in-coaching-advancing-female-tennis-coach-development.html",
        image: "/content/dam/coaching/public-pages/news/nancy-abrams.jpg",
        imageAltText: "Women in coaching advocate Nancy Abrams at the US Open tennis tournament",
        tags: []
      },
      "usta-coaching-gives-tennis-coaches-tips-how-to-create-2026-vision-board": {
        articleDate: "2026-01-06",
        featured: false,
        title: "The Power of Vision Boarding for Coaches",
        pageUrl: "/en/home/news/usta-coaching-gives-tennis-coaches-tips-how-to-create-2026-vision-board.html",
        image: "/content/dam/coaching/public-pages/news/natalia-pedroza.jpg",
        imageAltText: "Natalia Pedroza, USTA Senior Director, Leadership & Development headshot",
        tags: []
      },
      "zina-garrison-star-player-to-community-builder": {
        articleDate: "2025-12-17",
        featured: false,
        title: "From Center Court to Service: The Zina Garrison Legacy",
        pageUrl: "/en/home/news/zina-garrison-star-player-to-community-builder.html",
        image: "/content/dam/coaching/public-pages/news/usta-fed-cup-team-2007.jpg",
        imageAltText: "Zina Garrison (center), with (L to R) Venus Williams, Lisa Raymond, Vania King, and Serena Williams in front of the American flag at the 2007 Fed Cup, where the team reached the semifinals.",
        tags: [
          "tennis coaching"
        ]
      },
      "jack-and-jill-usta-coaching-tennis-for-black-families": {
        articleDate: "2025-12-03",
        featured: false,
        title: "Jack and Jill of America Introduces a New Generation to Tennis with USTA Coaching",
        pageUrl: "/en/home/news/jack-and-jill-usta-coaching-tennis-for-black-families.html",
        image: "/content/dam/coaching/public-pages/news/members-of-jack-and-jill-america.jpg",
        imageAltText: "Nine moms and members of Jack and Jill of America visited USTA Coaching on October 18, 2025, to learn easy drills and skills to introduce their children to tennis.",
        tags: []
      },
      "usta-coaching-online-learning-hub-is-live": {
        articleDate: "2025-12-03",
        featured: false,
        title: "Now Streaming Knowledge \u2013 The USTA Coaching Learning Hub Is Live!",
        pageUrl: "/en/home/news/usta-coaching-online-learning-hub-is-live.html",
        image: "/content/dam/coaching/public-pages/news/online-learning-hub-website-graphic.jpg",
        imageAltText: "Graphic showing the USTA Coaching Learning Hub with icons representing course categories such as Intro to Coaching, Athlete-Centered Coaching, Safety Coach, Cardio Tennis, and other coaching development topics.",
        tags: []
      },
      "usta-coaching-testimonials-7-coaches-share-their-experience": {
        articleDate: "2025-12-03",
        featured: false,
        title: "See What 7 Top Tennis Coaches Really Think About USTA Coaching \u2013 Plus Their Best Coaching Tips",
        pageUrl: "/en/home/news/usta-coaching-testimonials-7-coaches-share-their-experience.html",
        image: "/content/dam/coaching/public-pages/news/celia-quintero.jpg",
        imageAltText: "USTA Coaching Serve & Lead Coach Celia Quintero with large racquet",
        tags: []
      }
    }
  };

  // tools/importer/news/news-data.js
  var NEWS_ARTICLES = news_articles_default.articles;
  function articleSlug(url) {
    const { pathname } = new URL(url, "https://www.ustacoaching.com");
    return pathname.split("/").pop().replace(/\.html$/, "").replace(/-{2,}/g, "-");
  }
  var articleOf = (url) => NEWS_ARTICLES[articleSlug(url)] || null;
  var FEATURED = Object.entries(NEWS_ARTICLES).filter(([, a]) => a.featured).sort(([, a], [, b]) => b.articleDate.localeCompare(a.articleDate)).map(([slug, a]) => ({ slug, ...a }));

  // tools/importer/parsers/feature-options.js
  function cropOptions(imgComp) {
    if (!imgComp) return [];
    const cls = imgComp.className || "";
    const opts = [];
    const crop = (cls.match(/image--aspect-ration--((?:landscape|portrait)(?:-\d)?)(?=\s|$)/) || [])[1];
    if (crop) opts.push(crop);
    const pos = (cls.match(/image--position--(center|bottom)(?=\s|$)/) || [])[1];
    if (crop && pos) opts.push(`image-${pos}`);
    return opts;
  }
  function featureOptions(imgComp) {
    if (!imgComp) return [];
    const span = ((imgComp.className || "").match(/aem-GridColumn--default--(\d+)/) || [])[1];
    return [...span && span !== "6" && span !== "12" ? [`media-${span}`] : [], ...cropOptions(imgComp)];
  }

  // tools/importer/parsers/news-columns-feature.js
  var CARD = ".container.container--padding--medium";
  var GRAY = "container--border--gray";
  var isPanel = (k) => k.classList.contains("container") && k.classList.contains(GRAY);
  var isFeatureCard = (c) => {
    const grid = c.querySelector(":scope > .cmp-container > .aem-Grid");
    if (!grid) return false;
    const kids = [...grid.children];
    return kids.some((k) => k.classList.contains("image") && k.querySelector("img")) && kids.some(isPanel);
  };
  function markFeatureCards(frame) {
    frame.querySelectorAll(CARD).forEach((c) => {
      if (isFeatureCard(c)) c.setAttribute("data-feature-card", "");
    });
  }
  var toImg = (document, src) => {
    const img = document.createElement("img");
    img.src = src.currentSrc || src.getAttribute("src") || "";
    img.alt = src.getAttribute("alt") || "";
    if (src.getAttribute("title")) img.title = src.getAttribute("title");
    return img;
  };
  function parseFeatureCards(frame, { document }) {
    frame.querySelectorAll("[data-feature-card]").forEach((card) => {
      const grid = card.querySelector(":scope > .cmp-container > .aem-Grid");
      const imgComp = grid.querySelector(":scope > .image");
      const panel = [...grid.children].find(isPanel);
      const imgDefault = imgComp && (imgComp.querySelector(".cmp-image__image--default") || imgComp.querySelector("img"));
      if (!imgDefault || !panel) return;
      const images = [toImg(document, imgDefault)];
      const copy = [];
      panel.querySelectorAll(".cmp-text").forEach((t) => {
        [...t.children].forEach((e) => {
          if (e.classList.contains("cmp-text__icon")) return;
          if (/^(H[1-6]|P|UL|OL|BLOCKQUOTE)$/.test(e.tagName)) copy.push(e);
        });
      });
      const blank = (e) => e.tagName === "P" && !e.querySelector("img, picture") && !e.textContent.replace(/[\s\u00a0\uE000]/g, "");
      while (copy.length && blank(copy[copy.length - 1])) copy.pop();
      while (copy.length && blank(copy[0])) copy.shift();
      if (!copy.length) return;
      const block = WebImporter.Blocks.createBlock(document, {
        name: `Columns (${["feature", ...featureOptions(imgComp)].join(", ")})`,
        cells: [[images, copy]]
      });
      card.replaceWith(block);
    });
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
  var CONTAINER_MARGINS = { 32: [24, 32, 32], 52: [12, 20, 52] };
  var CONTAINER_PADDINGS = { "12px-4px": [0, 4, 12] };
  function containerMarginSpacers(frame, document) {
    frame.querySelectorAll('.container[class*="-margin--"], .container[class*="container--padding--"]').forEach((c) => {
      if (c.querySelector(".tags, .socialmediasharing")) return;
      if (c.closest("[data-feature-card]")) return;
      if (c.parentElement && c.parentElement.closest(".container--display--flex-reset-grid")) return;
      const cols = c.querySelectorAll(".aem-GridColumn");
      if (c.querySelector(".text--font-family--graphic-semibold") && cols.length <= 2 && !c.querySelector(".container")) return;
      const pad = [...c.classList].map((k) => k.match(/^container--padding--(.+)$/)).find(Boolean);
      const p = pad && CONTAINER_PADDINGS[pad[1]] || [0, 0, 0];
      [["top", "before"], ["bottom", "after"]].forEach(([side, where]) => {
        const m = [...c.classList].map((k) => k.match(new RegExp(`^container--${side}-margin--(\\d+)$`))).find(Boolean);
        const mg = m && CONTAINER_MARGINS[m[1]] || null;
        if (!mg && !pad) return;
        const h = [0, 1, 2].map((i) => (mg ? mg[i] : 0) + p[i]);
        if (!h.some(Boolean)) return;
        c[where](WebImporter.Blocks.createBlock(document, {
          name: "Spacer",
          cells: [["desktop", `${h[2]}px`], ["tablet", `${h[1]}px`], ["mobile", `${h[0]}px`]]
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
  function metadata(document, frame, url) {
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
    const article = articleOf(url);
    if (article) {
      cells["Article Date"] = article.articleDate;
      if (article.featured) cells.Featured = "true";
    }
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
      const touching = [];
      for (let n = p.nextElementSibling; n && n.tagName === "P" && !isBlankEl(n) && !styleKey(n); n = n.nextElementSibling) touching.push(n);
      p.replaceWith(WebImporter.Blocks.createBlock(document, { name: "Text Style (large)", cells: [[[q, ...touching]]] }));
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
    const textCmp = cmpEl.closest(".text");
    const nextCmp = textCmp?.nextElementSibling;
    const inRowColumn = !textCmp?.parentElement?.closest(".aem-Grid")?.classList.contains("aem-Grid--12");
    if (isListEl(last) && content[content.length - 1] === kids.length - 1 && !(inRowColumn && nextCmp?.classList.contains("separator"))) last.after(blankLine());
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
        const lines = p.querySelectorAll("br").length;
        if (/[\u00a0\uE000]/.test(p.textContent) || lines) {
          p.textContent = NBSP_MARK2;
          for (let i = 1; i < lines; i += 1) {
            const extra = document.createElement("p");
            extra.textContent = NBSP_MARK2;
            p.after(extra);
          }
        } else p.remove();
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
        const block = tile && buildFeaturedBlock(tile, document);
        if (block) out2.append(block);
        WebImporter.rules.adjustImageUrls(out2, url, params.originalURL);
        return [{ element: out2, path: FEATURED_FRAGMENT_PATH, report: { template: `${TEMPLATE}:fragment` } }];
      }
      const frame = main.querySelector(".container.container--border--white > .cmp-container") || main.querySelector(".container--border--white");
      if (!frame) throw new Error("news-article frame (.container--border--white) not found");
      markFeatureCards(frame);
      containerMarginSpacers(frame, document);
      convertHeadings(frame, document);
      convertNativeHeadings(frame, document);
      markLimeLinks(frame, document);
      textStyleBlocks(frame, document);
      frame.querySelectorAll(".text:not(.text--font-family--graphic-semibold) > .cmp-text").forEach((cmp) => normalizeTextComponent(cmp, document));
      parseFeatureCards(frame, { document });
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
      out.append(metadata(document, frame, url));
      out.querySelectorAll('a[href^="/content/dam/"]').forEach((a) => {
        a.setAttribute("href", new URL(a.getAttribute("href"), new URL(url).origin).href);
      });
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
