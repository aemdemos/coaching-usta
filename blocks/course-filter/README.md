# course-filter

The USTA Coaching **course browser** (source: `/en/home/courses.html` → "Courses and Workshops"):
persona tabs, a *Filter By* panel, *Sort by*, and a grid of course cards that expand to their
module timeline, paged with *See More*.

It replaces the source's AEM **Content Fragments + Vue component** with an EDS block that reads
two things at runtime:

| Data | Where it comes from | Who edits it |
|---|---|---|
| Course **titles, module lists, filter tags, sort order** | USTA LMS API `GET https://services.ustacoaching.com/v1/lms/courses/all` (live, public) | USTA's course system (not authors) |
| Course **descriptions, badges, flags, prerequisites, unlock text**, the **tabs / filters** and **settings** | DA sheet `/en/course-catalog.json` — it holds **all** courses, the Spanish-language ones included; the DEV site reads `/en/course-catalog-dev.json` (see *Environments*). The Spanish *site* (`/es/` pages) is out of scope — see *Spanish* | Authors, in Document Authoring |
| Badge images | DA `/assets/media/course-catalog/badges/` | Authors |

The block itself has **no rows** — on a page it is an empty `Course Filter` block.

---

## How it works

```mermaid
flowchart TD
  A[Page loads with an empty<br/>Course Filter block] --> B{Locale?}
  B -->|"Spanish page"| C["es/course-catalog.json"]
  B -->|otherwise| D["en/course-catalog.json"]
  A --> E["LMS API<br/>lms/courses/all"]
  C --> F[Join by course code]
  D --> F
  E --> F
  F --> G{API course has a<br/>row in the sheet?}
  G -->|no| H[Not shown]
  G -->|yes| I[Course card:<br/>API title + modules<br/>+ sheet description, badge,<br/>hide modules, unlock text]
  I --> J[Sort: API sortSequence<br/>settings use-response-order]
  J --> K[Apply the selected tab /<br/>filters from the filters sheet]
  K --> L[Show the first N cards<br/>settings items-to-display<br/>+ See More]
```

1. **Load** — the API and the locale's sheet are fetched in parallel.
2. **Join** — each API course is matched to the sheet row with the same `code`.
   **Only API courses that have a sheet row are shown** (as on the source: no fragment → no card).
   If the sheet cannot be loaded at all, every API course is shown without description / badge.
3. **Card** — title, eyebrow (`N modules`, Spanish courses `N módulos`) and module timeline come from
   the API; description, badge and the unlock note from the sheet. `hideModules = true` shows
   `0 modules` and no timeline (workshops).
4. **Filter & sort** — the tabs and the *Filter By* panel are built from the `filters` sheet; a tab is
   one option of its filter group (tab, checkbox and chip always agree). Options in different groups
   narrow the list (AND); options in the same group widen it (OR). Sort: Default (API order), A–Z, Z–A.
5. **Page** — the first `items-to-display` cards, then *See More* adds the same number again.

---

## Environments (dev / prod)

The site is **repoless**: one code base, a DEV site and a PROD site, each with its own DA content and
its own sheets. Course links point at a different LMS (CSOD) per environment — pilot
`ustacoaching-pilot.csod.com` for DEV, `ustacoaching.csod.com` for PROD — so each environment has
its own sheet:

| Site | Sheet read |
|---|---|
| a site whose name contains `-dev` — `main--coaching-dev--usta-digital.aem.page` / `.aem.live` (any branch) | `/en/course-catalog-dev.json` (pilot links) |
| every other host (PROD site, its preview, the production domain, local preview) | `/en/course-catalog.json` (production links) |

If a DEV sheet is missing (e.g. Spanish), the DEV site falls back to the PROD sheet. Both sheets have
the same columns; keep the course content the same and only the links environment-specific.

