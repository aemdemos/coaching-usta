// One reCAPTCHA script per page, however many forms use it.
const scripts = new Map();

function loadScript(url) {
  if (!scripts.has(url)) {
    scripts.set(url, new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = url;
      script.async = true;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error(`Failed to load script ${url}`));
      document.head.append(script);
    }));
  }
  return scripts.get(url);
}

/**
 * reCAPTCHA (v3 / Enterprise score keys) rendered explicitly per form, so
 * several forms can share a page. The badge placement is chosen by the form
 * theme: a captcha row whose wrapper has `--captcha-badge: inline` (e.g.
 * application.css) hosts the badge inside the form; otherwise Google's fixed
 * bottom-right badge is used.
 */
export default class GoogleReCaptcha {
  id;

  name;

  config;

  formName;

  widgetId;

  // resolves once the widget is rendered (set when the submit button is first seen)
  ready;

  #api;

  #pending;

  constructor(config, id, name, formName) {
    this.config = config;
    this.name = name;
    this.id = id;
    this.formName = formName;
  }

  #scriptUrl() {
    const base = this.config.version === 'enterprise' && this.config.uri
      ? this.config.uri
      : 'https://www.google.com/recaptcha/api.js';
    return `${base}?render=explicit`;
  }

  #grecaptcha() {
    return this.config.version === 'enterprise'
      ? window.grecaptcha?.enterprise
      : window.grecaptcha;
  }

  async #render(form) {
    await loadScript(this.#scriptUrl());
    const api = this.#grecaptcha();
    await new Promise((resolve) => { api.ready(resolve); });
    const host = form.querySelector('.captcha-wrapper');
    const inline = host
      && getComputedStyle(host).getPropertyValue('--captcha-badge').trim() === 'inline';
    const container = document.createElement('div');
    if (inline) {
      host.replaceChildren(container);
    } else {
      document.body.append(container);
    }
    this.widgetId = api.render(container, {
      sitekey: this.config.siteKey,
      size: 'invisible',
      badge: inline ? 'inline' : 'bottomright',
      // score keys resolve execute() with the token; checkbox-invisible keys
      // call back instead — both end up in getToken()
      callback: (token) => this.#pending?.(token),
    });
    if (inline) host.classList.add('captcha-ready');
    this.#api = api;
  }

  loadCaptcha(form) {
    if (form && this.config.siteKey) {
      const submit = form.querySelector('button[type="submit"]');
      if (submit == null) {
        // eslint-disable-next-line no-console
        console.warn('Captcha can not be loaded. Submit button is missing.');
        return;
      }
      // load when the form's submit button first scrolls into view
      const obs = new IntersectionObserver((entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          obs.disconnect();
          this.ready = this.#render(form).catch((e) => {
            // eslint-disable-next-line no-console
            console.warn('Captcha could not be loaded.', e);
          });
        }
      });
      obs.observe(submit);
    } else {
      // No site key authored yet (sheet captcha row "Value"): skip the captcha
      // quietly instead of alert()ing every visitor. getToken() returns null.
      // eslint-disable-next-line no-console
      console.warn('Captcha configuration in missing.');
    }
  }

  async getToken() {
    if (!this.config.siteKey) {
      return null;
    }
    await this.ready;
    if (!this.#api) return null;
    const action = this.config.version === 'enterprise'
      ? `submit_${this.formName}_${this.name}`
      : 'submit';
    return new Promise((resolve) => {
      this.#pending = resolve;
      const result = this.#api.execute(this.widgetId, { action });
      if (result?.then) result.then(resolve);
    });
  }
}
