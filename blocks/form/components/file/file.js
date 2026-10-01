import { updateOrCreateInvalidMsg, stripTags } from '../../util.js';
import { fileAttachmentText, dragDropText, defaultErrorMessages } from '../../constant.js';

const fileSizeRegex = /^(\d*\.?\d+)(\\?(?=[KMGT])([KMGT])(?:i?B)?|B?)$/i;

/**
 * converts a string of the form "10MB" to bytes. If the string is malformed 0 is returned
 * @param {*} str
 * @returns
 */
function getSizeInBytes(str) {
  const sizes = {
    KB: 1, MB: 2, GB: 3, TB: 4,
  };
  let sizeLimit = 0;
  const matches = fileSizeRegex.exec(str.trim());
  if (matches != null) {
    const symbol = matches[2] || 'kb';
    const size = parseFloat(matches[1]);
    const i = 1024 ** sizes[symbol.toUpperCase()];
    sizeLimit = Math.round(size * i);
  }
  return sizeLimit;
}

/**
 * matches a file against the accept list: ".pdf"-style entries compare the
 * file-name extension (MIME types such as .docx's don't end in "docx", and
 * many files have no MIME type at all); "image/*" and "application/pdf"
 * entries compare the MIME type.
 * @param {File} file the file to match
 * @param {[]} accepts accepted extensions / mediaTypes
 * @returns false if the file is not accepted
 */
function matchMediaType(file, accepts) {
  const mediaType = (file.type || '').toLowerCase();
  const fileName = (file.name || '').toLowerCase();
  return accepts.some((accept) => {
    const trimmedAccept = accept.trim().toLowerCase();
    if (trimmedAccept.startsWith('.')) return fileName.endsWith(trimmedAccept);
    if (trimmedAccept.endsWith('/*')) return mediaType.startsWith(trimmedAccept.slice(0, -1));
    return trimmedAccept === mediaType;
  });
}

/**
 * checks whether the size of the files in the array is withing the maxFileSize or not
 * @param {string|number} maxFileSize maxFileSize in bytes or string with the unit
 * @param {File[]} files array of File objects
 * @returns false if any file is larger than the maxFileSize
 */
function checkMaxFileSize(maxFileSize, files) {
  const sizeLimit = typeof maxFileSize === 'string' ? getSizeInBytes(maxFileSize) : maxFileSize;
  return Array.from(files).find((file) => file.size > sizeLimit) === undefined;
}

/**
 * checks whether the mediaType of the files in the array are accepted or not
 * @param {[]} acceptedMediaTypes
 * @param {File[]} files
 * @returns false if the mediaType of any file is not accepted
 */
function checkAccept(acceptedMediaTypes, files) {
  if (!acceptedMediaTypes || acceptedMediaTypes.length === 0 || !files.length) {
    return true;
  }
  const invalidFile = Array.from(files)
    .some((file) => !matchMediaType(file, acceptedMediaTypes));
  return !invalidFile;
}

/**
 * triggers file Validation for the given input element and updates the error message
 *
 * File validation is currently DOM-based for BOTH Sheet and AEM forms
 * (exception to standard architecture).
 * This component validates: required, accept, maxFileSize, minItems, maxItems.
 *
 * TODO: Remove this DOM-based validation for AEM forms and use afb-runtime's
 * built-in file validation. afb-runtime already supports: ACCEPT_MISMATCH,
 * FILE_SIZE_MISMATCH, MIN_ITEMS_MISMATCH, MAX_ITEMS_MISMATCH.
 * After this change, this component would only be needed for Sheet forms.
 * Remove the bypass logic in rules/index.js fieldChanged() when implementing this.
 *
 * @param {HTMLInputElement} input
 * @param {FileList} files
 */