```mermaid
flowchart LR
  H[Host name] --> D{site name<br/>contains -dev?}
  D -->|yes| S1["course-catalog-dev.json"]
  S1 -->|missing| S2
  D -->|no| S2["course-catalog.json"]
```

---

## Spanish — Spanish courses vs. the Spanish site

Two different things:

**1. Spanish-language courses — in scope, part of the EN course set.** The LMS returns Spanish courses
alongside the English ones (API `language: "Spanish"`), and the source's **EN** courses page shows them
as cards. They are ordinary rows of the EN sheets (both `course-catalog.json` and
`course-catalog-dev.json`):

| Code | Course | Shown today |
|---|---|---|
| `PA-NB1022S` | Introduzca a su Hijo al Tenis (Introduce Your Child to Tennis) | yes — Parents tab |
| `INC-B1001S` | Introducción al Entrenamiento 1 (Intro to Coaching 1) | yes — Coaches tab |
| `INC-B1002S` | Introducción al Entrenamiento 2 (Intro to Coaching 2) | yes — Coaches tab |
| `ITC-B1001S`, `ITC-B1002S` | the new Intro to Coaching codes (customer export) | not yet — the API doesn't return them |

Their eyebrow reads `N módulo(s)` (from the API `language`), their description is the Spanish copy in
the row, and the *Languages → Spanish* filter selects them. Verified against the source EN page
(2026-11-20): the same Spanish cards on every tab, same totals (Parents 9, School Tennis 9, Coaches 29).

**2. The Spanish site (`/es/` pages) — OUT OF SCOPE for now.** Customer decision: the `/es/` pages will
be produced by **Smartling** translating the EN pages automatically; no Spanish (ES) content is migrated.
State left behind for when ES is revisited:

- `/es/course-catalog.json` exists in DA (and on preview): a **one-off export of the live Spanish
  courses page** (2026-11-19: 48 rows, production links, plain-text descriptions — 5 descriptions are
  Spanish translations of the EN copy, the rest identical; same tabs / filters / settings). It is **not
  maintained** and was not rebuilt from the customer's `courses.json`. There is no `/es/course-catalog-dev.json`.
- On an `/es/` page the block reads `/es/course-catalog.json` (DEV site: `/es/course-catalog-dev.json`,
  falling back to `/es/course-catalog.json`). **If no Spanish sheet exists it does NOT fall back to the
  EN sheet**: every API course is then shown without description / badge, and without tabs or filters.
- To decide when ES comes back:
  1. Does Smartling translate the catalog **sheet** (JSON) as well as the pages? If yes, the translated
     `/es/course-catalog.json` simply replaces today's export (same columns; translate `description`,
     `conditionalDescription`, the `filters` titles and the `settings` labels; keep `code`, flags,
     paths and links).
  2. If not: either let `/es/` pages fall back to the EN sheet (a small code change in `loadCatalog()`),
     or keep a hand-maintained ES sheet (per environment, like EN).
  3. Labels still hard-coded in English in the block: *Filter By*, *Sort by*, *Apply filters*, the sort
     options and the close buttons' labels — they need translations (e.g. move them to the `settings`
     tab or the placeholders sheet). The module words are already Spanish for Spanish courses.
  4. Spanish course links (`Also available in [Spanish](…)`) are in the EN rows already.

---

## Course data source and open items

The `courses` rows come from the customer's **Content Fragment export** `courses.json` (pilot / QA
environment; kept in `tools/importer/course-filter/source/courses-fragments-dev.json`): 61 fragments,
59 with a code (the 2 code-less "electives" fragments can't match a course and are skipped). The tabs /
filters / settings come from the live courses page (the export has no component config).

- **Coverage (2026-11-19):** every course the public LMS API returns has a row; the export adds 11 codes
  the API doesn't return yet — `BLV-B1001` (blind & low vision), `CWT-W1010` (wheelchair tennis
  workshop), `ITC-B1001` / `-S` / `-GC`, `ITC-B1002` / `-S` / `-GC` (new Intro to Coaching codes),
  `SAS-00001` (athlete-safety course), `YPC-B1001`, `YPP-B1001` (youth pathway). Their rows exist; they
  appear as soon as the API returns them.
