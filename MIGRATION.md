# USTA Coaching → Edge Delivery Services — Migration Log

> **Purpose:** a running, date-ordered record of what we're migrating, where we are, what's done, and
> what's open. **Read this first.** **Keep it updated as you go** (newest dated entry at the bottom).
> Append an entry whenever you build/change a block, template, or section, or solve something non-obvious.

---

## 1. What we're doing

Migrating **https://www.ustacoaching.com/** to **Adobe Edge Delivery Services** with **visual +
functional parity across mobile, tablet, and desktop**. Source is an **AEM-classic** site
(`/etc.clientlibs/coaching/…`) with a large **Vue** app clientlib and a **modern flexbox** layout.

- **Repo / environments:** `main--coaching-usta--aemdemos`
  - Preview: `https://main--coaching-usta--aemdemos.aem.page/`
  - Live: `https://main--coaching-usta--aemdemos.aem.live/`
  - Local dev: `http://localhost:3000`
- **Setup note:** ensure the AEM Code Sync GitHub app is installed on `aemdemos/coaching-usta`.

## 2. Design system (discovered up front)

- **Breakpoints:** `768 / 1024 / 1280` — `tools/quality/breakpoints.json`. (992 minor tier excluded;
  640/1536 unused.) Mobile-first, min-width only. → `responsive-breakpoints`
- **Layout / units:** **modern flexbox** (flex ×324, float ×0), **pixel-first** (~7.4k px vs ~7 rem;
  16px root; notable `em`). box-sizing: border-box. Container widths are **utility-driven** (`max-w-*`)
  — measure per-section content-wrapper widths from the live DOM. Author block CSS in **px**. → `grid-system`
- **Brand / colours:** dark by default (bg `#000`, text `#fff`), lime accent `#cfff05`, blue events
  banner `#0373f3` (in `styles/styles.css :root`).
- **Fonts:** **Graphik** Regular 400 / Semibold 600 / XXCond Bold 700 (`.woff2`) self-hosted + wired
  (`fonts.css`, tokens `--body-font-family` → Graphik Regular, `--heading-font-family` → Graphik XXCond
  Bold → USTA Sans). **USTA Sans** (condensed display, `.otf`) is now self-hosted too (was referenced but
  its file/@font-face were missing — re-added). ⚠️ Graphik proprietary — confirm licensing.
- **Type scale (applied + recorded):** `tools/quality/typography.json` — h1/h2 (condensed display) and
  h3/body per breakpoint, stepping 768/1024/1280 (h1 32→40→56→80, h2 28→40→56→64, h3 28→28→28→32, body
  16 flat). Enforce with `npm run check:typography`. → `typography-system`

## 3. Templates / 4. Sections / 5. Blocks

Already migrated (committed before the guardrail was (re)applied): blocks — accordion-path, cards,
cards-media, cards-pricing, columns, columns-cta, columns-media, columns-quote, footer, form, fragment,
header, hero, hero-video, widget. _Document each block's authoring contract + variants here as you touch them._

## 6. Open items / TODO
- [ ] Confirm Graphik (and USTA Sans) licensing before publishing.
- [~] Quality gate run on the migrated homepage (2026-09-14): **a11y ✓ passes**; **typography ✗ 8 drifts**
      (cards-pricing h3), **overflow ✗ 2 tiers** (columns-cta @360, footer @768). See the log entry below
      for the exact root causes. Two real block bugs remain to fix:
  - [ ] **cards-pricing tier heading too big.** `blocks/cards-pricing/cards-pricing.css:31` sets the tier
        h3 to `font-size: 40px`, but the source type scale (`typography.json`) has h3 at 28px (32px @1280).
        Fix so h3 matches the scale across all viewports (or confirm 40px is source-correct and update
        `typography.json` — verify against the live source first).
  - [ ] **Horizontal overflow — `columns-cta` @360.** The h2 (`.columns-cta h2` = 40px, `line-height:1`)
        has a long unbroken word wider than its 240px column → page scrolls to 407px. Fix per
        `skills/grid-system` (word-break / overflow-wrap), not bespoke widths. **Still open.**
  - [x] **Horizontal overflow — `footer` — FIXED 2026-09-14 (source-faithful).** Root cause: the migrated
        footer forced the desktop single-row layout starting at **768** (a deliberate deviation the old
        comment noted), but the fixed link+social content (~796px) doesn't fit the 81.6%/1170px inner
        container until ~1024+, so 768–1023 overflowed. **First fix attempt (`flex-flow: row wrap`) was
        wrong** — it broke desktop parity by reflowing whole link items into a flat list and dropping the
        social icons onto a line below (user caught this vs the source screenshot). **Correct fix:** match
        the source exactly — verified live that the SOURCE stacks the footer into a column at ≤~1023
        (`.footer-links` = `flex-direction: column`) and only becomes a single `nowrap` row at desktop
        (≥1024, `justify-content: space-between`, links left / social right, each link's *text* wrapping to
        2 lines via `li { flex: 0 1 auto; white-space: normal }`). So: base mobile column stays through the
        768 tablet tier; single row switches on at **1024**. Verified: desktop @1440 matches source
        geometry (social pinned x=1108→1265, links left from x=175, no overflow); tablet @1023 stacks with
        no overflow; overflow sweep `768:OK` + `1024:OK`; lint + breakpoint check pass.
- [ ] Re-verify the type scale against the live source (`npm run discover:typography … --write`).
- [ ] Measure per-section content-wrapper widths and wire a shared grid/container if needed.
- [x] **Fixed the 13 breakpoint violations** — migrated CSS now uses only `768 / 1024 / 1280`,
      mobile-first min-width only. `node tools/quality/breakpoint-check.mjs` passes clean (exit 0).
      See 2026-09-14 log entry for the tier mapping used.
- [x] **Typography — h1/h2 font family.** `styles/styles.css` `--heading-font-family` now leads with
      **USTA Sans** (`"USTA Sans", tahoma, sans-serif`), matching source truth; h3–h6 keep Graphik
      Semibold (unchanged, set separately at `styles.css` h3–h6 rule).

### Breakpoint violations (13) — ✅ RESOLVED 2026-09-14

The migrated blocks were authored off-grid (`600` / `900` / `1281`, plus a `max-width` range in the
header). Mapped to the source grid `768 / 1024 / 1280`, mobile-first `min-width` only.

**Tier mapping used (evidence-based, not guessed):** the header block's own comments pin the author's
intent — the full-screen flyout persists "until 1024px, where it switches to the compact dropdown
panel". So this author's `600` ≈ tablet (**→768**) and `900` ≈ desktop (**→1024**). Confirmed
consistent with `cards-pricing`'s two-step progression (600→2-up, 900→4-up = tablet then desktop).
Applied uniformly: all `600`→`768`, all `900`→`1024`, `1281`→`1280`. The two header `max-width`
tablet bands (768–1023) became plain `min-width: 768` — safe because the `>=1024` desktop block below
already resets everything they touch (font-size→18px, flyout padding→24px, `.nav-actions`→`display:none`).

| File:line | Current | → Fixed to |
|---|---|---|
| `blocks/cards-media/cards-media.css:64` | `@media (width >= 900px)` | **1024** |
| `blocks/cards-pricing/cards-pricing.css:90` | `@media (width >= 600px)` | **768** |
| `blocks/cards-pricing/cards-pricing.css:96` | `@media (width >= 900px)` | **1024** |
| `blocks/columns/columns.css:22` | `@media (width >= 900px)` | **1024** |
| `blocks/columns-cta/columns-cta.css:47` | `@media (width >= 900px)` | **1024** |
| `blocks/columns-media/columns-media.css:41` | `@media (width >= 900px)` | **1024** |
| `blocks/columns-quote/columns-quote.css:39` | `@media (width >= 900px)` | **1024** |
| `blocks/form/form.css:46` | `@media (width >= 600px)` | **768** |
| `blocks/header/header.css:298` | `@media (width >= 768px) and (width <= 1023px)` | **min-width: 768** (desktop block overrides at 1024) |
| `blocks/header/header.css:426` | `@media (width >= 768px) and (width <= 1023px)` | **min-width: 768** (desktop block overrides at 1024) |
| `blocks/header/header.css:585` | `@media (width >= 1281px)` | **1280** |
| `blocks/hero/hero.css:33` | `@media (width >= 900px)` | **1024** |
| `styles/styles.css:360` | `@media (width >= 900px)` | **1024** |

✅ `node tools/quality/breakpoint-check.mjs` passes clean (exit 0).

---

## ▶ Typography validation — steps