function fileValidation(input, files) {
  const multiple = input.hasAttribute('multiple');
  // drop empty entries: with no accept attribute, [''] would reject every file
  const acceptedFile = (input.getAttribute('accept') || '').split(',').filter((type) => type.trim());
  const minItems = (parseInt(input.dataset.minItems, 10) || 1);
  const maxItems = (parseInt(input.dataset.maxItems, 10) || -1);
  const fileSize = `${input.dataset.maxFileSize || '2MB'}`;
  // dataset.required is the string "true"/"false" — any value used to count as
  // required, so removing a file from an optional upload flagged it invalid
  const isRequired = input.hasAttribute('required') || input.closest('.field-wrapper')?.dataset?.required === 'true';
  let constraint = '';
  let errorMessage = '';
  const wrapper = input.closest('.field-wrapper');

  // Check required first (valueMissing)
  if (isRequired && files.length === 0) {
    constraint = 'required';
  } else if (!checkAccept(acceptedFile, files)) {
    constraint = 'accept';
  } else if (!checkMaxFileSize(fileSize, files)) {
    constraint = 'maxFileSize';
  } else if (multiple && maxItems !== -1 && files.length > maxItems) {
    constraint = 'maxItems';
    errorMessage = defaultErrorMessages.maxItems.replace(/\$0/, maxItems);
  } else if (multiple && minItems !== 1 && files.length < minItems) {
    constraint = 'minItems';
    errorMessage = defaultErrorMessages.minItems.replace(/\$0/, minItems);
  }
  if (constraint.length) {
    const finalMessage = wrapper.dataset[constraint]
    || errorMessage
    || defaultErrorMessages[constraint];
    input.setCustomValidity(finalMessage);
    updateOrCreateInvalidMsg(
      input,
      finalMessage,
    );
  } else {
    input.setCustomValidity('');
    updateOrCreateInvalidMsg(input, '');
  }
}

