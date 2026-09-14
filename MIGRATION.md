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
- [ ] Run the quality gate on the migrated homepage: `check:overflow`, `check:typography`, `test:a11y`
      (needs `npm install` + `npx aem up`) and fix any drift/overflow.
- [ ] Re-verify the type scale against the live source (`npm run discover:typography … --write`).
- [ ] Measure per-section content-wrapper widths and wire a shared grid/container if needed.

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
