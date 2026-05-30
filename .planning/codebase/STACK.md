# Technology Stack

**Analysis Date:** 2026-03-26

## Languages

**Primary:**
- HTML5 - All page structure (`index.html`, `pages/*.html`, `components/*.html`)
- CSS3 - All styling via custom design token system (`assets/css/*.css`)
- JavaScript (ES2015+) - All interactivity (`assets/js/*.js`)

**Secondary:**
- None detected. No TypeScript, no server-side language.

## Runtime

**Environment:**
- Browser-only. No Node.js, no server runtime. This is a fully static website.

**Package Manager:**
- None. No `package.json`, `requirements.txt`, `go.mod`, or any package manifest is present.
- Lockfile: Not applicable.

## Frameworks

**Core:**
- None. No JavaScript framework (React, Vue, Svelte, etc.) is used.
- No CSS framework (Tailwind, Bootstrap, etc.) is used.
- Styling is entirely custom via CSS custom properties (design tokens).

**Testing:**
- None detected. No test framework or test files exist.

**Build/Dev:**
- No build tool (Webpack, Vite, esbuild, etc.) is present.
- Files are served directly without a build step.
- Development server: VSCode Live Server or any static file server on `localhost:8080` (per `.vscode/launch.json`).

## Key Dependencies

**Critical:**
- Google Fonts CDN - Loads `Inter` (400, 500, 600) and `Outfit` (600, 700, 800) typefaces. Required for correct typography rendering. Loaded via `<link>` tags in every HTML file. No local font fallback beyond `system-ui, sans-serif`.

**Infrastructure:**
- Shopify CDN (`cdn.shopify.com`) - Hosts logo image assets referenced in `components/navbar.html`. Two variants: light logo and dark-swap logo.
- No npm packages. No vendored libraries. No local third-party scripts.

## Configuration

**Environment:**
- No environment variables. No `.env` files. All configuration is hard-coded in HTML/JS.
- No build-time configuration.

**Build:**
- No build config files. No `tsconfig.json`, `.babelrc`, `vite.config.*`, `webpack.config.*`, etc.
- Cache-busting is manual via query string versioning: `styles.css?v=5`.

**CSS Design Tokens (in `assets/css/styles.css`):**
- Color palette: dark background (`#111111`), surface (`#1a1a1a`), primary accent (`#a855f7` purple).
- Spacing scale: `--space-xs` through `--space-4xl`.
- Border radii: `--radius-sm` (8px) through `--radius-full` (9999px).
- Transition speeds: `--transition-fast` (150ms), `--transition-base` (250ms), `--transition-slow` (400ms).
- Max layout width: `--max-width: 1200px`.

## CSS File Architecture

**Files (all in `assets/css/`):**
- `styles.css` — Global reset, design tokens, base typography, layout utilities, button components.
- `components.css` — Header, footer, navbar shared component styles.
- `home.css` — Hero section, bundle cards, pixel transitions, stories grid styles.
- `sections.css` — Motion carousel, vibe section, enterprise section, reusable section layouts.
- `pages.css` — Inner page overrides (present but scope limited to page-specific layouts).

## JavaScript File Architecture

**Files (all in `assets/js/`):**
- `bundle.js` — Self-contained script loaded by all HTML pages. Injects header/footer HTML strings, initialises scroll header state, scroll-reveal via `IntersectionObserver`, and the motion carousel autoplay logic.
- `main.js` — ES Module entry point (not loaded by any HTML page directly; references `components.js` and `sections.js`). Appears to be a development artefact or future module entry.
- `components.js` — ES Module export. Currently a stub that returns `Promise.resolve()` immediately.
- `sections.js` — ES Module export. Contains `initSections()` with header scroll/mobile menu, video loop fix, enterprise reveal, and stories reveal via `IntersectionObserver`.

## Platform Requirements

**Development:**
- Any static file server on port 8080 (VSCode Live Server, Python `http.server`, etc.).
- No Node.js, no build step, no dependencies to install.

**Production:**
- Any static hosting platform (Netlify, Vercel, GitHub Pages, Shopify, AWS S3+CloudFront, etc.).
- No server-side compute required.
- Domain: `aikeautomation.com` (referenced in `components/navbar.html`).

---

*Stack analysis: 2026-03-26*
