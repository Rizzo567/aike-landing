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
      <a href="${b}pages/booking.html" class="header__link">Booking</a>
      <a href="${b}pages/owl.html" class="header__link">Owl</a>
      <a href="${b}pages/plane.html" class="header__link">Plane</a>
    </nav>
    <div class="header__actions">
      <!-- Desktop Log In -->
      <a href="${b}pages/login.html" class="btn btn-outline auth-btn-login hide-on-mobile" style="border-color:transparent; padding: 0.5rem 1rem;">Log in</a>
      
      <!-- Profile Wrapper (Desktop & Mobile) -->
      <div id="auth-profile-wrapper" style="display:none; align-items:center; position:relative;">
        <button id="auth-profile-btn" aria-label="Account menu" aria-haspopup="true" aria-expanded="false">
          <span id="auth-profile-initial">?</span>
          <span class="aike-avatar-status" id="auth-avatar-status"></span>
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

          <!-- Booking -->
          <a href="${b}pages/booking.html" role="menuitem" class="dropdown-item">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
            Prenota una call
          </a>

          <div class="dropdown-separator"></div>

          <!-- Logout -->
          <button id="auth-logout-btn" role="menuitem" class="dropdown-item dropdown-item--danger">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
            Logout
          </button>
        </div>
      </div>
      
      <!-- Desktop Book Call -->
      <a href="${b}pages/booking.html" class="btn btn-primary hide-on-mobile" style="padding: 0.5rem 1.25rem;">Book a Call</a>

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
      <a href="${b}pages/booking.html" class="mobile-nav-link">Booking</a>
      <a href="${b}pages/owl.html" class="mobile-nav-link">Owl</a>
      <a href="${b}pages/plane.html" class="mobile-nav-link">Plane</a>
      <div class="mobile-nav-divider"></div>
      <a href="${b}pages/login.html" class="mobile-nav-link auth-btn-login" style="color:var(--color-primary)">Log in</a>
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
          <a href="${b}pages/booking.html" class="footer__link">Booking</a>
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
          '<div class="settings-coming-soon"><span>⚙️</span>Disponibile a breve</div>' +
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
