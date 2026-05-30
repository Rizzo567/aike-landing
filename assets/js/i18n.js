(function() {
  var TRANSLATIONS = {
    en: {
      // Nav
      'nav.solutions': 'Solutions',
      'nav.stories': 'Success Stories',
      'nav.owl': 'Try Owl',
      'nav.book': 'Book a call',
      // Hero index
      'hero.title': 'Intelligent automation for<br><span class="hero__title-highlight">modern businesses.</span>',
      'hero.subtitle': 'Avoid months of repetitive manual work. Get a solid automation base ready for production...',
      'hero.cta.title': 'Book your consultation',
      'hero.cta.desc': 'Schedule a call and receive a tailored implementation plan.<br>No spam, no ads.',
      'hero.cta.btn': 'Book your call 🚀',
      'hero.proof': '<strong>187</strong> businesses have already<br>booked a call',
      // Solutions page
      'solutions.hero.title': 'We build the systems<br>that run your <span class="hero__title-highlight sol-line-2">serious operations</span>',
      'solutions.cta.headline': '"Your business is slow,<br><span class="hero__title-highlight">but you don\'t notice it"',
      // Settings
      'settings.title': 'Settings',
      'settings.tab.profile': 'Profile',
      'settings.tab.account': 'Account',
      'settings.tab.prefs': 'Preferences',
      'settings.lang.label': 'Language',
      'settings.lang.en': 'English',
      'settings.lang.it': 'Italiano',
      'settings.save': 'Save changes',
      // Footer
      'footer.rights': 'All rights reserved',
    },
    it: {
      // Nav
      'nav.solutions': 'Soluzioni',
      'nav.stories': 'Storie di Successo',
      'nav.owl': 'Prova Owl',
      'nav.book': 'Prenota una call',
      // Hero index
      'hero.title': 'Automazione intelligente per<br><span class="hero__title-highlight">le aziende moderne.</span>',
      'hero.subtitle': 'Evita mesi di lavoro manuale ripetitivo. Ottieni una base di automazione solida e pronta per la produzione...',
      'hero.cta.title': 'Prenota la tua consulenza',
      'hero.cta.desc': 'Pianifica una call e ricevi un piano di implementazione su misura.<br>Zero spam, zero pubblicità.',
      'hero.cta.btn': 'Prenota la tua call 🚀',
      'hero.proof': '<strong>187</strong> aziende hanno già<br>prenotato una call',
      // Solutions page
      'solutions.hero.title': 'Costruiamo i sistemi<br>che fanno girare le tue <span class="hero__title-highlight sol-line-2">operazioni serie</span>',
      'solutions.cta.headline': '"La tua azienda è lenta,<br><span class="hero__title-highlight">ma non te ne accorgi"',
      // Settings
      'settings.title': 'Impostazioni',
      'settings.tab.profile': 'Profilo',
      'settings.tab.account': 'Account',
      'settings.tab.prefs': 'Preferenze',
      'settings.lang.label': 'Lingua',
      'settings.lang.en': 'English',
      'settings.lang.it': 'Italiano',
      'settings.save': 'Salva modifiche',
      // Footer
      'footer.rights': 'Tutti i diritti riservati',
    }
  };

  function getLang() {
    return localStorage.getItem('aike_lang') || 'en';
  }

  function setLang(lang) {
    localStorage.setItem('aike_lang', lang);
    applyLang(lang);
    updateLangBtns();
  }

  function applyLang(lang) {
    var t = TRANSLATIONS[lang] || TRANSLATIONS['en'];
    document.querySelectorAll('[data-i18n]').forEach(function(el) {
      var key = el.getAttribute('data-i18n');
      if (t[key] !== undefined) {
        el.innerHTML = t[key];
      }
    });
    document.querySelectorAll('[data-i18n-placeholder]').forEach(function(el) {
      var key = el.getAttribute('data-i18n-placeholder');
      if (t[key] !== undefined) {
        el.placeholder = t[key];
      }
    });
    // Update lang toggle UI if exists
    var toggleEl = document.getElementById('lang-toggle-value');
    if (toggleEl) toggleEl.textContent = lang === 'it' ? '🇮🇹 IT' : '🇬🇧 EN';
  }

  function updateLangBtns() {
    var lang = getLang();
    var enBtn = document.getElementById('lang-btn-en');
    var itBtn = document.getElementById('lang-btn-it');
    if (enBtn) enBtn.style.borderColor = lang === 'en' ? 'var(--color-primary)' : 'var(--color-border)';
    if (itBtn) itBtn.style.borderColor = lang === 'it' ? 'var(--color-primary)' : 'var(--color-border)';
  }

  function init() {
    applyLang(getLang());
  }

  window.aikeI18n = { getLang: getLang, setLang: setLang, applyLang: applyLang, init: init, updateLangBtns: updateLangBtns };

  // Auto-init on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
