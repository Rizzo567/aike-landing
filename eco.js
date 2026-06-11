/* ════════════════════════════════════════════════════════════════
   Ecosystem section — GSAP + ScrollTrigger
   Transform layers (never overwrite each other):
     [data-depth] outer → scroll parallax (scrub)
     .eco-float  middle → idle floating loop (starts after entrance)
     .eco-inner  inner  → entrance + mouse parallax
   ════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  if (!window.gsap || !window.ScrollTrigger) return;
  gsap.registerPlugin(ScrollTrigger);

  var section = document.querySelector('.eco-section');
  if (!section) return;

  var REDUCED = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var ACCENT_DEPTH_ROT = ['.eco-rock--1', '.eco-rock--3', '.eco-rock--5']; // scrubbed rotation

  var words = gsap.utils.toArray('.eco-title__word', section);
  var items = gsap.utils.toArray('[data-depth]', section).filter(function (el) {
    return !el.classList.contains('eco-glow-frame');
  });
  var glow = section.querySelector('.eco-glow-frame');

  /* ── Reduced motion: fade-in only, no scrub / idle / mouse ── */
  if (REDUCED) {
    gsap.from([words, glow].concat(items), {
      opacity: 0,
      duration: 0.8,
      ease: 'power1.out',
      stagger: 0.04,
      scrollTrigger: { trigger: section, start: 'top 70%', once: true }
    });
    return;
  }

  /* ── Entrance (once, at 70% of the viewport) ── */
  var entranceDone = false;
  var entrance = gsap.timeline({
    scrollTrigger: { trigger: section, start: 'top 70%', once: true },
    onComplete: function () { entranceDone = true; startIdle(); }
  });

  entrance.from(words, {
    yPercent: 110,
    duration: 0.9,
    ease: 'power3.out',
    stagger: 0.07
  }, 0);

  entrance.from(glow, { opacity: 0, duration: 1.4, ease: 'power1.out' }, 0);

  entrance.from(items.map(function (el) { return el.querySelector('.eco-inner'); }), {
    opacity: 0,
    scale: 0.6,
    y: 80,
    duration: 1.2,
    ease: 'back.out(1.4)',
    stagger: 0.06
  }, 0.1);

  /* ── Idle float: desynchronised hovering, starts after entrance ── */
  var IDLE_SCALE = window.matchMedia('(max-width: 992px)').matches ? 0.5 : 1;
  function startIdle() {
    items.forEach(function (el) {
      var float = el.querySelector('.eco-float');
      if (!float) return;
      gsap.to(float, {
        y: '+=' + gsap.utils.random(8, 22) * IDLE_SCALE,
        rotation: '+=' + gsap.utils.random(1, 4) * (Math.random() < 0.5 ? -1 : 1) * IDLE_SCALE,
        duration: gsap.utils.random(3, 6),
        delay: gsap.utils.random(0, 1.5),
        yoyo: true,
        repeat: -1,
        ease: 'sine.inOut'
      });
    });
  }

  /* ── Desktop-only: scroll parallax + mouse parallax ── */
  var mm = gsap.matchMedia();
  mm.add('(min-width: 993px)', function () {

    /* Eclipse: scrubbed over the sticky pin (top top → bottom bottom) so
       its three states land exactly on start / middle / end of the pin:
       dome rising from the bottom → all black → bright arc at the bottom.
       linear, translateY only. */
    var eclipse = section.querySelector('.eco-eclipse');
    if (eclipse) {
      gsap.fromTo(eclipse,
        { yPercent: 0, scale: 1 },   /* CSS margins hold the start state */
        {
          yPercent: -49,
          scale: 0.965,    /* barely-there shrink: tucks the rim in at mid-scroll */
          transformOrigin: '50% 50%',
          ease: 'none',
          scrollTrigger: {
            trigger: section,
            start: 'top top',
            end: 'bottom bottom',
            scrub: 1
          }
        });
    }

    /* Scroll parallax: scrubbed Y proportional to depth, alternating signs */
    var tl = gsap.timeline({
      scrollTrigger: {
        trigger: section,
        start: 'top bottom',
        end: 'bottom top',
        scrub: 1
      }
    });

    items.forEach(function (el, i) {
      var depth = parseFloat(el.getAttribute('data-depth')) || 0.5;
      var amp = gsap.utils.mapRange(0.1, 1, 20, 120, depth);
      var sign = i % 2 === 0 ? 1 : -1;
      /* scroll down → cluster drifts UP (alternating signs kept as variation) */
      tl.fromTo(el, { y: -sign * amp }, { y: sign * amp, ease: 'none' }, 0);
    });
    if (glow) tl.fromTo(glow, { y: -14 }, { y: 14, ease: 'none' }, 0);

    ACCENT_DEPTH_ROT.forEach(function (sel, i) {
      var rock = section.querySelector(sel);
      if (!rock) return;
      var dir = i % 2 === 0 ? 1 : -1;
      tl.fromTo(rock, { rotation: dir * 6 }, { rotation: -dir * 6, ease: 'none' }, 0);
    });

    /* Mouse parallax: inertial tilt of the whole cluster */
    var movers = items.map(function (el) {
      var inner = el.querySelector('.eco-inner');
      var depth = parseFloat(el.getAttribute('data-depth')) || 0.5;
      return {
        depth: depth,
        toX: gsap.quickTo(inner, 'x', { duration: 1, ease: 'power3.out' }),
        toY: gsap.quickTo(inner, 'y', { duration: 1, ease: 'power3.out' })
      };
    });

    function onMove(e) {
      if (!entranceDone) return; // entrance owns .eco-inner transforms until it finishes
      var nx = (e.clientX / window.innerWidth) * 2 - 1;  // -1 .. 1
      var ny = (e.clientY / window.innerHeight) * 2 - 1;
      movers.forEach(function (m) {
        m.toX(nx * m.depth * 30);
        m.toY(ny * m.depth * 20);
      });
    }
    window.addEventListener('mousemove', onMove, { passive: true });

    return function () {
      window.removeEventListener('mousemove', onMove);
    };
  });
})();
