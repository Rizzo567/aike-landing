/**
 * AIKE — main.js
 * Entry point: bootstraps all shared components and page-level behaviour.
 */

import { loadComponents } from './components.js';
import { initSections }   from './sections.js';

document.addEventListener('DOMContentLoaded', async () => {
  // 1. Inject shared components (aike-header + aike-footer)
  await loadComponents();

  // 2. Boot all new section interactivity (header, vibe, enterprise, stories)
  initSections();

  // 3. Animate [data-reveal] elements on inner pages
  initScrollReveal();
});

/* ── Scroll reveal ─────────────────────────────── */
function initScrollReveal() {
  const elements = document.querySelectorAll('[data-reveal]');
  if (!elements.length) return;

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('revealed');
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.12 }
  );

  elements.forEach(el => {
    el.classList.add('reveal-pending');
    observer.observe(el);
  });
}
