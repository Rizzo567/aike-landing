# Architecture

**Analysis Date:** 2026-03-26

## Pattern Overview

**Overall:** Static Multi-Page Website with JavaScript-Injected Shared Components

**Key Characteristics:**
- No build step, no bundler, no framework — pure HTML/CSS/JS served as static files
- Shared header and footer are injected at runtime via `assets/js/bundle.js` using DOM manipulation
- Each HTML page is self-contained: it declares its own `<head>`, loads its own CSS, and calls the single shared script
- All interactivity (scroll reveal, carousels, mobile menu) is vanilla JavaScript using the IntersectionObserver API
- Path resolution for assets is determined at runtime by checking `window.location.pathname` for `/pages/` — root pages use `./` as base, pages in `pages/` use `../` as base

## Layers

**Markup Layer:**
- Purpose: Defines page structure and content
- Location: `index.html` (root), `pages/pricing.html`, `pages/solutions.html`, `pages/booking.html`
- Contains: HTML sections, semantic elements, `data-reveal` attributes for animation triggers, placeholder `div` elements for injected components
- Depends on: CSS layer for styling, JS layer for component injection

**Shared Component Layer:**
- Purpose: Provides reusable header and footer HTML that is injected into every page
- Location: `components/navbar.html`, `components/footer.html`
- Contains: Full header markup (desktop nav, mobile overlay menu) and full footer markup (nav columns, social links, rating)
- Note: These `.html` files are NOT automatically fetched. The active injection mechanism in `bundle.js` uses inline template literals (`getHeaderHTML`, `getFooterHTML`), making `components/navbar.html` and `components/footer.html` reference/design files that are not loaded at runtime

**JavaScript Layer:**
- Purpose: Bootstraps shared component injection and all interactive behaviour
- Location: `assets/js/bundle.js` (production entry point), `assets/js/main.js`, `assets/js/sections.js`, `assets/js/components.js`
- Contains: Component injection, scroll-state header logic, scroll reveal animation, infinite carousel, mobile menu, video loop fix, enterprise/stories intersection observers
- Depends on: DOM being ready (DOMContentLoaded event)

**CSS Layer:**
- Purpose: Provides design tokens, reset, layout, and component/section styles
- Location: `assets/css/styles.css`, `assets/css/components.css`, `assets/css/home.css`, `assets/css/sections.css`, `assets/css/pages.css`
- Contains: CSS custom properties (design tokens) in `:root`, reset rules, utility classes, component classes (`.btn`, `.card`, `.bundle-card`), section-specific rules

## Data Flow

**Page Load Flow:**

1. Browser requests an HTML file (e.g., `index.html` or `pages/pricing.html`)
2. HTML loads CSS stylesheets via `<link>` tags in `<head>` (with cache-busting `?v=5` query param)
3. Browser renders the page skeleton including empty `#navbar-placeholder` and `#footer-placeholder` divs
4. `<script src="assets/js/bundle.js">` executes on `DOMContentLoaded`
5. `bundle.js` determines base path (`./` or `../`) from `window.location.pathname`
6. `injectHTML('navbar-placeholder', getHeaderHTML(b))` replaces the placeholder div with header markup
7. `injectHTML('footer-placeholder', getFooterHTML(b))` replaces the placeholder div with footer markup
8. `initHeader()` attaches scroll listener to add/remove `.scrolled` class on `#aikeHeader`
9. `initScrollReveal()` sets up `IntersectionObserver` on all `[data-reveal]` elements
10. `initInfiniteCarousel()` sets up the motion carousel with dot navigation and auto-play

**Navigation Flow:**

- All navigation is standard anchor `<a href>` links between HTML files
- No client-side routing — each navigation is a full browser page load
- Internal links use relative paths: `pages/pricing.html` from root, `booking.html` from within `pages/`

**State Management:**
- No application state — all state is DOM class-based (e.g., `.scrolled`, `.aike-open`, `.aike-lock`, `.revealed`, `.is-visible`, `.is-in`)
- Mobile menu open/close state is managed by toggling CSS classes on `#aikeHeader` and `document.body`
- Carousel position is tracked in local `activeDotIndex` variable within `initInfiniteCarousel()`

## Key Abstractions

**`injectHTML(id, html)`:**
- Purpose: Replaces a DOM element by ID with arbitrary HTML string
- Location: `assets/js/bundle.js` (line 77)
- Pattern: Creates a temporary `div`, sets `innerHTML`, then uses `replaceWith` with spread of `childNodes`

**`getHeaderHTML(b)` / `getFooterHTML(b)`:**
- Purpose: Template functions that return full header/footer HTML strings, with base path `b` interpolated into all `href` and `src` attributes
- Location: `assets/js/bundle.js` (lines 6, 26)
- Pattern: Arrow function returning a template literal

**`[data-reveal]` attribute:**
- Purpose: Marks any element to receive scroll-triggered fade-in animation
- Pattern: Elements get class `reveal-pending` immediately, then class `revealed` is added when the element enters the viewport at 10–12% threshold

**`.bundle-card` / `.bundle-card--highlight`:**
- Purpose: Reusable card component used across `index.html`, `pages/pricing.html`, and `pages/solutions.html`
- Location: `assets/css/home.css` or `assets/css/sections.css`
- Pattern: BEM-style modifier (`--highlight`) for the featured/recommended card variant

**`.btn` / `.btn-primary` / `.btn-outline`:**
- Purpose: Button utility class used site-wide
- Location: `assets/css/styles.css` or `assets/css/components.css`
- Pattern: Base class with modifier classes for visual variants

## Entry Points

**Root Page:**
- Location: `index.html`
- Triggers: Direct browser request to site root
- Responsibilities: Renders home page with hero, pricing bundles preview, Aike Motion carousel, and success stories sections; loads `bundle.js`

**Inner Pages:**
- Location: `pages/pricing.html`, `pages/solutions.html`, `pages/booking.html`
- Triggers: Navigation link click or direct URL access
- Responsibilities: Each page loads all shared CSS with `../` paths, renders its own content, and loads `../assets/js/bundle.js` which handles component injection

**JavaScript Bootstrap:**
- Location: `assets/js/bundle.js`
- Triggers: `DOMContentLoaded` event on every page
- Responsibilities: Component injection, header scroll behaviour, scroll reveal, carousel initialization

**ES Module Entry (unused in production):**
- Location: `assets/js/main.js`
- Triggers: Not referenced by any HTML file — appears to be a development-only module
- Responsibilities: Imports from `components.js` (stub) and `sections.js`, calls `loadComponents()` and `initSections()`

## Error Handling

**Strategy:** Silent failure — most functions guard with early returns if target elements are not found.

**Patterns:**
- All section init functions check for element existence: `if (!header || !topbar) return;`
- Image load errors fall back to emoji spans via `onerror` inline handlers in `index.html`
- Video `play()` promises are caught silently: `.catch(() => {})`
- `injectHTML` skips silently if `document.getElementById(id)` returns null

## Cross-Cutting Concerns

**Styling:** CSS custom properties defined in `:root` in `assets/css/styles.css` provide a shared design token system used by all CSS files and some inline styles
**Cache Busting:** All CSS `<link>` tags use `?v=5` query string parameter
**Accessibility:** ARIA labels present on nav, mobile menu dialog (`role="dialog" aria-modal="true"`), buttons, and decorative elements (`aria-hidden="true"`)
**Responsive Design:** Page-specific breakpoint overrides declared in `<style>` blocks within individual HTML files (e.g., `booking.html`, `solutions.html`) rather than in shared CSS

---

*Architecture analysis: 2026-03-26*
