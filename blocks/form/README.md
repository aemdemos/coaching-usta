# form

Adaptive Forms (document-based) **form** block — `form.js` is the
adobe-rnd/aem-boilerplate-forms runtime.

## Authoring (Document Authoring)

Every form follows the same pattern:

1. **Sheet** — the form definition lives in a DA spreadsheet under `/forms/`
   (e.g. `/forms/subscribe.json`). One row per field; columns: `Name`, `Type`,
   `Label`, `Mandatory`, `Options`, `OptionNames`, `Value`, `Max`, `Pattern`,
   `richText`, `Required Error Message`, `Pattern Error Message`, `Style`, and
   optionally `Fieldset` (parent panel's `Name`) + `Custom Type` (component).
2. **Page** — a single-cell `form` block whose content is a link to the sheet
   (`/forms/<name>.json`). Drafts live under `/drafts/shivani/`.
3. **Styles** — `Style` values become classes on each field wrapper
   (`<form>-heading`, `<form>-submit`, …). Each form gets its own scoped CSS
   file (`subscribe.css`, `gallagher-disclaimer.css`) `@import`ed at the top of
   `form.css`; never put form-specific rules in the shared `form.css`.

Submit row: `Value` is the thank-you message, or an `https://…` URL to redirect
to after a successful submit.

| Sheet | Page | CSS |
| --- | --- | --- |
| `/forms/subscribe.json` | `/drafts/shivani/subscribe-form` | `subscribe.css` |
| `/forms/lead-interests.json` | `/drafts/shivani/coaching-document` | — |
| `/forms/flag-profile.json` | `/drafts/shivani/flag-form` | — |
| `/forms/gallagher-disclaimer.json` | `/drafts/shivani/gallagher-disclaimer-form` | `gallagher-disclaimer.css` |

## Components

Set via the sheet's `Custom Type` column; registered in `mappings.js`, loaded
from `components/<name>/`.

- **accordion** — a `fieldset` row with `Custom Type: accordion`; each CHILD
  `fieldset` (rows whose `Fieldset` = the accordion's `Name`) is one item, its
  `Label` the item title, and ITS children the item body. Items start collapsed,
  single-open; the toggle is a `<button aria-expanded>` in the legend. Styled as
  the site's pill card (white border → lime when open, +/- glyph).
- **repeat** — repeatable panels (boilerplate).

Rich text: set `richText: true`; the `Label` may carry `<p>`, `<ul>/<li>`, `<a>`,
etc. (block-level markup renders in a `<div>`, inline markup in a `<p>`).

## Universal Editor fields

N/A (Document Authoring project)
