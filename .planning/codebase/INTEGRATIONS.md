# External Integrations

**Analysis Date:** 2026-03-26

## APIs & External Services

**Font Delivery:**
- Google Fonts CDN — Serves `Inter` and `Outfit` typefaces at page load.
  - URLs: `https://fonts.googleapis.com` (CSS), `https://fonts.gstatic.com` (font files)
  - Auth: None (public CDN)
  - Used in: Every HTML file (`index.html`, `pages/booking.html`, `pages/pricing.html`, `pages/solutions.html`)

**Asset CDN:**
- Shopify CDN — Hosts logo image assets for the navbar component.
  - URLs: `https://cdn.shopify.com/s/files/1/0984/2393/1228/files/IMG_2884.png` (light logo), `https://cdn.shopify.com/s/files/1/0984/2393/1228/files/IMG_2890.png` (dark logo)
  - Auth: None (public CDN)
  - Used in: `components/navbar.html`

**Community Platform:**
- Discord — Linked in the footer as a community channel.
  - URL: `https://discord.com` (placeholder, not yet a specific server invite)
  - Auth: None (outbound link only)
  - Used in: `assets/js/bundle.js` (footer HTML template)

## Data Storage

**Databases:**
- None. No database connection, ORM, or data persistence layer exists. This is a fully static site.

**File Storage:**
- Local filesystem for static assets (`assets/images/`, `assets/css/`, `assets/js/`).
- Logo images also hosted on Shopify CDN (see above).

**Caching:**
- No programmatic cache layer. Manual cache-busting via query string versioning (`?v=5`) on CSS files.

## Authentication & Identity

**Auth Provider:**
- None. No authentication system exists. There is no login, session management, or user identity in the current codebase.
- The header contains a "Log in" link (`pages/pricing.html`) but it is a static anchor with no backend.

## Booking & Scheduling

**Booking System:**
- None integrated. `pages/booking.html` renders a static UI mockup (fake calendar grid with hardcoded dates and time slots). No real calendar or scheduling service (Calendly, Cal.com, HubSpot Meetings, etc.) is connected.
- This is explicitly noted in the HTML: `<!-- Fake Calendar UI for styling consistency, clicking triggers CTA -->`.

## Email Collection

**Form Handling:**
- None integrated. The hero section in `index.html` contains an email input and submit button (`<input type="email">` + `<button>`), but there is no form action, no JavaScript submission handler, and no backend or third-party service (Mailchimp, ConvertKit, ActiveCampaign, etc.) connected.
- Clicking the submit button currently does nothing.

## Monitoring & Observability

**Error Tracking:**
- None. No Sentry, Datadog, LogRocket, or equivalent is present.

**Analytics:**
- None detected. No Google Analytics, Plausible, Mixpanel, Segment, or any tracking pixel is present in the HTML or JavaScript files.

**Logs:**
- None beyond browser `console` output from standard JavaScript execution.

## CI/CD & Deployment

**Hosting:**
- Not configured within this repository. Target domain is `aikeautomation.com` (referenced in `components/navbar.html`).
- No deployment config files (`.github/workflows/`, `netlify.toml`, `vercel.json`, etc.) are present.

**CI Pipeline:**
- None detected.

## Webhooks & Callbacks

**Incoming:**
- None. No webhook endpoints exist (static site only).

**Outgoing:**
- None configured. Pricing page mentions "Premium API webhooks" as a service offering to clients, but no outgoing webhook infrastructure exists in this codebase.

## Social Media Links

**Present in `components/footer.html` (all placeholder `#` hrefs — not yet linked to real accounts):**
- Facebook
- Instagram
- X (Twitter)
- LinkedIn
- YouTube

## Mentioned Tool Integrations (Marketing Content Only)

The following tools are referenced in marketing copy or as decorative floating icons on the homepage. They are not technically integrated into this codebase:

- **Claude AI** — Floating icon in hero (`assets/images/logos/Claude_AI_symbol.svg`)
- **Notion** — Floating icon in hero (`assets/images/logos/Notion-logo.svg.png`)
- **Cursor** — Floating icon in hero (`assets/images/logos/Cursor_Vector_Logo.png`)
- **Google Antigravity** — Floating icon in hero (`assets/images/logos/Google_Antigravity_icon.webp`)
- **Nano Banana Pro** — Floating icon in hero (`assets/images/logos/nanobanana.png`)
- **Make (formerly Integromat)** — Referenced in footer link labels (`components/footer.html`) as "Make", "Make + AI", "Make Academy", etc. Not technically integrated.

## Environment Configuration

**Required env vars:**
- None. The site has no environment variables of any kind.

**Secrets location:**
- None. No secrets, API keys, or credentials exist in this codebase.

---

*Integration audit: 2026-03-26*