- **Content:** the export differs from the live page on ~7 courses (e.g. `CWT-B1015` AND instead of OR,
  `INC-B1001S` now requires the Development Badge + Rally and has a badge) — the export was adopted
  for all courses (customer decision).
- **New column:** `isWorkshop` (stored; the 4 workshops).

Open items:

| Item | Status |
|---|---|
| 5 badge images that exist only on pilot: `associate-icon-1.png`, `associate-icon-2.png`, `blind-and-visually-impaired-icon`, `youth-pathway-coaches-icon`, `youth-pathway-parents-icon` | to be supplied (rows already point at `/assets/media/course-catalog/badges/<name>.png`; until then those cards show no badge, e.g. Intro to Coaching 1 EN + ES) |
| PROD links for the "Spanish." links of `ITC-B1001`, `ITC-B1002` (+ `-GC`) | unknown until the courses exist in production — kept as pilot links in the PROD sheet |
| LMS API per environment | the block calls the production API `services.ustacoaching.com` on every site; a pilot API for DEV, if there is one, can be switched in like the sheet |
| `general-elective-badge.png` (rasterized from the production DAM) | in the workspace; upload with the sheets |
| Signed-in states (Start / Continue / Locked / Review) | need EDS sign-in + the user APIs — see *Prerequisites and locks* |
| Spanish site | out of scope (Smartling) — see *Spanish* |

---

## The sheet: `/en/course-catalog.json` (and `/es/…`)

One DA spreadsheet with three tabs. Edit it in DA, then **preview** (and **publish**) it — the page
picks up the change on the next load; no code change, no page edit.

### Tab `courses` — one row per course (= one AEM Content Fragment)

| Column | AEM fragment field | Used by the block | Notes |
|---|---|---|---|
| `code` | Code | **Join key** | Must equal the LMS course code exactly (e.g. `ACS-B1009`). |
| `courseName` | — | no (reference only) | The title shown comes from the API. Here only to help authors find the row. |
| `description` | Description | yes | **Plain text** — see *Writing descriptions*. |
| `logoPath` | Logo Path | yes | Badge image, e.g. `/assets/media/course-catalog/badges/cardio-tennis.png`. Empty = no badge; a path whose image isn't uploaded yet shows no badge (not a broken image). |
| `sourceLogoPath` | (the AEM DAM path) | no | Traceability only. |
| `isAdvancedMembershipRequired` | "Rally or above" | stored* | `true` / `false` |
| `ignoreSafePlayForMinors` | Ignore SafePlay for minors (under 18) | stored* | `true` / `false` |
| `hideModules` | Hide modules | yes | `true` → `0 modules`, no timeline. |
| `isWorkshop` | Workshop | no (stored) | `true` for workshops (CAR-W1010, INC-W1010-IP, INC-W1010-OD, CWT-W1010). |
| `constraint` | Constraint | stored* | empty, `Development Badge Required` or `Specific Course Required` |
| `requiredCourseCode` | Required Course Code | stored* | comma-separated codes, e.g. `DEP-B1005, DEP-B1005-GC` |
| `logicalOperator` | Logical Operator | stored* | `OR` or `AND` |
| `courseNameForLocker` | Course Name For Locker | stored* | the name put into the locked-button text |
| `conditionalDescription` | Conditional Description | yes | the "To unlock this course…" note, shown under the description (plain text). |

\* *stored* = read by the block and kept on each card (`course.rules`) for the **signed-in states**
(Start / Continue / Locked / Review). Those need sign-in on EDS and the user-status APIs — see
*Prerequisites and locks*. Signed-out visitors (everyone today) see what the source shows them:
the description and the unlock note.

Rows whose code ends in `-GC` (grandfathered courses) are only returned by the signed-in API; they
are kept for completeness and have no effect today.

