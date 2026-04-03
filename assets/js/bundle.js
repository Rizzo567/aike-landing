/**
 * AIKE — bundle.js
 * Injects header/footer and handles scroll logic.
 */

const getHeaderHTML = (b) => `
<header class="header" id="aikeHeader">
  <div class="header__inner">
    <a href="${b}index.html" class="header__brand-group">
      <img src="${b}assets/images/logo.png" alt="Aike Logo" class="header__logo">
      <span class="header__brand">aike</span>
    </a>
    <nav class="header__nav hide-on-mobile">
      <a href="${b}pages/solutions.html" class="header__link">Solutions</a>
      <a href="${b}pages/pricing.html" class="header__link">Pricing</a>
      <a href="${b}pages/owl.html" class="header__link">Owl</a>
      <a href="${b}pages/plane.html" class="header__link">Plane</a>
    </nav>
    <div class="header__actions">
      <!-- Desktop Log In -->
      <a id="auth-login-btn" href="${b}pages/login.html" class="btn btn-outline auth-btn-login hide-on-mobile" style="border-color:transparent; padding: 0.5rem 1rem;">Log in</a>
      
      <!-- Profile Wrapper (Desktop & Mobile) -->
      <div id="auth-profile-wrapper" style="display:none; align-items:center; position:relative;">
        <button id="auth-profile-btn" aria-label="Account menu" aria-haspopup="true" aria-expanded="false">
          <span id="auth-profile-initial">?</span>
          <span class="aike-avatar-status" id="auth-avatar-status"><svg viewBox="0 0 24 24" width="14" height="14" fill="#3b82f6" xmlns="http://www.w3.org/2000/svg"><path d="M3.85 8.62a4 4 0 0 1 4.78-4.77 4 4 0 0 1 6.74 0 4 4 0 0 1 4.78 4.78 4 4 0 0 1 0 6.74 4 4 0 0 1-4.77 4.78 4 4 0 0 1-6.75 0 4 4 0 0 1-4.78-4.77 4 4 0 0 1 0-6.76Z"/><path d="m9 12 2 2 4-4" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"/></svg></span>
        </button>
        <div id="auth-dropdown" role="menu">
          <!-- Header: avatar + name + email -->
          <div class="dropdown-header">
            <div class="dropdown-header-avatar" id="dropdown-header-avatar"><span id="dropdown-header-initial">?</span></div>
            <div class="dropdown-header-info">
              <div class="dropdown-header-name" id="dropdown-header-name">Account</div>
              <div class="dropdown-header-email" id="dropdown-header-email"></div>
            </div>
          </div>
          <div class="dropdown-separator"></div>

          <!-- Admin (hidden unless admin) -->
          <a id="auth-dropdown-admin" href="${b}pages/admin.html" role="menuitem" class="dropdown-item" style="color:#c084fc;">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>
            Admin Dashboard
          </a>
          <div id="auth-dropdown-divider" style="display:none;"></div>

          <!-- Settings -->
          <button id="auth-settings-btn" role="menuitem" class="dropdown-item">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
            Impostazioni
          </button>

          <!-- Upgrade -->
          <a href="${b}pages/pricing.html" role="menuitem" class="dropdown-item">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><polyline points="17 11 21 7 17 3"/><line x1="21" y1="7" x2="9" y2="7"/><path d="M3 17a4 4 0 0 0 4 4h8"/></svg>
            Upgrade piano
          </a>

          <div class="dropdown-separator"></div>

          <!-- Logout -->
          <button id="auth-logout-btn" role="menuitem" class="dropdown-item dropdown-item--danger">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
            Logout
          </button>
        </div>
      </div>
      
      <!-- Mobile Menu Trigger -->
      <button class="mobile-nav-trigger" id="mobile-menu-trigger" aria-label="Open menu" aria-expanded="false">
        <span class="mobile-nav-trigger-lines"></span>
      </button>
    </div>
  </div>

  <!-- Mobile Dropdown Panel -->
  <div class="mobile-nav-panel" id="mobile-nav-panel">
    <div class="mobile-nav-panel-inner">
      <a href="${b}pages/solutions.html" class="mobile-nav-link">Solutions</a>
      <a href="${b}pages/pricing.html" class="mobile-nav-link">Pricing</a>
      <a href="${b}pages/owl.html" class="mobile-nav-link">Owl</a>
      <a href="${b}pages/plane.html" class="mobile-nav-link">Plane</a>
      <div class="mobile-nav-divider"></div>
      <a id="auth-login-btn-mobile" href="${b}pages/login.html" class="mobile-nav-link auth-btn-login" style="color:var(--color-primary)">Log in</a>
    </div>
  </div>
</header>
`;

const getFooterHTML = (b) => `
<div style="overflow: hidden; line-height: 0; width: 100%; position: relative; z-index: 10; margin-bottom: -1px;">
  <div class="footer__wave" aria-hidden="true"></div>
</div>
<footer class="footer">
  <div class="footer__bg-animate" aria-hidden="true"></div>
  <div class="container footer__inner">
    <div class="footer__grid">
      <!-- Left/Center Main Content -->
      <div class="footer__main">
        <div class="footer__brand-wrapper">
          <img src="${b}assets/images/logo.png" alt="Aike Logo" class="footer__brand-logo" />
          <span class="footer__brand">aike</span>
        </div>
        
        <p class="footer__description">
          The smart automation setup that helps businesses ship production-ready operations in days, not months.
        </p>

        <nav class="footer__nav" aria-label="Footer navigation">
          <a href="${b}pages/solutions.html" class="footer__link">Solutions</a>
          <a href="${b}pages/pricing.html" class="footer__link">Pricing</a>
        </nav>
        
        <a href="https://discord.com" target="_blank" rel="noopener" class="footer__link" style="display: flex; align-items: center; gap: 8px; color: var(--color-primary); font-weight: 600;">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/></svg>
          Discord Community
        </a>

        <div class="footer__divider"></div>
        
        <div class="footer__bottom-text">
          &copy; 2026 aike. All rights reserved.
        </div>
      </div>
      
      <!-- Right Side Media Wrapper -->
      <div class="footer__media">
        <div class="footer__video-placeholder" aria-label="16:9 Video Placeholder">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
            <polygon points="5 3 19 12 5 21 5 3"></polygon>
          </svg>
          Video Placeholder (16:9)
        </div>
      </div>
    </div>
  </div>
</footer>
`;

