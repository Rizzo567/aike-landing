# Codebase Concerns

**Analysis Date:** 2026-03-26

## Tech Debt

**Dual header/footer injection systems:**
- Issue: Two parallel component-injection systems exist side by side and are partially active simultaneously. `bundle.js` injects a hardcoded header/footer via `getHeaderHTML(b)` / `getFooterHTML(b)` into `#navbar-placeholder` / `#footer-placeholder` on every page. Separately, `components/navbar.html` and `components/footer.html` exist as standalone HTML partials that are never actually loaded — `components.js` is a stub that returns `Promise.resolve()` without fetching any files. The `main.js` ES module import chain (`main.js` → `components.js` → `sections.js`) is declared in `index.html` only via `<script src="assets/js/bundle.js">` — `main.js` is never included on any page, so `initSections()` is never called from `main.js`.
- Files: `assets/js/bundle.js`, `assets/js/components.js`, `assets/js/main.js`, `assets/js/sections.js`, `components/navbar.html`, `components/footer.html`
- Impact: `initSections()` (scroll reveal for the new `aike-header`, vibe videos, enterprise reveal, stories reveal) is dead code on all pages. The `aike-header` CSS in `sections.css` and the `navbar.html`/`footer.html` partials are unused. Maintenance confusion — two header HTML structures, two sets of scroll CSS classes (`scrolled` vs `aike-scrolled`).
- Fix approach: Choose one architecture. Either (1) load `main.js` as a module on all pages and fetch the HTML partials via `loadComponents()`, or (2) keep `bundle.js` as the single script and remove `main.js`, `components.js`, `sections.js` or merge their logic into `bundle.js`.

**Scroll-state class mismatch between JS and CSS:**
- Issue: `bundle.js` applies the class `scrolled` to `#aikeHeader`, but `styles.css` styles `.header.scrolled`. `sections.js` applies `aike-scrolled` to `#aikeHeader`, but `sections.css` styles `.aike-header.aike-scrolled`. Since `sections.js` is never invoked, only the `bundle.js` / `styles.css` path is active — but `bundle.js` injects a `<header class="header">` (not `aike-header`), so the `sections.css` styles for the `aike-scrolled` state are completely inactive.
- Files: `assets/js/bundle.js` (line 91), `assets/js/sections.js` (line 37), `assets/css/styles.css` (`.header.scrolled`), `assets/css/sections.css` (`.aike-header.aike-scrolled`)
- Impact: The intended scrolled-header behavior (white background + logo swap) from `sections.css` never fires. Users only see the minimal `styles.css` pill-shrink effect.
- Fix approach: Align to one header element class and one JS class toggle.

**`components.js` is a non-functional stub:**
- Issue: `components.js` exports `loadComponents()` that does nothing but return a resolved promise. The comment says "Using bundle.js for everything directly on this simplified architecture." This means the ES module architecture declared in `main.js` is an incomplete refactor.
- Files: `assets/js/components.js`
- Impact: Any future developer importing from `components.js` expecting component injection will get nothing. Dead code inflates confusion.
- Fix approach: Either implement real HTML-fetch logic in `loadComponents()`, or delete `components.js` and `main.js` entirely and consolidate into `bundle.js`.

**Undefined CSS custom property `--color-background`:**
- Issue: `assets/css/home.css` (line 154) and inline styles across `pages/booking.html` (line 49), `pages/pricing.html` (line 24), and `pages/solutions.html` (line 39) reference `var(--color-background)`. This token is never defined in `styles.css` `:root`. The defined token for the page background is `--color-bg`.
- Files: `assets/css/home.css`, `pages/booking.html`, `pages/pricing.html`, `pages/solutions.html`, `assets/css/styles.css`
- Impact: Elements using `--color-background` render with no background color (falls back to transparent or inherited), causing potential visual breaks.
- Fix approach: Add `--color-background: var(--color-bg)` as an alias in `:root` in `styles.css`, or do a find-replace to correct all usages to `--color-bg`.

