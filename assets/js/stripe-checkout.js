/**
 * AIKE — stripe-checkout.js
 * Redirects to Stripe Payment Links for Basic and Pro plans.
 * No Stripe.js SDK needed — Payment Links are plain URLs.
 */

(function () {
  'use strict';

  async function checkout(plan) {
    // Use localStorage session — no network request, works everywhere
    var user = await window.aikeAuth.getSessionUser();

    if (!user) {
      // Not logged in — send to signup
      var inPages = window.location.pathname.includes('/pages/');
      window.location.href = inPages ? 'signup.html' : 'pages/signup.html';
      return;
    }

    var link = plan === 'pro'
      ? window.AIKE_CONFIG.stripe.proPaymentLink
      : window.AIKE_CONFIG.stripe.basicPaymentLink;

    if (!link || link.includes('REPLACE')) {
      alert('Payment link not configured yet. Add it to config.js.');
      return;
    }

    // Append user info so Stripe pre-fills email and we can track via client_reference_id
    var url = link
      + '?prefilled_email=' + encodeURIComponent(user.email)
      + '&client_reference_id=' + encodeURIComponent(user.id);

    window.location.href = url;
  }

  window.aikeCheckout = {
    basic: function () { return checkout('basic'); },
    pro:   function () { return checkout('pro'); }
  };

})();
