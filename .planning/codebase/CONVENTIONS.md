# Coding Conventions

**Analysis Date:** 2026-03-26

## Naming Patterns

**Files:**
- CSS files use lowercase kebab-case: `styles.css`, `components.css`, `home.css`, `sections.css`, `pages.css`
- JS files use lowercase kebab-case: `bundle.js`, `main.js`, `components.js`, `sections.js`
- HTML files use lowercase kebab-case: `index.html`, `solutions.html`, `pricing.html`, `booking.html`
- Component HTML files are named by role: `navbar.html`, `footer.html`

**CSS Classes:**
- Global utility classes use lowercase with hyphens: `.btn`, `.card`, `.container`, `.section`, `.grid-2`, `.text-center`
- BEM-style for scoped components: block__element (e.g. `.hero__title`, `.footer__nav`, `.bundle-card__btn`)
- Modifier suffix with double-hyphen: `.btn-primary`, `.btn-outline`, `.bundle-card--highlight`, `.section-header--center`
- Aike-namespaced classes for the new component architecture use `aike-` prefix: `.aike-header`, `.aike-navLink`, `.aike-deskBtn`, `.aike-topbar`, `.aike-menuWrap`
- State classes are prefixed with `is-` or convey state as a bare word: `.is-visible`, `.is-in`, `.aike-open`, `.aike-scrolled`, `.aike-lock`, `.scrolled`, `.revealed`, `.reveal-pending`

**HTML IDs:**
- IDs use camelCase: `aikeHeader`, `aikeTopbar`, `aikeMenuBtn`, `aikeCloseBtn`, `aikeMenuScroll`, `aikeVibeSection`, `aikeEnterpriseSection`, `aikeStories`, `aikeMotionCarousel`
- Placeholder containers follow pattern: `navbar-placeholder`, `footer-placeholder`

**JavaScript Functions:**
- Functions follow camelCase: `loadComponents()`, `initSections()`, `initAikeHeader()`, `initVibeVideos()`, `initEnterpriseReveal()`, `initStoriesReveal()`, `initScrollReveal()`, `initHeader()`, `initInfiniteCarousel()`
- Initializer functions are prefixed `init`: `initSections`, `initAikeHeader`, `initVibeVideos`, `initScrollReveal`
- Helper/loader functions use descriptive verbs: `loadComponents`, `injectHTML`, `syncBodyPadding`, `openMenu`, `closeMenu`, `updateDots`, `moveNext`

**JavaScript Variables:**
- `const` for DOM references and fixed values: `const header`, `const btn`, `const track`
- `let` for mutable state only: `let isAnimating`, `let activeDotIndex`
- `var` used only in `bundle.js` (older script, not ES module): `var el`, `var tmp`
- Short names for local DOM refs within a function: `el`, `h`, `b`, `y`, `p`

**CSS Custom Properties (Design Tokens):**
- Global tokens in `:root` with `--color-`, `--font-`, `--space-`, `--radius-`, `--shadow-`, `--transition-` prefixes: `--color-primary`, `--space-xl`, `--radius-md`
- Section-scoped tokens without global prefix: `--bg-top`, `--ink`, `--purple`, `--muted`, `--topbar-h`, `--pad-x`

## Code Style

**Formatting:**
- No automated formatter configured (no `.prettierrc`, `biome.json`, or ESLint config detected)
- Consistent 2-space indentation throughout all JS and HTML files
- CSS uses 2-space indentation
- Single blank lines separate logical blocks within functions
- No trailing semicolons omitted — all JS statements end with semicolons

**Linting:**
- No linting toolchain detected (no `.eslintrc`, `eslint.config.*`, or `biome.json`)
- Code quality enforced through code review only

**JS Module Style:**
- `assets/js/main.js` and `assets/js/sections.js` and `assets/js/components.js` are ES Modules (use `import`/`export`)
- `assets/js/bundle.js` is a non-module classic script (uses `function` declarations, `var`, no `import`/`export`)
- The two systems coexist: `index.html` loads `bundle.js` as a plain `<script>`, while inner pages can use the module pattern via `main.js`

## Import Organization

**ES Module files (`main.js`):**
1. Named imports from local module files
2. No third-party imports (no npm packages)

