import {
  DEFAULT_ERROR_MESSAGE, DEFAULT_ERROR_SUMMARY, DEFAULT_THANK_YOU_MESSAGE, getSubmitBaseUrl,
} from './constant.js';
import { sanitizeHTML } from './util.js';

/**
 * Builds a form-level banner ("form-message"). Success banners are a polite
 * status; errors and the validation summary are alerts. Banners are
 * focusable so keyboard and screen-reader users can be moved onto them.
 * @param {'success'|'error'|'summary'} type
 * @param {string|DocumentFragment} content
 */
function createFormMessage(type, content) {
  const message = document.createElement('div');
  message.className = `form-message ${type === 'summary' ? 'error-summary' : `${type}-message`}`;
  message.tabIndex = -1;
  message.setAttribute('role', type === 'success' ? 'status' : 'alert');
  message.replaceChildren(content);
  return message;
}

// Form-level errors go below the form's title (a leading heading / plain-text
// row), else at the very top of the form.
function insertAtTop(form, message) {
  const title = form.firstElementChild?.matches('.heading-wrapper, .plain-text-wrapper')
    ? form.firstElementChild : null;
  if (title) title.after(message);
  else form.prepend(message);
}

export function clearFormMessages(form) {
  form.querySelectorAll('.form-message').forEach((el) => el.remove());
  form.parentNode?.querySelectorAll(':scope > .form-message').forEach((el) => el.remove());
}

function endSubmitting(form) {
  form.setAttribute('data-submitting', 'false');
  form.removeAttribute('aria-busy');
  const button = form.querySelector('button[type="submit"]');
  if (button) button.disabled = false;
}

export function submitSuccess(e, form) {
  const { payload } = e;
  const redirectUrl = form.dataset.redirectUrl || payload?.body?.redirectUrl;
  const thankYouMsg = form.dataset.thankYouMsg || payload?.body?.thankYouMessage;
  clearFormMessages(form);
  if (redirectUrl) {
    window.location.assign(encodeURI(redirectUrl));
  } else {
    const thankYouMessage = createFormMessage(
      'success',
      sanitizeHTML(thankYouMsg || DEFAULT_THANK_YOU_MESSAGE),
    );
    form.parentNode.insertBefore(thankYouMessage, form);
    thankYouMessage.focus({ preventScroll: true });
    thankYouMessage.scrollIntoView?.({ behavior: 'smooth', block: 'center' });
    form.reset();
  }
  endSubmitting(form);
}

export function submitFailure(e, form) {
  clearFormMessages(form);
  const errorMessage = createFormMessage('error', form.dataset.errorMsg || DEFAULT_ERROR_MESSAGE);
  insertAtTop(form, errorMessage);
  errorMessage.focus({ preventScroll: true });
  errorMessage.scrollIntoView({ behavior: 'smooth', block: 'center' });
  endSubmitting(form);
}

function generateUnique() {
  return new Date().valueOf() + Math.random();
}

function getFieldValue(fe, payload) {
  if (fe.type === 'radio') {
    return fe.form.elements[fe.name].value;
  } if (fe.type === 'checkbox') {
    if (payload[fe.name]) {
      if (fe.checked) {
        return `${payload[fe.name]},${fe.value}`;
      }
      return payload[fe.name];
    } if (fe.checked) {
      return fe.value;
    }
  } else if (fe.type !== 'file') {
    return fe.value;
  }
  return null;
}

function constructPayload(form) {
  const payload = { __id__: generateUnique() };
  [...form.elements].forEach((fe) => {
    if (fe.name && !fe.matches('button') && !fe.disabled && fe.tagName !== 'FIELDSET') {
      const value = getFieldValue(fe, payload);
      if (fe.closest('.repeat-wrapper')) {
        payload[fe.name] = payload[fe.name] ? `${payload[fe.name]},${fe.value}` : value;
      } else {
        payload[fe.name] = value;
      }
    }
  });
  return { payload };
}

function getFiles(form) {
  return [...form.querySelectorAll('input[type="file"][name]:not(:disabled)')]
    .flatMap((input) => [...(input.files || [])].map((file) => [input.name, file]));
}

/**
 * Request contract (see blocks/form/README.md → "Submission contract"):
 * - no files: JSON `{ data: { field: value, … } }`
 * - with files: multipart/form-data — part `data` holds the same JSON, and
 *   each file is a part named after its field (e.g. `intlProof`).
 */
async function prepareRequest(form) {
  const { payload } = constructPayload(form);
  const headers = {
    // eslint-disable-next-line comma-dangle
    'x-adobe-form-hostname': window?.location?.hostname
  };
  const files = getFiles(form);
  const body = { data: payload };
  let url;
  let baseUrl = getSubmitBaseUrl();
  if (!baseUrl) {
    // eslint-disable-next-line prefer-template
    baseUrl = 'https://forms.adobe.com/adobe/forms/af/submit/';
    url = baseUrl + btoa(`${form.dataset.action}.json`);
  } else {
    url = form.dataset.action;
  }
  return {
    headers, body, files, url,
  };
}

function encodeBody(body, files, headers) {
  if (!files.length) {
    headers['Content-Type'] = 'application/json';
    return JSON.stringify(body);
  }
  // the browser sets the multipart Content-Type (with its boundary)
  const formData = new FormData();
  formData.append('data', JSON.stringify(body));
  files.forEach(([name, file]) => formData.append(name, file, file.name));
  return formData;
}

async function submitDocBasedForm(form, captcha) {
  try {
    const {
      headers, body, files, url,
    } = await prepareRequest(form, captcha);
    let token = null;
    if (captcha) {
      token = await captcha.getToken();
      body.data['g-recaptcha-response'] = token;
    }
    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: encodeBody(body, files, headers),
    });
    if (response.ok) {
      submitSuccess(response, form);
    } else {
      const error = await response.text();
      throw new Error(error);
    }
  } catch (error) {
    submitFailure(error, form);
  }
}

export async function handleSubmit(e, form, captcha) {
  e.preventDefault();

  const valid = form.checkValidity();
  if (valid) {
    if (form.getAttribute('data-submitting') !== 'true') {
      e.submitter?.setAttribute('disabled', '');
      form.setAttribute('data-submitting', 'true');
      form.setAttribute('aria-busy', 'true');
      clearFormMessages(form);

      if (form.dataset.source === 'sheet') {
        await submitDocBasedForm(form, captcha);
      }
    }
  } else {
    // "invalid" events have already rendered each field's inline error;
    // announce one summary instead of every message, then move to the first.
    clearFormMessages(form);
    insertAtTop(form, createFormMessage('summary', form.dataset.errorSummary || DEFAULT_ERROR_SUMMARY));
    const firstInvalidEl = form.querySelector(':invalid:not(fieldset)');
    if (firstInvalidEl) {
      firstInvalidEl.focus({ preventScroll: true });
      firstInvalidEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }
}
