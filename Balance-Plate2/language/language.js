/**
 * Balance-Plate — multi-language switcher (English, Telugu, Hindi)
 * Uses data-i18n / data-i18n-placeholder attributes and localStorage
 */
(function () {
  'use strict';

  const STORAGE_KEY = 'balancePlate_language';
  const DEFAULT_LANG = 'english';

  let currentLang = DEFAULT_LANG;

  function getDict() {
    return (window.translations && window.translations[currentLang]) || {};
  }

  function t(key) {
    const dict = getDict();
    if (dict[key]) return dict[key];
    const en = window.translations && window.translations.english;
    return (en && en[key]) || key;
  }

  function applyToElement(el) {
    const key = el.getAttribute('data-i18n');
    if (!key) return;

    const text = t(key);
    const htmlAllowed = el.getAttribute('data-i18n-html') === 'true';

    if (htmlAllowed) {
      el.innerHTML = text;
    } else if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
      if (el.getAttribute('data-i18n-target') === 'value') {
        el.value = text;
      } else {
        el.placeholder = text;
      }
    } else {
      el.textContent = text;
    }
  }

  function applyPlaceholders() {
    document.querySelectorAll('[data-i18n-placeholder]').forEach(function (el) {
      const key = el.getAttribute('data-i18n-placeholder');
      if (key) el.placeholder = t(key);
    });
  }

  function applyPageTranslations() {
    document.querySelectorAll('[data-i18n]').forEach(applyToElement);
    applyPlaceholders();

    /* Update document title if marked */
    const titleEl = document.querySelector('title[data-i18n]');
    if (titleEl) {
      document.title = t(titleEl.getAttribute('data-i18n'));
    }

    document.documentElement.lang =
      currentLang === 'telugu' ? 'te' : currentLang === 'hindi' ? 'hi' : 'en';
  }

  function setLanguage(lang, save) {
    if (!window.translations || !window.translations[lang]) {
      lang = DEFAULT_LANG;
    }
    currentLang = lang;

    if (save !== false) {
      try {
        localStorage.setItem(STORAGE_KEY, lang);
      } catch (e) {
        /* ignore */
      }
    }

    document.body.classList.add('nutri-lang-switching');
    applyPageTranslations();
    document.body.classList.remove('nutri-lang-switching');

    const select = document.getElementById('nutriLangSelect');
    if (select) select.value = lang;

    document.dispatchEvent(
      new CustomEvent('nutri:language-changed', { detail: { lang: lang } })
    );
  }

  function loadSavedLanguage() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved && window.translations && window.translations[saved]) {
        currentLang = saved;
      }
    } catch (e) {
      currentLang = DEFAULT_LANG;
    }
  }

  /** Insert language dropdown into navbar (top-right, before theme toggle) */
  function injectLanguageSwitcher() {
    const navList = document.querySelector('.navbar-nav');
    if (!navList || document.getElementById('nutriLangSelect')) return;

    const li = document.createElement('li');
    li.className = 'nav-item nutri-lang-wrap';
    li.innerHTML =
      '<label class="nutri-lang-label" for="nutriLangSelect" data-i18n="lang.label">Language</label>' +
      '<select id="nutriLangSelect" class="nutri-lang-select" aria-label="Select language">' +
      '<option value="english">English</option>' +
      '<option value="telugu">తెలుగు</option>' +
      '<option value="hindi">हिन्दी</option>' +
      '</select>';

    const themeLi = navList.querySelector('#themeToggle')?.closest('.nav-item');
    if (themeLi) {
      navList.insertBefore(li, themeLi);
    } else {
      navList.appendChild(li);
    }

    const select = document.getElementById('nutriLangSelect');
    select.value = currentLang;
    select.addEventListener('change', function () {
      setLanguage(select.value, true);
    });
  }

  /** Floating switcher for pages without a navbar */
  function injectFloatingLanguageSwitcher() {
    if (document.getElementById('nutriLangSelect')) return;

    var wrap = document.createElement('div');
    wrap.className = 'nutri-lang-floating';
    wrap.innerHTML =
      '<label class="nutri-lang-label" for="nutriLangSelect" data-i18n="lang.label">Language</label>' +
      '<select id="nutriLangSelect" class="nutri-lang-select" aria-label="Select language">' +
      '<option value="english">English</option>' +
      '<option value="telugu">తెలుగు</option>' +
      '<option value="hindi">हिन्दी</option>' +
      '</select>';

    document.body.appendChild(wrap);

    var select = document.getElementById('nutriLangSelect');
    select.value = currentLang;
    select.addEventListener('change', function () {
      setLanguage(select.value, true);
    });
  }

  function initLanguage() {
    loadSavedLanguage();
    injectLanguageSwitcher();
    if (!document.getElementById('nutriLangSelect')) {
      injectFloatingLanguageSwitcher();
    }
    applyPageTranslations();
  }

  window.NutriLang = {
    t: t,
    getLanguage: function () {
      return currentLang;
    },
    setLanguage: setLanguage,
    applyPageTranslations: applyPageTranslations
  };

  window.initNutriLanguage = initLanguage;
})();