function injectHTML(id, html) {
  var el = document.getElementById(id);
  if (!el) return;
  var tmp = document.createElement('div');
  tmp.innerHTML = html;
  el.replaceWith.apply(el, tmp.childNodes);
}

function initHeader() {
  const header = document.getElementById('aikeHeader');
  if (!header) return;

  window.addEventListener('scroll', function() {
    if (window.scrollY > 15) {
      header.classList.add('scrolled');
    } else {
      header.classList.remove('scrolled');
    }
  }, { passive: true });

  const trigger = document.getElementById('mobile-menu-trigger');
  const panel = document.getElementById('mobile-nav-panel');
  if (trigger && panel) {
    trigger.addEventListener('click', function() {
      const isExpanded = trigger.getAttribute('aria-expanded') === 'true';
      if (isExpanded) {
        trigger.setAttribute('aria-expanded', 'false');
        panel.classList.remove('open');
        header.classList.remove('mobile-nav-open');
        document.body.style.overflow = '';
      } else {
        trigger.setAttribute('aria-expanded', 'true');
        panel.classList.add('open');
        header.classList.add('mobile-nav-open');
        document.body.style.overflow = 'hidden';
      }
    });
  }
}

function initScrollReveal() {
  const elements = document.querySelectorAll('[data-reveal]');
  if (!elements.length) return;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('revealed');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1 });

  elements.forEach(el => {
    el.classList.add('reveal-pending');
    observer.observe(el);
  });
}

// ── Settings Overlay HTML ────────────────────────────────────

function getSettingsOverlayHTML() {
  var avatarDefs = [
    { id: 1,  emoji: '🦊', color: '#f97316' },
    { id: 2,  emoji: '🐺', color: '#6366f1' },
    { id: 3,  emoji: '🦁', color: '#eab308' },
    { id: 4,  emoji: '🐉', color: '#22c55e' },
    { id: 5,  emoji: '🦅', color: '#3b82f6' },
    { id: 6,  emoji: '🐬', color: '#06b6d4' },
    { id: 7,  emoji: '🦄', color: '#a855f7' },
    { id: 8,  emoji: '🐻‍❄️', color: '#94a3b8' },
    { id: 9,  emoji: '🦋', color: '#ec4899' },
    { id: 10, emoji: '⚡', color: '#f59e0b' }
  ];

  var gridHTML = avatarDefs.map(function(a) {
    return '<button class="avatar-option" data-avatar-id="' + a.id + '" data-emoji="' + a.emoji + '" data-color="' + a.color + '" style="background:' + a.color + ';" title="Avatar ' + a.id + '" aria-label="Scegli avatar ' + a.emoji + '">' + a.emoji + '</button>';
  }).join('');

  return '<div id="aike-settings-overlay" role="dialog" aria-modal="true" aria-label="Impostazioni">' +
    '<div class="settings-scrim" id="settings-scrim"></div>' +
    '<div class="settings-panel">' +
      '<div class="settings-header">' +
        '<span class="settings-title">Impostazioni</span>' +
        '<button class="settings-close-btn" id="settings-close-btn" aria-label="Chiudi impostazioni">' +
          '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>' +
        '</button>' +
      '</div>' +
      '<div class="settings-tabs">' +
        '<button class="settings-tab active" data-tab="profile">Profilo</button>' +
        '<button class="settings-tab" data-tab="account">Account</button>' +
        '<button class="settings-tab" data-tab="prefs">Preferenze</button>' +
      '</div>' +
      '<div class="settings-body">' +
        '<div class="settings-tab-panel active" id="settings-panel-profile">' +
          '<div class="settings-profile-avatar-section">' +
            '<div class="settings-avatar-preview">' +
              '<div class="settings-avatar-circle" id="settings-avatar-circle"><span id="settings-avatar-preview-content">?</span></div>' +
              '<div class="settings-avatar-status"></div>' +
            '</div>' +
          '</div>' +
          '<div class="settings-avatar-grid-label">Scegli il tuo avatar</div>' +
          '<div class="settings-avatar-grid" id="settings-avatar-grid">' + gridHTML + '</div>' +
          '<div class="settings-field">' +
            '<label for="settings-display-name">Nome visualizzato</label>' +
            '<input type="text" id="settings-display-name" placeholder="Il tuo nome..." maxlength="40" autocomplete="name">' +
          '</div>' +
          '<button class="settings-save-btn" id="settings-save-btn">Salva modifiche</button>' +
        '</div>' +
        '<div class="settings-tab-panel" id="settings-panel-account">' +
          '<div class="settings-coming-soon"><span>🔒</span>Disponibile a breve</div>' +
        '</div>' +
        '<div class="settings-tab-panel" id="settings-panel-prefs">' +
          '<div class="settings-field">' +
            '<label style="color:var(--color-text-muted);font-size:0.85rem;text-transform:uppercase;letter-spacing:0.05em;">Lingua / Language</label>' +
            '<div style="display:flex;gap:8px;margin-top:8px;">' +
              '<button class="lang-btn" id="lang-btn-en" onclick="window.aikeI18n&&window.aikeI18n.setLang(\'en\');window.aikeI18n&&window.aikeI18n.updateLangBtns&&window.aikeI18n.updateLangBtns()" style="flex:1;padding:10px;border-radius:10px;border:1px solid var(--color-border);background:var(--color-surface-alt);color:var(--color-text);cursor:pointer;font-size:0.95rem;transition:border-color 0.2s;">🇬🇧 English</button>' +
              '<button class="lang-btn" id="lang-btn-it" onclick="window.aikeI18n&&window.aikeI18n.setLang(\'it\');window.aikeI18n&&window.aikeI18n.updateLangBtns&&window.aikeI18n.updateLangBtns()" style="flex:1;padding:10px;border-radius:10px;border:1px solid var(--color-border);background:var(--color-surface-alt);color:var(--color-text);cursor:pointer;font-size:0.95rem;transition:border-color 0.2s;">🇮🇹 Italiano</button>' +
            '</div>' +
          '</div>' +
        '</div>' +
      '</div>' +
    '</div>' +
  '</div>';
}

