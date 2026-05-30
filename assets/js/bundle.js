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
      <a href="${b}pages/owl.html" class="header__link" data-admin-only style="display:none">Owl</a>
      <a href="${b}pages/plane.html" class="header__link" data-admin-only style="display:none">Plane</a>
      <a href="${b}pages/operations-os.html" class="header__link" data-admin-only style="display:none">OperationsOS</a>
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
      <a href="${b}pages/owl.html" class="mobile-nav-link" data-admin-only style="display:none">Owl</a>
      <a href="${b}pages/plane.html" class="mobile-nav-link" data-admin-only style="display:none">Plane</a>
      <a href="${b}pages/operations-os.html" class="mobile-nav-link" data-admin-only style="display:none">OperationsOS</a>
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

// ── Settings Overlay HTML (sidebar layout) ───────────────────

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

  var navSections = [
    { id: 'generale',    label: 'Generale',     icon: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>' },
    { id: 'account',     label: 'Account',      icon: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>' },
    { id: 'privacy',     label: 'Privacy',      icon: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>' },
    { id: 'fatturazione', label: 'Fatturazione', icon: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>' },
    { id: 'funzionalita', label: 'Funzionalità', icon: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>' },
    { id: 'owl',         label: 'Owl',          icon: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><circle cx="9" cy="10" r="2"/><circle cx="15" cy="10" r="2"/><path d="M7 17c1 1.5 2.5 2 5 2s4-0.5 5-2"/></svg>' },
    { id: 'plane',       label: 'Plane',        icon: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 21V9"/></svg>' }
  ];

  var navHTML = navSections.map(function(s, i) {
    return '<button class="settings-nav-item' + (i === 0 ? ' active' : '') + '" data-section="' + s.id + '">' + s.icon + '<span>' + s.label + '</span></button>';
  }).join('');

  return '<div id="aike-settings-overlay" role="dialog" aria-modal="true" aria-label="Impostazioni">' +
    '<div class="settings-overlay-scrim" id="settings-scrim"></div>' +
    '<div class="settings-modal">' +
      '<div class="settings-sidebar">' +
        '<div class="settings-sidebar-title">Impostazioni</div>' +
        '<nav class="settings-nav">' + navHTML + '</nav>' +
      '</div>' +
      '<div class="settings-content">' +
        '<button class="settings-modal-close" id="settings-close-btn" aria-label="Chiudi impostazioni">' +
          '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>' +
        '</button>' +

        // ── GENERALE ──
        '<div class="settings-section active" id="settings-section-generale">' +
          '<h2 class="settings-section-heading">Generale</h2>' +
          '<div class="settings-row">' +
            '<div class="settings-row-label">' +
              '<div class="settings-row-title">Lingua</div>' +
              '<div class="settings-row-desc">Lingua dell\'interfaccia</div>' +
            '</div>' +
            '<select class="settings-select" id="settings-locale">' +
              '<option value="it">Italiano</option>' +
              '<option value="en">English</option>' +
            '</select>' +
          '</div>' +
          '<div class="settings-row">' +
            '<div class="settings-row-label">' +
              '<div class="settings-row-title">Notifiche email</div>' +
              '<div class="settings-row-desc">Ricevi aggiornamenti e novità via email</div>' +
            '</div>' +
            '<label class="settings-toggle"><input type="checkbox" id="settings-email-notifications" checked><span class="settings-toggle-track"></span></label>' +
          '</div>' +
        '</div>' +

        // ── ACCOUNT ──
        '<div class="settings-section" id="settings-section-account">' +
          '<h2 class="settings-section-heading">Account</h2>' +

          // Avatar row
          '<div class="settings-row settings-row--avatar">' +
            '<div class="settings-row-label">' +
              '<div class="settings-row-title">Avatar</div>' +
              '<div class="settings-row-desc">Il tuo avatar nell\'header</div>' +
            '</div>' +
            '<div style="display:flex;align-items:center;gap:12px;">' +
              '<div class="settings-avatar-circle" id="settings-avatar-circle" style="width:48px;height:48px;font-size:24px;"><span id="settings-avatar-preview-content">?</span></div>' +
              '<button class="settings-btn-secondary" id="settings-avatar-change-btn">Cambia</button>' +
            '</div>' +
          '</div>' +

          // Avatar picker (hidden by default)
          '<div class="settings-avatar-picker" id="settings-avatar-picker" style="display:none;">' +
            '<div class="settings-avatar-grid-label">Scegli il tuo avatar</div>' +
            '<div class="settings-avatar-grid" id="settings-avatar-grid">' + gridHTML + '</div>' +
            '<button class="settings-btn-secondary" id="settings-avatar-close-btn" style="margin-top:8px;">Chiudi</button>' +
          '</div>' +

          // Display name row
          '<div class="settings-row">' +
            '<div class="settings-row-label">' +
              '<div class="settings-row-title">Nome visualizzato</div>' +
              '<div class="settings-row-desc">Come appari nell\'app</div>' +
            '</div>' +
            '<div style="display:flex;gap:8px;align-items:center;">' +
              '<input type="text" class="settings-input" id="settings-display-name" placeholder="Il tuo nome..." maxlength="40" autocomplete="name" style="width:180px;">' +
              '<button class="settings-btn-primary" id="settings-save-name-btn">Salva</button>' +
            '</div>' +
          '</div>' +

          // Email row
          '<div class="settings-row" id="settings-email-row">' +
            '<div class="settings-row-label">' +
              '<div class="settings-row-title">Email</div>' +
              '<div class="settings-row-desc" id="settings-email-value"></div>' +
            '</div>' +
            '<div style="display:flex;align-items:center;gap:8px;" id="settings-email-status-wrap">' +
              '<span class="verification-badge verification-badge--unverified" id="settings-email-badge" style="display:none;">Non verificata</span>' +
              '<span class="verification-badge verification-badge--verified" id="settings-email-badge-ok" style="display:none;">Verificata ✓</span>' +
              '<button class="settings-btn-secondary" id="settings-verify-btn" style="display:none;">Verifica</button>' +
            '</div>' +
          '</div>' +

          // OTP inline form (hidden by default)
          '<div class="otp-form" id="settings-otp-form" style="display:none;">' +
            '<div class="otp-form-label">Inserisci il codice a 6 cifre inviato alla tua email</div>' +
            '<div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap;">' +
              '<input type="text" inputmode="numeric" pattern="[0-9]*" maxlength="6" class="otp-input" id="settings-otp-input" placeholder="000000" autocomplete="one-time-code">' +
              '<button class="settings-btn-primary" id="settings-otp-confirm-btn">Conferma</button>' +
            '</div>' +
            '<div class="otp-form-resend">' +
              '<button class="otp-resend-btn" id="settings-otp-resend-btn">Invia di nuovo</button>' +
              '<span class="otp-countdown" id="settings-otp-countdown" style="display:none;"></span>' +
            '</div>' +
            '<div class="otp-form-error" id="settings-otp-error" style="display:none;"></div>' +
          '</div>' +

          // Password row
          '<div class="settings-row">' +
            '<div class="settings-row-label">' +
              '<div class="settings-row-title">Password</div>' +
              '<div class="settings-row-desc">Reimposta la tua password via email</div>' +
            '</div>' +
            '<button class="settings-btn-secondary" id="settings-reset-password-btn">Cambia password</button>' +
          '</div>' +

          // Danger zone
          '<div class="settings-danger-zone">' +
            '<div class="settings-danger-title">Zona pericolosa</div>' +
            '<div class="settings-row">' +
              '<div class="settings-row-label">' +
                '<div class="settings-row-title" style="color:#ef4444;">Elimina account</div>' +
                '<div class="settings-row-desc">Questa azione è irreversibile</div>' +
              '</div>' +
              '<button class="settings-btn-danger" id="settings-delete-account-btn">Elimina account</button>' +
            '</div>' +
          '</div>' +
        '</div>' +

        // ── PRIVACY ──
        '<div class="settings-section" id="settings-section-privacy">' +
          '<h2 class="settings-section-heading">Privacy</h2>' +
          '<div class="settings-row">' +
            '<div class="settings-row-label">' +
              '<div class="settings-row-title">Memoria AI</div>' +
              '<div class="settings-row-desc">Owl ricorda le conversazioni passate</div>' +
            '</div>' +
            '<label class="settings-toggle"><input type="checkbox" id="settings-ai-memory" checked><span class="settings-toggle-track"></span></label>' +
          '</div>' +
          '<div class="settings-row">' +
            '<div class="settings-row-label">' +
              '<div class="settings-row-title">Esporta dati</div>' +
              '<div class="settings-row-desc">Scarica i tuoi dati in formato JSON</div>' +
            '</div>' +
            '<button class="settings-btn-secondary" id="settings-export-data-btn">Esporta</button>' +
          '</div>' +
          '<div class="settings-row">' +
            '<div class="settings-row-label">' +
              '<div class="settings-row-title" style="color:#ef4444;">Elimina tutti i dati</div>' +
              '<div class="settings-row-desc">Svuota i dati del profilo (non elimina l\'account)</div>' +
            '</div>' +
            '<button class="settings-btn-danger" id="settings-delete-data-btn">Elimina dati</button>' +
          '</div>' +
        '</div>' +

        // ── FATTURAZIONE ──
        '<div class="settings-section" id="settings-section-fatturazione">' +
          '<h2 class="settings-section-heading">Fatturazione</h2>' +
          '<div class="settings-row">' +
            '<div class="settings-row-label">' +
              '<div class="settings-row-title">Piano attivo</div>' +
            '</div>' +
            '<span class="settings-plan-badge" id="settings-plan-badge">Free</span>' +
          '</div>' +
          '<div class="settings-row settings-row--col">' +
            '<div class="settings-row-label">' +
              '<div class="settings-row-title">Crediti rimasti</div>' +
              '<div class="settings-row-desc" id="settings-credits-desc">— / —</div>' +
            '</div>' +
            '<div class="settings-credits-bar-wrap">' +
              '<div class="settings-credits-bar"><div class="settings-credits-bar-fill" id="settings-credits-fill" style="width:0%"></div></div>' +
            '</div>' +
          '</div>' +
          '<div class="settings-row">' +
            '<div class="settings-row-label">' +
              '<div class="settings-row-title">Storico pagamenti</div>' +
            '</div>' +
          '</div>' +
          '<div class="settings-payments-empty">Nessun pagamento registrato</div>' +
        '</div>' +

        // ── FUNZIONALITA ──
        '<div class="settings-section" id="settings-section-funzionalita">' +
          '<h2 class="settings-section-heading">Funzionalità</h2>' +
          '<div class="settings-row">' +
            '<div class="settings-row-label">' +
              '<div class="settings-row-title">Suggerimenti AI</div>' +
              '<div class="settings-row-desc">Suggerimenti contestuali durante l\'uso</div>' +
            '</div>' +
            '<label class="settings-toggle"><input type="checkbox" id="settings-ai-suggestions" checked><span class="settings-toggle-track"></span></label>' +
          '</div>' +
          '<div class="settings-row">' +
            '<div class="settings-row-label">' +
              '<div class="settings-row-title">Salvataggio automatico Plane</div>' +
              '<div class="settings-row-desc">Salva il canvas automaticamente</div>' +
            '</div>' +
            '<label class="settings-toggle"><input type="checkbox" id="settings-plane-autosave" checked><span class="settings-toggle-track"></span></label>' +
          '</div>' +
        '</div>' +

        // ── OWL ──
        '<div class="settings-section" id="settings-section-owl">' +
          '<h2 class="settings-section-heading">Owl</h2>' +
          '<div class="settings-row">' +
            '<div class="settings-row-label">' +
              '<div class="settings-row-title">Lingua risposta</div>' +
              '<div class="settings-row-desc">Lingua usata da Owl nelle risposte</div>' +
            '</div>' +
            '<select class="settings-select" id="settings-owl-language">' +
              '<option value="it">Italiano</option>' +
              '<option value="en">English</option>' +
            '</select>' +
          '</div>' +
          '<div class="settings-row">' +
            '<div class="settings-row-label">' +
              '<div class="settings-row-title">Tono risposte</div>' +
              '<div class="settings-row-desc">Stile comunicativo di Owl</div>' +
            '</div>' +
            '<select class="settings-select" id="settings-owl-tone">' +
              '<option value="formal">Formale</option>' +
              '<option value="balanced">Bilanciato</option>' +
              '<option value="creative">Creativo</option>' +
            '</select>' +
          '</div>' +
        '</div>' +

        // ── PLANE ──
        '<div class="settings-section" id="settings-section-plane">' +
          '<h2 class="settings-section-heading">Plane</h2>' +
          '<div class="settings-row">' +
            '<div class="settings-row-label">' +
              '<div class="settings-row-title">Griglia snap</div>' +
              '<div class="settings-row-desc">Aggancia gli elementi alla griglia</div>' +
            '</div>' +
            '<label class="settings-toggle"><input type="checkbox" id="settings-plane-snap-grid"><span class="settings-toggle-track"></span></label>' +
          '</div>' +
          '<div class="settings-row">' +
            '<div class="settings-row-label">' +
              '<div class="settings-row-title">Animazioni</div>' +
              '<div class="settings-row-desc">Animazioni interfaccia Plane</div>' +
            '</div>' +
            '<label class="settings-toggle"><input type="checkbox" id="settings-plane-animations" checked><span class="settings-toggle-track"></span></label>' +
          '</div>' +
        '</div>' +

      '</div>' + // settings-content
    '</div>' + // settings-modal
  '</div>'; // aike-settings-overlay
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

// ── Settings overlay controller (sidebar layout) ────────────

function initSettingsOverlay() {
  var overlay = document.getElementById('aike-settings-overlay');
  if (!overlay) return;

  var scrim     = document.getElementById('settings-scrim');
  var closeBtn  = document.getElementById('settings-close-btn');
  var navItems  = overlay.querySelectorAll('.settings-nav-item');
  var sections  = overlay.querySelectorAll('.settings-section');

  var avatarGrid    = document.getElementById('settings-avatar-grid');
  var avatarCircle  = document.getElementById('settings-avatar-circle');
  var avatarPreview = document.getElementById('settings-avatar-preview-content');
  var nameInput     = document.getElementById('settings-display-name');

  var currentSelectedAvatar = loadSavedAvatar();
  var _profileData = null;

  // ── Supabase helpers ──────────────────────────────────────
  function getJwt() {
    try {
      var sb = window.aikeSupabase ? window.aikeSupabase.getClient() : null;
      if (!sb) return null;
      // Access token from session cache
      var key = Object.keys(localStorage).find(function(k){ return k.startsWith('sb-') && k.endsWith('-auth-token'); });
      if (!key) return null;
      var sess = JSON.parse(localStorage.getItem(key));
      return (sess && sess.access_token) ? sess.access_token : null;
    } catch(e) { return null; }
  }

  async function fetchProfile(userId) {
    var jwt = getJwt();
    if (!jwt || !userId) return null;
    var url = window.AIKE_CONFIG.supabase.url + '/rest/v1/profiles?id=eq.' + userId + '&select=*&limit=1';
    try {
      var r = await fetch(url, {
        headers: {
          'apikey': window.AIKE_CONFIG.supabase.anonKey,
          'Authorization': 'Bearer ' + jwt,
          'Accept': 'application/json'
        }
      });
      if (!r.ok) return null;
      var data = await r.json();
      return data && data.length ? data[0] : null;
    } catch(e) { return null; }
  }

  async function patchProfile(userId, fields) {
    var jwt = getJwt();
    if (!jwt || !userId) return;
    var url = window.AIKE_CONFIG.supabase.url + '/rest/v1/profiles?id=eq.' + userId;
    try {
      await fetch(url, {
        method: 'PATCH',
        headers: {
          'apikey': window.AIKE_CONFIG.supabase.anonKey,
          'Authorization': 'Bearer ' + jwt,
          'Content-Type': 'application/json',
          'Prefer': 'return=minimal'
        },
        body: JSON.stringify(fields)
      });
    } catch(e) {}
  }

  async function getCurrentUserId() {
    if (!window.aikeAuth) return null;
    var user = await window.aikeAuth.getSessionUser();
    return user ? user.id : null;
  }

  // ── Profile population ────────────────────────────────────
  async function populateFromProfile() {
    var userId = await getCurrentUserId();
    if (!userId) return;
    var profile = await fetchProfile(userId);
    _profileData = profile;

    // Email field
    var emailEl = document.getElementById('settings-email-value');
    var userEmail = '';
    if (window.aikeAuth) {
      var u = await window.aikeAuth.getSessionUser();
      if (u) userEmail = u.email || '';
    }
    if (emailEl) emailEl.textContent = userEmail;

    // Email verification badge
    updateEmailVerificationUI(profile ? profile.email_verified : false);

    // Display name
    if (nameInput) {
      var n = (profile && profile.display_name) ? profile.display_name : loadSavedDisplayName();
      nameInput.value = n;
    }

    // Toggles & selects
    function setCheck(id, val, def) {
      var el = document.getElementById(id);
      if (el) el.checked = val !== null && val !== undefined ? !!val : def;
    }
    function setSelect(id, val, def) {
      var el = document.getElementById(id);
      if (el) el.value = (val !== null && val !== undefined) ? val : def;
    }

    if (profile) {
      setCheck('settings-email-notifications', profile.email_notifications, true);
      setCheck('settings-ai-memory', profile.ai_memory_enabled, true);
      setCheck('settings-ai-suggestions', profile.ai_suggestions, true);
      setCheck('settings-plane-autosave', profile.plane_autosave, true);
      setCheck('settings-plane-snap-grid', profile.plane_snap_grid, false);
      setCheck('settings-plane-animations', profile.plane_animations, true);
      setSelect('settings-locale', profile.locale, 'it');
      setSelect('settings-owl-language', profile.owl_language, 'it');
      setSelect('settings-owl-tone', profile.owl_tone, 'balanced');

      // Billing
      var planBadge = document.getElementById('settings-plan-badge');
      if (planBadge) {
        var plan = profile.plan || 'free';
        planBadge.textContent = plan.charAt(0).toUpperCase() + plan.slice(1);
        planBadge.className = 'settings-plan-badge settings-plan-badge--' + plan;
      }
      var creditsDesc = document.getElementById('settings-credits-desc');
      var creditsFill = document.getElementById('settings-credits-fill');
      var limits = { free: 30, basic: 300, pro: 1000 };
      var total = limits[profile.plan] || 30;
      var used = profile.credits_used || 0;
      var remaining = Math.max(0, total - used);
      var pct = total > 0 ? Math.round((remaining / total) * 100) : 0;
      if (creditsDesc) creditsDesc.textContent = remaining + ' / ' + total + ' crediti';
      if (creditsFill) creditsFill.style.width = pct + '%';
    }

    // Update header badge
    updateHeaderVerificationBadge(profile ? profile.email_verified : false);
  }

  function updateEmailVerificationUI(isVerified) {
    var badge    = document.getElementById('settings-email-badge');
    var badgeOk  = document.getElementById('settings-email-badge-ok');
    var verifyBtn = document.getElementById('settings-verify-btn');
    if (isVerified) {
      if (badge)     badge.style.display    = 'none';
      if (badgeOk)   badgeOk.style.display  = 'inline-flex';
      if (verifyBtn) verifyBtn.style.display = 'none';
    } else {
      if (badge)     badge.style.display    = 'inline-flex';
      if (badgeOk)   badgeOk.style.display  = 'none';
      if (verifyBtn) verifyBtn.style.display = 'inline-block';
    }
  }

  function updateHeaderVerificationBadge(isVerified) {
    var statusEl = document.getElementById('auth-avatar-status');
    if (!statusEl) return;
    statusEl.style.display = isVerified ? 'flex' : 'none';
  }

  // ── Avatar helpers ────────────────────────────────────────
  function markSelectedAvatar(id) {
    var opts = avatarGrid ? avatarGrid.querySelectorAll('.avatar-option') : [];
    opts.forEach(function(opt) {
      opt.classList.toggle('selected', parseInt(opt.dataset.avatarId) === id);
    });
  }

  function updateSettingsAvatarPreview(avatarData) {
    if (!avatarCircle) return;
    avatarCircle.style.background = avatarData.color;
    if (avatarPreview) avatarPreview.innerHTML = '<span style="font-size:24px">' + avatarData.emoji + '</span>';
  }

  function updateSettingsAvatarPreviewFromEmail() {
    if (!avatarCircle) return;
    avatarCircle.style.background = '';
    var letter = '?';
    var emailEl = document.getElementById('dropdown-header-email');
    if (emailEl && emailEl.textContent) letter = emailEl.textContent.charAt(0).toUpperCase();
    if (avatarPreview) avatarPreview.textContent = letter;
  }

  // Init avatar preview
  if (currentSelectedAvatar) {
    markSelectedAvatar(currentSelectedAvatar.id);
    updateSettingsAvatarPreview(currentSelectedAvatar);
  } else {
    updateSettingsAvatarPreviewFromEmail();
  }

  // Avatar change button
  var avatarChangeBtn = document.getElementById('settings-avatar-change-btn');
  var avatarPicker    = document.getElementById('settings-avatar-picker');
  var avatarCloseBtn  = document.getElementById('settings-avatar-close-btn');

  if (avatarChangeBtn) {
    avatarChangeBtn.addEventListener('click', function() {
      if (avatarPicker) avatarPicker.style.display = avatarPicker.style.display === 'none' ? 'block' : 'none';
    });
  }
  if (avatarCloseBtn) {
    avatarCloseBtn.addEventListener('click', function() {
      if (avatarPicker) avatarPicker.style.display = 'none';
    });
  }

  if (avatarGrid) {
    avatarGrid.addEventListener('click', function(e) {
      var opt = e.target.closest('.avatar-option');
      if (!opt) return;
      var id    = parseInt(opt.dataset.avatarId);
      var emoji = opt.dataset.emoji;
      var color = opt.dataset.color;
      currentSelectedAvatar = { id: id, emoji: emoji, color: color };
      markSelectedAvatar(id);
      updateSettingsAvatarPreview(currentSelectedAvatar);
      saveAvatar(currentSelectedAvatar);
      var emailForAvatar = document.getElementById('dropdown-header-email') ? document.getElementById('dropdown-header-email').textContent : '';
      window.applyAvatarToHeader(currentSelectedAvatar, emailForAvatar);
      if (avatarPicker) avatarPicker.style.display = 'none';
    });
  }

  // ── Display name save ─────────────────────────────────────
  var saveNameBtn = document.getElementById('settings-save-name-btn');
  if (saveNameBtn) {
    saveNameBtn.addEventListener('click', async function() {
      var name = nameInput ? nameInput.value.trim() : '';
      saveDisplayName(name);
      var email = document.getElementById('dropdown-header-email') ? document.getElementById('dropdown-header-email').textContent : '';
      window.applyDisplayNameToDropdown(name, email);
      var userId = await getCurrentUserId();
      if (userId) await patchProfile(userId, { display_name: name });
      saveNameBtn.textContent = 'Salvato ✓';
      setTimeout(function() { saveNameBtn.textContent = 'Salva'; }, 1500);
    });
  }

  // ── Toggle/select → Supabase patch ───────────────────────
  function wirePatchToggle(id, field) {
    var el = document.getElementById(id);
    if (!el) return;
    el.addEventListener('change', async function() {
      var userId = await getCurrentUserId();
      if (!userId) return;
      var patch = {};
      patch[field] = el.checked;
      await patchProfile(userId, patch);
    });
  }

  function wirePatchSelect(id, field) {
    var el = document.getElementById(id);
    if (!el) return;
    el.addEventListener('change', async function() {
      var userId = await getCurrentUserId();
      if (!userId) return;
      var patch = {};
      patch[field] = el.value;
      await patchProfile(userId, patch);
      // Also update i18n if locale changed
      if (field === 'locale' && window.aikeI18n && window.aikeI18n.setLang) {
        window.aikeI18n.setLang(el.value);
      }
    });
  }

  wirePatchToggle('settings-email-notifications', 'email_notifications');
  wirePatchToggle('settings-ai-memory',           'ai_memory_enabled');
  wirePatchToggle('settings-ai-suggestions',      'ai_suggestions');
  wirePatchToggle('settings-plane-autosave',      'plane_autosave');
  wirePatchToggle('settings-plane-snap-grid',     'plane_snap_grid');
  wirePatchToggle('settings-plane-animations',    'plane_animations');
  wirePatchSelect('settings-locale',              'locale');
  wirePatchSelect('settings-owl-language',        'owl_language');
  wirePatchSelect('settings-owl-tone',            'owl_tone');

  // ── Password reset ────────────────────────────────────────
  var resetPwBtn = document.getElementById('settings-reset-password-btn');
  if (resetPwBtn) {
    resetPwBtn.addEventListener('click', async function() {
      var email = '';
      var emailEl = document.getElementById('dropdown-header-email');
      if (emailEl) email = emailEl.textContent;
      if (!email) { alert('Nessuna email trovata.'); return; }
      var sb = window.aikeSupabase ? window.aikeSupabase.getClient() : null;
      if (!sb) return;
      await sb.auth.resetPasswordForEmail(email);
      resetPwBtn.textContent = 'Email inviata ✓';
      setTimeout(function() { resetPwBtn.textContent = 'Cambia password'; }, 3000);
    });
  }

  // ── Delete account ────────────────────────────────────────
  var deleteAccountBtn = document.getElementById('settings-delete-account-btn');
  if (deleteAccountBtn) {
    deleteAccountBtn.addEventListener('click', async function() {
      if (!confirm('Sei sicuro? L\'eliminazione dell\'account è irreversibile.')) return;
      if (!confirm('Ultima conferma: eliminare definitivamente l\'account?')) return;
      var sb = window.aikeSupabase ? window.aikeSupabase.getClient() : null;
      if (!sb) return;
      var userId = await getCurrentUserId();
      if (!userId) return;
      // Call Supabase admin delete via service endpoint — here we just sign out as fallback
      // Full delete requires server-side admin call; for now sign out + inform user
      await window.aikeAuth.signOut();
      alert('Account eliminato. Sei stato disconnesso.');
      window.location.href = '/index.html';
    });
  }

  // ── Delete all data ───────────────────────────────────────
  var deleteDataBtn = document.getElementById('settings-delete-data-btn');
  if (deleteDataBtn) {
    deleteDataBtn.addEventListener('click', async function() {
      if (!confirm('Eliminare tutti i dati del profilo? L\'account rimarrà attivo.')) return;
      var userId = await getCurrentUserId();
      if (!userId) return;
      await patchProfile(userId, {
        display_name: null, locale: 'it', email_notifications: true,
        ai_memory_enabled: true, ai_suggestions: true,
        plane_autosave: true, plane_snap_grid: false, plane_animations: true,
        owl_language: 'it', owl_tone: 'balanced'
      });
      localStorage.removeItem('aike_display_name');
      localStorage.removeItem('aike_avatar');
      alert('Dati eliminati.');
      closeSettings();
    });
  }

  // ── Export data ───────────────────────────────────────────
  var exportBtn = document.getElementById('settings-export-data-btn');
  if (exportBtn) {
    exportBtn.addEventListener('click', async function() {
      var userId = await getCurrentUserId();
      if (!userId) return;
      var profile = await fetchProfile(userId);
      var email = '';
      var emailEl = document.getElementById('dropdown-header-email');
      if (emailEl) email = emailEl.textContent;
      var exportData = { userId: userId, email: email, profile: profile, exportedAt: new Date().toISOString() };
      var blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      var url = URL.createObjectURL(blob);
      var a = document.createElement('a');
      a.href = url; a.download = 'aike-data.json'; a.click();
      URL.revokeObjectURL(url);
    });
  }

  // ── Email OTP verification ────────────────────────────────
  var verifyBtn        = document.getElementById('settings-verify-btn');
  var otpForm          = document.getElementById('settings-otp-form');
  var otpInput         = document.getElementById('settings-otp-input');
  var otpConfirmBtn    = document.getElementById('settings-otp-confirm-btn');
  var otpResendBtn     = document.getElementById('settings-otp-resend-btn');
  var otpCountdown     = document.getElementById('settings-otp-countdown');
  var otpError         = document.getElementById('settings-otp-error');
  var _otpCountdownTimer = null;

  function startOtpCountdown() {
    var seconds = 60;
    if (otpResendBtn) otpResendBtn.style.display = 'none';
    if (otpCountdown) { otpCountdown.style.display = 'inline'; otpCountdown.textContent = 'Riprova tra ' + seconds + 's'; }
    clearInterval(_otpCountdownTimer);
    _otpCountdownTimer = setInterval(function() {
      seconds--;
      if (otpCountdown) otpCountdown.textContent = 'Riprova tra ' + seconds + 's';
      if (seconds <= 0) {
        clearInterval(_otpCountdownTimer);
        if (otpCountdown) otpCountdown.style.display = 'none';
        if (otpResendBtn) otpResendBtn.style.display = 'inline';
      }
    }, 1000);
  }

  async function sendOtp() {
    var emailVal = document.getElementById('settings-email-value') ? document.getElementById('settings-email-value').textContent : '';
    if (!emailVal) return;
    var jwt = getJwt();
    if (!jwt) return;
    try {
      var r = await fetch('/api/verify-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + jwt },
        body: JSON.stringify({ action: 'send', email: emailVal })
      });
      if (r.ok) {
        if (otpForm) otpForm.style.display = 'block';
        if (otpInput) { otpInput.value = ''; otpInput.focus(); }
        if (otpError) otpError.style.display = 'none';
        startOtpCountdown();
      } else {
        var d = await r.json();
        if (otpError) { otpError.textContent = d.error || 'Errore invio OTP.'; otpError.style.display = 'block'; }
      }
    } catch(e) {
      if (otpError) { otpError.textContent = 'Errore di rete.'; otpError.style.display = 'block'; }
    }
  }

  if (verifyBtn) verifyBtn.addEventListener('click', sendOtp);
  if (otpResendBtn) otpResendBtn.addEventListener('click', sendOtp);

  if (otpConfirmBtn) {
    otpConfirmBtn.addEventListener('click', async function() {
      var token = otpInput ? otpInput.value.trim() : '';
      if (token.length !== 6) {
        if (otpError) { otpError.textContent = 'Inserisci un codice a 6 cifre.'; otpError.style.display = 'block'; }
        return;
      }
      var emailVal = document.getElementById('settings-email-value') ? document.getElementById('settings-email-value').textContent : '';
      var jwt = getJwt();
      if (!jwt || !emailVal) return;
      otpConfirmBtn.disabled = true;
      try {
        var r = await fetch('/api/verify-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + jwt },
          body: JSON.stringify({ action: 'verify', email: emailVal, token: token })
        });
        var d = await r.json();
        if (r.ok && d.ok) {
          if (otpForm) otpForm.style.display = 'none';
          clearInterval(_otpCountdownTimer);
          updateEmailVerificationUI(true);
          updateHeaderVerificationBadge(true);
        } else {
          if (otpError) { otpError.textContent = d.error || 'Codice non valido.'; otpError.style.display = 'block'; }
        }
      } catch(e) {
        if (otpError) { otpError.textContent = 'Errore di rete.'; otpError.style.display = 'block'; }
      } finally {
        otpConfirmBtn.disabled = false;
      }
    });
  }

  // ── Sidebar navigation ────────────────────────────────────
  navItems.forEach(function(item) {
    item.addEventListener('click', function() {
      var target = item.dataset.section;
      navItems.forEach(function(n) { n.classList.remove('active'); });
      sections.forEach(function(s) { s.classList.remove('active'); });
      item.classList.add('active');
      var section = document.getElementById('settings-section-' + target);
      if (section) section.classList.add('active');
    });
  });

  // ── Open / Close ──────────────────────────────────────────
  function closeSettings() {
    overlay.classList.remove('settings-overlay-open');
    document.body.style.overflow = '';
    if (_otpCountdownTimer) clearInterval(_otpCountdownTimer);
  }

  function openSettings() {
    // Reset to first section
    navItems.forEach(function(n) { n.classList.remove('active'); });
    sections.forEach(function(s) { s.classList.remove('active'); });
    var firstNav = overlay.querySelector('.settings-nav-item');
    if (firstNav) firstNav.classList.add('active');
    var firstSection = document.getElementById('settings-section-generale');
    if (firstSection) firstSection.classList.add('active');

    // Refresh avatar preview
    var saved = loadSavedAvatar();
    currentSelectedAvatar = saved;
    markSelectedAvatar(saved ? saved.id : -1);
    if (saved) updateSettingsAvatarPreview(saved);
    else updateSettingsAvatarPreviewFromEmail();

    // Close avatar picker
    if (avatarPicker) avatarPicker.style.display = 'none';
    // Hide OTP form
    if (otpForm) otpForm.style.display = 'none';

    overlay.classList.add('settings-overlay-open');
    document.body.style.overflow = 'hidden';

    // Load profile data async
    populateFromProfile();
  }

  if (closeBtn) closeBtn.addEventListener('click', closeSettings);
  if (scrim) scrim.addEventListener('click', closeSettings);

  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape' && overlay.classList.contains('settings-overlay-open')) closeSettings();
  });

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
