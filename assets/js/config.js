// assets/js/config.js
// Public config — Supabase anon key and Stripe publishable key are
// intentionally client-side safe. Access is controlled by Supabase RLS.
//
// NOTE: nested shape (supabase.url, supabase.anonKey) is canonical.
// All code must use window.AIKE_CONFIG.supabase.url — NOT window.AIKE_CONFIG.supabaseUrl

window.AIKE_CONFIG = {
  supabase: {
    url: 'REPLACE_WITH_SUPABASE_URL',          // e.g. https://abcdef.supabase.co
    anonKey: 'REPLACE_WITH_SUPABASE_ANON_KEY'  // Settings > API > anon public
  },
  stripe: {
    publishableKey: 'REPLACE_WITH_STRIPE_PUBLISHABLE_KEY', // pk_test_... or pk_live_...
    basicPriceId: 'REPLACE_WITH_BASIC_PRICE_ID',            // price_... for €14/mo
    proPriceId: 'REPLACE_WITH_PRO_PRICE_ID'                 // price_... for €49/mo
  }
};