// ── Avatar persistence helpers ───────────────────────────────

function loadSavedAvatar() {
  try {
    return JSON.parse(localStorage.getItem('aike_avatar') || 'null');
  } catch(e) { return null; }
}

function saveAvatar(avatarObj) {
  try {
    localStorage.setItem('aike_avatar', JSON.stringify(avatarObj));
  } catch(e) {}
}

function loadSavedDisplayName() {
  try {
    return localStorage.getItem('aike_display_name') || '';
  } catch(e) { return ''; }
}

function saveDisplayName(name) {
  try {
    localStorage.setItem('aike_display_name', name);
  } catch(e) {}
}

// ── Apply avatar to header button ────────────────────────────

window.applyAvatarToHeader = function applyAvatarToHeader(avatarData, userEmail) {
  var btn = document.getElementById('auth-profile-btn');
  var initial = document.getElementById('auth-profile-initial');
  var dropHdrAvatar = document.getElementById('dropdown-header-avatar');
  var dropHdrInitial = document.getElementById('dropdown-header-initial');

  if (avatarData) {
    // Show emoji avatar
    if (initial) {
      initial.innerHTML = '<span class="aike-avatar-emoji">' + avatarData.emoji + '</span>';
    }
    if (btn) {
      btn.style.background = avatarData.color;
      btn.style.fontSize = '20px';
    }
    if (dropHdrAvatar) {
      dropHdrAvatar.style.background = avatarData.color;
      dropHdrAvatar.innerHTML = '<span style="font-size:17px">' + avatarData.emoji + '</span>';
    }
  } else {
    // Show initial
    var letter = userEmail ? userEmail.charAt(0).toUpperCase() : '?';
    if (initial) initial.textContent = letter;
    if (btn) {
      btn.style.background = '';
      btn.style.fontSize = '';
    }
    if (dropHdrAvatar) {
      dropHdrAvatar.style.background = '';
      dropHdrAvatar.innerHTML = '<span id="dropdown-header-initial">' + letter + '</span>';
    }
  }
}

window.applyDisplayNameToDropdown = function applyDisplayNameToDropdown(name, email) {
  var nameEl = document.getElementById('dropdown-header-name');
  var emailEl = document.getElementById('dropdown-header-email');
  if (nameEl) nameEl.textContent = name || (email ? email.split('@')[0] : 'Account');
  if (emailEl) emailEl.textContent = email || '';
}

// ── Settings overlay controller ──────────────────────────────