function formatBytes(bytes) {
  if (!+bytes) return '0 Bytes';
  const k = 1024;
  const sizes = ['bytes', 'kb', 'mb', 'gb', 'tb', 'pb'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / k ** i).toFixed(0))} ${sizes[i]}`;
}

function updateButtonIndex(elements = []) {
  elements.forEach((element, index) => {
    element.dataset.index = index;
  });
}

// Mirror the attached files (browsed, dropped or pasted) into the real input,
// so input.files is what submit.js sends and what the form validates.
function syncInputFiles(input, files) {
  try {
    const dataTransfer = new DataTransfer();
    files.forEach((file) => { if (file instanceof File) dataTransfer.items.add(file); });
    input.files = dataTransfer.files;
  } catch (e) {
    // very old browsers: no DataTransfer constructor — dropped files can't be mirrored
  }
}

function dispatchChangeEvent(input, files) {
  syncInputFiles(input, files);
  if (!files.length) {
    input.value = null;
  }
  const options = { bubbles: true, detail: { files, deletion: true } };
  const changeEvent = new CustomEvent('change', options);
  input.dispatchEvent(changeEvent);
}

function createElement(tag, className, text) {
  const el = document.createElement(tag);
  el.className = className;
  if (text) el.textContent = text;
  return el;
}

/**
 * creates an HTML element for the attached file
 * @param {File} file
 * @param {number} index
 */
function fileElement(file, index) {
  const el = createElement('div', 'file-description');
  el.dataset.index = index;
  // file.name is user-controlled: set as text, never as HTML
  const remove = createElement('button', 'file-description-remove');
  remove.type = 'button';
  remove.setAttribute('aria-label', `Remove ${file.name}`);
  el.append(
    createElement('span', 'file-description-name', file.name),
    createElement('span', 'file-description-size', formatBytes(file.size)),
    remove,
  );
  return el;
}

/**
 * creates an HTML elements for drag & drop
 * @param {HTMLElement} wrapper
 */
function createDragAndDropArea(wrapper, field) {
  const input = wrapper.querySelector('input');
  const customButtonText = field?.properties?.['fd:buttonText'] || fileAttachmentText;
  const customDragDropText = field?.properties?.dragDropText || dragDropText;
  const dragContainer = document.createElement('div');
  if (input.title) {
    dragContainer.title = stripTags(input.title, '');
  }
  dragContainer.className = 'file-drag-area';
  const attachButton = createElement('button', 'file-attach-button', customButtonText);
  attachButton.type = 'button';
  if (field?.label?.value) {
    attachButton.setAttribute('aria-label', `${customButtonText} for ${stripTags(field.label.value, '')}`);
  }
  const dragText = createElement('div', 'file-drag-text', `${customDragDropText} `);
  dragText.append(attachButton);
  dragContainer.append(createElement('div', 'file-drag-icon'), dragText);
  // Sheet "Placeholder" column → hint under the drop text (e.g. "Max file size: 10 MB")
  if (field?.placeholder) {
    dragContainer.append(createElement('div', 'file-drag-hint', field.placeholder));
  }
  dragContainer.appendChild(input.cloneNode(true));
  input.parentNode.replaceChild(dragContainer, input);
  return dragContainer;
}

function createFileHandler(allFiles, input) {
  return {
    removeFile: (index) => {
      allFiles.splice(index, 1);
      const fileListElement = input.closest('.field-wrapper').querySelector('.files-list');
      fileListElement.querySelector(`[data-index="${index}"]`).remove();
      fileValidation(input, allFiles);
      updateButtonIndex(Array.from(fileListElement.children));
      dispatchChangeEvent(input, allFiles);
    },

    attachFiles: (inputEl, files) => {
      const multiple = inputEl.hasAttribute('multiple');
      let newFiles = Array.from(files || []);
      if (!multiple) {
        allFiles.splice(0, allFiles.length);
        newFiles = [newFiles[0]];
      }
      const currentLength = allFiles.length;
      allFiles.push(...newFiles);
      const newFileElements = newFiles
        .map((file, index) => fileElement(file, index + currentLength));
      const fileListElement = inputEl.closest('.field-wrapper').querySelector('.files-list');
      if (multiple) {
        fileListElement.append(...newFileElements);
      } else {
        fileListElement.replaceChildren(...newFileElements);
      }
      fileValidation(inputEl, allFiles);
      dispatchChangeEvent(input, allFiles);
    },

    previewFile: (index) => {
      const file = allFiles[index];
      let url = file.data || window.URL.createObjectURL(file);
      if (file.data) {
        const lastIndex = url.lastIndexOf('/');
        /* added check for query param since sas url contains query params &
          does not have file name, encoding is not required in this case
        */
        if (lastIndex >= 0 && url.indexOf('?') === -1) {
          // encode the filename after last slash to ensure the handling of special characters
          url = `${url.substr(0, lastIndex)}/${encodeURIComponent(url.substr(lastIndex + 1))}`;
        }
      }
      window.open(url, '', 'scrollbars=no,menubar=no,height=600,width=800,resizable=yes,toolbar=no,status=no');
    },
  };
}

// eslint-disable-next-line no-unused-vars
export default async function decorate(fieldDiv, field, htmlForm) {
  const allFiles = [];
  const dragArea = createDragAndDropArea(fieldDiv, field);
  const input = fieldDiv.querySelector('input');
  fieldDiv.classList.add('decorated');
  const fileListElement = document.createElement('div');
  fileListElement.classList.add('files-list');
  // announce attached / removed files
  fileListElement.setAttribute('aria-live', 'polite');
  const attachButton = dragArea.querySelector('.file-attach-button');
  attachButton.addEventListener('click', () => input.click());
  const fileHandler = createFileHandler(allFiles, input);
  input.addEventListener('change', (event) => {
    if (!event?.detail?.deletion) {
      event.stopPropagation();
      fileHandler.attachFiles(input, event.target.files);
    }
  });
  dragArea.addEventListener('drop', (event) => {
    event.preventDefault();
    dragArea.classList.remove('file-drag-area-active');
    fileHandler.attachFiles(input, (event?.dataTransfer?.files || []));
  });
  dragArea.addEventListener('paste', (event) => {
    event.preventDefault();
    fileHandler.attachFiles(input, (event?.clipboardData?.files || []));
  });
  dragArea.addEventListener('dragover', (event) => {
    event.preventDefault();
    dragArea.classList.add('file-drag-area-active');
  });
  dragArea.addEventListener('dragleave', () => {
    dragArea.classList.remove('file-drag-area-active');
  });
  fileListElement.addEventListener('click', (e) => {
    if (e.target.tagName === 'BUTTON') {
      fileHandler.removeFile(e.target?.parentElement?.dataset?.index || 0);
      // the focused remove button is gone — return focus to the picker
      attachButton.focus();
    } else if (e.target.tagName === 'SPAN') {
      fileHandler.previewFile(e.target?.parentElement?.dataset?.index || 0);
    }
  });
  fieldDiv.insertBefore(fileListElement, input.nextElementSibling);
  // pre-fill file attachment
  if (field.value) {
    const preFillFiles = Array.isArray(field.value) ? field.value : [field.value];
    const dataTransfer = new DataTransfer();
    const file = new File([preFillFiles[0].data], preFillFiles[0].name, { ...preFillFiles[0] });
    dataTransfer.items.add(file);
    // Pre-fill input field to mark it as a valid field.
    input.files = dataTransfer.files;
    fileHandler.attachFiles(input, preFillFiles);
  }
  return fieldDiv;
}