**Mismatched `--color-text-main` token reference:**
- Issue: `assets/css/styles.css` (line 591) references `var(--color-text-main)` for `.aike-scrolled .aike-navLink`. This token is never defined in `styles.css` `:root`. The defined token for text is `--color-text`.
- Files: `assets/css/styles.css` (line 591, 615)
- Impact: Nav link text color in the mobile menu and scrolled state is undefined — text may appear transparent or use browser default.
- Fix approach: Replace `--color-text-main` with `--color-text` globally.

**Inline styles used extensively for layout and spacing on inner pages:**
- Issue: `pages/booking.html`, `pages/pricing.html`, and `pages/solutions.html` use dozens of `style=""` attributes for padding, font-size, color, font-family, margin, and layout values. These repeat magic numbers (`padding: 180px 0`, `font-size: 3rem`, `margin-bottom: 1.5rem`) rather than using the established CSS token and utility class system.
- Files: `pages/booking.html`, `pages/pricing.html`, `pages/solutions.html`
- Impact: Impossible to update design tokens system-wide; changes require hunting through HTML. Contradicts the CSS token architecture established in `styles.css`.
- Fix approach: Extract repeated inline styles into named classes in the relevant CSS file.

**Duplicate `initScrollReveal()` defined in two files:**
- Issue: `initScrollReveal()` is defined as a global function in `bundle.js` (lines 98–115) and as a local function in `main.js` (lines 21–41). They are slightly different: `bundle.js` uses `threshold: 0.1`, `main.js` uses `threshold: 0.12`. Since `main.js` is never loaded, only the `bundle.js` version runs, but the divergence will cause confusion if `main.js` is ever activated.
- Files: `assets/js/bundle.js`, `assets/js/main.js`
- Fix approach: Consolidate into one implementation when resolving the dual-architecture issue.

**Missing image asset (`nanobananapro.png`):**
- Issue: `index.html` (line 89) references `assets/images/logos/nanobananapro.png`, but the file on disk is `assets/images/logos/nanobanana.png`. The filename mismatch causes a broken image load.
- Files: `index.html` (line 89), `assets/images/logos/`
- Impact: The float icon for "Nano Banana Pro" will always fail to load. The `onerror` fallback substitutes an emoji `🍌`, so it degrades gracefully but is still a broken reference.
- Fix approach: Rename the file to `nanobananapro.png` or correct the `src` attribute in `index.html` to `nanobanana.png`.

**Trailing whitespace in image path (SVG logo):**
- Issue: `index.html` (line 77) has `src="assets/images/logos/Claude_AI_symbol.svg  "` — there are two trailing spaces in the `src` attribute value. Most browsers will trim this, but it is an inconsistency and may fail in strict environments.
- Files: `index.html` (line 77)
- Fix approach: Remove trailing spaces from the `src` value.

**`sections.js` and `main.js` never loaded on any page:**
- Issue: No `<script>` tag on any of the four HTML pages (`index.html`, `pages/booking.html`, `pages/pricing.html`, `pages/solutions.html`) loads `main.js` or `sections.js`. All pages only load `bundle.js`.
- Files: `index.html` (line 319), `pages/booking.html` (line 130), `pages/pricing.html` (line 101), `pages/solutions.html` (line 140)
- Impact: All code in `sections.js` (`initAikeHeader`, `initVibeVideos`, `initEnterpriseReveal`, `initStoriesReveal`) is dead. The `aike-header` HTML in `components/navbar.html` is never rendered in a browser.
- Fix approach: Add `<script type="module" src="../assets/js/main.js">` on all pages, or fold `sections.js` behavior into `bundle.js`.

---

## Known Bugs

**Booking page calendar is purely decorative (non-functional):**
- Symptoms: The calendar UI in `pages/booking.html` shows date tiles (Tue 14, Wed 15, Thu 16) and time slot buttons ("10:00 AM UTC", "02:30 PM UTC", "04:00 PM UTC"), but none of them have event listeners. Clicking a date or time slot does nothing. There is no actual calendar integration or form submission.
- Files: `pages/booking.html` (lines 96–115)
- Trigger: Clicking any calendar element on the booking page.
- Workaround: None — users have no functional way to book.