function initSettingsOverlay() {
  var overlay = document.getElementById('aike-settings-overlay');
  if (!overlay) return;

  var scrim = document.getElementById('settings-scrim');
  var closeBtn = document.getElementById('settings-close-btn');
  var saveBtn = document.getElementById('settings-save-btn');
  var nameInput = document.getElementById('settings-display-name');
  var avatarGrid = document.getElementById('settings-avatar-grid');
  var settingsAvatarCircle = document.getElementById('settings-avatar-circle');
  var settingsAvatarPreview = document.getElementById('settings-avatar-preview-content');
  var tabs = overlay.querySelectorAll('.settings-tab');
  var panels = overlay.querySelectorAll('.settings-tab-panel');

  var currentSelectedAvatar = loadSavedAvatar();

  // Populate name input
  if (nameInput) nameInput.value = loadSavedDisplayName();

  // Mark selected avatar in grid
  function markSelectedAvatar(id) {
    var opts = avatarGrid ? avatarGrid.querySelectorAll('.avatar-option') : [];
    opts.forEach(function(opt) {
      opt.classList.toggle('selected', parseInt(opt.dataset.avatarId) === id);
    });
  }

  if (currentSelectedAvatar) {
    markSelectedAvatar(currentSelectedAvatar.id);
    updateSettingsPreview(currentSelectedAvatar);
  } else {
    updateSettingsPreviewFromEmail();
  }

  function updateSettingsPreview(avatarData) {
    if (!settingsAvatarCircle) return;
    settingsAvatarCircle.style.background = avatarData.color;
    if (settingsAvatarPreview) settingsAvatarPreview.innerHTML = '<span style="font-size:36px">' + avatarData.emoji + '</span>';
  }

  function updateSettingsPreviewFromEmail() {
    if (!settingsAvatarCircle) return;
    settingsAvatarCircle.style.background = '';
    var btn = document.getElementById('auth-profile-btn');
    var initial = btn ? (btn.querySelector('#auth-profile-initial') || btn.querySelector('[id="auth-profile-initial"]')) : null;
    var letter = '?';
    if (document.getElementById('dropdown-header-email')) {
      var em = document.getElementById('dropdown-header-email').textContent;
      if (em) letter = em.charAt(0).toUpperCase();
    }
    if (settingsAvatarPreview) settingsAvatarPreview.textContent = letter;
  }

  // Avatar grid click
  if (avatarGrid) {
    avatarGrid.addEventListener('click', function(e) {
      var opt = e.target.closest('.avatar-option');
      if (!opt) return;
      var id = parseInt(opt.dataset.avatarId);
      var emoji = opt.dataset.emoji;
      var color = opt.dataset.color;
      currentSelectedAvatar = { id: id, emoji: emoji, color: color };
      markSelectedAvatar(id);
      updateSettingsPreview(currentSelectedAvatar);
    });
  }

  // Tab switching
  tabs.forEach(function(tab) {
    tab.addEventListener('click', function() {
      var target = tab.dataset.tab;
      tabs.forEach(function(t) { t.classList.remove('active'); });
      panels.forEach(function(p) { p.classList.remove('active'); });
      tab.classList.add('active');
      var panel = document.getElementById('settings-panel-' + target);
      if (panel) panel.classList.add('active');
    });
  });

  // Save
  if (saveBtn) {
    saveBtn.addEventListener('click', function() {
      var displayName = nameInput ? nameInput.value.trim() : '';
      saveDisplayName(displayName);
      if (currentSelectedAvatar) {
        saveAvatar(currentSelectedAvatar);
        var emailForAvatar = document.getElementById('dropdown-header-email') ? document.getElementById('dropdown-header-email').textContent : '';
        window.applyAvatarToHeader(currentSelectedAvatar, emailForAvatar);
      }
      var email = document.getElementById('dropdown-header-email') ? document.getElementById('dropdown-header-email').textContent : '';
      window.applyDisplayNameToDropdown(displayName, email);

      // Visual feedback
      saveBtn.textContent = 'Salvato ✓';
      saveBtn.style.background = '#22c55e';
      setTimeout(function() {
        saveBtn.textContent = 'Salva modifiche';
        saveBtn.style.background = '';
        closeSettings();
      }, 900);
    });
  }

  // Close handlers
  function closeSettings() {
    overlay.classList.remove('overlay-open');
    document.body.style.overflow = '';
  }

  function openSettings() {
    // Refresh state from storage each time
    var saved = loadSavedAvatar();
    var savedName = loadSavedDisplayName();
    currentSelectedAvatar = saved;
    if (nameInput) nameInput.value = savedName;
    markSelectedAvatar(saved ? saved.id : -1);
    if (saved) updateSettingsPreview(saved);
    else updateSettingsPreviewFromEmail();

    overlay.classList.add('overlay-open');
    document.body.style.overflow = 'hidden';
    if (nameInput) setTimeout(function() { nameInput.focus(); }, 250);
    if (window.aikeI18n && window.aikeI18n.updateLangBtns) window.aikeI18n.updateLangBtns();
  }

  if (closeBtn) closeBtn.addEventListener('click', closeSettings);
  if (scrim) scrim.addEventListener('click', closeSettings);

  // ESC key
  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape' && overlay.classList.contains('overlay-open')) closeSettings();
  });

  // Expose open function
  window.aikeOpenSettings = openSettings;
}

// ── Auth Modal ─────────────────────────────────────────────────────────────

