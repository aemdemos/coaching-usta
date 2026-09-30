// File-upload copy, matching the source site's upload fields
export const fileAttachmentText = 'Browse files';
export const dragDropText = 'Drag and drop here or';

export const DEFAULT_THANK_YOU_MESSAGE = 'Thank you for your submission.';

// Fallback copy only — a form sheet can override each via its submit row
// ("Value" = thank-you message) and the submit row's "Description" (error).
export const DEFAULT_ERROR_MESSAGE = 'Something went wrong while submitting the form. Please try again.';
export const DEFAULT_ERROR_SUMMARY = 'Please correct the highlighted fields.';

// Logging Configuration
// Control logging via URL parameter: ?log=<level>
// Valid levels: debug, info, error, off, warn → returns that level
// Invalid/empty values (including 'on') → returns 'warn' (fallback)
// AEM preview/live URLs (*.page, *.live) or localhost → returns 'warn'
const VALID_LOG_LEVELS = ['error', 'debug', 'warn', 'info', 'off'];

export const getLogLevelFromURL = (urlString = null) => {
  // Semantic constants for log level defaults
  const DEFAULT_LOG_LEVEL = 'off'; // Used when no logging is explicitly requested
  const FALLBACK_LOG_LEVEL = 'warn'; // Used for invalid/empty values or AEM preview

  try {
    // Extract URL object from either parameter or current context
    let url;
    if (urlString) {
      // Explicit URL string provided (for workers - they need page URL passed from main thread)
      url = new URL(urlString);
    } else if (typeof window !== 'undefined' && window.location) {
      // Main thread context - use page URL
      url = new URL(window.location.href);
    } else {
      return DEFAULT_LOG_LEVEL; // No URL available
    }

    const { searchParams, hostname } = url;

    // Check if logging should be enabled (explicit param or AEM preview)
    const logParam = searchParams.get('log');
    if (logParam !== null || hostname.match(/\.(page|live)$|^localhost$/)) {
      // Return valid log level or fallback to warn for invalid/empty values
      if (VALID_LOG_LEVELS.includes(logParam)) return logParam;
      return FALLBACK_LOG_LEVEL;
    }

    // Default - no logging
    return DEFAULT_LOG_LEVEL;
  } catch (error) {
    // Fallback to default if URL parsing fails
    return DEFAULT_LOG_LEVEL;
  }
};
// Logging Configuration
// To set log level, modify this constant:
// Available options: 'off', 'debug', 'info', 'warn', 'error'
export const LOG_LEVEL = getLogLevelFromURL();

export const defaultErrorMessages = {
  accept: 'The specified file type not supported.',
  maxFileSize: 'File too large. Reduce size and try again.',
  maxItems: 'Specify a number of items equal to or less than $0.',
  minItems: 'Specify a number of items equal to or greater than $0.',
  pattern: 'Specify the value in allowed format : $0.',
  minLength: 'Please lengthen this text to $0 characters or more.',
  maxLength: 'Please shorten this text to $0 characters or less.',
  maximum: 'Value must be less than or equal to $0.',
  minimum: 'Value must be greater than or equal to $0.',
  required: 'Please fill in this field.',
};

// local@domain.tld — accepts hyphens, plus-addressing, subdomains and 2-letter
// TLDs (the upstream pattern rejected all of these, and its unescaped "." in a
// single-quoted string matched any character). Valid under the "v" flag
// browsers apply to the pattern attribute.
export const emailPattern = String.raw`[^\s@]+@[^\s@.]+(\.[^\s@.]+)*\.[^\s@.]{2,}`;

let submitBaseUrl = '';

export const SUBMISSION_SERVICE = 'https://forms.adobe.com/adobe/forms/af/submit/';

// Submit action types routed to the submission service.
export const SUPPORTED_SUBMISSION_ACTION_TYPES = ['spreadsheet', 'aep'];

export function setSubmitBaseUrl(url) {
  submitBaseUrl = url;
}

export function getSubmitBaseUrl() {
  return submitBaseUrl;
}