`typography.json` scale is populated from the applied/measured values (regression baseline). To
re-confirm against the live source and enforce:
1. `npm install` (Playwright + Chromium) and `npx aem up` (localhost:3000).
2. `npm run discover:typography -- https://www.ustacoaching.com/ --write` (review before persisting).
3. `npm run check:typography http://localhost:3000/<page>` — fix `:root` tokens in `styles/styles.css`; re-run until green.
If bot-blocked, add a browser User-Agent to `tools/quality/typography-discover.mjs`.

---

## Log (newest at the bottom)

### 2026-09-14 — (re)applied the guardrail after it was lost
- **Root cause:** the guardrail layer was set up earlier but left **uncommitted**; the working tree
  was later reset to committed block work, discarding it. Re-applied and **committed this time**.
- Re-applied the full EDS guardrail from the master (`ema-eds-guardrail`): AGENTS.md rules, 22 skills,
  checkers (breakpoint/overflow/typography/svg), tests/a11y, CI, `.claude/skills`, `MIGRATION.template.md`.
  Did NOT touch the already-migrated `blocks/`, `styles/styles.css`, or `fonts.css` (real work).
- Recorded the discovered design system: breakpoints **768/1024/1280**, flexbox + **px-first** units
  (`breakpoints.json`); type scale + fonts (`typography.json`).
- **Fixed a real gap:** `styles.css` referenced **USTA Sans** but the font file + `@font-face` were
  missing — self-hosted `fonts/usta-sans-bold.otf` and added its `@font-face` to `fonts.css`.

### 2026-09-14 — fixed all 13 breakpoint violations + h1/h2 font family
- **Breakpoints:** mapped every off-grid value to the source grid `768/1024/1280`, mobile-first
  min-width only. Tier mapping was evidence-based (see the resolved table above): `600`→`768`,
  `900`→`1024`, `1281`→`1280`. The two header `max-width` tablet bands (768–1023) became plain
  `min-width: 768` — verified safe because the existing `>=1024` desktop block resets font-size (→18px),
  flyout padding (→24px), and hides `.nav-flyout .nav-actions`, so nothing leaks past 1024.
  `node tools/quality/breakpoint-check.mjs` now exits 0.
- **Typography:** `styles/styles.css` `--heading-font-family` changed from `"Graphik XXCond Bold",
  "USTA Sans", …` → `"USTA Sans", tahoma, sans-serif` so h1/h2 render the correct condensed display
  face (source truth in `typography.json`). h3–h6 unchanged — they already override to Graphik Semibold.
- **Not yet run** (needs `npm install` + `npx aem up`, dev server was down): `check:typography`,
  `check:overflow`, `test:a11y`. Still open in §6.

### 2026-09-14 — ran the quality gate (npm install + aem up, homepage `/`)
Ran `npm install` (378 pkgs + Playwright Chromium) and `npx aem up` (localhost:3000, proxying
`main--coaching-usta--aemdemos.aem.page`), then all three checkers against `/`.
- **a11y — ✓ PASS.** `node tests/a11y/run.mjs` → 1 passed, 0 critical/serious violations.
- **typography — ✗ 8 drifts (all one root cause).** h3 renders **40px** at every viewport, but the
  source scale wants 28px (32px @1280). Traced to `blocks/cards-pricing/cards-pricing.css:31` — the
  pricing-tier heading (`.cards-pricing .cards-pricing-card h3`) is hardcoded `font-size: 40px`. The
  global `:root` scale tokens (h3 = 28/28/28/32) are correct; this block rule overrides them. NOT caused
  by the font-family fix. Left as an open item — needs a decision (shrink to scale vs. confirm 40px is
  source-correct and record it in `typography.json`).
- **overflow — ✗ 2 tiers.** `/` scrolls sideways at 360 (407>360) and 768 (915>768):
  - **@360 → `columns-cta`.** `.columns-cta h2` (40px, `line-height:1`) contains a long unbroken word
    that exceeds its 240px content column (`scrollWidth 347 > clientWidth 240`), pushing `main` to 407px.
  - **@768 → `footer`.** `.footer-row` switches to a single `nowrap` flex row at >=768 but the content
    doesn't fit: 7 links (16px, 30px gaps ≈599px) + 40px gap + social row (157px) ≈796px into ~664px.
  Both are bespoke-width/nowrap layout bugs (fix per `skills/grid-system`) — pre-existing, unrelated to
  the breakpoint remap. Left as open items in §6.
- **Net:** breakpoints + heading font-family are green; a11y green. Two real block bugs (cards-pricing h3
  size, columns-cta/footer overflow) surfaced and are queued in §6.

### 2026-09-14 — audit of the breakpoint changes; fixed a JS/CSS breakpoint mismatch
Re-verified all breakpoint edits before moving on to block work. Breakpoint check + stylelint (all
touched files) + eslint all pass clean. One thing the CSS checker can't see but the audit caught:
- **`blocks/header/header.js` used `matchMedia('(min-width: 900px)')`** for its `isDesktop` gate, but
  the CSS switches from the full-screen mobile flyout to the compact desktop dropdown at **1024px**.
  Between 900–1023 the layout was the mobile flyout while JS thought it was desktop → body-scroll lock
  (openFlyout) and the crossing-reset listener fired at the wrong width. Changed the JS to
  `min-width: 1024px` to match the CSS. Verified live: header decorates, inline links appear at 1280.
- Also refreshed stale comments that still referenced `900px` / `1281px` (header.css ×3,
  columns-media.css ×1) so comments match the on-grid values. No behavioural change from those.

### 2026-09-14 — fixed footer horizontal overflow (768–~1080 tier)
User reported (with screenshot) a horizontal scrollbar on the footer between ~700 and ~900px — the
"USTA COACHING" wordmark and "GET ON THE LIST" heading were clipped on the left. Root cause: at >=768
the footer switches to a single `nowrap` flex row (links + social) but the fixed content (~796px:
7 links@16px with 30px gaps ≈599px + 40px gap + 157px social) doesn't fit inside the 81.6%/max-1170px
inner container until ~1080px+. The overflow checker only samples 360/768/1024/1280/1920 and 768 landed
right at the edge, so it read borderline. Fix in `blocks/footer/footer.css` (>=768 block): `.footer-row`
and `.footer-links ul` now use `flex-flow: row wrap` with row+column gaps (24/40 and 16/30) so the
social group drops below and links wrap to a second line when narrow; the intended single-row layout is
unchanged at wide desktop. Verified: no page overflow at 700/768/820/899, screenshot @820 shows a clean
two-row link block + wordmark fully visible, stylelint + breakpoint check pass, a11y unaffected.

### 2026-09-14 — footer parity audit vs source across ALL viewports (fixed 3 drifts)
Full measure-and-match of the footer against the live source at 390/768/1024/1280 (extracted computed
styles both sides). Footer link responsive scale (SOURCE truth, now replicated exactly):
| viewport | font/line-height | letter-spacing | link gap | layout |
|---|---|---|---|---|
| <768 | 18/18 | -0.54px | 16px | column |
| 768–1023 | **24/24** | -0.72px | **24px** (row 32px) | column |
| 1024–1279 | 16/16 | -0.48px | **16px** | row |
| >=1280 | 18/18 | -0.54px | 30px | row |
Three drifts found & fixed in `blocks/footer/`:
1. **Tablet links too small** — source is 24px at 768–1023 (with 24px column gap + 32px links↔social
   container gap); migrated fell through to 18px. Added the 24px tablet tier in the `>=768` block.
2. **Desktop link gap wrong** — source is 16px at 1024–1279 and only 30px at >=1280; migrated used 30px
   across all >=1024. Split: 16px in the `>=1024` block, 30px in the `>=1280` block.
3. **External-link `target` never applied (footer.js bug)** — `decorateExternalLinks(footer)` ran BEFORE
   `footer.append(brand, row)`, so it operated on an empty container and no link got `target=_blank`.
   Source opens every footer link + all social in a new tab except the internal "Program Terms and
   Conditions" (`_self`). Moved the call after append; now matches (http links → `_blank rel=noopener`;
   the relative Program-Terms link stays same-tab). Verified live at all 4 viewports.
Logo (natural 432×36 SVG, full-width, 91px@1440 / 57px@768 / 30px@390), social gaps (18px) and icon
sizes (IG/LI 36×36, YT 49×36) already matched source. Content complete: all 7 links (text+href) + 3
social icons present. One deliberate a11y improvement kept over strict parity: migrated LinkedIn icon has
`alt="LinkedIn"` where source's is empty. Lint (css+js) + breakpoint check pass; footer `768/1024:OK`.

