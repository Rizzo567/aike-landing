/**
 * AIKE — bundle.js
 * Injects header/footer and handles scroll logic.
 */

const getHeaderHTML = (b) => `
<header class="header" id="aikeHeader">
  <div class="header__inner">
    <a href="${b}index.html" class="header__brand-group">
      <img src="${b}assets/images/logo.png" alt="Aike Logo" class="header__logo">
      <span class="header__brand">aike</span>
    </a>
    <nav class="header__nav hide-on-mobile">
      <a href="${b}pages/solutions.html" class="header__link">Solutions</a>
      <a href="${b}pages/pricing.html" class="header__link">Pricing</a>
      <a href="${b}pages/booking.html" class="header__link">Booking</a>
      <a href="${b}pages/howl.html" class="header__link header__link--howl">Howl <svg width="7" height="7" viewBox="0 0 8 8" fill="none" aria-hidden="true" style="margin-left:2px;opacity:0.5;vertical-align:middle"><circle cx="4" cy="4" r="3" fill="#a855f7"/></svg></a>
    </nav>
    <div class="header__actions">
      <!-- Desktop Log In -->
      <a href="${b}pages/login.html" class="btn btn-outline auth-btn-login hide-on-mobile" style="border-color:transparent; padding: 0.5rem 1rem;">Log in</a>
      
      <!-- Profile Wrapper (Desktop & Mobile) -->
      <div id="auth-profile-wrapper" style="display:none; align-items:center; position:relative;">
        <button id="auth-profile-btn" aria-label="Account menu" aria-haspopup="true" aria-expanded="false" style="width:36px; height:36px; border-radius:50%; background:var(--color-primary); border:2px solid rgba(168,85,247,0.4); cursor:pointer; display:flex; align-items:center; justify-content:center; font-size:0.875rem; font-weight:600; color:#fff; font-family:var(--font-sans);">
          <span id="auth-profile-initial">?</span>
        </button>
        <div id="auth-dropdown" role="menu" style="display:none; position:absolute; top:calc(100% + 10px); right:0; background:#1a1a1a; border:1px solid rgba(255,255,255,0.1); border-radius:12px; padding:0.375rem; min-width:200px; z-index:9999; box-shadow:0 8px 32px rgba(0,0,0,0.7);">
          <a id="auth-dropdown-admin" href="${b}pages/admin.html" role="menuitem" style="display:none;align-items:center;gap:0.6rem;padding:0.65rem 0.875rem;border-radius:8px;color:#c084fc;text-decoration:none;font-size:0.875rem;font-weight:600;" onmouseover="this.style.background='rgba(168,85,247,0.15)'" onmouseout="this.style.background='transparent'">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="flex-shrink:0"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>
            Admin Dashboard
          </a>
          <div id="auth-dropdown-divider" style="display:none; height:1px;background:rgba(255,255,255,0.07);margin:0.25rem 0.5rem;"></div>
          <button id="auth-logout-btn" role="menuitem" style="display:flex;align-items:center;gap:0.6rem;padding:0.65rem 0.875rem;border-radius:8px;color:#9ca3af;font-size:0.875rem;font-weight:500;background:transparent;border:none;cursor:pointer;width:100%;text-align:left;" onmouseover="this.style.background='rgba(239,68,68,0.1)';this.style.color='#f87171'" onmouseout="this.style.background='transparent';this.style.color='#9ca3af'">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="flex-shrink:0"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
            Log out
          </button>
        </div>
      </div>
      
      <!-- Desktop Book Call -->
      <a href="${b}pages/booking.html" class="btn btn-primary hide-on-mobile" style="padding: 0.5rem 1.25rem;">Book a Call</a>

      <!-- Mobile Menu Trigger -->
      <button class="mobile-nav-trigger" id="mobile-menu-trigger" aria-label="Open menu" aria-expanded="false">
        <span class="mobile-nav-trigger-lines"></span>
      </button>
    </div>
  </div>

  <!-- Mobile Dropdown Panel -->
  <div class="mobile-nav-panel" id="mobile-nav-panel">
    <div class="mobile-nav-panel-inner">
      <a href="${b}pages/solutions.html" class="mobile-nav-link">Solutions</a>
      <a href="${b}pages/pricing.html" class="mobile-nav-link">Pricing</a>
      <a href="${b}pages/booking.html" class="mobile-nav-link">Booking</a>
      <a href="${b}pages/howl.html" class="mobile-nav-link" style="color:var(--color-primary);font-weight:600">Howl</a>
      <div class="mobile-nav-divider"></div>
      <a href="${b}pages/login.html" class="mobile-nav-link auth-btn-login" style="color:var(--color-primary)">Log in</a>
    </div>
  </div>
</header>
`;

