// assets/js/config.js
// Public config — Supabase anon key and Stripe publishable key are
// intentionally client-side safe. Access is controlled by Supabase RLS.
//
// NOTE: nested shape (supabase.url, supabase.anonKey) is canonical.
// All code must use window.AIKE_CONFIG.supabase.url — NOT window.AIKE_CONFIG.supabaseUrl

window.AIKE_CONFIG = {
  supabase: {
    url: 'https://iczkxlligfelqmcddbdc.supabase.co',          // e.g. https://abcdef.supabase.co
    anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imljemt4bGxpZ2ZlbHFtY2RkYmRjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ1NDE3MTksImV4cCI6MjA5MDExNzcxOX0.pI8qlZetECLe8pOrj7qpJpmMmIysfNzwXb2WiVzrz4c'  // Settings > API > anon public
  },
  stripe: {
    publishableKey: 'pk_live_51TFHHB0vGzVFnco6NraggfcNNQ6SrjNBizE6R92oxCkCT3bPcKPwuxwgbEykPwS4Csm1ZOjBVO6jElri4OaDPBfH00OxorIKTx', // pk_test_... or pk_live_...
    basicPriceId: 'prod_UDj0nS3eqDlgfK',            // price_... for €14/mo
    proPriceId: 'prod_UDj1OUHD4PoIT8'                 // price_... for €49/mo
  }
};
