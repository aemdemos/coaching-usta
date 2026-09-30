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

Type `captcha` rows render reCAPTCHA v3: put the site key in the row's Value. Without a key
the captcha is skipped quietly (console warning, no token sent).

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

## Universal Editor fields

N/A (Document Authoring project)