function injectAuthModalCSS() {
  if (document.getElementById('aam-styles')) return;
  var style = document.createElement('style');
  style.id = 'aam-styles';
  style.textContent = [
    '#aam-overlay{position:fixed;inset:0;z-index:9999;display:flex;align-items:center;justify-content:center;padding:20px;opacity:0;pointer-events:none;transition:opacity 0.25s ease;}',
    '#aam-overlay.aam-open{opacity:1;pointer-events:all;}',
    '.aam-scrim{position:absolute;inset:0;background:rgba(0,0,0,0.72);backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px);}',
    '.aam-dialog{position:relative;display:flex;width:min(860px,95vw);max-height:90dvh;background:#09090f;border-radius:16px;overflow:hidden;border:1px solid #14141f;transform:scale(0.96) translateY(8px);transition:transform 0.28s cubic-bezier(0.16,1,0.3,1);}',
    '#aam-overlay.aam-open .aam-dialog{transform:scale(1) translateY(0);}',
    '.aam-left{position:relative;width:42%;overflow:hidden;background:#07070e;border-right:1px solid #14141f;display:flex;flex-direction:column;}',
    '#aam-stars{position:absolute;inset:0;width:100%;height:100%;pointer-events:none;}',
    '.aam-left-inner{position:relative;z-index:2;display:flex;flex-direction:column;height:100%;padding:36px 40px;}',
    '.aam-brand{display:flex;align-items:center;gap:10px;text-decoration:none;flex-shrink:0;}',
    '.aam-brand-logo{height:28px;width:auto;}',
    ".aam-brand-name{font-family:'Suisse Int\\'l','Inter',system-ui,sans-serif;font-size:1.4rem;font-weight:700;color:#fff;letter-spacing:-0.02em;line-height:1;}",
    '.aam-cta{flex:1;display:flex;flex-direction:column;justify-content:center;gap:28px;padding:24px 0 16px;}',
    '.aam-cta-text{font-size:clamp(1.2rem,1.8vw,1.6rem);font-weight:800;line-height:1.2;letter-spacing:-0.03em;color:#fff;perspective:800px;transform-style:preserve-3d;}',
    '.aam-line-1{display:inline-block;opacity:0;transform:translateY(50px) scale(0.87) rotateX(-18deg);filter:blur(16px);transition:opacity 1.3s cubic-bezier(0.16,1,0.3,1),transform 1.3s cubic-bezier(0.16,1,0.3,1),filter 1.3s cubic-bezier(0.16,1,0.3,1);}',
    '.aam-line-1.animate{opacity:1;transform:translateY(0) scale(1) rotateX(0);filter:blur(0);}',
    '.aam-line-2{display:inline-block;background-color:#3b1d64;color:#d9abff;padding:3px 12px;border-radius:5px;margin-top:8px;transform:rotate(-2.5deg) translateY(-2px);box-shadow:0 8px 24px rgba(168,85,247,0.15);clip-path:inset(0 100% 0 0);transition:clip-path 1.1s cubic-bezier(0.77,0,0.175,1);}',
    '.aam-line-2.animate{clip-path:inset(0 0% 0 0);}',
    '.aam-globe-wrap{display:flex;justify-content:center;align-items:center;position:relative;height:180px;}',
    '.aam-globe-glow{position:absolute;width:220px;height:220px;background:radial-gradient(circle,rgba(99,102,241,0.16),transparent 65%);border-radius:50%;pointer-events:none;}',
    '#aam-globe{display:block;border-radius:50%;}',
    '.aam-left-footer{color:#252535;font-size:11px;flex-shrink:0;}',
    '.aam-right{width:58%;background:#09090f;display:flex;align-items:center;justify-content:center;padding:40px 44px;position:relative;}',
    '.aam-close-btn{position:absolute;top:16px;right:16px;background:none;border:none;cursor:pointer;color:#4b5563;padding:6px;display:flex;align-items:center;border-radius:6px;transition:color 0.15s,background 0.15s;}',
    '.aam-close-btn:hover{color:#d1d5db;background:#111118;}',
    '.aam-form-wrap{width:100%;max-width:340px;display:flex;flex-direction:column;gap:20px;}',
    '.aam-heading{font-size:22px;font-weight:600;letter-spacing:-0.03em;color:#f9f9fb;}',
    '.aam-sub{font-size:13px;color:#4b5563;margin-top:4px;}',
    '.aam-social-row{display:flex;gap:10px;}',
    '.aam-btn-social{flex:1;background:#111118;border:1px solid #1e1e30;border-radius:8px;padding:10px 12px;display:flex;align-items:center;justify-content:center;gap:8px;color:#d1d5db;font-size:13px;font-weight:500;font-family:inherit;cursor:pointer;transition:border-color 0.15s,background 0.15s;}',
    '.aam-btn-social:hover{border-color:#2e2e45;background:#13131e;}',
    '.aam-btn-social:disabled{opacity:0.5;cursor:not-allowed;}',
    '.aam-divider{display:flex;align-items:center;gap:10px;}',
    '.aam-divider-line{flex:1;height:1px;background:#1a1a2a;}',
    '.aam-divider-text{color:#2a2a3e;font-size:11px;white-space:nowrap;}',
    '.aam-fields{display:flex;flex-direction:column;gap:12px;}',
    '.aam-field{display:flex;flex-direction:column;gap:5px;}',
    '.aam-label{font-size:11px;font-weight:500;color:#4b5563;letter-spacing:0.5px;text-transform:uppercase;}',
    '.aam-input-wrap{position:relative;}',
    '.aam-input{width:100%;background:#0e0e1a;border:1px solid #1e1e30;border-radius:8px;padding:10px 14px;color:#f9f9fb;font-size:14px;font-family:inherit;outline:none;transition:border-color 0.15s;}',
    '.aam-input:focus{border-color:#4f4f8a;}',
    '.aam-input::placeholder{color:#252535;}',
    '.aam-input.has-toggle{padding-right:40px;}',
    '.aam-pw-toggle{position:absolute;right:10px;top:50%;transform:translateY(-50%);background:none;border:none;cursor:pointer;color:#4b5563;padding:4px;display:flex;align-items:center;}',
    '.aam-pw-toggle:hover{color:#9ca3af;}',
    '.aam-field-error{font-size:12px;color:#ef4444;min-height:15px;display:none;}',
    '.aam-field-error.visible{display:block;}',
    '.aam-btn-submit{width:100%;background:#fff;color:#09090f;border:none;border-radius:8px;padding:11px 20px;font-size:14px;font-weight:600;font-family:inherit;letter-spacing:-0.01em;cursor:pointer;transition:opacity 0.15s;display:flex;align-items:center;justify-content:center;gap:8px;}',
    '.aam-btn-submit:hover:not(:disabled){opacity:0.9;}',
    '.aam-btn-submit:disabled{opacity:0.6;cursor:not-allowed;}',
    '.aam-spinner{width:14px;height:14px;border:2px solid rgba(0,0,0,0.2);border-top-color:#09090f;border-radius:50%;animation:aam-spin 0.7s linear infinite;display:none;}',
    '@keyframes aam-spin{to{transform:rotate(360deg);}}',
    '.aam-footer-link{font-size:12px;color:#4b5563;text-align:center;}',
    '.aam-footer-link a{color:#8b8ba0;text-decoration:underline;text-underline-offset:2px;}',
    '.aam-footer-link a:hover{color:#d1d5db;}',
    '.aam-error-banner{background:rgba(239,68,68,0.08);border:1px solid rgba(239,68,68,0.25);border-radius:8px;padding:10px 14px;font-size:13px;color:#f87171;display:none;}',
    '.aam-error-banner.visible{display:block;}',
    '@media(max-width:640px){.aam-left{display:none;}.aam-right{width:100%;padding:32px 24px;}.aam-dialog{width:95vw;}}'
  ].join('');
  document.head.appendChild(style);
}

