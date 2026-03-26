# Testing Patterns

**Analysis Date:** 2026-03-26

## Test Framework

**Runner:**
- None. No test framework is installed or configured.
- No `jest.config.*`, `vitest.config.*`, `mocha.*`, `cypress.config.*`, or any test runner config detected.

**Assertion Library:**
- None.

**Run Commands:**
- Not applicable. No test scripts exist.

## Test File Organization

**Location:**
- No test files exist anywhere in the project.

**Naming:**
- No `*.test.*` or `*.spec.*` files detected.

**Structure:**
- Not applicable.

## Test Structure

This is a static HTML/CSS/JS marketing site with no test suite. There are no:
- Unit tests
- Integration tests
- End-to-end tests
- Visual regression tests
- Accessibility automated tests

## Mocking

**Framework:** None.

**What to Mock:**
- Not applicable.

## Fixtures and Factories

**Test Data:**
- Not applicable.

**Location:**
- No fixture files present.

## Coverage

**Requirements:** None enforced.

**View Coverage:**
- Not applicable.

## Test Types

**Unit Tests:**
- Not present. The JavaScript in `assets/js/bundle.js`, `assets/js/sections.js`, and `assets/js/main.js` contains DOM-manipulating initializer functions with no test coverage.

**Integration Tests:**
- Not present.

**E2E Tests:**
- Not present.

## Testable Units Identified

If tests were to be added, the following are the discrete, testable behaviours in the codebase:

**`assets/js/bundle.js`:**
- `injectHTML(id, html)` — injects parsed HTML into a target element; verifiable with DOM assertions
- `initHeader()` — toggles `.scrolled` class on scroll; testable with scroll event simulation
- `initScrollReveal()` — adds `.reveal-pending` and `.revealed` classes via IntersectionObserver; requires IntersectionObserver mock
- `initInfiniteCarousel()` — manages dot state, transform transitions, and auto-play via `setInterval`; requires timer mocks

**`assets/js/sections.js`:**
- `initAikeHeader()` — manages mobile menu open/close state and body padding sync; testable with DOM + event simulation
- `initVibeVideos()` — handles video loop restart on `ended` event; testable with HTMLVideoElement mock
- `initEnterpriseReveal()` — adds `.is-visible` class on intersection; requires IntersectionObserver mock
- `initStoriesReveal()` — adds `.is-in` class on intersection; requires IntersectionObserver mock

**`assets/js/main.js`:**
- Bootstraps `loadComponents()` then `initSections()` and `initScrollReveal()` on `DOMContentLoaded`; testable as integration of above

## Recommended Testing Approach

If a test suite were introduced:

**Framework:** Vitest (no build tool needed for plain JS, runs in Node with jsdom)

**Key mocks needed:**
- `IntersectionObserver` — required for all reveal/scroll animations
- `HTMLVideoElement.play()` — returns a Promise; must mock to prevent JSDOM errors
- `setInterval` / `setTimeout` — use fake timers for carousel auto-play tests

**Example test structure if adopted:**
```js
// Example pattern for future tests
import { describe, it, expect, vi, beforeEach } from 'vitest';

describe('initScrollReveal', () => {
  beforeEach(() => {
    document.body.innerHTML = '<div data-reveal></div>';
    global.IntersectionObserver = vi.fn().mockImplementation((cb) => ({
      observe: vi.fn(),
      unobserve: vi.fn(),
      disconnect: vi.fn(),
    }));
  });

  it('adds reveal-pending class to elements with data-reveal', () => {
    initScrollReveal();
    expect(document.querySelector('[data-reveal]').classList.contains('reveal-pending')).toBe(true);
  });
});
```

**Config file location if added:** `vitest.config.js` at project root

**Test file location if added:** Co-located with source files or in a `__tests__/` directory at root

---

*Testing analysis: 2026-03-26*