### Writing descriptions (no HTML)

- Plain text. A blank line starts a new paragraph.
- Links: `[the words to show](https://the-address)` — underlined; links to other sites open in a new tab.
  Example: `Also available in [Spanish](https://ustacoaching.csod.com/…).`
- Do **not** add an empty line before the unlock note — the block adds that space itself.

### Tab `filters` — the tabs and the *Filter By* panel

| Column | Meaning |
|---|---|
| `sectionTitle` | the group heading in the panel (`Coach type`, `Certification`, `Membership package`, `Languages`) |
| `filtersDataPath` | which API field the group tests: `filters.coachTypes`, `filters.certifications`, `filters.membershipPackages`, `language` |
| `filterTitle` | the option label (and its chip) |
| `filterValue` | the API value(s) to match; **comma-separated = any of them** (e.g. `FT_PROF_COACH, PT_PROF_COACH, COLLEGE_COACH, VOLUNTEER_OR_EMERGING_COACH`) |
| `addToTopFilters` | `true` → also a **tab** above the cards |
| `appliedByDefault` | `true` → selected on load (today: *Coaches*) |
| `topFilterTitle`, `topFilterDescription` | the tab's title and line (e.g. *Coaches* / *I coach a team or individuals.*) |

An option that **no course carries** is shown disabled (the *Coming Soon* certifications) — it turns
on by itself once the API tags a course with that value.

### Tab `settings`

| Key | Used | Meaning |
|---|---|---|
| `items-to-display` | yes | cards per page (16) |
| `show-more-button-title` | yes | the *See More* label |
| `empty-message` | yes | shown when no course matches |
| `use-response-order` | yes | `true` = API sort order; `false` = the row order of the `courses` tab |
| `url-filter-parameter`, `hide-description`, `hide-badge-path`, `hide-eyebrow`, `hide-modules` | no | recorded from the AEM component; not wired yet |

---

## Common tasks

```mermaid
flowchart LR
  T1[Edit a course's<br/>description / badge /<br/>unlock note] --> S[Edit its row in the<br/>courses tab]
  T2[Show a course that<br/>is in the LMS] --> R[Add a row with its<br/>exact code]
  T3[Hide a course] --> X[Delete its row]
  T4[Brand-new course] --> L[Create it in the LMS first<br/>→ then add its row]
  T5[New filter option / tab] --> F[Add a row in the<br/>filters tab]
  S --> P[Preview → Publish the sheet]
  R --> P
  X --> P
  L --> P
  F --> P
```

- **Edit a course** — change `description`, `logoPath`, `hideModules` or `conditionalDescription` in its
  row. Preview → publish.
- **Add (show) a course** — the course must already exist in the LMS API (titles, modules and filter tags
  live there). Add a row with its exact `code`; fill `description` (and `logoPath` if it has a badge).
  A row whose code the API doesn't return shows nothing.
- **Create a brand-new course** — create it in USTA's LMS first (the sheet cannot create titles or
  modules), then add its row.