function getAuthModalHTML(b) {
  return '<div id="aam-overlay" role="dialog" aria-modal="true" aria-label="Accedi">' +
    '<div class="aam-scrim" id="aam-scrim"></div>' +
    '<div class="aam-dialog">' +
      '<div class="aam-left">' +
        '<canvas id="aam-stars"></canvas>' +
        '<div class="aam-left-inner">' +
          '<a href="' + b + 'index.html" class="aam-brand">' +
            '<img src="' + b + 'assets/images/logo.png" alt="Aike Logo" class="aam-brand-logo">' +
            '<span class="aam-brand-name">aike</span>' +
          '</a>' +
          '<div class="aam-cta">' +
            '<div class="aam-cta-text">' +
              '<span class="aam-line-1">Built for teams that<br>move fast and</span><br>' +
              '<span class="aam-line-2">need results</span>' +
            '</div>' +
            '<div class="aam-globe-wrap">' +
              '<div class="aam-globe-glow"></div>' +
              '<canvas id="aam-globe" width="160" height="160"></canvas>' +
            '</div>' +
          '</div>' +
          '<div class="aam-left-footer">\u00a9 2025 AIKE</div>' +
        '</div>' +
      '</div>' +
      '<div class="aam-right">' +
        '<button class="aam-close-btn" id="aam-close" aria-label="Chiudi">' +
          '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>' +
        '</button>' +
        '<div class="aam-form-wrap">' +
          '<div><div class="aam-heading">Bentornato</div><div class="aam-sub">Accedi al tuo account AIKE.</div></div>' +
          '<div class="aam-social-row">' +
            '<button class="aam-btn-social" id="aam-btn-google" type="button">' +
              '<svg width="15" height="15" viewBox="0 0 24 24" aria-hidden="true"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>' +
              'Google' +
            '</button>' +
            '<button class="aam-btn-social" id="aam-btn-github" type="button">' +
              '<svg width="15" height="15" viewBox="0 0 24 24" fill="#d1d5db" aria-hidden="true"><path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z"/></svg>' +
              'GitHub' +
            '</button>' +
          '</div>' +
          '<div class="aam-divider"><div class="aam-divider-line"></div><div class="aam-divider-text">oppure continua con email</div><div class="aam-divider-line"></div></div>' +
          '<div class="aam-error-banner" id="aam-error-banner" role="alert"></div>' +
          '<form class="aam-fields" id="aam-form" novalidate>' +
            '<div class="aam-field">' +
              '<label class="aam-label" for="aam-email">Email</label>' +
              '<div class="aam-input-wrap"><input class="aam-input" type="email" id="aam-email" name="email" autocomplete="email" placeholder="mario@esempio.it" required></div>' +
              '<div class="aam-field-error" id="aam-err-email"></div>' +
            '</div>' +
            '<div class="aam-field">' +
              '<label class="aam-label" for="aam-password">Password</label>' +
              '<div class="aam-input-wrap">' +
                '<input class="aam-input has-toggle" type="password" id="aam-password" name="password" autocomplete="current-password" placeholder="\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022" required>' +
                '<button type="button" class="aam-pw-toggle" id="aam-pw-toggle" aria-label="Mostra/nascondi password">' +
                  '<svg id="aam-eye" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>' +
                  '<svg id="aam-eye-off" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" style="display:none"><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>' +
                '</button>' +
              '</div>' +
              '<div class="aam-field-error" id="aam-err-password"></div>' +
            '</div>' +
            '<button class="aam-btn-submit" type="submit" id="aam-submit">' +
              '<span class="aam-spinner" id="aam-spinner"></span>' +
              '<span id="aam-submit-text">Accedi</span>' +
            '</button>' +
          '</form>' +
          '<div class="aam-footer-link">Non hai un account? <a href="' + b + 'pages/signup.html">Registrati</a></div>' +
        '</div>' +
      '</div>' +
    '</div>' +
  '</div>';
}