### 2026-09-14 — REVERTED the wrap fix; restored source-exact footer layout
The `flex-flow: row wrap` fix above **broke desktop parity** — it reflowed the whole link items into a
flat list and pushed the social icons onto a line below the links, whereas the source keeps a single row
(links left with 2-line-wrapping labels, social pinned right). User caught it by overlaying the source vs
migrated desktop screenshots. Investigated the SOURCE directly with Playwright: at 900px the source
`.footer-links` is `flex-direction: column` (links stacked above social — the "tablet" layout), and only
at ≥1024 does it become `flex; nowrap; justify-content: space-between` with each link `li` = `flex: 0 1
auto; white-space: normal` so labels wrap to 2 lines instead of the row growing. Rewrote the footer to
mirror that: keep the base mobile column through the 768 tablet tier, switch to the single row at **1024**
(the source's own breakpoint, and where it fits — so no overflow, no wrap hack). Footer-link size band
also corrected to the source's: 18px (<1024, stacked) → 16px (1024–1279) → 18px (≥1280). Verified desktop
@1440 matches source pixel geometry (social x=1108→1265, links from x=175, single row), tablet @1023
stacks cleanly, overflow sweep `768:OK`+`1024:OK`, stylelint + breakpoint check green.

### 2026-09-14 — Hero (video) block: rendered the video + full source parity across viewports
The migrated hero showed the mp4 as a **plain text link** — the video never rendered. Two root causes,
both fixed in `blocks/hero-video/`:
1. **Import mangled the extension** — the content link href is `…coaching-video-loop-compressed-mp4`
   (dot→hyphen). The block's `href.includes('.mp4')` detection missed it, so no `<video>` was built.
   Fixed in `hero-video.js`: added `isVideoHref()` (matches `.mp4/.webm` OR the mangled `-mp4/-webm`) and
   `resolveVideoSrc()` now normalises a trailing `-mp4`→`.mp4` before the DAM-path rewrite. The clean
   `/assets/media/coaching-video-loop-compressed.mp4` 301-redirects on DA to the hashed asset
   (`media_1dbe44fa…​.mp4`, user-confirmed). Video autoplays/loops/muted/playsinline with poster; the
   play/pause toggle works. Did NOT hand-edit the imported content HTML (per guardrail).
2. **Geometry was guessed (aspect-ratio), not measured** — old CSS used `aspect-ratio` 4:3→3:2→2:1 and a
   1200px section cap. Extracted the SOURCE truth from its CSS: the video panel is FULL content width with
   a FIXED pixel height per breakpoint (`#hero-video-container`): **477 / 550 / 522 / 694** at
   0 / 768 / 1024 / 1289, `object-fit: cover`, 20px radius. Side gutters **16 / 40 / 48 / 64**. H1 uses the
   global scale (32/40/56/80) with `letter-spacing: normal`; H1→video gap 24px; toggle 40×40 at 24px
   bottom-left inset. Rewrote `hero-video.css` to those exact fixed heights + gutters (1289→our 1280 tier).
Verified migrated == source at 390/768/1024/1440: gutter 16/40/48/64, H1 32/40/56/80, panel W×H
358×477 / 688×550 / 928×522 / 1312×694, toggle at x=88 (=64+24) @1440, no hero overflow. Lint (css+js),
breakpoint check, and a11y all pass. (Homepage still shows the unrelated columns-cta @360 overflow —
`heroOverflow:false` confirmed; that item stays queued.)

### 2026-09-14 — Hero (video): aligned with header container on wide screens
User flagged the hero video not aligning vertically with the header on wide viewports. Root cause: the
header caps its content at `max-width: 1536px; margin: 0 auto` (centered, growing gutter), but the hero
section wrapper used `max-width: none` (full-bleed). Below ~1664px they coincided (both hit the raw
gutter), but at 1728 the header content inset to x=148 while the video ran to x=64 — an ~84px drift.
Verified the SOURCE: at 1728 its hamburger is x=148 and the video panel x=160 / right 1568 / width 1408
(1536 max centered → (1728−1536)/2 = 96 margin + 64 padding = 160; video sits 12px inside the header's
52px gutter). Fix: gave `main > .section.hero-video-container > div` `max-width: 1536px; margin-inline:
auto; box-sizing: border-box` (keeping the 16/40/48/64 per-band padding). Now migrated == source at 1728
(ham 148, panel 160→1568, w 1408) and unchanged below the cap (1440: ham 52, panel 64, w 1312, h 694).
Lint + breakpoint pass; hero has no overflow (the remaining sweep 360 failure is the separate columns-cta).

### 2026-09-14 — Header side-gutter scale fixed (tablet alignment with hero)
User flagged the tablet (1024) view: hero video not aligning with the header. Root cause was in the
HEADER, not the hero — the migrated `header nav` used a flat `52px` side gutter at all >=1024 widths and
fell back to the mobile `16px` at 768, whereas the SOURCE steps the header gutter per breakpoint. Measured
source header padding: **40px @768, 36px @1024–1279, 52px @>=1280** (hamburger x = 40 / 36 / 52). The hero
video already used the correct 40/48/64 gutters (video sits flush at 768, then +12px inside the header at
1024/1440). Because the header was 52px at 1024 while the video was 48px, the video poked ~4px left of the
header; at 768 the header (16px) sat far left of the video (40px). Fixes in `blocks/header/header.css`:
added `header nav { padding: 0 40px }` in the `>=768` block, changed the `>=1024` block from `0 52px` to
`0 36px`, and added `header nav { padding: 0 52px }` in the `>=1280` block. Verified migrated == source at
768 (ham 40, video 40 flush), 1024 (ham 36, video 48, +12 inset), 1440 (ham 52, video 64, +12). Lint
(css+js), breakpoint check, and a11y all pass.

### 2026-09-14 — intro-statement width parity via a `narrow` section style
The intro line ("If tennis…coaches like you.") wrapped differently from source because it used the global
section container (max-width 1200, x=120 @1440) while the SOURCE uses a narrower box. Measured source
intro across viewports: font 40/56/72 at 768/1024/1280+ (line-height 1, letter-spacing -0.03em); content
box x=40 w=688 @768, x=48 w=928 @1024, x=162 w=956 @1280, x=175 w=1089 @1440. Two gaps: (1) migrated
skipped the **56px @1024** tier (jumped 40→72); (2) at >=1280 the source insets to **81.6%** of the
1536-capped container (same ratio as the footer), not the 1200 box.
Fix — per user's suggestion, added a reusable **`narrow` section style** (section-metadata `style: narrow`)
in `styles.css`: 1536-max centered container with hero gutters 16/40/48 through 1024, then at >=1280 the
content insets to 81.6% (max 1170). Also added the missing 56px intro tier. Applied it to the intro
section in `content/index.plain.html` via a `section-metadata` block (`style: narrow`). Verified migrated
== source at 768/1024/1280/1440 (x/width within ≤4px sub-pixel on the 81.6% calc). NOTE: the local aem-cli
dev server strips trailing section-metadata when serving `.plain.html` (so `narrow` isn't visible on
localhost), but DA/EDS applies section-metadata normally — same pattern as the `<em>`/`<u>` accents that
were confirmed working on aem.live. Lint + breakpoint check pass. Push `content/index.plain.html` +
`styles/styles.css` to DA to see it live.

### 2026-09-14 — columns-media block: rebuilt to source (white card + lime CTA)
The block was a bare "structural only" placeholder — plain white text on black, no card, unstyled link.
Source is a two-column promo: a WHITE ROUNDED CARD (heading + copy + lime CTA button) beside a rounded
image. Extracted source spec at 768/1024/1280/1440: card bg #fff, border-radius 20px, ~48px padding,
content uses space-between so the CTA pins to the card bottom; heading Graphik Semibold #000 line-height 1
at 32/40/64 (768/1024/1280); body copy #000 at 16/18/24 line-height 1.2; CTA = lime (#cfff05) button,
#000 text, radius 12px, padding 14px 22px, 18px. Layout: stacked on mobile/tablet, 50/50 side-by-side at
>=1024 with a 24px gap and equal-height columns (image object-fit: cover); gutters 16/40/48/64 on the
1536 centered container. Rewrote `blocks/columns-media/columns-media.css` accordingly (the quiz card
authors its heading as the first <p>, so `p:first-child` is styled as the heading; the lone trailing link
`p:last-child a` becomes the lime button). The 2nd instance (Safe Play) is authored image-first, so it
renders image-left / card-right (the source's media-right layout) with no extra option needed — verified
h2 64px, white card on the right, lime "Start Now". Both instances verified at 1440 (quiz card x=64 white
radius20 + lime "Start the Quiz"; Safe Play image-left card-right). Lint + breakpoint + a11y pass.
Note: source's "Start Now" has a 2px black border and "Start the Quiz" has none — kept both borderless
(negligible on lime/#000); revisit if strict border parity is wanted.

### 2026-09-14 — columns-media: exact 50/50 split + heading 3-line wrap parity
Follow-up pixel pass on both columns-media instances (quiz + Safe Play — same block, different image
aspect/content, so 100% parity is achievable). Two drifts fixed:
1. **Uneven column split** — was card 692 / image 596 (54/46) because `flex:1 1 0` let the card's text
   min-content and the optimized image's intrinsic width skew the flex. Source is 50/50 (card 644 + 24
   gap + image 644 @1440). Fixed with `flex: 0 0 calc(50% - 12px)` + `min-width: 0` on both columns →
   now exactly 644/644.
2. **Heading wrapped to 2 lines vs source's 3** — the source caps the card's text to ~80% of the card
   width (an AEM inner-grid artifact: text sits in a 5-of-6 subcolumn, ~491px measure in a 644 card,
   leaving right whitespace). That narrower measure is what wraps the 64px heading to "Can't decide? /
   Find your / perfect fit.". Added `.columns-media-content > * { max-width: 80% }` at desktop → heading
   now wraps to 3 lines matching source. Verified @1440: card x=64 w=644, image x=732 w=644, heading 3
   lines. Same block drives both instances (Safe Play image-left/card-right via image-first authoring).
   Lint + breakpoint pass.

### 2026-09-14 — columns-media: full typography parity + padding + button border
Detailed source typography audit across 768/1024/1440 for the card. Fixes to
`blocks/columns-media/columns-media.css`:
- **Card left padding** — was 48px (text too far right); source insets content only **25px left/right,
  49px top/bottom**. Set base `padding: 49px 25px` and removed the 40/48px desktop overrides.
- **Button border** — source CTA has a **2px solid #000** border (both quiz + Safe Play); added it.
- **Button typography** — source CTA text is Graphik Semibold with **letter-spacing 1px** (positive) and
  font-size **16 → 18 → 24** at 768/1024/1280 (was flat 18px); added the responsive sizes + tracking.
- **Text typography (verified exact, all viewports):** heading Graphik Semibold #000 lh 1, ls -0.03em,
  32→40→64; body Graphik Regular #000 lh 1.2 (16/19.2 → 18/21.6 → 24/28.8), ls -0.03em. Confirmed
  migrated == source at 1440 (padL 25, heading 64/64/-1.92, para 24/28.8/-0.72, btn 24/ls1px/2px border)
  and 768 (padL 25, heading 32/32, para 16/19.2, btn 16px/2px border).
- **Image** — re-verified the Safe Play image is ALREADY correct: migrated `media_1e6f408d…jpg` is
  byte-identical (md5 c487b16…) to the current source `get-early-access.jpeg` (green-hoodie handshake).
  No change needed; the earlier "wrong image" was a stale screenshot.
Lint + breakpoint + a11y pass.

### 2026-09-14 — Safe Play image corrected (was the wrong photo)
User was right: the Safe Play image differed from source. Root cause: the SOURCE renders the Safe Play
photo via a CSS **background-image** (`content/dam/coaching/decorative/983b964b…jpg` — the green-hoodie
handshake, 1440×1795 portrait), while the `<img>` fallback in its markup is a DIFFERENT photo
(`get-early-access.jpeg`, blue-court, 1440×810). The importer captured the `<img>` fallback, so the
migration showed the wrong (blue-court) image. My earlier md5 "match" compared the wrong source URL
(the fallback), which is why I mistakenly concluded it was correct — apologies.
Fix: downloaded the real displayed image (`983b964b…jpg`, md5 a4ec8360…) and overwrote the local asset
`content/media-da/index/get-early-access-f650bc83-577f619a.jpeg` in place (same filename → all content
`<picture>` refs keep working, pushes to DA cleanly). Disk verified: md5 a4ec8360…, 1440×1795. NOTE: the
local aem-cli media proxy still serves a stale 900×506 optimized derivative keyed by the old file (display
cache only); the raw served file is already the new image (md5 verified) and DA will regenerate the
derivative from the correct source on push. Lint clean.

### 2026-09-14 — Block consolidation: variant classes (cards, columns)
Refactor to eliminate near-duplicate blocks and adopt the idiomatic EDS **`blockname (variant)`**
pattern (the block name is `classList[0]`; extra classes are variant modifiers). No visual/behavioural
change — verified byte-for-byte parity of the decorated DOM + computed styles before/after.

**Consolidated 7 blocks → 2:**
- `cards-media` → **`cards (media)`**, `cards-pricing` → **`cards (pricing)`**. Deleted
  `blocks/cards-media/`, `blocks/cards-pricing/`.
- `columns-media` → **`columns (media)`**, `columns-cta` → **`columns (cta)`**, `columns-quote` →
  **`columns (quote)`**. Deleted `blocks/columns-cta/`, `blocks/columns-media/`, `blocks/columns-quote/`.

**How it works:**
- **JS** — each base block (`blocks/cards/cards.js`, `blocks/columns/columns.js`) keeps one `decorate()`
  that dispatches on the variant class: `if (block.classList.contains('media')) …`, else `cta`/`quote`/
  `pricing`, else the boilerplate default. Each variant's decoration logic was moved in **verbatim**
  (same inner class names — `cards-media-*`, `cards-pricing-*`, `columns-media-*`, `columns-cta-*`,
  `columns-quote-*`) so the CSS ported over unchanged.
- **CSS** — each variant's rules are prefixed with the variant class (`.cards.media …`,
  `.columns.cta …`). The **default** variant's rules are guarded with `:not(.media, .pricing)` /
  `:not(.media, .cta, .quote)` so they don't leak onto variants. The section-container rules that used
  the old per-block container class (`.cards-media-container`, `.columns-media-container`) are now
  re-scoped via **`:has()`** on the shared container: `.cards-container:has(.cards.media)` and
  `main > .section.columns-container:has(.columns.media) > div`. Added a
  `stylelint-disable no-descending-specificity` header to `cards.css` (variant rules intentionally
  follow the lower-specificity default rules); `columns.css` already had it. stylelint also required the
  complex `:not(a, b)` notation over chained `:not(a):not(b)`.

**Content** — `content/index.plain.html` + `content/es/index.plain.html`: `class="cards-media"` →
`"cards media"`, `"cards-pricing"` → `"cards pricing"`, `"columns-media"` → `"columns media"`,
`"columns-cta"` → `"columns cta"`, `"columns-quote"` → `"columns quote"`. Mechanical class rename on
existing blocks (not new HTML) — required to match the block rename.

**Gotcha (verification):** the local aem-cli serves the **published** page at `/` (proxied from
`…aem.page`), so it still shows the OLD class names and would 404 the now-deleted block folders — it
can't reflect the rename until the content is pushed to DA. To verify the refactored blocks against the
**new** markup locally, copied the content to `drafts/refactor-check.plain.html` and restarted the dev
server with `--html-folder drafts`, rendering at `/drafts/refactor-check`.

**Verified @1440 (draft, new markup):** columns.media quiz row 772 + space-between + 80% text cap;
columns.media Safe Play media `aspect-ratio: 644/567` + `object-fit: cover`; columns.cta blue banner,
`flex-direction: row`; columns.quote body+attribution tagged; cards.media 3-up section grid; cards.pricing
4-up grid, tier h3 40px. Lint clean (0 errors), breakpoint check pass, overflow OK at 768/1024/1280/1920
(the 360px 409>360 is the pre-existing columns.cta baseline overflow, unchanged by this refactor — no
`main` element exceeds 360px).

### 2026-09-14 — Block consolidation cont'd: hero-video → hero (video variant)
Same variant-class consolidation as cards/columns. Folded `hero-video` into the boilerplate `hero`
block as **`hero (video)`**. Deleted `blocks/hero-video/`. The plain `hero` variant (CSS-only background
hero) was unused in content but kept as the default.

**How it works:**
- **JS** — `blocks/hero/hero.js` (was an empty boilerplate file) now dispatches: `if
  (block.classList.contains('video')) decorateVideo(block)`, else no-op (the default hero is CSS-only).
  `decorateVideo` + its helpers (`resolveVideoSrc`, `isVideoHref`, `buildVideo`, `HERO_POSTER`) are the
  former `hero-video.js` verbatim, so the video-src resolution (DAM path -> `/assets/media/...`, mangled
  `-mp4` -> `.mp4`) and the play/pause toggle are unchanged. Inner JS-created class names
  (`hero-video-content`, `hero-video-bg`, `hero-video-media`, `hero-video-toggle`) kept as-is so the CSS
  ported over unchanged.
- **CSS** — `blocks/hero/hero.css`: default rules guarded with `:not(.video)` /
  `:not(:has(.hero.video))`; video rules re-scoped from the old per-block container/wrapper names to the
  shared ones via `:has()` — `hero-video-container` -> `main > .section.hero-container:has(.hero.video)`,
  `.hero-video-wrapper` -> `.hero-container:has(.hero.video) .hero-wrapper`, `.hero-video` -> `.hero.video`.
  Added `stylelint-disable no-descending-specificity` header (variant rules follow the lower-specificity
  default/`:has()` rules).

**Content** — `content/index.plain.html` + `content/es/index.plain.html`: `class="hero-video"` ->
`"hero video"`.

**Verified @360/768/1024/1280 (draft, new markup):** video panel height 477/550/522/694, side gutter
16/40/48/64, radius 20px + overflow hidden, toggle bottom-left 24/24, section padding-top 72, inner
max-width 1536, video src resolved to `/assets/media/coaching-video-loop-compressed.mp4`, `decorateVideo`
built the panel + "Pause video" toggle. All identical to pre-refactor hero-video. Lint clean (0 errors),
breakpoint check pass, overflow OK at 768/1024/1280/1920 (360px 409>360 is the pre-existing columns.cta
baseline, unrelated to hero).

After this pass `blocks/` is: accordion-path, cards, columns, footer, form, fragment, header, hero,
widget (down from 15 -> 10 blocks).

### 2026-09-14 — Section headings: center alignment + lime accent phrase
The source's section headings (PACKAGES, JOIN THE COMMUNITY, SUCCESS STORIES, DISCOVER YOUR PATH) are
all `text-align: center` and several colour a trailing phrase lime (`rgb(207,255,5)` = `--usta-lime`) via
an inline colored `<span>`. The migration had them left-aligned and all-white. Fixed with a new section
style + the existing semantic-colour convention — no new per-heading CSS.

**New `center` section style** (`styles/styles.css`, alongside `narrow`):
```
main > .section.center > .default-content-wrapper { text-align: center; }
```
Scoped to the section's **default-content wrapper only**, so a section's *blocks* keep their own
alignment (verified: columns.cta text, cards.pricing tiles, cards.media cards all stay `start` even when
their section also carries `center`). Authored via section-metadata `style: center` (composes with other
tokens — SUCCESS STORIES uses `accent, center`, and the ES sections combine `dark, center`).

**Lime phrases** — authored SEMANTICALLY with `<em>` (the global `main em → lime; font-style: normal`
rule already colours it), NOT a hardcoded span/colour. Applied per source:
- EN: PACKAGES FOR EVERY KIND OF *TENNIS COACH* · JOIN THE *USTA TENNIS COACHING* COMMUNITY · DISCOVER
  YOUR PATH WITH *USTA COACHING* (SUCCESS STORIES has no lime).
- ES: PAQUETES PARA CADA TIPO DE *ENTRENADOR DE TENIS* · ÚNETE A LA COMUNIDAD *DE ENTRENADORES DE TENIS
  DE LA USTA* · DESCUBRE TU CAMINO CON *USTA COACHING* (HISTORIAS DE ÉXITO has no lime).

**Content** — `content/index.plain.html` + `content/es/index.plain.html`: wrapped the lime phrases in
`<em>` and added `center` to each heading's section (own trailing `section-metadata` where the section
had none; appended to the existing `style` token list where it did — e.g. `accent, center`,
`dark, center`).