- **Hide a course** — delete its row (the API may keep returning it; without a row it isn't shown).
- **New badge image** — upload the PNG (2× size, e.g. 296 px for a 148 px badge) to
  `/assets/media/course-catalog/badges/`, preview it, then set the row's `logoPath`.
- **New filter option or tab** — add a `filters` row with the API value; set `addToTopFilters` for a tab.
  The value must be one the API uses in that field.
- **Change the default tab** — move `appliedByDefault = true` to another option.
- **Spanish-language course** — edit / add its row in the EN sheet like any other course (e.g.
  `INC-B1001S`); the API's `language` makes it a Spanish card. The `/es/` site is out of scope — see *Spanish*.

---

## Prerequisites and locks (e.g. "Applied Coaching Skills: Group")

Every field of the AEM fragment's *Constraint* section is a column of the course's row. For
**Applied Coaching Skills: Group** (`ACS-B1009`):

| AEM fragment field | Sheet column | Value |
|---|---|---|
| Rally or above required | `isAdvancedMembershipRequired` | `true` |
| Hide modules | `hideModules` | `false` |
| Constraint | `constraint` | `Specific Course Required` |
| Required Course Code | `requiredCourseCode` | `DEP-B1005, DEP-B1005-GC` |
| Logical Operator | `logicalOperator` | `OR` |
| Course Name For Locker | `courseNameForLocker` | `Developing Junior and Adult Players Badge` |
| Conditional Description | `conditionalDescription` | `To unlock this course you will have to complete the Developing Junior and Adult Players Badge and have a Rally or above package.` |

So yes — authors set up a group course (or any locked course) entirely in the sheet. What each
visitor sees:

- **Signed out (today, everyone):** the card with its description and the unlock note — exactly what
  the source shows a signed-out visitor.
- **Signed in (source behaviour, not built on EDS yet):** the rules decide the card's button:

```mermaid
flowchart TD
  U[Signed-in coach] --> P{isAdvancedMembershipRequired<br/>and package = Baseline?}
  P -->|yes| LK[Locked:<br/>upgrade to a Rally package]
  P -->|no| SP{API isSafePlayRequired and<br/>Safe Play not approved?<br/>unless under 18 and<br/>ignoreSafePlayForMinors}
  SP -->|yes| LK2[Locked: complete Safe Play]
  SP -->|no| C{constraint}
  C -->|Development Badge Required| DB{Development Coach<br/>Badge completed?}
  DB -->|no| LK3[Locked: complete the<br/>Development Coach Badge]
  C -->|Specific Course Required| SC{requiredCourseCode<br/>+ logicalOperator}
  SC -->|OR: none completed<br/>AND: any missing| LK4[Locked: Complete the<br/>courseNameForLocker …]
  DB -->|yes| ST[Start / Continue / Review]
  SC -->|satisfied| ST
  C -->|empty| ST
```

(`OR` = completing **any one** of the codes unlocks; `AND` = **all** must be completed. The `-GC` code
lets grandfathered completions count.) Building the signed-in states needs EDS sign-in plus the
user APIs the source calls: `/profile/lightweight`, `/lms/courses/me/achievements`,
`/lms/courses/me/{code}/status`, `/lms/courses/me/all`.

---

## For developers

- Files: `course-filter.js` (data load, join, filters, cards), `course-filter.css`.
- Catalog URL: `${localePrefix() || '/en'}/course-catalog[-dev].json` (multi-sheet JSON: `courses`,
  `filters`, `settings`); `-dev` on a `-dev` site, falling back to the PROD sheet (`loadCatalog()`).
  `/es/` pages use the `/es/` sheet and do not fall back to EN.
- Description cells: plain text + `[text](url)` (rendered with `createElement`, http/https/mailto only);
  a cell that still holds HTML renders through an allow-list — never `innerHTML`.
- Re-export: `node tools/importer/course-filter/export-course-catalog.mjs [--fragments <courses.json>]`.
  Without `--fragments` it reads the AEM props on `/en|es/home/courses.html`. With the customer's
  Content Fragment export (kept in `tools/importer/course-filter/source/courses-fragments-dev.json`)
  the EN rows come from that file: `course-catalog-dev.json` as-is (pilot links) and
  `course-catalog.json` with each pilot link swapped for its production link (learned from the live
  page; links with no known production counterpart are reported). Tabs / filters / settings always
  come from the live page. **It overwrites the local sheets** — use it to re-seed, not after authors
  have edited DA.
- Site detection: `isDevSite()` — the `--<site>--` part of the host name contains `-dev`.
- Not authorable yet: the *Filter By* / *Sort by* / *Apply filters* / sort-option labels and the
  module words are in the code (English; Spanish module words).
- History and parity notes: `MIGRATION.md` (course-filter entries).