**Hero email form has no submit handler:**
- Symptoms: `index.html` has an email `<input>` and a "Book your call" `<button type="submit">` but they are not inside a `<form>` element and no JavaScript handles the button click. Submitting the email address does nothing.
- Files: `index.html` (lines 53–58)
- Trigger: Entering an email and clicking "Book your call" on the homepage.
- Workaround: None — no data is collected or acted upon.

**Carousel dot count mismatch:**
- Symptoms: The motion carousel in `index.html` has 5 cards but only 3 dot buttons (`.motion-dot`). The `initInfiniteCarousel()` logic in `bundle.js` tracks `activeDotIndex` modulo `dots.length` (3), so after 3 advances the active dot wraps back to 0 while the card sequence has only advanced 3 of 5. Dot position will desynchronize from the visible card within one full auto-play cycle.
- Files: `index.html` (lines 179–241), `assets/js/bundle.js` (lines 129–181)
- Trigger: Auto-play or clicking dots repeatedly.
- Workaround: None — visual state drifts.

**Carousel `moveNext` uses `setTimeout` race condition:**
- Symptoms: Dot click handler fires `moveNext()` multiple times via staggered `setTimeout` calls (`i * 650ms`). If the user clicks again before the sequence completes, `isAnimating` may be false between steps, allowing overlapping animations and jumbled card order.
- Files: `assets/js/bundle.js` (lines 164–175)
- Trigger: Rapidly clicking different carousel dots.
- Workaround: None.

---

## Security Considerations

**External CDN images loaded from Shopify CDN without SRI:**
- Risk: `components/navbar.html` loads logo images from `https://cdn.shopify.com/s/files/...`. If the CDN URL is compromised or the file is replaced, the site will silently display a different image. No Subresource Integrity (SRI) hash is present.
- Files: `components/navbar.html` (lines 13, 19, 52)
- Current mitigation: None.
- Recommendations: Host logo assets locally in `assets/images/` (as already done for `logo.png` and `logo2.png`) and remove external CDN dependency for critical brand assets.

**Discord link points to `https://discord.com` (generic homepage):**
- Risk: The Discord community link in the injected footer (`bundle.js` line 51) points to `https://discord.com` rather than a specific server invite. Any visitor clicking it lands on the Discord homepage, not the AIKE community.
- Files: `assets/js/bundle.js` (line 51)
- Recommendations: Replace with the specific Discord invite URL once a server is created.

**No Content Security Policy headers or meta tags:**
- Risk: There are no CSP headers defined at the HTML level or server configuration. The site loads Google Fonts and external CDN assets without restrictions.
- Files: All HTML files
- Current mitigation: None.
- Recommendations: Add a `<meta http-equiv="Content-Security-Policy">` tag restricting `script-src`, `img-src`, and `font-src` to known origins.

**No `<link rel="canonical">` or structured data:**
- Risk: Without canonical URLs, search engines may index multiple path variants of the same page, diluting SEO authority. This is a marketing site where SEO is a core growth channel.
- Files: `index.html`, `pages/pricing.html`, `pages/solutions.html`, `pages/booking.html`
- Recommendations: Add canonical `<link>` tags and basic JSON-LD structured data for the organization.

---

## Performance Bottlenecks

**Continuous CSS animations running unconditionally:**
- Problem: `styles.css` runs `@keyframes waveAnimate` (footer wave) and `@keyframes footerSweep` (footer gradient) on `animation: ... infinite` with no `prefers-reduced-motion` check. Both animations run even when the footer is not visible.
- Files: `assets/css/styles.css` (lines 420–439)
- Cause: No `@media (prefers-reduced-motion: reduce)` guard and no IntersectionObserver to pause when off-screen.
- Improvement path: Wrap animations in `@media (prefers-reduced-motion: no-preference)` and/or use an IntersectionObserver to add/remove an animation class.

**Google Fonts loaded without `font-display: swap`:**
- Problem: All four HTML pages load Google Fonts via standard `<link>` without appending `&display=swap` to the URL. Fonts block rendering until downloaded.
- Files: `index.html` (line 15), `pages/booking.html` (line 11), `pages/pricing.html` (line 11), `pages/solutions.html` (line 12)
- Cause: Missing query parameter on the fonts URL.
- Improvement path: Append `&display=swap` to the Google Fonts `href` on all pages.

