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
      if (_profileCache) return _profileCache;
      var r = await getClient()
        .from('users')
        .select('is_admin, plan, email')
        .eq('id', userId)
        .maybeSingle();
      if (r.error) console.warn('[aikeAuth] getProfile:', r.error.message);
      _profileCache = r.data || null;
      return _profileCache;
    }
  };

  // ── Header helpers ───────────────────────────────────────────

  function updateHeader(user, profile) {
    var loginBtn  = document.getElementById('auth-login-btn');
    var wrapper   = document.getElementById('auth-profile-wrapper');
    var initial   = document.getElementById('auth-profile-initial');
    var adminLink = document.getElementById('auth-dropdown-admin');
    var divider   = document.getElementById('auth-dropdown-divider');

    if (!loginBtn || !wrapper) return; // header not yet in DOM

    if (user) {
      loginBtn.style.display = 'none';
      wrapper.style.display  = 'flex';
      if (initial) initial.textContent = user.email.charAt(0).toUpperCase();
      var isAdmin = profile && profile.is_admin;
      if (adminLink) adminLink.style.display = isAdmin ? 'flex' : 'none';
      if (divider)   divider.style.display   = isAdmin ? 'block' : 'none';
    } else {
      loginBtn.style.display = '';
      wrapper.style.display  = 'none';
      closeDropdown();
    }
  }

  function openDropdown() {
    var d = document.getElementById('auth-dropdown');
    var b = document.getElementById('auth-profile-btn');
    if (d) d.style.display = 'block';
    if (b) b.setAttribute('aria-expanded', 'true');
  }

  function closeDropdown() {
    var d = document.getElementById('auth-dropdown');
    var b = document.getElementById('auth-profile-btn');
    if (d) d.style.display = 'none';
    if (b) b.setAttribute('aria-expanded', 'false');
  }

  function toggleDropdown() {
    var d = document.getElementById('auth-dropdown');
    if (!d) return;
    d.style.display === 'block' ? closeDropdown() : openDropdown();
  }

  // ── Called by bundle.js immediately after header is injected ─

  window.aikeAuthInit = async function () {
    // 1. Get session from localStorage (no network)
    var user = await window.aikeAuth.getSessionUser();
    var profile = null;
    if (user) profile = await window.aikeAuth.getProfile(user.id);

    // 2. Update header state
    updateHeader(user, profile);

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
    });
  };

})();
