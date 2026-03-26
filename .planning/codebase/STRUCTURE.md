# Codebase Structure

**Analysis Date:** 2026-03-26

## Directory Layout

```
AIKE/
├── index.html              # Home page (root entry point)
├── pages/                  # Inner pages
│   ├── pricing.html        # Pricing tiers page
│   ├── solutions.html      # Solutions/features page
│   └── booking.html        # Book a call page
├── components/             # HTML component templates (not auto-fetched)
│   ├── navbar.html         # Header markup reference
│   └── footer.html         # Footer markup reference
├── assets/
│   ├── css/                # All stylesheets
│   │   ├── styles.css      # Design tokens, reset, base styles
│   │   ├── components.css  # Reusable component styles (buttons, cards, etc.)
│   │   ├── home.css        # Home page section styles
│   │   ├── sections.css    # Shared section styles (aike-header, aike-footer)
│   │   └── pages.css       # Styles specific to inner pages
│   ├── js/                 # All JavaScript
│   │   ├── bundle.js       # Production script loaded by all HTML pages
│   │   ├── main.js         # ES module entry point (development reference only)
│   │   ├── components.js   # ES module stub for loadComponents()
│   │   └── sections.js     # ES module for initSections() (header, carousel, reveals)
│   └── images/             # Static image assets
│       ├── logo.png         # Primary logo (dark background)
│       ├── logo2.png        # Secondary logo / hero visual
│       └── logos/           # Third-party integration logos (Claude, Notion, Cursor, etc.)
├── .planning/              # GSD planning documents
│   └── codebase/           # Codebase analysis documents
├── .claude/                # Claude Code settings
└── .vscode/                # VS Code launch configuration
```

## Directory Purposes

**`pages/`:**
- Purpose: All HTML pages other than the home page
- Contains: One `.html` file per route
- Key files: `pricing.html`, `solutions.html`, `booking.html`
- Path convention: CSS and JS paths use `../` prefix to resolve from parent directory

**`components/`:**
- Purpose: Stores the canonical HTML markup for the shared header and footer
- Contains: `navbar.html`, `footer.html`
- Important: These files are reference/design documents. The live site injects header and footer via inline template literals in `assets/js/bundle.js`, NOT by fetching these files. Keep `components/` in sync with `bundle.js` templates when updating shared components.

**`assets/css/`:**
- Purpose: All stylesheets loaded by HTML pages
- Contains: Five CSS files with distinct responsibilities
- Key file: `styles.css` — defines all CSS custom properties (design tokens) in `:root`

**`assets/js/`:**
- Purpose: All JavaScript for the site
- Contains: `bundle.js` (production), plus ES module files (`main.js`, `components.js`, `sections.js`) used as development reference
- Key file: `bundle.js` — the only script referenced by HTML files

**`assets/images/`:**
- Purpose: Static image and icon assets
- Contains: Logo variants and third-party integration logos
- Subdirectory: `logos/` holds SVG and PNG icons for tool integrations shown in the hero section

## Key File Locations

**Entry Points:**
- `index.html`: Home page, root URL
- `pages/pricing.html`: Pricing page
- `pages/solutions.html`: Solutions page
- `pages/booking.html`: Booking/consultation page

**Primary JavaScript:**
- `assets/js/bundle.js`: Loaded by every HTML page — handles component injection, scroll behaviour, animations, carousel

**Design Tokens:**
- `assets/css/styles.css`: All CSS custom properties (`--color-*`, `--space-*`, `--radius-*`, `--font-*`, `--transition-*`)

**Component Templates:**
- `components/navbar.html`: Canonical header HTML (reference — not fetched at runtime)
- `components/footer.html`: Canonical footer HTML (reference — not fetched at runtime)

## Naming Conventions

**Files:**
- HTML pages: lowercase with hyphens — `booking.html`, `solutions.html`
- CSS files: lowercase, single-word or short descriptor — `styles.css`, `components.css`, `home.css`
- JS files: camelCase or lowercase — `bundle.js`, `main.js`, `sections.js`
- Image files: lowercase with hyphens — `logo.png`, `logo2.png`

**CSS Classes:**
- BEM pattern for components: `bundle-card`, `bundle-card__title`, `bundle-card--highlight`
- New header/footer components use `aike-` prefix: `aike-header`, `aike-topbar`, `aike-brand`, `aike-footer`
- Legacy header (commented out) uses `.navbar`, `.navbar__inner` — superseded by `aike-header`
- Utility classes use single short names: `.btn`, `.btn-primary`, `.btn-outline`, `.container`, `.section`
- State classes: `.scrolled`, `.aike-open`, `.aike-lock`, `.revealed`, `.is-visible`, `.is-in`

**HTML IDs:**
- Named with camelCase: `#aikeHeader`, `#aikeTopbar`, `#aikeMenuBtn`, `#aikeCloseBtn`, `#aikeMotionCarousel`, `#aikeStories`
- Placeholder divs: `#navbar-placeholder`, `#footer-placeholder`

**JavaScript Functions:**
- Init functions: camelCase prefixed with `init` — `initHeader()`, `initScrollReveal()`, `initInfiniteCarousel()`, `initSections()`
- Section-specific inits: `initAikeHeader()`, `initVibeVideos()`, `initEnterpriseReveal()`, `initStoriesReveal()`

## Where to Add New Code

**New Page:**
- Create `pages/[page-name].html`
- Copy the standard boilerplate: `<!DOCTYPE html>`, charset/viewport meta, font links, all four CSS `<link>` tags with `../assets/css/` prefix and `?v=5`
- Include `<div id="navbar-placeholder"></div>` at top of `.page-wrapper`
- Include `<div id="footer-placeholder"></div>` before `</div>` closing `.page-wrapper`
- Load script at bottom: `<script src="../assets/js/bundle.js"></script>`
- Add a navigation link in `bundle.js` inside both `getHeaderHTML` and `getFooterHTML` templates, AND update `components/navbar.html` and `components/footer.html` to match

**New Section on Existing Page:**
- Add a `<section>` element with `aria-labelledby` pointing to a heading ID
- Add `data-reveal` to any element that should animate in on scroll
- Place page-specific styles either in `assets/css/home.css` (for home page) or `assets/css/pages.css` (for inner pages), or as a `<style>` block in the HTML file for one-off layouts

**New Interactive Behaviour:**
- Add the init function to `assets/js/bundle.js` and call it from the `DOMContentLoaded` handler
- Also add it to `assets/js/sections.js` (called via `initSections()`) if it applies to a named section

**New Shared Component:**
- Update the `getHeaderHTML(b)` or `getFooterHTML(b)` template literal in `assets/js/bundle.js`
- Update the corresponding file in `components/` to keep it as an accurate reference

**New CSS Design Token:**
- Add to the `:root` block in `assets/css/styles.css`
- Follow existing naming: `--color-*`, `--space-*`, `--radius-*`, `--shadow-*`, `--transition-*`

**New Image/Icon:**
- Place in `assets/images/` for site images or `assets/images/logos/` for tool/integration logos
- Reference with path `assets/images/...` from root pages or `../assets/images/...` from `pages/`

## Special Directories

**`.planning/`:**
- Purpose: GSD planning and codebase analysis documents
- Generated: No — written by GSD mapper agents
- Committed: Yes

**`.claude/`:**
- Purpose: Claude Code local settings
- Generated: Yes (by Claude Code)
- Committed: Optional

**`.vscode/`:**
- Purpose: VS Code launch configuration
- Generated: Partially (created by developer)
- Committed: Yes

---

*Structure analysis: 2026-03-26*