function initAuthModal(b) {
  injectAuthModalCSS();

  var container = document.createElement('div');
  container.innerHTML = getAuthModalHTML(b);
  document.body.appendChild(container.firstChild);

  var overlay = document.getElementById('aam-overlay');
  var scrim = document.getElementById('aam-scrim');
  var closeBtn = document.getElementById('aam-close');
  var globeInited = false;
  var starsRaf = null;

  // ── Stars ──────────────────────────────────────────────────
  function initAamStars() {
    if (starsRaf) cancelAnimationFrame(starsRaf);
    var canvas = document.getElementById('aam-stars');
    if (!canvas) return;
    var ctx = canvas.getContext('2d');
    var stars = [];
    var NUM = 120;
    function resize() { canvas.width = canvas.offsetWidth; canvas.height = canvas.offsetHeight; }
    function rand(a, b) { return Math.random() * (b - a) + a; }
    function mkStar(top) {
      var angle = rand(35, 45) * Math.PI / 180;
      var speed = rand(0.4, 1.1), len = rand(18, 55), opacity = rand(0.3, 0.75), w = rand(0.5, 1.4);
      var vx = -Math.cos(angle) * speed, vy = Math.sin(angle) * speed, x, y;
      if (top) {
        x = Math.random() < 0.6 ? rand(0, canvas.width) : rand(canvas.width * 0.5, canvas.width + len);
        y = Math.random() < 0.6 ? rand(-len, 0) : rand(-canvas.height * 0.1, canvas.height * 0.4);
      } else {
        x = Math.random() < 0.5 ? rand(0, canvas.width + canvas.height * Math.tan(angle)) : canvas.width + rand(0, len);
        y = rand(-len, canvas.height * 0.3);
      }
      return { x: x, y: y, vx: vx, vy: vy, len: len, opacity: opacity, w: w };
    }
    function off(s) { return s.x < -s.len * 2 || s.y > canvas.height + s.len; }
    function drawStar(s) {
      var hyp = Math.hypot(s.vx, s.vy);
      var nx = s.vx / hyp, ny = s.vy / hyp;
      var g = ctx.createLinearGradient(s.x - nx * s.len, s.y - ny * s.len, s.x, s.y);
      g.addColorStop(0, 'rgba(255,255,255,0)');
      g.addColorStop(1, 'rgba(220,230,255,' + s.opacity + ')');
      ctx.beginPath(); ctx.moveTo(s.x - nx * s.len, s.y - ny * s.len); ctx.lineTo(s.x, s.y);
      ctx.strokeStyle = g; ctx.lineWidth = s.w; ctx.lineCap = 'round'; ctx.stroke();
    }
    resize();
    for (var i = 0; i < NUM; i++) stars.push(mkStar(true));
    function loop() {
      ctx.fillStyle = 'rgba(0,0,0,0.03)'; ctx.fillRect(0, 0, canvas.width, canvas.height);
      for (var i = 0; i < stars.length; i++) {
        stars[i].x += stars[i].vx; stars[i].y += stars[i].vy;
        if (off(stars[i])) stars[i] = mkStar(false); else drawStar(stars[i]);
      }
      starsRaf = requestAnimationFrame(loop);
    }
    loop();
  }

  // ── Globe ──────────────────────────────────────────────────
  function initAamGlobe() {
    var s = document.createElement('script');
    s.type = 'module';
    s.textContent =
      'import createGlobe from "https://cdn.jsdelivr.net/npm/cobe@0.6.3/+esm";' +
      'var c=document.getElementById("aam-globe");' +
      'if(c){var phi=0;createGlobe(c,{devicePixelRatio:2,width:320,height:320,phi:0,theta:0.25,dark:1,diffuse:1.2,mapSamples:10000,mapBrightness:6,baseColor:[0.18,0.12,0.38],markerColor:[0.55,0.25,0.95],glowColor:[0.15,0.08,0.3],markers:[{location:[41.9,12.5],size:0.05},{location:[48.8,2.3],size:0.04},{location:[40.7,-74],size:0.06}],onRender:function(state){state.phi=phi;phi+=0.004;}});}';
    document.head.appendChild(s);
  }

  // ── Open / Close ───────────────────────────────────────────
  function openModal() {
    overlay.classList.add('aam-open');
    document.body.style.overflow = 'hidden';
    if (!globeInited) { initAamGlobe(); globeInited = true; }
    initAamStars();
    setTimeout(function() {
      var l1 = overlay.querySelector('.aam-line-1');
      var l2 = overlay.querySelector('.aam-line-2');
      if (l1) l1.classList.add('animate');
      if (l2) setTimeout(function() { l2.classList.add('animate'); }, 550);
    }, 80);
    setTimeout(function() { var el = document.getElementById('aam-email'); if (el) el.focus(); }, 300);
  }

  function closeModal() {
    overlay.classList.remove('aam-open');
    document.body.style.overflow = '';
    if (starsRaf) { cancelAnimationFrame(starsRaf); starsRaf = null; }
    var l1 = overlay.querySelector('.aam-line-1');
    var l2 = overlay.querySelector('.aam-line-2');
    if (l1) l1.classList.remove('animate');
    if (l2) l2.classList.remove('animate');
    var form = document.getElementById('aam-form');
    if (form) form.reset();
    showAamBanner('');
    showAamErr('aam-err-email', '');
    showAamErr('aam-err-password', '');
  }

  // ── Intercept login links ──────────────────────────────────
  document.addEventListener('click', function(e) {
    var btn = e.target.closest('.auth-btn-login');
    if (btn) { e.preventDefault(); openModal(); }
  });

  if (closeBtn) closeBtn.addEventListener('click', closeModal);
  if (scrim) scrim.addEventListener('click', closeModal);
  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape' && overlay.classList.contains('aam-open')) closeModal();
  });

  // ── Helpers ────────────────────────────────────────────────
  function showAamErr(id, msg) {
    var el = document.getElementById(id);
    if (!el) return;
    el.textContent = msg;
    el.classList.toggle('visible', !!msg);
  }
  function showAamBanner(msg) {
    var el = document.getElementById('aam-error-banner');
    if (!el) return;
    el.textContent = msg;
    el.classList.toggle('visible', !!msg);
  }
  function setAamLoading(on) {
    var btn = document.getElementById('aam-submit');
    var sp = document.getElementById('aam-spinner');
    var txt = document.getElementById('aam-submit-text');
    if (!btn) return;
    btn.disabled = on;
    if (sp) sp.style.display = on ? 'block' : 'none';
    if (txt) txt.textContent = on ? '' : 'Accedi';
    document.querySelectorAll('.aam-btn-social').forEach(function(b) { b.disabled = on; });
  }

  // ── Password toggle ────────────────────────────────────────
  var pwInput = document.getElementById('aam-password');
  var pwToggle = document.getElementById('aam-pw-toggle');
  var pwEye = document.getElementById('aam-eye');
  var pwEyeOff = document.getElementById('aam-eye-off');
  if (pwToggle) {
    pwToggle.addEventListener('click', function() {
      var isText = pwInput.type === 'text';
      pwInput.type = isText ? 'password' : 'text';
      if (pwEye) pwEye.style.display = isText ? 'block' : 'none';
      if (pwEyeOff) pwEyeOff.style.display = isText ? 'none' : 'block';
    });
  }

  // ── OAuth ──────────────────────────────────────────────────
  var gBtn = document.getElementById('aam-btn-google');
  var ghBtn = document.getElementById('aam-btn-github');
  if (gBtn) gBtn.addEventListener('click', async function() {
    setAamLoading(true);
    if (window.aikeAuth) await window.aikeAuth.signInWithOAuth('google');
  });
  if (ghBtn) ghBtn.addEventListener('click', async function() {
    setAamLoading(true);
    if (window.aikeAuth) await window.aikeAuth.signInWithOAuth('github');
  });

  // ── Email/password form ────────────────────────────────────
  var form = document.getElementById('aam-form');
  if (form) {
    form.addEventListener('submit', async function(e) {
      e.preventDefault();
      showAamBanner('');
      showAamErr('aam-err-email', '');
      showAamErr('aam-err-password', '');
      var email = document.getElementById('aam-email').value.trim().toLowerCase();
      var password = document.getElementById('aam-password').value;
      var valid = true;
      if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        showAamErr('aam-err-email', 'Inserisci un indirizzo email valido.');
        valid = false;
      }
      if (!password) {
        showAamErr('aam-err-password', 'Inserisci la password.');
        valid = false;
      }
      if (!valid) return;
      setAamLoading(true);
      if (!window.aikeSupabase) { showAamBanner('Errore di configurazione.'); setAamLoading(false); return; }
      var sb = window.aikeSupabase.getClient();
      var result = await sb.auth.signInWithPassword({ email: email, password: password });
      if (result.error) {
        setAamLoading(false);
        showAamBanner(window.aikeAuth ? window.aikeAuth.parseAuthError(result.error) : result.error.message);
        return;
      }
      window.location.reload();
    });
  }
}

