/**
 * AIKE — sections.js
 * Boots all interactive behaviour for the new aike- sections
 * after components have been injected into the DOM.
 *
 * Exported function: initSections()
 * Called from main.js after loadComponents() resolves.
 */

export function initSections() {
  initAikeHeader();
  initVibeVideos();
  initEnterpriseReveal();
  initStoriesReveal();
}

/* ──────────────────────────────────────────
   HEADER: scroll state + mobile menu + dropdowns
   ────────────────────────────────────────── */
function initAikeHeader() {
  const header    = document.getElementById('aikeHeader');
  const topbar    = document.getElementById('aikeTopbar');
  if (!header || !topbar) return;

  /* ── Body padding sync ── */
  function syncBodyPadding() {
    const h = topbar.offsetHeight || 0;
    document.documentElement.style.scrollPaddingTop = h + 'px';
    document.body.style.paddingTop = h + 'px';
  }
  syncBodyPadding();
  window.addEventListener('resize', syncBodyPadding);

  /* ── Scroll-class ── */
  function onScroll() {
    const y = window.scrollY || document.documentElement.scrollTop || 0;
    header.classList.toggle('aike-scrolled', y > 8);
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ── Mobile menu ── */
  const btn       = document.getElementById('aikeMenuBtn');
  const closeBtn  = document.getElementById('aikeCloseBtn');
  const scrollArea = document.getElementById('aikeMenuScroll');

  function openMenu() {
    header.classList.add('aike-open');
    document.body.classList.add('aike-lock');
    if (btn) btn.setAttribute('aria-expanded', 'true');
    if (scrollArea) scrollArea.scrollTop = 0;
    setTimeout(() => { if (closeBtn) closeBtn.focus(); }, 60);
  }

  function closeMenu() {
    header.classList.remove('aike-open');
    document.body.classList.remove('aike-lock');
    if (btn) btn.setAttribute('aria-expanded', 'false');
    if (btn) btn.focus();
  }

  if (btn) {
    btn.addEventListener('click', () => {
      header.classList.contains('aike-open') ? closeMenu() : openMenu();
    });
  }
  if (closeBtn) closeBtn.addEventListener('click', closeMenu);

  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && header.classList.contains('aike-open')) closeMenu();
  });

  window.addEventListener('resize', () => {
    syncBodyPadding();
  });
}

/* ──────────────────────────────────────────
   VIBE SECTION: video loop fix
   ────────────────────────────────────────── */
function initVibeVideos() {
  const root = document.getElementById('aikeVibeSection');
  if (!root) return;

  root.querySelectorAll('.aike-vibeCard__video').forEach(video => {
    video.addEventListener('ended', function () {
      this.currentTime = 0;
      this.play().catch(() => {});
    });
    const p = video.play();
    if (p !== undefined) p.catch(() => {});
  });
}

/* ──────────────────────────────────────────
   ENTERPRISE: scroll reveal
   ────────────────────────────────────────── */
function initEnterpriseReveal() {
  const el = document.getElementById('aikeEnterpriseSection');
  if (!el) return;

  const io = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      if (entry.isIntersecting) {
        el.classList.add('is-visible');
        io.unobserve(el);
        break;
      }
    }
  }, { threshold: 0.18 });

  io.observe(el);
}

/* ──────────────────────────────────────────
   STORIES: wave-drop animation
   ────────────────────────────────────────── */
function initStoriesReveal() {
  const section = document.getElementById('aikeStories');
  if (!section) return;

  const io = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        section.classList.add('is-in');
        io.disconnect();
      }
    });
  }, { threshold: 0.25 });

  io.observe(section);
}
