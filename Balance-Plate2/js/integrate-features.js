/**
 * Balance-Plate — global loader for NutriBot chatbot + language translation
 * Add ONE script tag before </body> on every HTML page:
 *   <script src="js/integrate-features.js"></script>
 * For pages in subfolders use: ../js/integrate-features.js
 */
(function () {
  'use strict';

  /** Resolve project root from this script's URL */
  function getBasePath() {
    var scripts = document.getElementsByTagName('script');
    for (var i = scripts.length - 1; i >= 0; i--) {
      var src = scripts[i].getAttribute('src') || '';
      if (src.indexOf('integrate-features.js') !== -1) {
        var idx = src.lastIndexOf('js/integrate-features.js');
        if (idx !== -1) return src.substring(0, idx);
      }
    }
    return '';
  }

  function loadCss(href) {
    if (document.querySelector('link[href="' + href + '"]')) return;
    var link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = href;
    document.head.appendChild(link);
  }

  function loadScript(src) {
    return new Promise(function (resolve, reject) {
      if (document.querySelector('script[src="' + src + '"]')) {
        resolve();
        return;
      }
      var s = document.createElement('script');
      s.src = src;
      s.onload = resolve;
      s.onerror = reject;
      document.body.appendChild(s);
    });
  }

  function boot() {
    var base = getBasePath();

    loadCss(base + 'language/language.css');
    loadCss(base + 'chatbot/chatbot.css');

    loadScript(base + 'language/translations.js')
      .then(function () {
        return loadScript(base + 'language/language.js');
      })
      .then(function () {
        if (typeof window.initNutriLanguage === 'function') {
          window.initNutriLanguage();
        }
        return loadScript(base + 'chatbot/chatbot.js');
      })
      .then(function () {
        if (typeof window.initNutriBot === 'function') {
          window.initNutriBot(base);
        }
        document.dispatchEvent(new CustomEvent('nutri:features-ready'));
      })
      .catch(function (err) {
        console.warn('Balance-Plate features failed to load:', err);
      });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
