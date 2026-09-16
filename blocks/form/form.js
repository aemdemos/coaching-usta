/*
 * form — builds an accessible form from self-describing authored rows. Because
 * DA/EDS strips form controls from the content fragment, each field is authored
 * as a plain table row and the real <input>/<label>/<button> controls are
 * created here.
 *
 * Row shape (first cell = field type; remaining cells vary by type):
 *   text | <label> | <name>                     → single-line text input
 *   email | <label> | <name>                     → email input
 *   zip | <label> | <name>                        → text input (postal code)
 *   checkbox-group | <legend> | <name> | opt1, opt2, …
 *   legal | <consent / legal copy>                → static consent text
 *   submit | <button label>                       → submit button
 *
 * A row whose first cell isn't a known type is rendered as static markup
 * (headings, intro copy) so authors can mix explanatory content into the form.
 */

const FIELD_TYPES = new Set(['text', 'email', 'zip', 'tel', 'number', 'checkbox-group', 'legal', 'submit']);
const slug = (s) => (s || '').trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

function buildField(type, cells) {
  const cellText = (i) => (cells[i] ? cells[i].textContent.trim() : '');

  if (type === 'legal') {
    const p = document.createElement('div');
    p.className = 'form-legal';
    // cells[0] is the "legal" type marker; the copy lives in cells[1].
    if (cells[1]) p.append(...cells[1].childNodes);
    return p;
  }

  if (type === 'submit') {
    const wrapper = document.createElement('div');
    wrapper.className = 'form-actions';
    const button = document.createElement('button');
    button.type = 'submit';
    button.className = 'form-submit';
    button.textContent = cellText(1) || 'Submit';
    wrapper.append(button);
    return wrapper;
  }

  if (type === 'checkbox-group') {
    const legendText = cellText(1);
    const name = slug(cellText(2) || legendText);
    const options = cellText(3).split(/[,|]/).map((o) => o.trim()).filter(Boolean);
    const fieldset = document.createElement('fieldset');
    fieldset.className = 'form-checkbox-group';
    if (legendText) {
      const legend = document.createElement('legend');
      legend.textContent = legendText;
      fieldset.append(legend);
    }
    options.forEach((opt) => {
      const id = `${name}-${slug(opt)}`;
      const wrap = document.createElement('div');
      wrap.className = 'form-checkbox';
      const input = document.createElement('input');
      input.type = 'checkbox';
      input.id = id;
      input.name = name;
      input.value = opt;
      const label = document.createElement('label');
      label.setAttribute('for', id);
      label.textContent = opt;
      wrap.append(input, label);
      fieldset.append(wrap);
    });
    return fieldset;
  }

  // single text-like input (text, email, zip, tel, number)
  const labelText = cellText(1);
  const name = slug(cellText(2) || labelText);
  const wrapper = document.createElement('div');
  wrapper.className = 'form-field';
  const id = `form-${name}`;
  const label = document.createElement('label');
  label.setAttribute('for', id);
  label.textContent = labelText;
  const input = document.createElement('input');
  input.id = id;
  input.name = name;
  input.type = type === 'zip' ? 'text' : type;
  if (type === 'zip') {
    input.setAttribute('inputmode', 'numeric');
    input.autocomplete = 'postal-code';
  }
  if (type === 'email') input.autocomplete = 'email';
  wrapper.append(label, input);
  return wrapper;
}

export default function decorate(block) {
  const form = document.createElement('form');
  form.className = 'form-form';
  form.setAttribute('novalidate', '');

  [...block.children].forEach((row) => {
    const cells = [...row.children];
    const type = (cells[0] ? cells[0].textContent.trim().toLowerCase() : '');
    if (FIELD_TYPES.has(type)) {
      form.append(buildField(type, cells));
    } else {
      // static content row (heading / intro copy) — keep as-is
      const staticWrap = document.createElement('div');
      staticWrap.className = 'form-static';
      while (row.firstElementChild) staticWrap.append(row.firstElementChild);
      form.append(staticWrap);
    }
  });

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    form.classList.add('form-submitted');
  });

  block.replaceChildren(form);
}
