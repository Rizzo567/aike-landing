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
    publishableKey: 'pk_live_51TFHHB0vGzVFnco6NraggfcNNQ6SrjNBizE6R92oxCkCT3bPcKPwuxwgbEykPwS4Csm1ZOjBVO6jElri4OaDPBfH00OxorIKTx',
    basicPriceId: 'price_1TFHYa0vGzVFnco62JmjVE0Z',
    proPriceId: 'price_1TFHYz0vGzVFnco6MPM8vVf8',
    basicPaymentLink: 'https://buy.stripe.com/eVq14f1Rb6iQcfQ5Va8og00',  // https://buy.stripe.com/xxx
    proPaymentLink: 'https://buy.stripe.com/5kA2971Rbc9QcfQ5V'    // https://buy.stripe.com/xxx
  }
};
