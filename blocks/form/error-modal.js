/**
 * The source's generic error modal ("Oops! Something went wrong" — the `generic-error-modal`
 * v-modal of the Coaching Modals XF), shown by the Gallagher disclaimer forms when a submission
 * can't be saved (on the source: any Submit while signed out).
 *
 * Copy comes from the locale's placeholders sheet (keys `Error Modal Title`, `Error Modal
 * Subtitle`, `Error Modal Button`, `Error Modal Close`); the source's copy is the fallback.
 * The header bar repeats the page header's logo. A native <dialog> (showModal): focus moves
 * into it, Escape closes it, focus returns to the Submit button.
 */
import { fetchPlaceholders } from '../../scripts/scripts.js';

const FALLBACK = {
  errorModalTitle: 'Oops! Something went wrong',
  errorModalSubtitle: 'Your changes were not saved. Please try again!',
  errorModalButton: 'OK',
  errorModalClose: 'Close',
};

const CLOSE_ICON = '<svg width="24" height="24" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M6 6l12 12M18 6L6 18" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/></svg>';

let counter = 0;

async function buildModal(block) {
  const placeholders = await fetchPlaceholders();
  const text = (key) => placeholders[key] || FALLBACK[key];
  counter += 1;
  const id = `form-error-modal-${counter}`;

  const dialog = document.createElement('dialog');
  dialog.className = 'form-error-modal';
  dialog.setAttribute('aria-labelledby', `${id}-title`);
  dialog.setAttribute('aria-describedby', `${id}-subtitle`);

  const header = document.createElement('div');
  header.className = 'form-error-modal-header';
  const logo = document.querySelector('header .nav-brand img, header img');
  if (logo) {
    const img = logo.cloneNode(true);
    img.alt = '';
    img.removeAttribute('loading');
    const wrap = document.createElement('span');
    wrap.className = 'form-error-modal-logo';
    wrap.append(img);
    header.append(wrap);
  }
  const close = document.createElement('button');
  close.type = 'button';
  close.className = 'form-error-modal-close';
  close.setAttribute('aria-label', text('errorModalClose'));
  close.innerHTML = CLOSE_ICON;
  header.append(close);

  const content = document.createElement('div');
  content.className = 'form-error-modal-content';
  const title = document.createElement('h2');
  title.id = `${id}-title`;
  title.className = 'form-error-modal-title';
  title.textContent = text('errorModalTitle');
  const subtitle = document.createElement('p');
  subtitle.id = `${id}-subtitle`;
  subtitle.className = 'form-error-modal-subtitle';
  subtitle.textContent = text('errorModalSubtitle');
  const cta = document.createElement('div');
  cta.className = 'form-error-modal-cta';
  const ok = document.createElement('button');
  ok.type = 'button';
  ok.className = 'form-error-modal-ok';
  ok.textContent = text('errorModalButton');
  cta.append(ok);
  content.append(title, subtitle, cta);

  dialog.append(header, content);
  [close, ok].forEach((b) => b.addEventListener('click', () => dialog.close()));
  block.append(dialog);
  return dialog;
}

/**
 * Opens the error modal for a form (built once per form block).
 * @param {HTMLFormElement} form
 */
export default async function openErrorModal(form) {
  const block = form.closest('.form') || form.parentElement;
  let dialog = block.querySelector(':scope > dialog.form-error-modal');
  if (!dialog) dialog = await buildModal(block);
  if (!dialog.open) dialog.showModal();
  dialog.querySelector('.form-error-modal-ok')?.focus();
}