**Example from `assets/js/main.js`:**
```js
import { loadComponents } from './components.js';
import { initSections }   from './sections.js';
```

**Path Aliases:**
- None. All imports use relative paths (e.g. `'./components.js'`, `'./sections.js'`)

## Error Handling

**Patterns:**
- Guard clause at function start: check for required DOM element, return early if absent
  ```js
  const header = document.getElementById('aikeHeader');
  if (!header) return;
  ```
- Swallowed promise rejections for browser media APIs where failure is expected:
  ```js
  video.play().catch(() => {});
  const p = video.play();
  if (p !== undefined) p.catch(() => {});
  ```
- No `try/catch` blocks present — errors are silently swallowed or prevented by guard clauses
- No error boundaries or user-facing error messages in JS

**HTML Fallbacks:**
- `onerror` attribute on `<img>` tags to swap broken images with inline emoji/HTML spans:
  ```html
  onerror="this.outerHTML='<span class=&quot;fallback-icon&quot;>🤖</span>'"
  ```

## Logging

**Framework:** `console` (browser native)

**Patterns:**
- No `console.log`, `console.warn`, or `console.error` calls present in any JS file
- No structured logging — the project has no server-side code

## Comments

**When to Comment:**
- File-level JSDoc header block on every JS file naming the file and its purpose
- Section dividers using dashes and ALL CAPS labels to separate logical groups within a file
- Inline comments explain non-obvious behaviour (e.g. `// Fast forward the loop state smoothly`)
- CSS files use block comments at the top and section banners with `/* ── Section Name ─── */`

**JSDoc Usage:**
- Single `@param` and `@description` style not used — comments are prose-narrative only
- Example file header from `assets/js/sections.js`:
  ```js
  /**
   * AIKE — sections.js
   * Boots all interactive behaviour for the new aike- sections
   * after components have been injected into the DOM.
   *
   * Exported function: initSections()
   * Called from main.js after loadComponents() resolves.
   */
  ```

**CSS Comments:**
- File banner: `/* ============================================================ AIKE — ... ============================================================ */`
- Section banners: `/* ── Section Name ────── */`
- Inline explanations for non-obvious values: `/* Bright Purple */`, `/* Move text EVEN MORE to the left */`
- Deprecated/replaced code is kept but commented out with a note explaining what replaced it (see `components.css` lines 6-80)

## Function Design

**Size:**
- Functions are small and single-purpose (under 30 lines each)
- Each `init*` function handles exactly one interactive component

**Parameters:**
- Functions typically take no parameters — they query the DOM internally
- Exception: `injectHTML(id, html)` in `bundle.js` takes an element ID and HTML string
- Arrow functions used for callbacks and event handlers; `function` declarations used for named top-level functions

**Return Values:**
- Initializer functions return nothing (void)
- `loadComponents()` returns `Promise.resolve()` as a stub
- `injectHTML()` returns early (`return`) if the target element is not found

## Module Design

**Exports:**
- ES Module files export a single named function per file:
  - `components.js` exports `loadComponents`
  - `sections.js` exports `initSections`
- `bundle.js` exports nothing — it relies on global scope and `DOMContentLoaded`

**Barrel Files:**
- None. Imports are direct to their source file.

## HTML Conventions

**Structure:**
- Every page has identical shell: `<!DOCTYPE html>`, `<html lang="en">`, `<head>` with meta/fonts/styles, `<body>` with `.page-wrapper > #navbar-placeholder + <main> + #footer-placeholder`
- Pages under `pages/` reference assets with `../assets/` relative paths
- `index.html` (root) references assets with `assets/` relative paths
- Inline `<style>` blocks used on individual pages for page-specific layout rules (e.g. `.split-grid` in `solutions.html`)
- `data-reveal` attribute marks elements for scroll-triggered animation (no value needed)
- `aria-labelledby`, `aria-label`, `aria-hidden`, `aria-expanded`, `aria-controls`, `role="dialog"` used consistently for accessibility

**Script Loading:**
- `bundle.js` loaded as non-module `<script>` at the bottom of `<body>` (no `defer` or `type="module"`)
- ES module entry (`main.js`) available but not used in production HTML pages as of current state

---

*Convention analysis: 2026-03-26*
