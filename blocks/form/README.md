# form

Adaptive Forms boilerplate **form** block, driven by a DA sheet.

## Authoring (Document Authoring)

Model: `standalone`

Single block table. Content: one row, one cell holding a link to the form sheet
(`/forms/{name}.json`, stored in DA under `/forms`). One row per field in the sheet;
columns: Name, Type, Label, Mandatory, Options, OptionNames, Value, Max, Pattern, richText,
Required Error Message, Pattern Error Message, Style, plus (as needed) Fieldset (group rows
into a panel), Column Span (12-col span), Description (help text; on the submit row: the
submission-failure message), Placeholder, Accept (`.pdf,.docx,…` or MIME types), maxFileSize,
and this project's additions: **Autocomplete** (HTML autocomplete token, e.g. `given-name`,
`email`, `postal-code` — WCAG 1.3.5), **Input Mode** (`numeric`, `decimal`, `tel`…) and
**Heading Level** (Type `heading` rows: 2–6, default 2). Submit row Value = thank-you message
(or an `https://` redirect URL).

Per-form styling lives in its own scoped CSS file: `subscribe.css` is imported by `form.css`
(it themes every form); variant files (`application.css`) are loaded on demand by `form.js`
(`VARIANT_STYLES`) only when a block carries the variant class.

| Sheet | Page |
|---|---|
| `/forms/subscribe.json` | home page subscribe (styles: `subscribe.css`) |
| `/forms/lead-interests.json`, `/forms/flag-profile.json` | `/drafts/shivani/coaching-document`, `/drafts/shivani/flag-form` |
| `/forms/education-equivalency.json`, `/forms/industry-experience.json` | equivalency application (styles: `application.css`) |

## Supported variations

- `application` — "Form (application)": the navy Formstack-style application card
  (Open Sans, 12px/36px inputs, sub-labels under grouped inputs, pink inline error pills).
  Also rendered inside "Tabs (application)": a tab panel holding only a `/forms/*.json` link
  becomes a form, and the tabs variant is passed on.

Type `captcha` rows render reCAPTCHA (v3 / Enterprise score key, explicit render — one script
per page): put the site key in the row's Value. Without a key the captcha is skipped quietly
(console warning, no token sent). Badge placement is chosen by the form theme: a captcha wrapper
with `--captcha-badge: inline` (application.css) hosts the badge inside the form — for
`application`, at the card's bottom-right corner, collapsed to the logo and sliding open on
hover like the source embed; otherwise Google's fixed bottom-right badge is used.

The `application` variant validates each field on blur (`form.dataset.validateOn = "blur"`,
source behaviour) and shows one error pill per grouped field (Name, Address) — `.panel-error`,
hidden on other forms.

## Submission contract (for the backend)

The frontend is complete: validation, error/summary/success/failure states and the
submitting state are all rendered client-side. The backend only has to accept the request
below and answer with a 2xx (success) or anything else (failure).

- **Endpoint**: `https://forms.adobe.com/adobe/forms/af/submit/{base64("/forms/{name}.json")}`
  (Adobe Forms submission service; needs the sheet's incoming-data setup). The URL is built in
  one place — `prepareRequest()` in `submit.js` — change it there to post to your own endpoint.
- **Headers**: `x-adobe-form-hostname: {page hostname}`.
- **Body — no files attached**: `Content-Type: application/json`,
  `{ "data": { "__id__": …, "{field Name}": "value", …, "g-recaptcha-response": "token|null" } }`.
  Checkbox groups send a comma-separated string; empty optional fields send `""`.
- **Body — with files**: `multipart/form-data`; part `data` holds the same JSON string, and each
  file is a part named after its field (`intlProof`, `domesticProof`, `resume`,
  `coachUpCertification`). Files are already checked client-side against Accept + maxFileSize
  (10 MB) — re-validate server-side.
- **Response**: 2xx → the green success banner shows the submit row's Value (thank-you
  message; an `https://` Value redirects instead) and the form resets; non-2xx or a network
  error → the red failure banner shows the submit row's Description. The response body is not
  read on success.
- **reCAPTCHA v3**: put the site key registered for the production domain in the captcha row's
  Value; verify `g-recaptcha-response` server-side. Without a key no token is sent.

## Accessibility behaviour

Invalid submit: every invalid control gets `aria-invalid="true"` and `aria-describedby` → its
inline message; one "Please correct the highlighted fields." `role="alert"` summary is shown
below the form title; focus moves to the first invalid field. The summary disappears once all
fields are valid. Success (`role="status"`) and failure (`role="alert"`) banners take focus.
Author HTML (help text, thank-you message) is sanitized to a small tag allow-list.
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
   (`/forms/<name>.json`). Drafts live under `/drafts/shivani/`. For the
   source's "intro left, form right" layout, put the heading + intro as default
   content in the form's section and set section style `split, intro-text`
   (styles.css: `split` = generic 50/50 layout, `intro-text` = the intro's type).
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

Gallagher Style classes (`gallagher-disclaimer.css`): `gallagher-disclaimers`
(accordion panel), `gallagher-legal` (item body list), `gallagher-optin` (a
`checkbox` row — label left, box right, dark panel; Pro-Plus opt-in),
`gallagher-copy` (eligibility text), `gallagher-submit` (lime pill). Its
selectors out-rank the shared dark theme in `subscribe.css`, so they don't
depend on `@import` order.

Rich text: set `richText: true`; the `Label` may carry `<p>`, `<ul>/<li>`, `<a>`,
etc. (block-level markup renders in a `<div>`, inline markup in a `<p>`).

## Universal Editor fields

N/A (Document Authoring project)
