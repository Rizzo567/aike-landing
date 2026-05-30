/**
 * AIKE — stripe-checkout.js
 * Redirects to Stripe Payment Links. Reads session synchronously from
 * localStorage — no async, no Promises, cannot hang after back-navigation.
 */

(function () {
  'use strict';

  // Read Supabase session directly from localStorage (synchronous, always works)
  function getStoredUser() {
    try {
      var projectRef = window.AIKE_CONFIG.supabase.url.split('//')[1].split('.')[0];
      var key = 'sb-' + projectRef + '-auth-token';
      var raw = localStorage.getItem(key);
      if (!raw) return null;
      var parsed = JSON.parse(raw);
      return (parsed && parsed.user) ? parsed.user : null;
    } catch (e) {
      return null;
    }
  }

  function checkout(plan) {
    var user = getStoredUser();

    if (!user) {
      var inPages = window.location.pathname.includes('/pages/');
      window.location.href = inPages ? 'signup.html' : 'pages/signup.html';
      return;
    }

    var link = plan === 'pro'
      ? window.AIKE_CONFIG.stripe.proPaymentLink
      : window.AIKE_CONFIG.stripe.basicPaymentLink;

    window.location.href = link
      + '?prefilled_email=' + encodeURIComponent(user.email)
      + '&client_reference_id=' + encodeURIComponent(user.id);
  }

  function checkoutYearly(plan) {
    var user = getStoredUser();

    if (!user) {
      var inPages = window.location.pathname.includes('/pages/');
      window.location.href = inPages ? 'signup.html' : 'pages/signup.html';
      return;
    }

    // Fall back to monthly link until yearly Stripe links are configured
    var link = plan === 'pro'
      ? (window.AIKE_CONFIG.stripe.proYearlyPaymentLink || window.AIKE_CONFIG.stripe.proPaymentLink)
      : (window.AIKE_CONFIG.stripe.basicYearlyPaymentLink || window.AIKE_CONFIG.stripe.basicPaymentLink);

    window.location.href = link
      + '?prefilled_email=' + encodeURIComponent(user.email)
      + '&client_reference_id=' + encodeURIComponent(user.id);
  }

  window.aikeCheckout = {
    basic:       function () { checkout('basic'); },
    pro:         function () { checkout('pro'); },
    basicYearly: function () { checkoutYearly('basic'); },
    proYearly:   function () { checkoutYearly('pro'); }
  };

})();
