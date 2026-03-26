/**
 * AIKE — auth.js
 * Supabase auth: signup, login, logout, session persistence, header state.
 * Loaded after config.js and supabase CDN, before bundle.js.
 */

(function () {
  'use strict';

  // Init Supabase client (window.supabase set by CDN, window.AIKE_CONFIG set by config.js)
  var _client = null;

  function getClient() {
    if (!_client) {
      _client = window.supabase.createClient(
        window.AIKE_CONFIG.supabase.url,
        window.AIKE_CONFIG.supabase.anonKey
      );
    }
    return _client;
  }

  // Expose client globally so bundle.js and future scripts can use it
  window.aikeSupabase = { getClient: getClient };

  // ── Auth actions ────────────────────────────────────────────

  window.aikeAuth = {

    /**
     * Sign up with email + password.
     * @returns {Promise<{error: string|null}>}
     */
    signUp: async function (email, password) {
      var sb = getClient();
      var result = await sb.auth.signUp({ email: email, password: password });
      if (result.error) return { error: result.error.message };
      return { error: null };
    },

    /**
     * Sign in with email + password.
     * @returns {Promise<{error: string|null}>}
     */
    signIn: async function (email, password) {
      var sb = getClient();
      var result = await sb.auth.signInWithPassword({ email: email, password: password });
      if (result.error) return { error: result.error.message };
      return { error: null };
    },

    /**
     * Sign out current user.
     */
    signOut: async function () {
      var sb = getClient();
      await sb.auth.signOut();
      updateHeaderAuthState(null);
    },

    /**
     * Get current session user (null if not logged in).
     * @returns {Promise<object|null>}
     */
    getUser: async function () {
      var sb = getClient();
      var result = await sb.auth.getUser();
      return result.data && result.data.user ? result.data.user : null;
    }
  };

  // ── Header auth state ────────────────────────────────────────

  function getInitials(email) {
    if (!email) return '?';
    return email.charAt(0).toUpperCase();
  }

  function updateHeaderAuthState(user) {
    var loginBtn = document.getElementById('auth-login-btn');
    var profileWrapper = document.getElementById('auth-profile-wrapper');
    var profileInitial = document.getElementById('auth-profile-initial');

    if (!loginBtn || !profileWrapper) return;

    if (user) {
      loginBtn.style.display = 'none';
      profileWrapper.style.display = 'flex';
      if (profileInitial) profileInitial.textContent = getInitials(user.email);
    } else {
      loginBtn.style.display = '';
      profileWrapper.style.display = 'none';
    }
  }

  // ── Bootstrap on DOMContentLoaded ───────────────────────────

  document.addEventListener('DOMContentLoaded', function () {
    // Check session after header is injected by bundle.js (use a small timeout)
    setTimeout(async function () {
      var user = await window.aikeAuth.getUser();
      updateHeaderAuthState(user);

      // Attach logout handler if profile button exists
      var profileBtn = document.getElementById('auth-profile-btn');
      if (profileBtn) {
        profileBtn.addEventListener('click', async function () {
          await window.aikeAuth.signOut();
          window.location.href = window.location.pathname.includes('/pages/')
            ? '../index.html'
            : 'index.html';
        });
      }
    }, 50);

    // Listen for auth state changes (e.g. login in another tab)
    getClient().auth.onAuthStateChange(function (_event, session) {
      var user = session && session.user ? session.user : null;
      updateHeaderAuthState(user);
    });
  });

})();
