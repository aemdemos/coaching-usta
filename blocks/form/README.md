# form

Adaptive Forms boilerplate **form** block, driven by a DA sheet.

## Authoring (Document Authoring)

Model: `standalone`

Single block table. Content: one row, one cell holding a link to the form sheet
(`/forms/{name}.json`, stored in DA under `/forms`). One row per field in the sheet;
columns: Name, Type, Label, Mandatory, Options, OptionNames, Value, Max, Pattern, richText,
Required Error Message, Pattern Error Message, Style, plus (as needed) Fieldset (group rows
into a panel), Column Span (12-col span), Description (help text), Placeholder, Accept,
maxFileSize. Per-form styling lives in its own scoped CSS file imported by `form.css`.

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

## Universal Editor fields

N/A (Document Authoring project)
