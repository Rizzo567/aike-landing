(function () {
  'use strict';

  // ── Spring physics ──────────────────────────────────────────
  function Spring(initial, k, c, m) {
    this.x = initial;
    this.v = 0;
    this.target = initial;
    this.k = k; this.c = c; this.m = m;
  }
  Spring.prototype.set = function (t) { this.target = t; };
  Spring.prototype.tick = function (dt) {
    var F = -this.k * (this.x - this.target) - this.c * this.v;
    this.v += (F / this.m) * dt;
    this.x += this.v * dt;
    return this.x;
  };

  // ── Config ─────────────────────────────────────────────────
  var N = 22;
  var Z_SPREAD = 42;
  var SIGMA = 2.8;
  var WK = 160, WC = 22, WM = 0.6;   // wave spring
  var SK = 80,  SC = 22, SM = 1;     // scene spring

  var IMGS = [
    'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&q=80',
    'https://images.unsplash.com/photo-1518020382113-a7e8fc38eac9?w=400&q=80',
    'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=400&q=80',
    'https://images.unsplash.com/photo-1501854140801-50d01698950b?w=400&q=80',
    'https://images.unsplash.com/photo-1682687220742-aba13b6e50ba?w=400&q=80',
    'https://images.unsplash.com/photo-1475924156734-496f6cac6ec1?w=400&q=80',
    'https://images.unsplash.com/photo-1518495973542-4542c06a5843?w=400&q=80',
    'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=400&q=80',
    'https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?w=400&q=80',
    'https://images.unsplash.com/photo-1510784722466-f2aa240c3c4a?w=400&q=80',
    'https://images.unsplash.com/photo-1682687220063-4742bd7fd538?w=400&q=80',
    'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=400&q=80',
    'https://images.unsplash.com/photo-1519681393784-d120267933ba?w=400&q=80',
    'https://images.unsplash.com/photo-1540390769625-2fc3f8b1d50c?w=400&q=80',
    'https://images.unsplash.com/photo-1486325212027-8081e485255e?w=400&q=80',
    'https://images.unsplash.com/photo-1472214103451-9374bd1c798e?w=400&q=80',
    'https://images.unsplash.com/photo-1433086966358-54859d0ed716?w=400&q=80',
    'https://images.unsplash.com/photo-1490682143684-14369e18dce8?w=400&q=80',
    'https://images.unsplash.com/photo-1501696461415-6bd6660c6742?w=400&q=80',
    'https://images.unsplash.com/photo-1445962125599-30f582ac21f4?w=400&q=80',
    'https://images.unsplash.com/photo-1455156218388-5e61b526818b?w=400&q=80',
    'https://images.unsplash.com/photo-1426604966848-d7adac402bff?w=400&q=80',
  ];

  var GRADS = [
    'linear-gradient(135deg,rgba(99,55,255,.55),rgba(236,72,153,.45))',
    'linear-gradient(135deg,rgba(6,182,212,.55),rgba(59,130,246,.45))',
    'linear-gradient(135deg,rgba(245,158,11,.55),rgba(239,68,68,.45))',
    'linear-gradient(135deg,rgba(16,185,129,.45),rgba(6,182,212,.55))',
    'linear-gradient(135deg,rgba(236,72,153,.55),rgba(245,158,11,.45))',
    'linear-gradient(135deg,rgba(59,130,246,.55),rgba(99,55,255,.45))',
    'linear-gradient(135deg,rgba(239,68,68,.45),rgba(236,72,153,.55))',
    'linear-gradient(135deg,rgba(6,182,212,.45),rgba(16,185,129,.55))',
    'linear-gradient(135deg,rgba(99,55,255,.45),rgba(6,182,212,.55))',
    'linear-gradient(135deg,rgba(245,158,11,.45),rgba(16,185,129,.55))',
    'linear-gradient(135deg,rgba(239,68,68,.55),rgba(245,158,11,.45))',
    'linear-gradient(135deg,rgba(99,55,255,.55),rgba(59,130,246,.45))',
    'linear-gradient(135deg,rgba(16,185,129,.55),rgba(99,55,255,.45))',
    'linear-gradient(135deg,rgba(236,72,153,.45),rgba(59,130,246,.55))',
    'linear-gradient(135deg,rgba(6,182,212,.55),rgba(245,158,11,.45))',
    'linear-gradient(135deg,rgba(59,130,246,.45),rgba(16,185,129,.55))',
    'linear-gradient(135deg,rgba(245,158,11,.55),rgba(99,55,255,.45))',
    'linear-gradient(135deg,rgba(239,68,68,.45),rgba(6,182,212,.55))',
    'linear-gradient(135deg,rgba(99,55,255,.45),rgba(236,72,153,.55))',
    'linear-gradient(135deg,rgba(16,185,129,.45),rgba(245,158,11,.55))',
    'linear-gradient(135deg,rgba(236,72,153,.55),rgba(239,68,68,.45))',
    'linear-gradient(135deg,rgba(59,130,246,.55),rgba(6,182,212,.45))',
  ];

  // ── Init ───────────────────────────────────────────────────
  function init() {
    var container = document.getElementById('stackedPanelsMount');
    if (!container) return;

    // Springs
    var rotY = new Spring(-42, SK, SC, SM);
    var rotX = new Spring(18,  SK, SC, SM);
    var waveY = [], scaleY = [];
    for (var i = 0; i < N; i++) {
      waveY.push(new Spring(0, WK, WC, WM));
      scaleY.push(new Spring(1, WK, WC, WM));
    }

    // Scene
    var scene = document.createElement('div');
    scene.style.cssText = 'position:absolute;top:50%;left:50%;width:0;height:0;transform-style:preserve-3d;';
    container.appendChild(scene);

    // Panel elements
    var panels = [];
    for (var j = 0; j < N; j++) {
      var t      = j / (N - 1);
      var baseZ  = (j - (N - 1)) * Z_SPREAD;
      var w      = 200 + t * 80;
      var h      = 280 + t * 120;
      var op     = (0.25 + t * 0.75).toFixed(3);
      var bOp    = (0.08 + t * 0.22).toFixed(3);

      var el = document.createElement('div');
      el.style.cssText = [
        'position:absolute',
        'width:' + w + 'px',
        'height:' + h + 'px',
        'margin-left:' + (-w / 2) + 'px',
        'margin-top:' + (-h / 2) + 'px',
        'border-radius:12px',
        'overflow:hidden',
        'pointer-events:none',
        'opacity:' + op,
        'transform-origin:bottom center',
        'will-change:transform',
      ].join(';');
      el.dataset.bz = baseZ;

      var bg = document.createElement('div');
      bg.style.cssText = 'position:absolute;inset:0;background:url(' + IMGS[j % IMGS.length] + ') center/cover;';

      var ov = document.createElement('div');
      ov.style.cssText = 'position:absolute;inset:0;background:' + GRADS[j % GRADS.length] + ';mix-blend-mode:multiply;';

      var vg = document.createElement('div');
      vg.style.cssText = 'position:absolute;inset:0;background:linear-gradient(to bottom,rgba(0,0,0,.08),rgba(0,0,0,.32));';

      var bd = document.createElement('div');
      bd.style.cssText = 'position:absolute;inset:0;border-radius:inherit;border:1px solid rgba(255,255,255,' + bOp + ');box-sizing:border-box;';

      el.appendChild(bg); el.appendChild(ov); el.appendChild(vg); el.appendChild(bd);
      scene.appendChild(el);
      panels.push(el);
    }

    // ── Events ────────────────────────────────────────────────
    container.addEventListener('mousemove', function (e) {
      var rect = container.getBoundingClientRect();
      var cx = (e.clientX - rect.left) / rect.width;
      var cy = (e.clientY - rect.top)  / rect.height;

      rotY.set(-42 + (cx - 0.5) * 14);
      rotX.set(18  + (cy - 0.5) * -10);

      var pos = cx * (N - 1);
      for (var i = 0; i < N; i++) {
        var d   = Math.abs(i - pos);
        var inf = Math.exp(-(d * d) / (2 * SIGMA * SIGMA));
        waveY[i].set(-inf * 70);
        scaleY[i].set(0.35 + inf * 0.65);
      }
    });

    container.addEventListener('mouseleave', function () {
      rotY.set(-42); rotX.set(18);
      for (var i = 0; i < N; i++) { waveY[i].set(0); scaleY[i].set(1); }
    });

    // ── RAF loop ──────────────────────────────────────────────
    var last = null;
    function frame(now) {
      if (!last) last = now;
      var dt = Math.min((now - last) / 1000, 0.05);
      last = now;

      scene.style.transform =
        'rotateY(' + rotY.tick(dt) + 'deg) rotateX(' + rotX.tick(dt) + 'deg)';

      for (var i = 0; i < N; i++) {
        panels[i].style.transform =
          'translateZ(' + panels[i].dataset.bz + 'px)' +
          ' translateY(' + waveY[i].tick(dt) + 'px)' +
          ' scaleY(' + scaleY[i].tick(dt) + ')';
      }

      requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
