/* eslint-disable */
/* global WebImporter */
/**
 * Parser for form. Base block: form.
 * Source: https://www.ustacoaching.com/ (.v-leads newsletter signup)
 * Generated for USTA Coaching homepage migration (da project).
 *
 * Target decorate() (blocks/form/form.js) rebuilds the controls from
 * self-describing rows. Each row's FIRST cell is a field type; remaining cells
 * carry label/name/options:
 *   email | <label> | <name>
 *   zip   | <label> | <name>
 *   text  | <label> | <name>
 *   checkbox-group | <legend> | <name> | opt1, opt2, …
 *   legal | <consent copy>
 *   submit | <button label>
 * A row whose first cell isn't a known type renders as static content, so the
 * intro heading is emitted as a static row.
 *
 * DA/EDS strips real form markup from the fragment, so we emit plain table rows
 * describing each control rather than the live <input>/<label>/<button> nodes.
 * The live DOM renders custom widgets (.form-text-input, .v-checkbox-group,
 * .v-leads__terms-message, .coaching-primary-button); selectors below target
 * those with fallbacks to the simpler cached structure.
 */
export default function parse(element, { document }) {
  const cell = (text) => {
    const div = document.createElement('div');
    div.textContent = text;
    return div;
  };
  const clean = (s) => (s || '').replace(/^\*+/, '').replace(/\s+/g, ' ').trim();

  const cells = [];

  // Optional intro heading (static content row).
  const title = element.querySelector('.v-leads__title, h1, h2, h3');
  if (title && title.textContent.trim()) {
    const h = document.createElement('h2');
    h.textContent = title.textContent.trim();
    cells.push([[h]]);
  }

  // Text-like fields (email, zip, text). Live: .form-text-input; cached: .v-leads__field.
  const textFields = element.querySelectorAll('.form-text-input, .v-leads__field');
  textFields.forEach((node) => {
    const labelEl = node.querySelector('label');
    const rawLabel = labelEl ? clean(labelEl.textContent) : '';
    const input = node.querySelector('input');
    const inputType = input ? (input.getAttribute('type') || '').toLowerCase() : '';
    const name = input ? (input.getAttribute('name') || '') : '';

    // Determine field type from input type, name, or label.
    let type = 'text';
    if (inputType === 'email' || /email/i.test(rawLabel) || /email/i.test(name)) type = 'email';
    else if (/zip|postal/i.test(rawLabel) || /zip|postal/i.test(name) || node.querySelector('.form-text-input__counter')) type = 'zip';

    const fieldName = name || clean(rawLabel).toLowerCase().replace(/[^a-z0-9]+/g, '-');
    cells.push([cell(type), cell(rawLabel), cell(fieldName)]);
  });

  // Checkbox group. Live: .v-checkbox-group; cached: fieldset.v-leads__checkbox-group.
  const group = element.querySelector('.v-checkbox-group, fieldset');
  if (group) {
    const legendEl = group.querySelector('.v-checkbox-group__title, legend');
    const legend = legendEl ? clean(legendEl.textContent) : '';
    let options = [...group.querySelectorAll('.v-checkbox__text')].map((o) => clean(o.textContent));
    if (!options.length) options = [...group.querySelectorAll('label')].map((l) => clean(l.textContent));
    options = options.filter(Boolean);
    if (legend || options.length) {
      cells.push([cell('checkbox-group'), cell(legend), cell('coach-type'), cell(options.join(', '))]);
    }
  }

  // Legal / consent copy — preserve links. Live: .v-leads__terms-message; cached: p.v-leads__legal.
  const legalNode = element.querySelector('.v-leads__terms-message, .v-leads__legal');
  if (legalNode && legalNode.textContent.trim()) {
    const legal = document.createElement('div');
    // Prefer the inner <p> so we carry a clean paragraph with its anchors.
    const source = legalNode.querySelector('p') || legalNode;
    legal.append(...source.cloneNode(true).childNodes);
    cells.push([cell('legal'), legal]);
  }

  // Submit button. Live: button.coaching-primary-button; cached: button.v-leads__submit.
  const submit = element.querySelector('.v-leads__submit, button.coaching-primary-button, button[type="submit"], button');
  if (submit && submit.textContent.trim()) {
    cells.push([cell('submit'), cell(clean(submit.textContent))]);
  }

  // Empty-block guard.
  if (!cells.length) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const block = WebImporter.Blocks.createBlock(document, { name: 'form', cells });
  element.replaceWith(block);
}