**Verified @1440 (draft, new markup):** all four headings `text-align: center`; the three lime `<em>`
spans compute to `rgb(207,255,5)`, `font-style: normal`; block content in the same sections stays
left-aligned. Lint clean (0 errors), breakpoint pass. Typography check shows 8 drifts — all
`cards.pricing h3` (40 vs 28/32), the PRE-EXISTING pricing-tier backlog item, NOT the section headings
(this change added no font rules). Overflow 360px 409>360 is the pre-existing columns.cta baseline.

### 2026-09-14 — cards (pricing): full parity rebuild + mobile tabs
Rebuilt the pricing tiers to match the source pixel-for-pixel at all three viewports and added the
mobile tabs interaction that was missing.

**Corrections to the card (all viewports):**
- **1px solid white border** + 16px radius (was borderless). 24px inner padding (unchanged).
- **Blue check** `#0373F3` (= --usta-blue) — was wrongly lime. SVG 24x24, list `padding-left: 32px`.
- **Price line** (Free / $49/year) 28px Graphik Semibold — now tagged `.cards-pricing-price` in JS
  (the standalone `<p>` immediately before the feature list) and scoped
  `.cards-pricing-card p.cards-pricing-price` so it outranks the generic 16px `p` rule.
- **Title** (tier name) 40px Graphik Semibold, `margin-bottom: 8px` (matches source).
- **CTA** lime pill, 18px Graphik Semibold, radius 12px, padding 16px 24px; content-width on
  tablet/desktop, **full-width in the mobile panel** (source).

