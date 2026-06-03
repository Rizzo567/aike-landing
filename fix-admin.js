const fs = require('fs');
let html = fs.readFileSync('pages/admin.html', 'utf8');

const scriptStart = html.indexOf('  <script>\r\n    function escHtml');
const altScriptStart = html.indexOf('  <script>\r\n    (async function');
const start = scriptStart !== -1 ? scriptStart : altScriptStart;
const end = html.indexOf('  </script>\r\n</body>') + '  </script>\r\n</body>'.length;

console.log('start:', start, 'end:', end);

const before = html.slice(0, start);
const after = html.slice(end); // should be empty or just whitespace

const newScript = `  <script>
    function escHtml(s) {
      return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
    }

    (async function () {
      'use strict';

      var sb = window.supabase.createClient(
        window.AIKE_CONFIG.supabase.url,
        window.AIKE_CONFIG.supabase.anonKey
      );

      // ── 1. Auth gate (server-verified round-trip) ────────────────
      var userResult = await sb.auth.getUser();
      var user = userResult.data && userResult.data.user ? userResult.data.user : null;

      if (!user) { window.location.href = 'login.html'; return; }

      var profileResult = await sb.from('users').select('is_admin, email').eq('id', user.id).maybeSingle();
      var profile = profileResult.data;

      if (!profile) {
        document.getElementById('admin-gate').innerHTML =
          '<div style="text-align:center;padding:2rem;color:#f87171;font-size:0.9rem;max-width:400px;line-height:1.6;">' +
          'Profilo utente mancante.<br><br>Esegui nel Supabase SQL Editor:<br>' +
          '<code style="background:#1a1a1a;padding:0.5rem;border-radius:6px;display:block;margin-top:0.75rem;color:#c084fc;font-size:0.8rem;">' +
          'INSERT INTO public.users (id, email, plan, is_admin)<br>' +
          'SELECT id, email, \\'free\\', true<br>FROM auth.users<br>WHERE email = \\'' + escHtml(user.email) + '\\';</code></div>';
        return;
      }

      if (!profile.is_admin) { window.location.href = '../index.html'; return; }

      // ── 2. Inject admin UI only after verified ───────────────────
      renderAdminApp(user);

    })();

    function renderAdminApp(u) {
      var email = u.email || '';
      var initial = email.charAt(0).toUpperCase();
      var today = new Date().toLocaleDateString('en-GB', { weekday:'long', year:'numeric', month:'long', day:'numeric' });

      var sb = window.supabase.createClient(
        window.AIKE_CONFIG.supabase.url,
        window.AIKE_CONFIG.supabase.anonKey
      );

      document.getElementById('admin-container').innerHTML =
        '<div class="admin-layout">' +
          '<aside class="admin-sidebar">' +
            '<a href="../index.html" class="admin-brand">' +
              '<img src="../assets/images/logo.png" alt="Aike"/>' +
              '<span>aike</span><span class="admin-tag">Admin</span>' +
            '</a>' +
            '<nav class="admin-nav">' +
              '<a class="admin-nav-item active" href="#"><span class="nav-icon">\u25c8</span> Overview</a>' +
              '<a class="admin-nav-item" href="../index.html"><span class="nav-icon">\u2197</span> View Site</a>' +
            '</nav>' +
            '<div class="admin-sidebar-footer">' +
              '<button class="admin-logout-btn" id="admin-logout-btn"><span>\u21a4</span> Log out</button>' +
            '</div>' +
          '</aside>' +
          '<main class="admin-main">' +
            '<div class="admin-header">' +
              '<div>' +
                '<div class="admin-header-title">Dashboard</div>' +
                '<div class="admin-header-sub">' + today + '</div>' +
              '</div>' +
              '<div class="admin-user-chip">' +
                '<div class="admin-avatar">' + escHtml(initial) + '</div>' +
                '<span>' + escHtml(email) + '</span>' +
              '</div>' +
            '</div>' +
            '<div class="stats-grid">' +
              '<div class="stat-card"><div class="stat-label">Total Users</div><div class="stat-value" id="stat-users">\u2014</div><div class="stat-sub">registered accounts</div></div>' +
              '<div class="stat-card"><div class="stat-label">Total Visits</div><div class="stat-value" id="stat-visits">\u2014</div><div class="stat-sub">all-time page views</div></div>' +
              '<div class="stat-card"><div class="stat-label">Active Now</div><div class="stat-value purple" id="stat-active">\u2014</div><div class="stat-sub">visits in last 5 min</div></div>' +
            '</div>' +
            '<div class="section-heading">All Users</div>' +
            '<div class="admin-table-wrap">' +
              '<div id="users-loading" class="admin-loading"><div class="admin-spinner"></div><div>Loading users\u2026</div></div>' +
              '<table class="admin-table" id="users-table" style="display:none;">' +
                '<thead><tr><th>Email</th><th>Plan</th><th>Joined</th></tr></thead>' +
                '<tbody id="users-tbody"></tbody>' +
              '</table>' +
            '</div>' +
          '</main>' +
        '</div>';

      document.getElementById('admin-gate').style.display = 'none';

      document.getElementById('admin-logout-btn').addEventListener('click', async function () {
        await sb.auth.signOut();
        window.location.href = 'login.html';
      });

      loadStats(sb);
      loadUsers(sb);
    }

    async function loadStats(sb) {
      var results = await Promise.all([
        sb.from('users').select('id', { count: 'exact', head: true }),
        sb.from('analytics').select('id', { count: 'exact', head: true }),
        sb.from('analytics').select('id', { count: 'exact', head: true }).gte('visited_at', new Date(Date.now() - 5 * 60 * 1000).toISOString())
      ]);
      var userEl = document.getElementById('stat-users');
      var visitEl = document.getElementById('stat-visits');
      var activeEl = document.getElementById('stat-active');
      if (userEl) userEl.textContent = results[0].count !== null ? results[0].count : '\u2014';
      if (visitEl) visitEl.textContent = results[1].count !== null ? Number(results[1].count).toLocaleString() : '\u2014';
      if (activeEl) activeEl.textContent = results[2].count !== null ? results[2].count : '\u2014';
    }

    async function loadUsers(sb) {
      var res = await sb.from('users').select('id, email, plan, created_at').order('created_at', { ascending: false });
      document.getElementById('users-loading').style.display = 'none';
      var table = document.getElementById('users-table');
      var tbody = document.getElementById('users-tbody');
      if (!res.data || res.data.length === 0) {
        tbody.innerHTML = '<tr><td colspan="3" style="text-align:center;color:var(--color-text-muted);padding:2rem;">No users yet.</td></tr>';
      } else {
        tbody.innerHTML = res.data.map(function (u) {
          var joined = new Date(u.created_at).toLocaleDateString('en-GB', { day:'2-digit', month:'short', year:'numeric' });
          var plan = u.plan || 'free';
          return '<tr><td class="email-cell">' + escHtml(u.email) + '</td><td><span class="plan-badge ' + escHtml(plan) + '">' + escHtml(plan) + '</span></td><td style="color:var(--color-text-muted);">' + joined + '</td></tr>';
        }).join('');
      }
      table.style.display = 'table';
    }
  </script>
</body>
</html>`;

const newHtml = before + newScript;
fs.writeFileSync('pages/admin.html', newHtml, 'utf8');
console.log('Done. New length:', newHtml.length);
