/* Dragon Tab — runtime language engine (EN source in HTML, FR/AR dictionaries). */
(() => {
  'use strict';

  const STORAGE_KEY = 'dragonTabLang';
  const SUPPORTED = ['en', 'fr', 'ar'];
  const page = document.documentElement.getAttribute('data-page') || 'landing';
  const dicts = window.DT_LANGS || {};
  const fallbackLabels = {
    'a11y.menuOpen': 'Open menu',
    'a11y.menuClose': 'Close menu'
  };

  const metaNode = (selector) => document.querySelector(selector);
  const meta = {
    description: metaNode('meta[name="description"]'),
    keywords: metaNode('meta[name="keywords"]'),
    ogTitle: metaNode('meta[property="og:title"]'),
    ogDescription: metaNode('meta[property="og:description"]'),
    ogImageAlt: metaNode('meta[property="og:image:alt"]'),
    twitterTitle: metaNode('meta[name="twitter:title"]'),
    twitterDescription: metaNode('meta[name="twitter:description"]')
  };

  const enMeta = {
    title: document.title,
    description: meta.description ? meta.description.getAttribute('content') : '',
    keywords: meta.keywords ? meta.keywords.getAttribute('content') : '',
    imageAlt: meta.ogImageAlt ? meta.ogImageAlt.getAttribute('content') : ''
  };

  const fields = [];
  const collect = (attr, kind) => {
    document.querySelectorAll(`[${attr}]`).forEach((el) => {
      fields.push({
        el,
        key: el.getAttribute(attr),
        kind,
        en: kind === 'text' ? el.textContent : kind === 'html' ? el.innerHTML : el.getAttribute(kind)
      });
    });
  };
  collect('data-i18n', 'text');
  collect('data-i18n-html', 'html');
  collect('data-i18n-aria', 'aria-label');
  collect('data-i18n-placeholder', 'placeholder');

  const has = (obj, key) => Object.prototype.hasOwnProperty.call(obj, key);

  const lookup = (lang, key) => {
    const dict = dicts[lang];
    if (!dict) return undefined;
    if (dict[page] && has(dict[page], key)) return dict[page][key];
    if (dict.common && has(dict.common, key)) return dict.common[key];
    return undefined;
  };

  const setMeta = (node, value) => {
    if (node && typeof value === 'string' && value) node.setAttribute('content', value);
  };

  const applyMeta = (lang) => {
    const dict = dicts[lang] && dicts[lang][page] ? dicts[lang][page].meta : null;
    const title = (dict && dict.title) || enMeta.title;
    const description = (dict && dict.description) || enMeta.description;
    const keywords = (dict && dict.keywords) || enMeta.keywords;
    const imageAlt = (dict && dict.imageAlt) || enMeta.imageAlt;

    document.title = title;
    setMeta(meta.description, description);
    setMeta(meta.keywords, keywords);
    setMeta(meta.ogTitle, title);
    setMeta(meta.ogDescription, description);
    setMeta(meta.ogImageAlt, imageAlt);
    setMeta(meta.twitterTitle, title);
    setMeta(meta.twitterDescription, description);
  };

  const syncButtons = (lang) => {
    document.querySelectorAll('[data-lang-btn]').forEach((btn) => {
      const active = btn.getAttribute('data-lang-btn') === lang;
      btn.classList.toggle('is-active', active);
      btn.setAttribute('aria-pressed', String(active));
    });
  };

  let current = 'en';

  const apply = (lang, persist) => {
    if (!SUPPORTED.includes(lang)) lang = 'en';
    current = lang;

    const root = document.documentElement;
    const dir = lang === 'ar' ? 'rtl' : 'ltr';
    root.setAttribute('lang', lang);
    root.setAttribute('dir', dir);

    fields.forEach((field) => {
      const value = lookup(lang, field.key);
      const next = value === undefined ? field.en : value;
      if (field.kind === 'text') field.el.textContent = next;
      else if (field.kind === 'html') field.el.innerHTML = next;
      else field.el.setAttribute(field.kind, next);
    });

    applyMeta(lang);
    syncButtons(lang);

    if (persist) {
      try {
        localStorage.setItem(STORAGE_KEY, lang);
      } catch (error) {
        /* storage may be blocked — the page still switches for this visit */
      }
    }

    document.dispatchEvent(new CustomEvent('dt:lang', { detail: { lang, dir } }));
  };

  window.dtLang = {
    get lang() {
      return current;
    },
    set(lang) {
      apply(lang, true);
    },
    label(key) {
      const value = lookup(current, key);
      if (value !== undefined) return value;
      if (has(fallbackLabels, key)) return fallbackLabels[key];
      const field = fields.find((item) => item.key === key);
      return field ? field.en : '';
    }
  };

  document.addEventListener('click', (event) => {
    const btn = event.target.closest('[data-lang-btn]');
    if (!btn) return;
    apply(btn.getAttribute('data-lang-btn'), true);
  });

  const stored = (() => {
    try {
      return localStorage.getItem(STORAGE_KEY);
    } catch (error) {
      return null;
    }
  })();
  const browserLang = (navigator.language || 'en').slice(0, 2).toLowerCase();
  const rootLang = (document.documentElement.getAttribute('lang') || '').toLowerCase();
  const initial = SUPPORTED.includes(stored) ? stored
    : SUPPORTED.includes(browserLang) ? browserLang
      : SUPPORTED.includes(rootLang) ? rootLang
        : 'en';

  apply(initial, true);
})();