**Grid (source-measured):**
- `>=1280`: 4 x **310px**, 24px gap (was `repeat(4,1fr)` gap 20 at the 1024 tier — wrong count/gap).
- `>=768`: 2 x **332px**, 24px gap. Section gutters 16/40/48/64 in the 1536-capped centered container
  (added `.cards-container:has(.cards.pricing)` — the pricing section previously had no gutter rule).
- Cards are row-equal-height (flex column + `flex:1` on the list pushes the CTA to the bottom).

**Mobile tabs (< 768) — NEW.** Source collapses the 4 cards into a tab UI. Built in `cards.js`
(`decoratePricing`): a `.cards-pricing-tabs` role=tablist strip with one button per tier (name + price
stacked), each card gets `.is-active` toggled on click; first tier active by default. CSS: strip is a
horizontal `overflow-x: auto` flex row (12px gap, tabs 96px tall, radius 12px, 0 24px padding); **active
tab** = lime bg + black text (no border), **inactive** = black bg + 1px white border + lime name +
white price. Below 768 only the `.is-active` card shows (`display:none` otherwise); at >=768 the strip is
hidden and all cards show in the grid. Panel height follows the active tier's content (verified switching
Baseline<->Rally). The strip's overflow is clipped by its own `overflow-x:auto` (confirmed it does NOT
add to document horizontal overflow at 360).

**Content** — `content/index.plain.html`: the four CTA labels were imported as bare "Select"; the source
reads "Select Baseline/Rally/Pro/Pro Plus" — corrected. (ES source uses plain "Seleccione" — left as-is.)

**Verified:** desktop 1440 (4x310, cards 607 equal-height, border/radius/padding/title/price/li/button
all match source rects), tablet 768 (2x332, tabs hidden, price 28, content-width button), mobile 375/360
(tab strip 96 tall, active lime, inactive lime-name+border, single full-width panel, tab-switch works).
Lint clean (0 errors), breakpoint pass. Overflow 360 409>360 = pre-existing columns.cta, NOT pricing
(pricing strip is internally scrolled/clipped). Typography check flags h3 40 vs 32 — the pricing tier
title is INTENTIONALLY 40px per source (direct-measured), a known scale exception for this block.

### 2026-09-14 — cards (pricing): button-alignment + internal spacing parity
Follow-up pixel pass on the pricing tiers. Two drifts fixed:

1. **CTA not bottom-aligned.** The importer wraps each tile's content in a single `<div>`, so the card's
   flex column had ONE child and `flex:1` on the feature list couldn't grow — the button sat right under
   the content in shorter cards (Pro/Pro Plus) instead of pinning to the card bottom. Fix in `cards.js`
   (`decoratePricing`): unwrap that single wrapper `<div>` so the card's flex column sees the content
   elements (h3 / intro p / price / ul / cta) directly. Now `flex:1` on `.cards-pricing-features` pushes
   the CTA to the bottom → all four buttons align (verified all btn-bottoms equal at desktop, and
   per-row at tablet 2x2).
2. **Internal vertical rhythm.** Replaced the uniform `gap: 12px` with the source's explicit per-element
   spacing (measured): title `margin-bottom: 8px`, intro `p` line-height 1.25 (tight), price
   `margin: 15px 0 27px`, list gap 13px, li line-height 1.25 (2-line items = 40px). Now
   title->bestFor 8, bestFor->price 15, price->list 27, first-li 40 — all match source exactly.

Cards remain equal-height per row (flex column + list `flex:1`); buttons are content-width pills sized to
each label (172/143/131/169 — matches source). Lint clean (0 errors), breakpoint pass, overflow 360 =
pre-existing columns.cta.