**No image lazy loading or responsive `srcset`:**
- Problem: `index.html` loads `assets/images/logo2.png` as a hero visual with no `loading="lazy"` or `srcset`. Float icon images also lack `width`/`height` attributes, causing layout shifts.
- Files: `index.html` (lines 74–104)
- Improvement path: Add `loading="lazy"` on below-fold images, set explicit `width`/`height` on all `<img>` elements, and provide optimized WebP variants via `<picture>`.

---

## Fragile Areas

**`bundle.js` path resolution based on `window.location.pathname`:**
- Files: `assets/js/bundle.js` (lines 118–119)
- Why fragile: The base path `b` is determined by checking `window.location.pathname.includes('/pages/')`. This works for the current two-level directory structure (`/` and `/pages/`) but breaks if any page is nested further (e.g., `/pages/blog/post.html`) or if the site is hosted at a sub-path.
- Safe modification: Add new pages only at the existing two levels; do not create subdirectories inside `/pages/` without updating this logic.
- Test coverage: None.

**`injectHTML` uses `el.replaceWith.apply(el, tmp.childNodes)`:**
- Files: `assets/js/bundle.js` (lines 77–83)
- Why fragile: `tmp.childNodes` is a live `NodeList`. As nodes are moved out of `tmp` during `replaceWith`, the live list shrinks, so not all nodes may be inserted in complex HTML. The current header/footer HTML happens to work because the content is simple, but adding sibling root elements to the injected HTML could silently drop nodes.
- Safe modification: Convert `tmp.childNodes` to an array (`Array.from(tmp.childNodes)`) before passing to `replaceWith`.
- Test coverage: None.

**Carousel index drift is cumulative and unrecoverable:**
- Files: `assets/js/bundle.js` (lines 129–181)
- Why fragile: There is no mechanism to re-sync `activeDotIndex` with the actual visible card after a multi-step jump or auto-play overlap. The only reset is a full page reload.
- Safe modification: Do not add more cards or dots without rewriting the carousel logic to track card identity rather than positional index.
- Test coverage: None.

---

## Missing Critical Features

**No real booking/scheduling integration:**
- Problem: The booking page displays a static mock calendar with hardcoded dates (Tue 14, Wed 15, Thu 16) and no connection to any scheduling service (Calendly, Cal.com, Google Calendar, etc.).
- Files: `pages/booking.html`
- Blocks: Core business conversion — users cannot actually book a call.

**No email capture or CRM integration:**
- Problem: The hero email input on `index.html` has no form submission handler, no API endpoint, and no integration with any email service (Mailchimp, ConvertKit, HubSpot, etc.). The email field is purely cosmetic.
- Files: `index.html` (lines 52–59)
- Blocks: Lead generation — the primary homepage CTA collects nothing.

**Footer content is placeholder/template copy from Make.com:**
- Problem: `components/footer.html` contains footer navigation columns with link texts such as "Make Academy", "Make Community", "Make + AI", "Waves", "On-prem agents", "Bug Bounty" — content that belongs to Make.com, not AIKE. All 20+ footer links point to `href="#"`.
- Files: `components/footer.html`
- Blocks: Credibility and legal compliance — "Terms & conditions", "Privacy and GDPR", and "Disclaimer" links are dead.

**No analytics or tracking:**
- Problem: No analytics script (Google Analytics, Plausible, Fathom, etc.) is loaded on any page. There is no way to measure traffic, conversion, or user behavior.
- Files: All HTML pages
- Blocks: Business visibility into site performance.

---

## Test Coverage Gaps

**No tests of any kind:**
- What's not tested: All JavaScript behavior — component injection, scroll events, carousel logic, reveal animations. All HTML structure, accessibility, and link validity.
- Files: Entire `assets/js/` directory
- Risk: Any change to `bundle.js` can silently break injection, carousel, or scroll behavior with no safety net.
- Priority: High

---

*Concerns audit: 2026-03-26*
