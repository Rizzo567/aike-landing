/**
 * AIKE — stripe-checkout.js
 * Redirects to Stripe Payment Links for Basic and Pro plans.
 */

(function () {
  'use strict';

  async function checkout(plan, triggerEl) {
    // Visual feedback on the button
    if (triggerEl) {
      triggerEl.disabled = true;
      triggerEl._originalText = triggerEl.textContent;
      triggerEl.textContent = 'Loading…';
    }

    function resetBtn() {
      if (triggerEl) {
        triggerEl.disabled = false;
        triggerEl.textContent = triggerEl._originalText || (plan === 'pro' ? 'Get started →' : 'Get started');
      }
    }

    try {
      // Get session — try localStorage first, fallback to network
      var sb = window.aikeSupabase.getClient();
      var sessionRes = await sb.auth.getSession();
      var user = sessionRes.data && sessionRes.data.session
        ? sessionRes.data.session.user
        : null;

      // If session missing (bfcache edge case), try refreshing it
      if (!user) {
        var refreshRes = await sb.auth.refreshSession();
        user = refreshRes.data && refreshRes.data.session
          ? refreshRes.data.session.user
          : null;
      }

      if (!user) {
        var inPages = window.location.pathname.includes('/pages/');
        window.location.href = inPages ? 'signup.html' : 'pages/signup.html';
        return;
      }

      var link = plan === 'pro'
        ? window.AIKE_CONFIG.stripe.proPaymentLink
        : window.AIKE_CONFIG.stripe.basicPaymentLink;

      if (!link || link.includes('REPLACE')) {
        alert('Payment link not configured. Add it to config.js.');
        resetBtn();
        return;
      }

      // Build URL with user context
      var url = link
        + '?prefilled_email=' + encodeURIComponent(user.email)
        + '&client_reference_id=' + encodeURIComponent(user.id);

      window.location.href = url;

    } catch (err) {
      console.error('[aikeCheckout] Error:', err);
      resetBtn();
      alert('Something went wrong. Please try again.');
    }
  }

  window.aikeCheckout = {
    basic: function (el) { return checkout('basic', el); },
    pro:   function (el) { return checkout('pro', el); }
  };

  // Handle bfcache restore — re-enable any disabled buttons
  window.addEventListener('pageshow', function (e) {
    if (e.persisted) {
      document.querySelectorAll('button[disabled]').forEach(function (btn) {
        btn.disabled = false;
        if (btn._originalText) btn.textContent = btn._originalText;
      });
    }
  });

})();
