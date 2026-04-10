/**
 * AIKE — auth.js
 * Supabase auth + header dropdown.
 * Loaded BEFORE bundle.js. bundle.js calls window.aikeAuthInit() after
 * injecting the header — this eliminates all timing race conditions.
 */

(function () {
  'use strict';

  var _client = null;
  var _profileCache = null;
  var _profileCacheTime = 0;
  var PROFILE_CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  function getClient() {
    if (!_client) {
      _client = window.supabase.createClient(
        window.AIKE_CONFIG.supabase.url,
        window.AIKE_CONFIG.supabase.anonKey
      );
    }
    return _client;
  }

  window.aikeSupabase = { getClient: getClient };

  // ── Public auth API ──────────────────────────────────────────

  window.aikeAuth = {

    signUp: async function (email, password) {
      var r = await getClient().auth.signUp({ email: email, password: password });
      return r.error ? { error: r.error.message } : { error: null };
    },

    signIn: async function (email, password) {
      var r = await getClient().auth.signInWithPassword({ email: email, password: password });
      return r.error ? { error: r.error.message } : { error: null };
    },

    signOut: async function () {
      _profileCache = null;
      _profileCacheTime = 0;
      await getClient().auth.signOut();
      updateHeader(null, null);
    },

    // Server-verified user (for security-sensitive pages)
    getUser: async function () {
      var r = await getClient().auth.getUser();
      return (r.data && r.data.user) ? r.data.user : null;
    },

    // Reads from localStorage — no network, always fast, works on any origin
    getSessionUser: async function () {
      var r = await getClient().auth.getSession();
      return (r.data && r.data.session) ? r.data.session.user : null;
    },

    // Profile row from public.users (is_admin, plan)
    getProfile: async function (userId) {
      var now = Date.now();
      if (_profileCache && (now - _profileCacheTime < PROFILE_CACHE_TTL)) {
        return _profileCache;
      }
      var r = await getClient()
        .from('users')
        .select('is_admin, plan, email')
        .eq('id', userId)
        .maybeSingle();
      if (r.error) console.warn('[aikeAuth] getProfile:', r.error.message);
      _profileCache = r.data || null;
      _profileCacheTime = Date.now();
      return _profileCache;
    },

    signInWithOAuth: async function (provider) {
      var redirectTo = window.location.origin + '/pages/login.html';
      var r = await getClient().auth.signInWithOAuth({
        provider: provider,
        options: { redirectTo: redirectTo }
      });
      return r.error ? { error: r.error.message } : { error: null };
    },

    parseAuthError: function (err) {
      if (!err) return 'Errore sconosciuto. Riprova.';
      var code = err.code || '';
      var msg  = (err.message || '').toLowerCase();
      if (code === 'invalid_credentials' || msg.includes('invalid login'))
        return 'Email o password non corretti.';
      if (code === 'email_not_confirmed' || msg.includes('email not confirmed'))
        return 'Conferma la tua email prima di accedere.';
      if (code === 'over_email_send_rate_limit' || msg.includes('rate limit'))
        return 'Troppi tentativi. Riprova tra qualche minuto.';
      if (code === 'user_already_exists' || msg.includes('already registered'))
        return 'Un account con questa email esiste già.';
      if (code === 'weak_password' || msg.includes('weak password'))
        return 'Password troppo debole. Usa almeno 8 caratteri.';
      if (msg.includes('network') || msg.includes('fetch'))
        return 'Errore di rete. Controlla la connessione.';
      return 'Errore. Riprova.';
    }
  };

  // ── Header helpers ───────────────────────────────────────────

  function updateHeader(user, profile) {
    var loginBtn       = document.getElementById('auth-login-btn');
    var loginBtnMobile = document.getElementById('auth-login-btn-mobile');
    var wrapper        = document.getElementById('auth-profile-wrapper');
    var adminLink      = document.getElementById('auth-dropdown-admin');
    var divider        = document.getElementById('auth-dropdown-divider');

    if (!loginBtn || !wrapper) return; // header not yet in DOM

    if (user) {
      loginBtn.style.display = 'none';
      if (loginBtnMobile) loginBtnMobile.style.display = 'none';
      wrapper.style.display  = 'flex';

      // Apply saved avatar (emoji) or fall back to initial
      var savedAvatar = null;
      try { savedAvatar = JSON.parse(localStorage.getItem('aike_avatar') || 'null'); } catch(e) {}
      if (window.applyAvatarToHeader) {
        window.applyAvatarToHeader(savedAvatar, user.email);
      } else {
        var initial = document.getElementById('auth-profile-initial');
        if (initial && !savedAvatar) initial.textContent = user.email.charAt(0).toUpperCase();
      }

      // Apply saved display name to dropdown
      var savedName = '';
      try { savedName = localStorage.getItem('aike_display_name') || ''; } catch(e) {}
      if (window.applyDisplayNameToDropdown) {
        window.applyDisplayNameToDropdown(savedName, user.email);
      } else {
        var nameEl = document.getElementById('dropdown-header-name');
        var emailEl = document.getElementById('dropdown-header-email');
        if (nameEl) nameEl.textContent = savedName || user.email.split('@')[0];
        if (emailEl) emailEl.textContent = user.email;
      }

      var isAdmin = profile && profile.is_admin;
      if (adminLink) adminLink.className = isAdmin ? 'dropdown-item visible' : 'dropdown-item';
      if (divider)   divider.style.display = isAdmin ? 'block' : 'none';
      document.querySelectorAll('[data-admin-only]').forEach(function(el) {
        el.style.display = isAdmin ? '' : 'none';
      });
    } else {
      loginBtn.style.display = '';
      if (loginBtnMobile) loginBtnMobile.style.display = '';
      wrapper.style.display  = 'none';
      document.querySelectorAll('[data-admin-only]').forEach(function(el) {
        el.style.display = 'none';
      });
      closeDropdown();
    }
  }

  function openDropdown() {
    var d = document.getElementById('auth-dropdown');
    var b = document.getElementById('auth-profile-btn');
    if (d) d.classList.add('dropdown-open');
    if (b) b.setAttribute('aria-expanded', 'true');
  }

  function closeDropdown() {
    var d = document.getElementById('auth-dropdown');
    var b = document.getElementById('auth-profile-btn');
    if (d) d.classList.remove('dropdown-open');
    if (b) b.setAttribute('aria-expanded', 'false');
  }

  function toggleDropdown() {
    var d = document.getElementById('auth-dropdown');
    if (!d) return;
    d.classList.contains('dropdown-open') ? closeDropdown() : openDropdown();
  }

  // ── Email-verified badge ─────────────────────────────────

  async function updateEmailVerifiedBadge(userId) {
    if (!userId) {
      var statusEl = document.getElementById('auth-avatar-status');
      if (statusEl) statusEl.style.display = 'none';
      return;
    }
    try {
      var jwt = null;
      var key = Object.keys(localStorage).find(function(k) {
        return k.startsWith('sb-') && k.endsWith('-auth-token');
      });
      if (key) {
        var sess = JSON.parse(localStorage.getItem(key) || 'null');
        if (sess && sess.access_token) jwt = sess.access_token;
      }
      if (!jwt) return;
      var url = window.AIKE_CONFIG.supabase.url + '/rest/v1/profiles?id=eq.' + userId + '&select=email_verified&limit=1';
      var r = await fetch(url, {
        headers: {
          'apikey': window.AIKE_CONFIG.supabase.anonKey,
          'Authorization': 'Bearer ' + jwt,
          'Accept': 'application/json'
        }
      });
      if (!r.ok) return;
      var data = await r.json();
      var verified = data && data.length && data[0].email_verified === true;
      var statusEl = document.getElementById('auth-avatar-status');
      if (statusEl) statusEl.style.display = verified ? 'flex' : 'none';
    } catch(e) {}
  }

  // ── Called by bundle.js immediately after header is injected ─

  window.aikeAuthInit = async function () {
    // 1. Get session from localStorage (no network)
    var user = await window.aikeAuth.getSessionUser();
    var profile = null;
    if (user) profile = await window.aikeAuth.getProfile(user.id);

    // 2. Update header state
    updateHeader(user, profile);

    // 2b. Show/hide email verified badge
    if (user) updateEmailVerifiedBadge(user.id);
    else {
      var statusEl = document.getElementById('auth-avatar-status');
      if (statusEl) statusEl.style.display = 'none';
    }

    // 3. Wire profile button → toggle dropdown
    var profileBtn = document.getElementById('auth-profile-btn');
    if (profileBtn) {
      profileBtn.addEventListener('click', function (e) {
        e.stopPropagation();
        toggleDropdown();
      });
    }

    // 4. Wire logout button
    var logoutBtn = document.getElementById('auth-logout-btn');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', async function () {
        closeDropdown();
        await window.aikeAuth.signOut();
        var inPages = window.location.pathname.includes('/pages/');
        window.location.href = inPages ? '../index.html' : 'index.html';
      });
    }

    // 5. Close on outside click
    document.addEventListener('click', function (e) {
      var w = document.getElementById('auth-profile-wrapper');
      if (w && !w.contains(e.target)) closeDropdown();
    });

    // 6. Sync if session changes (login/logout in another tab)
    getClient().auth.onAuthStateChange(async function (_event, session) {
      _profileCache = null;
      var u = (session && session.user) ? session.user : null;
      var p = u ? await window.aikeAuth.getProfile(u.id) : null;
      updateHeader(u, p);
      if (u) updateEmailVerifiedBadge(u.id);
      else {
        var statusEl = document.getElementById('auth-avatar-status');
        if (statusEl) statusEl.style.display = 'none';
      }
    });
  };

})();
