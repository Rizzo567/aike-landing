/**
 * AIKE — analytics.js
 * Inserts a page-visit row into the Supabase analytics table on every load.
 * RLS allows anon INSERT, so no auth required.
 */

(function () {
  'use strict';

  // Fire-and-forget — don't block page load
  window.addEventListener('DOMContentLoaded', function () {
    if (!window.supabase || !window.AIKE_CONFIG) return;

    var sb = window.supabase.createClient(
      window.AIKE_CONFIG.supabase.url,
      window.AIKE_CONFIG.supabase.anonKey
    );

    sb.from('analytics').insert({ page: window.location.pathname });
  });

})();
