# Form authoring templates

- **`form-template.csv`** — a starter form covering every common field type and the complex patterns:
  a `plain-text` heading, required text/email/tel inputs, a `Value Expression` derived field
  (`fullName`), two `select`s, a **conditional** field (`sdsProduct`, shown only when
  `requestType = "SDS Request"` via `Visible Expression`), a `checkbox-group` with `OptionNames`,
  a `textarea` with a max length, a consent `checkbox`, a `captcha`, and a `submit` with a
  thank-you message.

## How to use
1. Open in Excel / Google Sheets (or paste into a DA sheet). **Row 1 is the header** — do not rename
   the columns. Each subsequent row is one field.
2. Delete the rows/columns you don't need, edit labels/options. Keep `Name` values unique and camelCase.
3. **Cell references in `Visible Expression`/`Value Expression` are by ROW NUMBER** (header = row 1,
   first field = row 2). If you insert or reorder rows, fix the references (e.g. `=$B$9="SDS Request"`
   points at whatever field is on row 9). See the parent `SKILL.md` Part E.
4. Save the sheet to DA at `/forms/<name>.json`, then reference it from a `form` block via a **real
   anchor** (never a raw-typed URL — DA slugifies `.json` → `-json`).

See `../SKILL.md` for the full column reference, the `Type` values, and the screenshot→sheet recipe.
