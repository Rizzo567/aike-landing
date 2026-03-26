/**
 * AIKE — auth.js
 * Supabase auth: signup, login, logout, session, header state, profile dropdown.
 * Loaded after config.js and supabase CDN, before bundle.js.
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

  // ── Auth actions ────────────────────────────────────────────

  window.aikeAuth = {

    signUp: async function (email, password) {
      var result = await getClient().auth.signUp({ email: email, password: password });
      if (result.error) return { error: result.error.message };
      return { error: null };
    },

    signIn: async function (email, password) {
      var result = await getClient().auth.signInWithPassword({ email: email, password: password });
      if (result.error) return { error: result.error.message };
      return { error: null };
    },

    signOut: async function () {
      _profileCache = null;
      await getClient().auth.signOut();
      updateHeaderAuthState(null, null);
    },

    getUser: async function () {
      var result = await getClient().auth.getUser();
      return (result.data && result.data.user) ? result.data.user : null;
    },

    /**
     * Fetch public profile (is_admin, plan) for a given user ID.
     * Uses maybeSingle() so missing rows don't throw errors.
     */
    getProfile: async function (userId) {
      if (_profileCache) return _profileCache;
      var result = await getClient()
        .from('users')
        .select('is_admin, plan, email')
        .eq('id', userId)
        .maybeSingle();
      if (result.error) {
        console.warn('[aikeAuth] getProfile error:', result.error.message);
        return null;
      }
      _profileCache = result.data || null;
      return _profileCache;
    }
  };

  // ── Header / dropdown ────────────────────────────────────────

  function getInitials(email) {
    return email ? email.charAt(0).toUpperCase() : '?';
  }

  function updateHeaderAuthState(user, profile) {
    var loginBtn       = document.getElementById('auth-login-btn');
    var profileWrapper = document.getElementById('auth-profile-wrapper');
    var profileInitial = document.getElementById('auth-profile-initial');
    var adminSection   = document.getElementById('auth-dropdown-admin');

    if (!loginBtn || !profileWrapper) return;

    if (user) {
      loginBtn.style.display = 'none';
      profileWrapper.style.display = 'flex';
      if (profileInitial) profileInitial.textContent = getInitials(user.email);
      if (adminSection) {
        adminSection.style.display = (profile && profile.is_admin) ? 'block' : 'none';
      }
    } else {
      loginBtn.style.display = '';
      profileWrapper.style.display = 'none';
      closeDropdown();
    }
  }

  function closeDropdown() {
    var dropdown = document.getElementById('auth-dropdown');
    var btn = document.getElementById('auth-profile-btn');
    if (dropdown) dropdown.style.display = 'none';
    if (btn) btn.setAttribute('aria-expanded', 'false');
  }

  function toggleDropdown() {
    var dropdown = document.getElementById('auth-dropdown');
    var btn = document.getElementById('auth-profile-btn');
    if (!dropdown) return;
    var isOpen = dropdown.style.display === 'block';
    dropdown.style.display = isOpen ? 'none' : 'block';
    if (btn) btn.setAttribute('aria-expanded', String(!isOpen));
  }

  // ── Bootstrap ─────────────────────────────────────────────────

  document.addEventListener('DOMContentLoaded', function () {
    // Wait for bundle.js to inject the header HTML, then wire up
    setTimeout(async function () {
      var user = await window.aikeAuth.getUser();
      var profile = null;
      if (user) profile = await window.aikeAuth.getProfile(user.id);
      updateHeaderAuthState(user, profile);

      // Profile button → toggle dropdown (NOT logout)
      var profileBtn = document.getElementById('auth-profile-btn');
      if (profileBtn) {
        profileBtn.addEventListener('click', function (e) {
          e.stopPropagation();
          toggleDropdown();
        });
      }

      // Logout inside dropdown
      var logoutBtn = document.getElementById('auth-logout-btn');
      if (logoutBtn) {
        logoutBtn.addEventListener('click', async function () {
          closeDropdown();
          await window.aikeAuth.signOut();
          var isPage = window.location.pathname.includes('/pages/');
          window.location.href = isPage ? '../index.html' : 'index.html';
        });
      }

      // Close dropdown when clicking outside
      document.addEventListener('click', function (e) {
        var wrapper = document.getElementById('auth-profile-wrapper');
        if (wrapper && !wrapper.contains(e.target)) closeDropdown();
      });

    }, 80);

    // Sync across tabs
    getClient().auth.onAuthStateChange(async function (_event, session) {
      _profileCache = null;
      var user = (session && session.user) ? session.user : null;
      var profile = null;
      if (user) profile = await window.aikeAuth.getProfile(user.id);
      updateHeaderAuthState(user, profile);
    });
  });

})();