### 2026-09-14 — cards (pricing): CTA gap parity (above button / below content)
Padding pass on the CTA spacing. Source model (measured): the button is pinned to the card bottom with a
CONSTANT 25px below (24px padding + 1px border), and a MINIMUM 24px gap above it — the tallest tier in a
row (Rally at desktop) shows exactly 24px list->button; shorter tiers show more (flex fills the slack).

Two drifts fixed:
1. Previously `flex: 1` on the feature list made the list touch the button (0px) in the tallest card
   instead of the source's 24px minimum. Replaced with `margin-bottom: 24px` on the list (the fixed
   minimum) + `margin-top: auto` on the CTA (pushes it to the bottom in shorter cards).
2. The CTA is authored as a `<p>`, so the generic `.cards-pricing-card p { margin: 0 }` rule (specificity
   0,3,1) was overriding `.cards-pricing-cta` (0,2,1) -> `margin-top: auto` never applied and the button
   un-pinned. Scoped the CTA rule as `.cards-pricing-card p.cards-pricing-cta` so it wins.

Verified: desktop (all four btn-bottoms constant 25px, Rally list->btn = 24 min), tablet 2x2 (per-row:
tallest tier 24px above, all btn-bottoms 25px), mobile panel (24 above / 25 below, full-width CTA). Lint
clean, breakpoint pass.

### 2026-09-14 — cards (media): equal-height images + rhythm + responsive layout parity
The "JOIN THE COMMUNITY" feature cards drifted: images rendered at NATURAL aspect (height:auto) so the
three were unequal heights and nothing aligned across the row; radius was 12px (source 20px); the
uniform 16px gap didn't match the source rhythm; and the source's tablet layout was missing.

Fixes to `blocks/cards/cards.css` (`.cards.media`):
- **Equal-height images:** `aspect-ratio: 421/297` (~1.42, source-measured) + `object-fit: cover` +
  `border-radius: 20px` (was 12) — all three images are now the same height (260 @1280) and align.
- **Rhythm:** image -> heading 36px (h3 `margin-top`), heading -> paragraph 24px (p `margin-top`),
  replacing the flat 16px gap. h3 line-height 1, p line-height 1.2 (16/19.2).
- **Heading size:** 28px mobile/tablet, **32px desktop** (source), Graphik Semibold white.
- **Responsive layout (source-matched):**
  - mobile (<768): stacked, image on top; image aspect ~1.42, full card width.
  - tablet (768-1023): HORIZONTAL card — image left `flex: 0 0 213px` (aspect 213/223), text right,
    vertically centered, 36px gap; heading margin-top reset to 0 (side-by-side).
  - desktop (>=1024): 3-up row of stacked image-top cards.
- **Section gutters** 16/40/48/64 in a 1536-capped centered container (was a 1200 cap / 48px padding).
  Removed a stale duplicate `.cards-container:has(.cards.media)` rule in the >=1024 block that was
  overriding the new padding with `48px 32px`.

Verified: 1280 (3x368, gutter 64, imgs equal 260 @1.418 r20, h3 32, img->h3 36, h3->p 24), tablet 768
(horizontal, img 213x223 left, 36px gap, h3 28 at x=289 — matches source), mobile 375 (stacked, img 343
wide r20, h3 28, 36/24 rhythm). Lint clean, breakpoint pass, no overflow from this block (360 = pre-
existing columns.cta).

### 2026-09-14 — GLOBAL FIX: section gaps regression + cards(media) image crop
Two fixes:

1. **Section gaps were gone (whole page cluttered).** The global base rule `main > .section { padding:
   48px 0 }` provides the vertical section rhythm, but several block CONTAINER rules
   (`.cards-container:has(.cards.media)` / `:has(.cards.pricing)`) set `padding: 0 <gutter>` **directly on
   the section element**, which zeroed the 48px block padding — so those sections butted against their
   neighbours with no gap. Fixed by switching those section-level rules to **`padding-inline: <gutter>`**
   (16/40/48/64) so only the horizontal axis is overridden and the base 48px top/bottom survives. (The
   columns/hero containers were already correct — they target the inner `> div`, not the section.)
   Result: 48px top + 48px bottom = ~96px between section contents restored across the page.
2. **cards(media) image crop.** Source crops the card images from the TOP (`object-position: 50% 0%`),
   not center — the migrated center-crop showed a different slice of each photo. Added
   `object-position: 50% 0%` to `.cards.media .cards-media-image img`. Framing now matches source.

Verified @1280: media images equal 260px, object-position 50% 0%, all sections padTop/padBottom 48px,
content gap between pricing cards and JOIN heading restored (was 0). Screenshot confirms top-crop framing
+ section spacing match source. Lint clean, breakpoint pass.

### 2026-09-14 — Content: group section headings with their cards (+ full-width heading fix)
Per source structure, the section headings now live in the SAME section as their cards (previously each
trailed the PREVIOUS section as trailing default content):
- **PACKAGES FOR EVERY KIND OF TENNIS COACH** -> moved into the `cards (pricing)` section (was trailing
  the quiz `columns media` section).
- **JOIN THE USTA TENNIS COACHING COMMUNITY** -> moved into the `cards (media)` section (was trailing the
  pricing section).
Done in both `content/index.plain.html` and `content/es/index.plain.html` (ES: PAQUETES / ÚNETE),
carrying each heading's `center` style (ES pricing/media sections already had `dark`; combined to
`dark, center`). Each section keeps exactly one section-metadata.

**CSS follow-up (required):** the `cards (media)` section IS a 3-column grid
(`.cards-container:has(.cards.media)`), so a heading placed above the cards became a grid ITEM in column
1 and shoved the card row. Added `.cards-container:has(.cards.media) > .default-content-wrapper {
grid-column: 1 / -1 }` so the heading spans all columns full-width above the row. Verified @1280: JOIN
heading 1152px full-width + centered, 3 media cards back in a clean row (x=64/456/848, images equal 260).
Lint clean, breakpoint pass.

### 2026-09-14 — New `banner` block (blue/black colour variants) replaces columns(cta)
The blue "Explore workshops & events" band is a distinct BANNER pattern (not a columns layout), and the
site uses two colour treatments of it, so it's now its own block with switchable colour variants:
- **`banner (events, blue)`** — blue panel, black text, solid BLACK pill button (the events banner; the
  homepage instance). `blue` is also the default when no colour class is given.
- **`banner (events, black)`** / **`banner (black)`** — black panel, white text, solid LIME-GREEN pill
  button. Available for the other banner treatment seen across the site; author just swaps the colour
  token (`blue` <-> `black`).

**Block** (`blocks/banner/`): `banner.js` normalises the authored cells into heading / body / CTA and
tags them (`.banner-heading` / `.banner-body` / `.banner-cta`); `banner.css` is the contained rounded
panel. Source-measured: radius 20px; padding 36px 12px desktop / 12px 16px mobile; heading USTA Sans
700, 40px desktop / 28px mobile; body Graphik Semibold 18/16; CTA fully-rounded pill (radius 9999),
18px, +1px tracking, 14px 32px padding. Layout: 3-up centered row (heading | body | CTA, 24px gaps) at
>=1024; stacked left-aligned column on mobile. Colour variants set panel bg / text / button palette only.

**Content** (`content/index.plain.html` + ES): `columns (cta)` -> `banner (events, blue)`, and the
section's `accent` style token was DROPPED (the banner is its own blue panel now; `accent` had wrongly
tinted the whole band — incl. SUCCESS STORIES — blue). Kept `center`.

**Cleanup:** removed the `cta` variant from the columns block — `decorateCta` + the `.columns.cta` CSS
deleted, the `cta` dispatch branch removed, and the default-variant `:not(.media, .cta, .quote)` guards
simplified to `:not(.media, .quote)`. Columns is now three variants (default/media/quote).

Verified: desktop 1280 (blue panel radius 20, heading USTA Sans 40 black, black pill radius 9999 ls 1px,
3-col row heading|body|CTA 24px gaps), mobile 375 (stacked, padding 12/16, heading 28, full palette).
Lint clean, breakpoint pass, and overflow now PASSES at 360 (the old columns.cta was the long-standing
360 overflow offender — gone).

### 2026-09-14 — banner: width/container + heading-wrap parity fix
Follow-up on the banner. Two drifts:
1. **Panel too narrow.** The banner sat in the section's default 1200px wrapper, so at 1440 it was
   narrower than the source (panel x=64 w=1312 in the 1536-capped/64px-gutter container). Added
   `main > .section.banner-container > div { max-width: 1536px; padding-inline: 16/40/48/64 }` (inline
   only, so the base 48px block padding / section gap survives) — panel now x=64 w=1312, matching source.