document.addEventListener('DOMContentLoaded', function() {
  const isPage = window.location.pathname.includes('/pages/');
  const b = isPage ? '../' : './';

  injectHTML('navbar-placeholder', getHeaderHTML(b));
  injectHTML('footer-placeholder', getFooterHTML(b));

  // Inject settings overlay into body
  var overlayContainer = document.createElement('div');
  overlayContainer.innerHTML = getSettingsOverlayHTML();
  document.body.appendChild(overlayContainer.firstChild);

  // Apply saved avatar immediately (before auth resolves)
  var savedAvatar = loadSavedAvatar();
  if (savedAvatar) window.applyAvatarToHeader(savedAvatar, '');
  var savedName = loadSavedDisplayName();
  window.applyDisplayNameToDropdown(savedName, '');

  // Header is in DOM — tell auth.js to initialise now (no timing guesswork)
  if (window.aikeAuthInit) window.aikeAuthInit();

  initHeader();
  initScrollReveal();
  initInfiniteCarousel();
  initSettingsOverlay();
  initAuthModal(b);

  // Wire settings button (after overlay is ready)
  document.addEventListener('click', function(e) {
    if (e.target.closest('#auth-settings-btn')) {
      var d = document.getElementById('auth-dropdown');
      if (d) d.classList.remove('dropdown-open');
      var btn = document.getElementById('auth-profile-btn');
      if (btn) btn.setAttribute('aria-expanded', 'false');
      if (window.aikeOpenSettings) window.aikeOpenSettings();
    }
  });
});

function initInfiniteCarousel() {
  const track = document.getElementById('aikeMotionCarousel');
  const dots = document.querySelectorAll('.motion-dot');
  if(!track || dots.length === 0) return;
  
  let isAnimating = false;
  let activeDotIndex = 0;

  function updateDots() {
    dots.forEach((dot, i) => {
      dot.classList.toggle('active', i === activeDotIndex);
    });
  }

  function moveNext() {
    if(isAnimating) return;
    isAnimating = true;
    const cardWidth = track.children[0].offsetWidth;
    const gap = parseFloat(getComputedStyle(track).gap) || 0;
    
    track.style.transition = 'transform 0.6s cubic-bezier(0.16, 1, 0.3, 1)';
    track.style.transform = `translateX(-${cardWidth + gap}px)`;
    
    activeDotIndex = (activeDotIndex + 1) % dots.length;
    updateDots();
    
    setTimeout(() => {
      track.style.transition = 'none';
      track.appendChild(track.children[0]);
      track.style.transform = 'translateX(0)';
      isAnimating = false;
    }, 600);
  }

  // Bind dots to navigate
  dots.forEach((dot, index) => {
    dot.addEventListener('click', () => {
      if(isAnimating || activeDotIndex === index) return;
      let steps = index - activeDotIndex;
      if (steps < 0) steps += dots.length;
      
      // Fast forward the loop state smoothly simulating distinct jumps
      for(let i = 0; i < steps; i++) {
        setTimeout(() => moveNext(), i * 650);
      }
    });
  });

  // Optional: Auto-play to keep the dots progressing mapping infinite SaaS behavior
  setInterval(() => {
    if(!document.hidden) moveNext();
  }, 4000);
}
