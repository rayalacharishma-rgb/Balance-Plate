/**
 * NutriBot — static nutrition chatbot (no API / backend)
 * Loads chatbot.html, shows predefined Q&A, supports i18n via NutriLang
 */
(function () {
  'use strict';

  /** FAQ entries: translation keys for question & answer */
  const FAQ_ITEMS = [
    { q: 'chatbot.q1', a: 'chatbot.a1' },
    { q: 'chatbot.q2', a: 'chatbot.a2' },
    { q: 'chatbot.q3', a: 'chatbot.a3' },
    { q: 'chatbot.q4', a: 'chatbot.a4' },
    { q: 'chatbot.q5', a: 'chatbot.a5' },
    { q: 'chatbot.q6', a: 'chatbot.a6' },
    { q: 'chatbot.q7', a: 'chatbot.a7' },
    { q: 'chatbot.q8', a: 'chatbot.a8' },
    { q: 'chatbot.q9', a: 'chatbot.a9' },
    { q: 'chatbot.q10', a: 'chatbot.a10' },
    { q: 'chatbot.q11', a: 'chatbot.a11' },
    { q: 'chatbot.q12', a: 'chatbot.a12' },
    { q: 'chatbot.q13', a: 'chatbot.a13' },
    { q: 'chatbot.q14', a: 'chatbot.a14' },
    { q: 'chatbot.q16', a: 'chatbot.a16' },
    { q: 'chatbot.q17', a: 'chatbot.a17' },
    { q: 'chatbot.qDiabetes', a: 'chatbot.aDiabetes' },
    { q: 'chatbot.q18', a: 'chatbot.a18' },
    { q: 'chatbot.q19', a: 'chatbot.a19' },
    { q: 'chatbot.q20', a: 'chatbot.a20' },
    { q: 'chatbot.q21', a: 'chatbot.a21' }
  ];

  const WELCOME_KEY = 'chatbot.welcome';

  let panel, fab, messagesEl, questionsEl;
  let minimized = false;

  function t(key) {
    if (window.NutriLang && typeof window.NutriLang.t === 'function') {
      return window.NutriLang.t(key);
    }
    if (window.translations && window.translations.english) {
      return window.translations.english[key] || key;
    }
    return key;
  }

  function scrollMessagesToBottom() {
    if (messagesEl) {
      messagesEl.scrollTop = messagesEl.scrollHeight;
    }
  }

  function addMessage(text, type) {
    if (!messagesEl || !text) return;
    const row = document.createElement('div');
    row.className = 'nutribot-msg nutribot-msg--' + type;
    const bubble = document.createElement('div');
    bubble.className = 'nutribot-bubble';
    bubble.textContent = text;
    row.appendChild(bubble);
    messagesEl.appendChild(row);
    scrollMessagesToBottom();
  }

  function showWelcome() {
    if (!messagesEl) return;
    messagesEl.innerHTML = '';
    addMessage(t(WELCOME_KEY), 'bot');
  }

  function renderQuestionButtons() {
    if (!questionsEl) return;
    questionsEl.innerHTML = '';
    FAQ_ITEMS.forEach(function (item) {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'nutribot-q-btn';
      btn.textContent = t(item.q);
      btn.addEventListener('click', function () {
        addMessage(t(item.q), 'user');
        setTimeout(function () {
          addMessage(t(item.a), 'bot');
        }, 350);
      });
      questionsEl.appendChild(btn);
    });
  }

  function openPanel() {
    panel.classList.remove('nutribot-panel--hidden');
    fab.classList.add('nutribot-fab--hidden');
    minimized = false;
    panel.classList.remove('nutribot-panel--minimized');
    scrollMessagesToBottom();
  }

  function closePanel() {
    panel.classList.add('nutribot-panel--hidden');
    fab.classList.remove('nutribot-fab--hidden');
    minimized = false;
    panel.classList.remove('nutribot-panel--minimized');
  }

  function toggleMinimize() {
    minimized = !minimized;
    panel.classList.toggle('nutribot-panel--minimized', minimized);
    if (!minimized) scrollMessagesToBottom();
  }

  function bindControls() {
    document.getElementById('nutribot-toggle').addEventListener('click', openPanel);
    document.getElementById('nutribot-close').addEventListener('click', closePanel);
    document.getElementById('nutribot-minimize').addEventListener('click', toggleMinimize);
  }

  function refreshChatbotLanguage() {
    document.querySelectorAll('#nutribot-root [data-i18n]').forEach(function (el) {
      var key = el.getAttribute('data-i18n');
      if (key) el.textContent = t(key);
    });
    renderQuestionButtons();
    /* Keep chat history; only refresh welcome if empty */
    if (messagesEl && messagesEl.children.length === 0) {
      showWelcome();
    }
  }

  function initWidget() {
    panel = document.getElementById('nutribot-panel');
    fab = document.getElementById('nutribot-toggle');
    messagesEl = document.getElementById('nutribot-messages');
    questionsEl = document.getElementById('nutribot-questions');

    bindControls();
    showWelcome();
    renderQuestionButtons();

    document.addEventListener('nutri:language-changed', refreshChatbotLanguage);
  }

  /** Inline markup fallback when fetch fails (e.g. file:// protocol) */
  var CHATBOT_HTML =
    '<div id="nutribot-root" class="nutribot-root" aria-live="polite">' +
    '<button type="button" id="nutribot-toggle" class="nutribot-fab" aria-label="Open NutriBot chat" title="NutriBot">' +
    '<i class="fas fa-robot"></i><span class="nutribot-fab-label" data-i18n="chatbot.fabLabel">NutriBot</span></button>' +
    '<div id="nutribot-panel" class="nutribot-panel nutribot-panel--hidden" role="dialog" aria-labelledby="nutribot-title">' +
    '<header class="nutribot-header"><div class="nutribot-header-info">' +
    '<span class="nutribot-avatar"><i class="fas fa-leaf"></i></span><div>' +
    '<h2 id="nutribot-title" data-i18n="chatbot.title">NutriBot</h2>' +
    '<p class="nutribot-status" data-i18n="chatbot.status">Online</p></div></div>' +
    '<div class="nutribot-header-actions">' +
    '<button type="button" id="nutribot-minimize" class="nutribot-icon-btn" aria-label="Minimize chat" title="Minimize"><i class="fas fa-minus"></i></button>' +
    '<button type="button" id="nutribot-close" class="nutribot-icon-btn" aria-label="Close chat" title="Close"><i class="fas fa-times"></i></button>' +
    '</div></header><div id="nutribot-messages" class="nutribot-messages"></div>' +
    '<div class="nutribot-questions-wrap"><p class="nutribot-questions-label" data-i18n="chatbot.pickQuestion">Choose a question:</p>' +
    '<div id="nutribot-questions" class="nutribot-questions"></div></div></div></div>';

  function injectChatbotMarkup(html) {
    var wrap = document.createElement('div');
    wrap.innerHTML = html.trim();
    while (wrap.firstChild) {
      document.body.appendChild(wrap.firstChild);
    }
    initWidget();
  }

  /**
   * Fetch chatbot HTML fragment and inject into body
   * @param {string} basePath - e.g. '' or '../' for subfolders
   */
  window.initNutriBot = function (basePath) {
    basePath = basePath || '';
    var url = basePath + 'chatbot/chatbot.html';

    fetch(url)
      .then(function (res) {
        if (!res.ok) throw new Error('Failed to load chatbot');
        return res.text();
      })
      .then(injectChatbotMarkup)
      .catch(function () {
        injectChatbotMarkup(CHATBOT_HTML);
      });
  };
})();