2. **Heading wrapped to 3 lines** vs the source's 2 ("EXPLORE WORKSHOPS" / "& EVENTS"). Root cause was
   the narrow container plus a too-tight `max-width: 44%` on the heading; with the correct 1536 container
   and `max-width: 50%` the 40px USTA Sans heading now wraps to exactly 2 lines (w 644, h 80).

Verified @1440 (panel x=64 w=1312, heading 2 lines, 3-col row heading|body|CTA 24px gaps) and @375
(panel x=16 w=343, padding 12/16, stacked, heading 28). Lint clean, breakpoint pass, overflow clean at
360/768/1024/1280/1920.

### 2026-09-14 — banner: content inset parity (heading left-edge alignment)
The banner content sat 12px inside the panel edge; the source insets it 24px (panel padding 12 + an inner
row wrapper 12). At 1440 the source banner heading text starts at x=88 (panel edge 64 + 24), but the
migrated heading was at x=76 (only +12). Fixed the desktop panel padding `36px 12px` -> `36px 24px` so
the heading/CTA sit 24px in — banner heading now at x=88, matching source exactly (panel edge 64 shared
with the cards grid). Lint clean, breakpoint pass, overflow clean at all viewports.

### 2026-09-14 — banner: left edge aligned to header hamburger
Per request, the blue banner panel's left edge must start exactly where the header hamburger/content
starts. The header uses gutters 16/40/36/52 (mobile/768/1024/1280); the banner was using 16/40/48/64, so
its panel started at x=64 while the hamburger was at x=52. Changed the banner-container inline gutters to
MATCH THE HEADER (40 @768, 36 @1024, 52 @1280). Verified @1440: banner panel left = 52 = hamburger left
(and right = 1388, symmetric). Lint clean, breakpoint pass, overflow clean at all viewports.

### 2026-09-14 — banner: align to CARDS grid (not header) — corrected
Correction to the prior entry: the banner should align with the CONTENT BLOCKS above it (the cards),
not the header. The cards/pricing grid sits at a 16/40/48/64 gutter (left 64, right 1376 @1440); the
banner had been set to the header's 16/40/36/52 (left 52), leaving it 12px left of the cards. Reverted
the banner-container gutters to 16/40/48/64 so the blue bar's left/right edges line up exactly with the
cards. Verified @1440: banner panel left 64 = pricing/media card left 64; right 1376 = pricing right.
Lint clean, breakpoint pass, overflow clean at all viewports.

### 2026-09-14 — banner: align to HEADER gridline (final, per user)
Final decision (user): the blue banner's left edge should line up with the HEADER (hamburger start at
the 52px gutter), NOT the 64px content/cards grid — cards and header left unchanged. Set the
banner-container inline gutters to match the header exactly: 16 / 40 / 36 / 52 (mobile/768/1024/1280).
Verified @1512: banner panel left = 52 = header hamburger left (right 1460, symmetric). Note this is an
intentional deviation from the cards' 64px grid for this block. Lint clean, breakpoint pass, overflow
clean at all viewports. (Supersedes the two prior banner-alignment entries.)

### 2026-09-14 — banner: tablet row layout (was stacking)
At tablet the source keeps the 3-column ROW (heading left, body + CTA right, vertically centered) — but
the migrated banner was stacking because the row layout was gated at >=1024. Moved the row layout
(flex-row, align center, 36px 24px panel padding, heading flex 0 1 auto / max-width 50%, body flex 1) to
>=768, with heading 32px at tablet and a >=1024 bump to 40px. Verified @834: row layout, panel x=40 =
header hamburger, heading 32px at x=64, heading->body gap 24, CTA content-width; mobile (375) still
stacks at 28px. Lint clean, breakpoint pass, overflow clean at all viewports.

### 2026-09-14 — banner: tablet 2-column structure + desktop compact row (final)
Refined the tablet layout. The source at tablet (768–1023) is NOT a 3-in-a-row; it is TWO top-level
columns — HEADING (left) | CONTENT (right), where the content column stacks BODY over the CTA. Restructured
banner.js to wrap the body paragraphs and the CTA together in a `.banner-content` column (`.banner-body`
over `.banner-action`), leaving the heading as the first row child. CSS: at >=768 `.banner-inner` is a
centered flex row with heading and content each `flex: 1 1 0; min-width: 0` (both can shrink so long words
wrap instead of overflowing); `.banner-content` is a column (body above button). At >=1024 `.banner-content`
becomes a row (body beside button) → the source's single 3-across line. This fixed two earlier bugs: (a)
body copy collapsing to one-word-per-line at ~1024 (caused by `max-width:50%` + `flex:0 1 auto` starving
the body — removed), and (b) heading overflowing when tried with `flex:0 0 auto` (reverted). Verified:
@834 heading|body-over-button, no overflow; @1280 single row, heading 3 lines, panel 192px; @1440 single
row, heading 2 lines, panel 152px (more compact than source ~216px — no height regression). Panel left edge
= 52 (header gutter) at all desktop widths. Lint clean (0 errors), breakpoint pass.

### 2026-09-14 — banner: fixed CTA width + per-viewport panel padding (parity)
Two source-parity bugs found by re-measuring the live source at all three viewports:
1. CTA button: source is a FIXED 280x56 pill at EVERY viewport, and it is CENTERED under the body on
   mobile/tablet. Mine was content-width (~195px) and left-aligned. Fixed: `.banner-cta { width: 280px;
   max-width: 100% }` and `.banner-action { align-self: center }`.
2. Panel top/bottom padding: source uses 12px at mobile AND tablet, and only grows to 36px at DESKTOP.
   My `>=768` rule was applying 36px at tablet too, inflating the tablet panel to 207px (source 186px)
   and making the whole band look "longer". Fixed: tablet padding stays 12px 24px; a new `>=1024` rule
   bumps it to 36px 24px. Verified panel heights now: desktop(1512) 152px / tablet(834) 159px /
   mobile(390) 260px — all matching the source's compact band; CTA 280px centered at tablet+mobile,
   beside the body at desktop. Lint clean (0 err), breakpoint pass, overflow clean 360–1920.

