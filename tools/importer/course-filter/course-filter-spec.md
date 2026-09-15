# Course Filter widget — source investigation & spec

Source: https://www.ustacoaching.com/en/home/courses.html
Investigated: for EDS lift-and-shift parity.

## 1. Nature of the widget — CANNOT pull in as-is → RECREATE

- It is a **bespoke Vue component** (`.v-course-list`, mounted in a `data-v-app`) compiled into the
  source site's AEM clientlib bundle (`aem-course-list` grid column). It is **not** a third-party
  embeddable snippet, **not** an iframe, and exposes **no CORS** header — so there is nothing to
  "drop in". We must **recreate** it as an EDS block with parity.
- Data source: course tags/metadata come from a **public JSON API**
  `https://services.ustacoaching.com/v1/lms/courses/all` (31 courses). BUT the **card descriptions
  and badge images are AEM-authored** (keyed by course code) and are NOT in the API. So neither the
  API alone nor a live fetch reproduces the page — the descriptions must be captured (done below).
- Decision: build a **self-contained EDS block** with the course data authored/baked in (no runtime
  cross-origin fetch — API has no CORS and lacks descriptions anyway). This matches the
  content-import rule and keeps it a static, fast, no-dependency block.

## 2. Structure / behaviour

- **3 tabs** (top-filter pills) = coach-type personas: **Parents / School Tennis / Coaches**.
  Selecting a tab sets an applied filter chip and filters the card list to that coach type.
  Default active tab on load = **Coaches**.
- **Filter By** button opens a dropdown panel (absolute, white, 1px black border, 12px radius,
  width ~454px desktop) with 4 checkbox groups. Checking options adds chips into the applied-filters
  row (between Filter By and Sort) and narrows the list. "Apply filters" (black pill) commits.
- **Sort by** button opens a small panel: Default / A to Z / Z to A (radio). Default = API sort order.
- Each **card** has an expand chevron; expanding reveals a **module timeline** (bulleted list with
  ringed circles) of the course's modules. Long descriptions get a "..." (read more) truncation.
- **See More** button paginates (loads more cards).

### Tab → coachType mapping (API values)
- Parents → `PARENT_GUARDIAN_COACH`
- School Tennis → `SCHOOL_COACH`
- Coaches → `COLLEGE_COACH`, `FT_PROF_COACH`, `PT_PROF_COACH`, `VOLUNTEER_OR_EMERGING_COACH`

### Filter taxonomy (exact labels + API value mapping)
- **Coach type**: For Parents (`PARENT_GUARDIAN_COACH`), For School Coaches (`SCHOOL_COACH`),
  For Coaches (the 4 coach values above).
- **Certification**: USTA Coaching Professional (`USTA Professional Coach Certification`),
  USTA Coaching Specialist (Coming Soon), USTA Coaching Masters (Coming Soon).
- **Membership package**: Baseline / Rally / Pro / Pro Plus (`BASELINE`/`RALLY`/`PRO`/`PRO_PLUS`).
- **Languages**: English / Spanish (course `language`).

## 3. Design spec (computed from live source)

Container grid matches the site content grid (1288px inner @1440; gutters 16/40/48/64).

### Tabs bar (`.v-course-list__top-filters`)
- Wrapper panel: bg `#2d2d2d`, border-radius 20px, margin-bottom 100px (desktop).
- Row: flex-wrap, gap 16px (8px @mobile).
- Tab: flex column, align/justify center, padding `0 20px`, **margin 8px**, border-radius 20px,
  color #fff. Desktop tab width ≈ (row − margins)/3.
- **Active tab**: bg `#cfff05` (lime), color #000.
- Tab title: Graphik Regular, **fontWeight 700**; size 16px @desktop, 12px @768, 14px @390.
- Tab desc: Graphik Regular 400, 12px all viewports (hidden @390 — 0 size).

### Filter bar (`.v-course-list__buttons-wrapper`)
- flex row, gap 16px, justify space-between, margin-bottom 48px (wraps @mobile).
- **Filter By** / **Sort by** buttons: white bg, color #000, border-radius 12px, height 40px,
  Graphik Semibold 16px, padding `0 45px 0 25px` (desktop) / `0 35px 0 15px` (mobile). Chevron icon.
- **Applied filter chip**: bg #000, color #fff, **1px solid #fff**, border-radius 12px,
  padding `12px 34px 12px 16px`, Graphik Regular 16px, with an "×" remove affordance.

### Card (`.v-course`)
- bg #fff, border-radius 20px, display flex column, **gap 24px** (16px @mobile),
  padding **24px** (16px @mobile).
- Grid: **2-up @desktop (≥1024)**, **1-up @≤768**. Desktop card width 636 = (1288−16)/2, col-gap 16px,
  row-gap 24px (grid of `.v-course-list__courses > div`).
- Eyebrow (`__eyebrow`, "N modules"): Graphik Semibold; 18px/lh18/ls-0.54 @desktop, 16px/-0.48 @768,
  12px/-0.36 @390.
- Name (`__name`): Graphik Semibold; 32px/lh32/ls-0.96 @desktop, 28px/lh28/ls-0.84 @768,
  18px/lh18/ls-0.54 @390. color #000.
- Description (`__description`): Graphik Regular 16px, color #000, lh normal. Links underlined
  (`<u>`), open in new tab. "..." read-more truncation on long ones.
- **Expand button** (`__expand-button`): 48×48, border 2px solid #000, radius 12px, chevron SVG
  (down = expand). Positioned top-right of card.
- **Badge img** (`__badge`, for badge courses): 148×148 svg, sits at card bottom-right area.
  Source path `/content/dam/coaching/course-catalog/badges/<slug>.svg`.

### Expanded module timeline (`.v-course__modules`)
- ul, margin 16px 0. Each `.v-course__module`: flex, align center, gap 16px, margin-bottom 32px.
- `.v-course__timeline-circle`: 15×15, bg #fff, border 2px solid #000, border-radius 50%.
- `.v-course__module-text`: Graphik Regular 16px #000.

### See More button
- bg `#cfff05` lime, color #000, border 2px solid #000, border-radius 12px, padding 16px 24px,
  Graphik Semibold 18px, centered.

### Filter dropdown panel (`.v-course-list__filters-container`)
- position absolute, bg #fff, border 1px solid #000, radius 12px, width ~454px desktop.
- Header: "Filters" title + close ×. Each group = `<fieldset><legend>` + labels with checkboxes.
- Apply button: black bg, #fff, radius 12px, full width.

### Sort dropdown panel (`.v-course-list__sorting-container`)
- Header "Sort" + close. Radio group: Default / A to Z / Z to A.

## 4. Colors/fonts (already in project tokens)
- lime `#cfff05` = `--usta-lime`; blue `#0373f3` = `--usta-blue`; dark panel `#2d2d2d`; white cards.
- Fonts: Graphik Regular (body/name/desc), Graphik Semibold (eyebrow/buttons/name). Already self-hosted.
</content>
</invoke>
