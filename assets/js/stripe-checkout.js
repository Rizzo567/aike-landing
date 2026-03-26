/**
 * AIKE — stripe-checkout.js
 * Handles Stripe Checkout redirect for Basic and Pro plans.
 * Requires: config.js (AIKE_CONFIG), auth.js (aikeAuth), Stripe.js CDN
 */

(function () {
  'use strict';

  var _stripe = null;

  function getStripe() {
    if (!_stripe) {
      _stripe = Stripe(window.AIKE_CONFIG.stripe.publishableKey);
    }
    return _stripe;
  }

  /**
   * Redirect to Stripe Checkout for a given plan.
   * If the user is not logged in, redirect to signup first.
   * @param {'basic'|'pro'} plan
   */
  async function checkout(plan) {
    var user = await window.aikeAuth.getUser();

    if (!user) {
      // Not logged in — send to signup, they can return to pricing after
      var base = window.location.pathname.includes('/pages/') ? '' : 'pages/';
      window.location.href = base + 'pages/signup.html';
      return;
    }

    var priceId = plan === 'pro'
      ? window.AIKE_CONFIG.stripe.proPriceId
      : window.AIKE_CONFIG.stripe.basicPriceId;

    var origin = window.location.origin;
    // Determine base path for success/cancel URLs
    var successUrl = origin + '/pages/success.html?plan=' + plan;
    var cancelUrl  = origin + '/pages/pricing.html';

    var stripe = getStripe();

    var result = await stripe.redirectToCheckout({
      lineItems: [{ price: priceId, quantity: 1 }],
      mode: 'subscription',
      successUrl: successUrl,
      cancelUrl: cancelUrl,
      clientReferenceId: user.id  // Supabase user ID — useful for future webhook
    });

    if (result && result.error) {
      alert('Payment error: ' + result.error.message);
    }
  }

  // Expose globally
  window.aikeCheckout = {
    basic: function () { return checkout('basic'); },
    pro:   function () { return checkout('pro'); }
  };

})();