### 2026-09-14 — banner: align to CONTENT/CARDS grid (corrected from header gutter)
The blue banner was overshooting to the left/right of the cards above it and reading as "too long". Root
cause: the banner-container was using the HEADER's gutter set (16/40/36/52). Re-measured the LIVE SOURCE
against its own content grid at two widths and confirmed the source banner aligns to the CONTENT/CARDS
grid, NOT the header: @1600 panel x=96/right=1504 = packages-grid x=96/right=1504 (w=1408); @1280 panel
x=64/right=1216 = grid x=64. The header hamburger sits at x=84 @1600 / x=64 @1280, so the banner does NOT
follow the hamburger at wide widths — it follows the cards. Switched the banner-container gutters to the
cards grid (16/40/48/64, 1536 cap, margin-inline:auto). Verified migrated now matches exactly: @1600
x=96->1504 w=1408; @1280 x=64->1216 w=1152. CTA stays 280px; heading 2 lines @1600. This supersedes the
three earlier banner-alignment entries (the "align to header" decision was wrong at wide widths because
the source's header gutter and content gutter diverge above 1280). Lint clean, breakpoint pass, overflow
clean 360-1920.

### 2026-09-14 — typography parity audit: last 4 blocks (hero, cards, columns, banner)
Measured EVERY text element in the 4 instrumented blocks against the LIVE SOURCE at 390/834/1024/1280
(fs/fw/lh/ls/family/color/align). Results:
- HERO — h1 (80/56/40/32 USTA Sans 700) and intro subtitle (the `<strong>` inside the intro-statement p:
  72/56/40/32 Graphik Regular, ls -0.03em) both already match. (Note: measure the `<strong>`, not its
  wrapper `<p>` — the p reads 16px but is not the visible text.) NO drift.
- CARDS — pricing tier 40, price 28, best-for/li 16, CTA 18(desktop/tablet)/16(mobile); media h3
  32/28/28/28, body 16/19.2; section h2 64/56/40/28 USTA Sans. All match. (Earlier a stray read of a
  HIDDEN a11y label showed tier=16px Arial — ignore; the visible tier is 40px Graphik Semibold.) NO drift.
- COLUMNS — TWO real drifts found & fixed:
  1. Quote attribution (name + role) was a flat 16/19.2; source scales 16/19.2 (mob+tab) -> 18/21.6
     (@1024) -> 24/28.8 (@1280). Added `.columns.quote .columns-quote-body p:not(:first-child)` sizing
     at base/1024/1280.
  2. Media/quiz CTA ("Start Now"/"Start the Quiz") was 16 -> 18 -> 24 across breakpoints; source is a
     FLAT 18/20/ls1px at every viewport. Set base to 18px and removed the 1024 (redundant) + 1280 (24px)
     bumps. Verified: @1280 name/role 24/28.8, CTA 18/20; @834 name 16/19.2, CTA 18/20. Quote text
     (28->32) unchanged (already correct).
- BANNER — heading 40/32/28 USTA Sans 700, body 18/16/16 Graphik Semibold, CTA flat 18/20/ls1px white.
  All match. NO drift.
Quality gate: lint clean, breakpoint pass, overflow clean 360-1920. `check:typography` reports 8 "drifts"
= the pricing tier h3 at 40px (Baseline/Rally/Pro/Pro Plus) vs the single global-h3 record (28/32) — this
is INTENTIONAL source parity (the source pricing card name IS 40px), a known limitation of the one-h3
global record, NOT a regression (no h3 rules were touched in this audit).

### 2026-09-14 — columns.quote (SUCCESS STORIES) rebuilt to two-column card layout
The migrated quote was a plain stacked text block with a 0x0 glyph — missing the source's entire
structure. Source "SUCCESS STORIES" is ONE row: a HEADSHOT photo (left) + a bordered rounded CARD (right)
holding a large blue quote glyph on top, the quote, and the attribution pinned to the card BOTTOM.
Root cause: the importer fragmented the section — the headshot became an ORPHANED lone-picture paragraph
in the PREVIOUS (banner) section (beside the SUCCESS STORIES heading), while `.columns.quote` held only
the glyph SVG + text with no card styling, and the SVG rendered 0x0.
Fix (blocks/columns/columns.js decorateQuote):
  • Reunite: adopt the orphaned headshot from the previous section as the left `.columns-quote-photo`
    column (matched as a `p > picture` with empty text; optimized via createOptimizedPicture 750w).
  • Card: tag the text cell `.columns-quote-card`; prepend the glyph as `.columns-quote-glyph`; wrap the
    quote as `.columns-quote-text` and the trailing name+role paragraphs as `.columns-quote-attribution`.
Fix (blocks/columns/columns.css): 50/50 flex row at >=768 (each `flex:0 0 calc(50% - 12px)`, 24px gap,
  align stretch), STACKED on mobile (photo over card, 24px gap). Photo: 20px radius, object-fit cover,
  aspect 358/280 mobile -> 564/592 tablet+. Card: 1px #fff border, 20px radius, transparent, padding
  12px16px mobile -> 36px13px @1024 (source content inset ~25px). Glyph 77x51 + 24px to quote. Quote
  Graphik Semibold #fff 28px -> 32px @1280, ls -0.03em. Attribution 16px #fff pinned bottom via
  margin-top:auto. Section gutters 16/40/48/64 + 1536 cap so edges line up with the cards/banner grid.
Verified vs source: @1280 photo 64->628 (564x592) + card 652->1216 (564x592), glyph 77x51, quote 32px,
  attribution pinned bottom — exact match. @390 stacked, photo 358x280, card below, quote 28px. @834
  50/50 row. Lint clean (0 err), breakpoint pass, overflow clean 360-1920.

### 2026-09-14 — columns.quote: fixed authoring (image inside block) + glyph/empty-p bugs
Author feedback (DA): the headshot was NOT inside the columns(quote) block — it was a loose image in the
banner section, so the block only held the glyph+text (wrong authoring model). Fixed WITHOUT re-import
(would lose other blocks' manual parity work):
  • content/index.plain.html + content/es/index.plain.html: moved the headshot picture to be the block's
    FIRST cell and the blue quote-glyph picture to lead the SECOND (card) cell → proper two-cell columns
    row: [headshot | glyph + quote + name + role].
  • blocks/columns/columns.js decorateQuote: simplified — no longer borrows the headshot across sections.
    Classifies the picture-only cell as .columns-quote-photo (optimized 750w) and the text cell as
    .columns-quote-card; lifts the leading glyph <picture> into .columns-quote-glyph, KEEPING only the
    <img> (drops EDS's webp <source>s that break SVGs → the glyph was rendering as a broken image on the
    published site); drops the empty <p> EDS leaves after the glyph is moved out; classes the first
    non-empty <p> as .columns-quote-text (32/28) and wraps the rest as .columns-quote-attribution (16px).
  • tools/importer/parsers/columns-quote.js: updated to author the same two-cell structure on future
    imports (scan the parent grid for the sibling portrait; glyph+paras in the card cell). Validated by the
    parser harness (captureConfident:true).
Verified via drafts (dev server serves REMOTE preview at /, so local content edits only render once synced
to DA — validated the corrected authoring on /drafts): @1280 photo 64→628 564×592 (real headshot),
card 652→1216, glyph 77×51 (not broken/giant), quote 32px, attribution 16px below. Lint clean, breakpoint
pass. NOTE: the block at / will keep showing the old (pre-edit) layout until content/index is synced to
the DA backend — the code + local content are correct.

### 2026-09-14 — columns.quote: attribution pushed to lower card (source parity)
Author feedback: the "Butch Staples / Nationally Recognized Coaching Leader" attribution was sitting right
under the quote; the source pushes it DOWN into the lower third of the card with a large gap after the
quote and reserved space below. Measured source (all vps): desktop gap 81 / attr→bottom 105 (card 592);
tablet gap 155 / 175 (card 730); mobile gap 24 / 44 (card 468) — i.e. on mobile the short card hugs
content, on tablet/desktop the taller card (stretched to the photo) pushes the attribution down but leaves
a reserved bottom band. Modeled with `.columns-quote-attribution { margin-top: auto }` (pushes down when
the card has spare height; stays near the quote on mobile) + a reserved card `padding-bottom: 105px` at
>=1024. Verified @1280: attr→cardBottom 106 (source 105), attribution in lower third — matches source.
Lint clean, breakpoint pass.

### 2026-09-14 — columns.quote: attribution typography parity (name not bold)
Typography audit vs source (390/834/1280): the attribution NAME "Butch Staples" is authored as <strong>
but the SOURCE renders it in Graphik Regular weight 400 — NOT bold — identical to the role line. Mine was
using Graphik Semibold (visually bold). Also the source attribution has letter-spacing: normal (no tracking),
while mine inherited the section's -0.03em. Fixed: `.columns-quote-attribution p` → Graphik Regular 16/19.2
letter-spacing normal; `.columns-quote-attribution p strong` → Graphik Regular 400 (override the strong).
Full attribution spec now matches source at all vps: name + role both Graphik Regular 400, 16px, lh 19.2,
ls normal, white. Quote unchanged (Graphik Semibold 28→32, ls -0.03em). Glyph renders 77×51 (SVG kept, webp
sources dropped). Lint clean, breakpoint pass.

### 2026-09-14 — columns.quote: attribution font-size scales (16→18→24) + card border confirmed
Source DevTools (user screenshot) showed the attribution rendering at "24px Graphik Regular" on desktop,
but my rebuild had flattened it to a fixed 16px. Restored the responsive scale confirmed in the earlier
typography audit: attribution (name + role) 16/19.2 (mobile+tablet) → 18/21.6 (@1024) → 24/28.8 (@1280),
all Graphik Regular weight 400, letter-spacing normal, white. Added the 18px @1024 and 24px @1280 bumps to
`.columns-quote-attribution p`. Confirmed the card's 1px white 20px-radius border renders (it was only
absent in the stale live view, which still serves pre-edit backend content). Verified @1440: name+role 24px
Graphik Regular 400, card border 1px #fff r20, attribution in lower third. Lint clean, breakpoint pass.

### 2026-09-14 — columns.quote: attribution flows naturally (not bottom-pinned) + gap scales
Correcting the prior margin-top:auto approach. Inspected the source card: it's display:block (NOT flex),
36px padding all sides, and the attribution FLOWS naturally after the quote with an authored gap that
scales with viewport — measured quote→name gap: 24px @390 / ~96px @1024 / 138px @1440; name font 16→18→24.
The card is a grid column stretched to the photo height, so natural empty space sits below the attribution
(no pinning). Replaced margin-top:auto + reserved-bottom-band with a scaling margin-top on
`.columns-quote-attribution`: 24px base → 96px @1024 → 138px @1280; card padding back to symmetric 36px
13px at desktop. Verified: @1440 cardH 676 (source 676), gap 138 (source 138), name 24px; @390 gap 24
(source 24), name 16px. Both match the source screenshots (desktop attribution higher; mobile just under
the quote). Lint clean, breakpoint pass.