const getFooterHTML = (b) => `
<div style="overflow: hidden; line-height: 0; width: 100%; position: relative; z-index: 10; margin-bottom: -1px;">
  <div class="footer__wave" aria-hidden="true"></div>
</div>
<footer class="footer">
  <div class="footer__bg-animate" aria-hidden="true"></div>
  <div class="container footer__inner">
    <div class="footer__grid">
      <!-- Left/Center Main Content -->
      <div class="footer__main">
        <div class="footer__brand-wrapper">
          <img src="${b}assets/images/logo.png" alt="Aike Logo" class="footer__brand-logo" />
          <span class="footer__brand">aike</span>
        </div>
        
        <p class="footer__description">
          The smart automation setup that helps businesses ship production-ready operations in days, not months.
        </p>

        <nav class="footer__nav" aria-label="Footer navigation">
          <a href="${b}pages/solutions.html" class="footer__link">Solutions</a>
          <a href="${b}pages/pricing.html" class="footer__link">Pricing</a>
          <a href="${b}pages/booking.html" class="footer__link">Booking</a>
        </nav>
        
        <a href="https://discord.com" target="_blank" rel="noopener" class="footer__link" style="display: flex; align-items: center; gap: 8px; color: var(--color-primary); font-weight: 600;">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/></svg>
          Discord Community
        </a>

        <div class="footer__divider"></div>
        
        <div class="footer__bottom-text">
          &copy; 2026 aike. All rights reserved.
        </div>
      </div>
      
      <!-- Right Side Media Wrapper -->
      <div class="footer__media">
        <div class="footer__video-placeholder" aria-label="16:9 Video Placeholder">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
            <polygon points="5 3 19 12 5 21 5 3"></polygon>
          </svg>
          Video Placeholder (16:9)
        </div>
      </div>
    </div>
  </div>
</footer>
`;

function injectHTML(id, html) {
  var el = document.getElementById(id);
  if (!el) return;
  var tmp = document.createElement('div');
  tmp.innerHTML = html;
  el.replaceWith.apply(el, tmp.childNodes);
}

function initHeader() {
  const header = document.getElementById('aikeHeader');
  if (!header) return;

  window.addEventListener('scroll', function() {
    if (window.scrollY > 15) {
      header.classList.add('scrolled');
    } else {
      header.classList.remove('scrolled');
    }
  }, { passive: true });

  const trigger = document.getElementById('mobile-menu-trigger');
  const panel = document.getElementById('mobile-nav-panel');
  if (trigger && panel) {
    trigger.addEventListener('click', function() {
      const isExpanded = trigger.getAttribute('aria-expanded') === 'true';
      if (isExpanded) {
        trigger.setAttribute('aria-expanded', 'false');
        panel.classList.remove('open');
        header.classList.remove('mobile-nav-open');
        document.body.style.overflow = '';
      } else {
        trigger.setAttribute('aria-expanded', 'true');
        panel.classList.add('open');
        header.classList.add('mobile-nav-open');
        document.body.style.overflow = 'hidden';
      }
    });
  }
}

function initScrollReveal() {
  const elements = document.querySelectorAll('[data-reveal]');
  if (!elements.length) return;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('revealed');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1 });

  elements.forEach(el => {
    el.classList.add('reveal-pending');
    observer.observe(el);
  });
}

document.addEventListener('DOMContentLoaded', function() {
  const isPage = window.location.pathname.includes('/pages/');
  const b = isPage ? '../' : './';
  
  injectHTML('navbar-placeholder', getHeaderHTML(b));
  injectHTML('footer-placeholder', getFooterHTML(b));

  // Header is in DOM — tell auth.js to initialise now (no timing guesswork)
  if (window.aikeAuthInit) window.aikeAuthInit();

  initHeader();
  initScrollReveal();
  initInfiniteCarousel();
});

function initInfiniteCarousel() {
  const track = document.getElementById('aikeMotionCarousel');
  const dots = document.querySelectorAll('.motion-dot');
  if(!track || dots.length === 0) return;
  
  let isAnimating = false;
  let activeDotIndex = 0;

  function updateDots() {
    dots.forEach((dot, i) => {
      dot.classList.toggle('active', i === activeDotIndex);
    });
  }

  function moveNext() {
    if(isAnimating) return;
    isAnimating = true;
    const cardWidth = track.children[0].offsetWidth;
    const gap = parseFloat(getComputedStyle(track).gap) || 0;
    
    track.style.transition = 'transform 0.6s cubic-bezier(0.16, 1, 0.3, 1)';
    track.style.transform = `translateX(-${cardWidth + gap}px)`;
    
    activeDotIndex = (activeDotIndex + 1) % dots.length;
    updateDots();
    
    setTimeout(() => {
      track.style.transition = 'none';
      track.appendChild(track.children[0]);
      track.style.transform = 'translateX(0)';
      isAnimating = false;
    }, 600);
  }

  // Bind dots to navigate
  dots.forEach((dot, index) => {
    dot.addEventListener('click', () => {
      if(isAnimating || activeDotIndex === index) return;
      let steps = index - activeDotIndex;
      if (steps < 0) steps += dots.length;
      
      // Fast forward the loop state smoothly simulating distinct jumps
      for(let i = 0; i < steps; i++) {
        setTimeout(() => moveNext(), i * 650);
      }
    });
  });

  // Optional: Auto-play to keep the dots progressing mapping infinite SaaS behavior
  setInterval(() => {
    if(!document.hidden) moveNext();
  }, 4000);
}
