export default class GoogleReCaptcha {
  id;

  name;

  config;

  formName;

  loadPromise;

  constructor(config, id, name, formName) {
    this.config = config;
    this.name = name;
    this.id = id;
    this.formName = formName;
  }

  #loadScript(url) {
    if (!this.loadPromise) {
      this.loadPromise = new Promise((resolve, reject) => {
        const head = document.head || document.querySelector('head');
        const script = document.createElement('script');
        script.src = url;
        script.async = true;
        script.onload = () => resolve(window.grecaptcha);
        script.onerror = () => reject(new Error(`Failed to load script ${url}`));
        head.append(script);
      });
    }
  }

  /**
   * Renders the reCAPTCHA badge INLINE into the form's captcha field (the row the
   * author placed in the sheet) instead of Google's default viewport-fixed badge,
   * so per-form CSS can position it (e.g. inside the flag-profile frame, like the
   * source's embedded form). Falls back to the fixed badge if the field is missing.
   * @param {HTMLFormElement} form
   */
  #renderInlineBadge(form) {
    const container = form.querySelector(`[data-id="${this.id}"]`);
    if (!container) {
      this.#loadScript(`https://www.google.com/recaptcha/api.js?render=${this.config.siteKey}`);
      return;
    }
    container.textContent = '';
    const badge = document.createElement('div');
    badge.className = 'form-recaptcha-badge';
    container.append(badge);
    this.#loadScript('https://www.google.com/recaptcha/api.js?render=explicit');
    this.loadPromise.then((grecaptcha) => grecaptcha.ready(() => {
      this.widgetId = grecaptcha.render(badge, {
        sitekey: this.config.siteKey,
        badge: 'bottomright',
        size: 'invisible',
      });
    })).catch((error) => {
      // eslint-disable-next-line no-console
      console.warn('reCAPTCHA failed to load', error);
    });
  }

  loadCaptcha(form) {
    if (form && this.config.siteKey) {
      const submit = form.querySelector('button[type="submit"]');
      const obs = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const { siteKey } = this.config;
            const url = this.config.uri;
            if (this.config.version === 'enterprise') {
              this.#loadScript(`${url}?render=${siteKey}`);
            } else {
              this.#renderInlineBadge(form);
            }
            obs.disconnect();
          }
        });
      });
      if (submit == null) {
        // eslint-disable-next-line no-console
        console.warn('Captcha can not be loaded. Submit button is missing.');
        // eslint-disable-next-line no-alert
        alert('Captcha can not be loaded. Add Submit button.');
      } else {
        obs.observe(submit);
      }
    } else {
      // eslint-disable-next-line no-console
      console.warn('Captcha configuration in missing.');
      // eslint-disable-next-line no-alert
      alert('Captcha can not be loaded. Captcha configuration in missing.');
    }
  }

  async getToken() {
    if (!this.config.siteKey) {
      return null;
    }
    return new Promise((resolve) => {
      const { grecaptcha } = window;
      if (this.config.version === 'enterprise') {
        grecaptcha.enterprise.ready(async () => {
          const submitAction = `submit_${this.formName}_${this.name}`;
          const token = await grecaptcha.enterprise.execute(
            this.config.siteKey,
            { action: submitAction },
          );
          resolve(token);
        });
      } else {
        grecaptcha.ready(async () => {
          // An explicitly rendered (inline) badge is executed by its widget id.
          const target = this.widgetId ?? this.config.siteKey;
          const token = await grecaptcha.execute(target, { action: 'submit' });
          resolve(token);
        });
      }
    });
  }
}
