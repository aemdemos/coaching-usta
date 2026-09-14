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
