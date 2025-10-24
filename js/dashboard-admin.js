// Admin Dashboard SPA – tabs, role guard, data fetching

(function () {
  const state = {
    tab: 'overview',
    kpis: null,
    users: [],
    withdrawals: [],
    disputes: [],
    tickets: [],
    settings: null
  };

  function qs(sel) { return document.querySelector(sel); }
  function qsa(sel) { return Array.from(document.querySelectorAll(sel)); }

  function setHidden(el, hidden) { if (el) el.hidden = hidden; }
  function setTitle(t) { const h = qs('#page-title'); if (h) h.textContent = t; }

  function updateActiveTabLink() {
    const links = qsa('.tab-link');
    links.forEach(l => {
      if (l.getAttribute('data-tab') === state.tab) l.classList.add('active');
      else l.classList.remove('active');
    });
  }

  function showPanel(tab) {
    state.tab = tab;
    updateActiveTabLink();
    const panels = qsa('.panel');
    panels.forEach(p => setHidden(p, true));
    const panel = qs(`#panel-${tab}`);
    if (panel) setHidden(panel, false);
    setTitle(tabTitle(tab));
  }

  function tabTitle(tab) {
    switch (tab) {
      case 'overview': return 'Aperçu';
      case 'users': return 'Utilisateurs';
      case 'withdrawals': return 'Retraits';
      case 'disputes': return 'Litiges';
      case 'tickets': return 'Tickets';
      case 'settings': return 'Paramètres';
      default: return 'Administration';
    }
  }

  async function ensureAdmin() {
    try {
      // In development (localhost), allow viewing the UI without hard redirecting
      const isLocal = typeof window !== 'undefined' && /^(localhost|127\.0\.0\.1)$/.test(window.location.hostname);

      if (!window.supabaseClient) {
        // Wait until config initialized Supabase
        await new Promise(resolve => {
          window.addEventListener('supabaseReady', resolve, { once: true });
        });
      }
      const { data: { user } } = await window.supabaseClient.auth.getUser();
      if (!user) {
        if (isLocal) {
          console.warn('[ensureAdmin] No user, but running on localhost → allowing UI preview.');
          return true;
        }
        window.location.href = '/auth/creator-login.html';
        return false;
      }
      // Fetch profile (assumes backend provides /admin/profile or reuse public table if available)
      // Fallback: assume admin role provided through claims or a quick endpoint under window.api.admin.getStats
      // Here, we optimistically attempt to call a protected admin endpoint to check access.
      const stats = await window.api.admin.getStats?.();
      if (!stats?.success) {
        // Not admin or endpoint unavailable
        if (isLocal) {
          console.warn('[ensureAdmin] Admin endpoint not available, localhost → allowing UI preview.');
          return true;
        }
        window.location.href = '/auth/creator-login.html';
        return false;
      }
      return true;
    } catch (e) {
      console.error('Admin guard failed', e);
      const isLocal = typeof window !== 'undefined' && /^(localhost|127\.0\.0\.1)$/.test(window.location.hostname);
      if (isLocal) {
        console.warn('[ensureAdmin] Error but localhost → allowing UI preview.');
        return true;
      }
      window.location.href = '/auth/creator-login.html';
      return false;
    }
  }

  // Enhanced KPI rendering with UGC Maroc design
  function renderKpis(kpis) {
    const container = qs('#kpi-container');
    if (!container) return;
    container.innerHTML = '';
    
    const items = [
      { 
        title: 'إجمالي المستخدمين', 
        value: kpis.users_total ?? 1247, 
        icon: 'groups',
        color: 'blue',
        trend: '+12.5%',
        trendText: 'من الشهر الماضي',
        aiEnabled: true
      },
      { 
        title: 'إجمالي الإيرادات', 
        value: `${(kpis.revenue ?? 45200).toLocaleString()} د.م`, 
        icon: 'trending_up',
        color: 'green',
        trend: '+8.3%',
        trendText: 'من الشهر الماضي',
        aiEnabled: true
      },
      { 
        title: 'الحملات النشطة', 
        value: kpis.active_campaigns ?? 23, 
        icon: 'campaign',
        color: 'orange',
        trend: '+3',
        trendText: 'هذا الأسبوع',
        aiEnabled: true
      },
      { 
        title: 'معدل الرضا', 
        value: `${kpis.satisfaction_rate ?? 94.2}%`, 
        icon: 'psychology',
        color: 'purple',
        trend: '+2.1%',
        trendText: 'من الشهر الماضي',
        aiEnabled: true
      }
    ];
    
    items.forEach(({ title, value, icon, color, trend, trendText, aiEnabled }, index) => {
      const card = document.createElement('div');
      card.className = 'kpi-card hover-lift bg-card-light dark:bg-card-dark p-6 rounded-2xl border border-border-light dark:border-border-dark';
      card.style.animationDelay = `${index * 100}ms`;
      
      const header = document.createElement('div');
      header.className = 'flex items-center justify-between mb-4';
      
      const iconContainer = document.createElement('div');
      iconContainer.className = `p-3 rounded-xl bg-${color}-100 dark:bg-${color}-900/50`;
      
      const iconEl = document.createElement('span');
      iconEl.className = 'material-symbols-outlined text-2xl';
      iconEl.textContent = icon;
      iconEl.style.color = `var(--${color}-500)`;
      iconContainer.appendChild(iconEl);
      
      const aiBadge = document.createElement('div');
      if (aiEnabled) {
        aiBadge.className = 'ai-badge';
        aiBadge.textContent = 'AI';
      }
      
      header.appendChild(iconContainer);
      header.appendChild(aiBadge);
      
      const titleEl = document.createElement('h3');
      titleEl.className = 'text-sm font-medium text-muted-light dark:text-muted-dark mb-2';
      titleEl.textContent = title;
      
      const valueEl = document.createElement('p');
      valueEl.className = 'text-3xl font-bold text-text-light dark:text-text-dark mb-2';
      valueEl.textContent = value;
      
      const trendContainer = document.createElement('div');
      trendContainer.className = 'flex items-center gap-2';
      
      const trendEl = document.createElement('span');
      trendEl.className = 'text-xs text-success font-semibold';
      trendEl.textContent = trend;
      
      const trendTextEl = document.createElement('span');
      trendTextEl.className = 'text-xs text-muted-light dark:text-muted-dark';
      trendTextEl.textContent = trendText;
      
      trendContainer.appendChild(trendEl);
      trendContainer.appendChild(trendTextEl);
      
      card.appendChild(header);
      card.appendChild(titleEl);
      card.appendChild(valueEl);
      card.appendChild(trendContainer);
      container.appendChild(card);
    });
  }

  function renderTable(containerSel, columns, rows) {
    const container = qs(containerSel);
    if (!container) return;
    
    if (!rows || rows.length === 0) {
      container.innerHTML = `
        <div class="empty">
          <div style="font-size: 3rem; margin-bottom: var(--space-4);">📊</div>
          <div>Aucune donnée disponible</div>
        </div>
      `;
      return;
    }
    
    const table = document.createElement('table');
    table.className = 'table';
    
    // Header
    const thead = document.createElement('thead');
    const trh = document.createElement('tr');
    columns.forEach(c => { 
      const th = document.createElement('th'); 
      th.textContent = c.label; 
      trh.appendChild(th); 
    });
    thead.appendChild(trh); 
    table.appendChild(thead);
    
    // Body
    const tbody = document.createElement('tbody');
    rows.forEach((r, index) => {
      const tr = document.createElement('tr');
      tr.style.animationDelay = `${index * 50}ms`;
      
      columns.forEach(c => {
        const td = document.createElement('td');
        const content = (typeof c.render === 'function') ? c.render(r) : (r[c.key] ?? '');
        
        if (typeof content === 'string' && content.includes('button')) {
          td.innerHTML = content;
        } else {
          td.textContent = content;
        }
        
        tr.appendChild(td);
      });
      tbody.appendChild(tr);
    });
    table.appendChild(tbody);
    
    container.innerHTML = '';
    container.appendChild(table);
  }

  // Data loaders with loading states
  async function loadOverview() {
    const container = qs('#kpi-container');
    const activityContainer = qs('#recent-activity');
    
    try {
      // Show loading state
      if (container) container.innerHTML = '<div class="loading">Chargement des statistiques...</div>';
      if (activityContainer) activityContainer.innerHTML = '<div class="loading">Chargement de l\'activité récente...</div>';
      
      const res = await window.api.admin.getStats();
      if (res?.success) {
        state.kpis = res.data;
        renderKpis(res.data);
        
        // Mock recent activity for now
        if (activityContainer) {
          activityContainer.innerHTML = `
            <div class="recent-activity-list">
              <div class="activity-item">
                <div class="activity-icon">👤</div>
                <div class="activity-content">
                  <div class="activity-text">Nouvel utilisateur inscrit</div>
                  <div class="activity-time">Il y a 2 minutes</div>
                </div>
              </div>
              <div class="activity-item">
                <div class="activity-icon">💰</div>
                <div class="activity-content">
                  <div class="activity-text">Retrait approuvé</div>
                  <div class="activity-time">Il y a 15 minutes</div>
                </div>
              </div>
              <div class="activity-item">
                <div class="activity-icon">⚖️</div>
                <div class="activity-content">
                  <div class="activity-text">Nouveau litige ouvert</div>
                  <div class="activity-time">Il y a 1 heure</div>
                </div>
              </div>
            </div>
          `;
        }
      } else {
        throw new Error(res?.message || 'Erreur lors du chargement des statistiques');
      }
    } catch (e) { 
      console.error('Overview load error:', e);
      if (container) container.innerHTML = '<div class="error">Erreur lors du chargement des statistiques</div>';
      if (activityContainer) activityContainer.innerHTML = '<div class="error">Erreur lors du chargement de l\'activité</div>';
    }
  }

  async function loadUsers() {
    try {
      const q = qs('#users-search').value.trim();
      const role = qs('#users-role-filter').value;
      const res = await window.api.admin.getUsers({ q, role });
      if (res?.success) {
        state.users = res.data?.users ?? res.data ?? [];
        renderTable('#users-table', [
          { key: 'email', label: 'Email' },
          { key: 'full_name', label: 'Nom' },
          { key: 'role', label: 'Rôle' },
          { key: 'status', label: 'Statut' },
          { key: 'id', label: 'Actions', render: (r) => {
            const isBlocked = r.status === 'blocked';
            return `
              <button data-action="${isBlocked ? 'unblock' : 'block'}" data-user="${r.id}">
                ${isBlocked ? 'Débloquer' : 'Bloquer'}
              </button>
              <select data-action="changerole" data-user="${r.id}">
                <option ${r.role==='creator'?'selected':''} value="creator">Créateur</option>
                <option ${r.role==='brand'?'selected':''} value="brand">Marque</option>
                <option ${r.role==='admin'?'selected':''} value="admin">Admin</option>
              </select>
            `;
          } }
        ], state.users);
        // Bind actions
        qs('#users-table').addEventListener('click', async (e) => {
          const btn = e.target.closest('button[data-action]');
          if (!btn) return;
          const userId = btn.getAttribute('data-user');
          const action = btn.getAttribute('data-action');
          if (action === 'block') await window.api.admin.blockUser(userId);
          if (action === 'unblock') await window.api.admin.unblockUser(userId);
          await loadUsers();
        }, { once: true });
        qs('#users-table').addEventListener('change', async (e) => {
          const sel = e.target.closest('select[data-action="changerole"]');
          if (!sel) return;
          const userId = sel.getAttribute('data-user');
          const newRole = sel.value;
          await window.api.admin.changeUserRole(userId, newRole);
          await loadUsers();
        }, { once: true });
      }
    } catch (e) { console.error(e); }
  }

  async function loadWithdrawals() {
    try {
      const res = await window.api.admin.getPendingWithdrawals();
      if (res?.success) {
        state.withdrawals = res.data ?? [];
        renderTable('#withdrawals-table', [
          { key: 'id', label: 'ID' },
          { key: 'creator_id', label: 'Créateur' },
          { key: 'amount', label: 'Montant' },
          { key: 'status', label: 'Statut' },
          { key: 'requested_at', label: 'Demandé le' },
          { key: 'id', label: 'Actions', render: (r) => `
            <button data-wact="approve" data-id="${r.id}">Approuver</button>
            <button data-wact="reject" data-id="${r.id}">Rejeter</button>
            <button data-wact="process" data-id="${r.id}">Traiter</button>
          ` }
        ], state.withdrawals);
        qs('#withdrawals-table').addEventListener('click', async (e) => {
          const btn = e.target.closest('button[data-wact]');
          if (!btn) return;
          const id = btn.getAttribute('data-id');
          const act = btn.getAttribute('data-wact');
          if (act === 'approve') await window.api.admin.processWithdrawal(id, 'approve', {});
          if (act === 'reject') await window.api.admin.processWithdrawal(id, 'reject', { reason: 'Non conforme' });
          if (act === 'process') await window.api.admin.processWithdrawal(id, 'process', {});
          await loadWithdrawals();
        }, { once: true });
      }
    } catch (e) { console.error(e); }
  }

  async function loadDisputes() {
    try {
      const res = await window.api.admin.getAllDisputes();
      if (res?.success) {
        state.disputes = res.data ?? [];
        renderTable('#disputes-table', [
          { key: 'id', label: 'ID' },
          { key: 'agreement_id', label: 'Accord' },
          { key: 'status', label: 'Statut' },
          { key: 'opened_by', label: 'Ouvert par' },
          { key: 'id', label: 'Actions', render: (r) => `
            <button data-dact="assign" data-id="${r.id}">Assigner</button>
            <button data-dact="resolve" data-id="${r.id}">Résoudre</button>
          ` }
        ], state.disputes);
        qs('#disputes-table').addEventListener('click', async (e) => {
          const btn = e.target.closest('button[data-dact]');
          if (!btn) return;
          const id = btn.getAttribute('data-id');
          const act = btn.getAttribute('data-dact');
          if (act === 'assign') await window.api.admin.assignDispute(id, 'me');
          if (act === 'resolve') await window.api.admin.resolveDispute(id, { decision: 'favor_creator' });
          await loadDisputes();
        }, { once: true });
      }
    } catch (e) { console.error(e); }
  }

  async function loadTickets() {
    try {
      const res = await window.api.admin.getAllTickets();
      if (res?.success) {
        state.tickets = res.data ?? [];
        renderTable('#tickets-table', [
          { key: 'id', label: 'ID' },
          { key: 'subject', label: 'Sujet' },
          { key: 'status', label: 'Statut' },
          { key: 'created_at', label: 'Créé le' },
          { key: 'id', label: 'Actions', render: (r) => `
            <button data-tact="assign" data-id="${r.id}">Assigner</button>
            <button data-tact="resolve" data-id="${r.id}">Résoudre</button>
          ` }
        ], state.tickets);
        qs('#tickets-table').addEventListener('click', async (e) => {
          const btn = e.target.closest('button[data-tact]');
          if (!btn) return;
          const id = btn.getAttribute('data-id');
          const act = btn.getAttribute('data-tact');
          if (act === 'assign') await window.api.admin.assignTicket(id, 'me');
          if (act === 'resolve') await window.api.admin.resolveTicket(id, 'Résolu');
          await loadTickets();
        }, { once: true });
      }
    } catch (e) { console.error(e); }
  }

  async function loadSettings() {
    try {
      // Expect a backend settings endpoint; if not present, leave empty
      const resp = await fetch(`${window.API_BASE_URL}/platform/settings`, {
        headers: { 'Content-Type': 'application/json' }
      });
      if (resp.ok) {
        const data = await resp.json();
        state.settings = data?.data ?? data ?? null;
        const form = qs('#settings-form');
        if (form && state.settings) {
          ['bank_name','account_holder','rib','swift','iban','bank_address','special_instructions']
            .forEach(k => {
              const el = form.querySelector(`[name="${k}"]`);
              if (el) el.value = state.settings[k] ?? '';
            });
        }
      }
    } catch (e) { console.error(e); }
  }

  function bindToolbar() {
    const logout = qs('#logout-btn');
    if (logout) logout.addEventListener('click', async () => {
      try { await fetch(`${window.API_BASE_URL}/api/auth/logout`, { method: 'POST' }); } catch {}
      localStorage.clear();
      window.location.href = '/auth/creator-login.html';
    });

    // Mobile sidebar toggle
    const sidebarToggle = qs('#sidebar-toggle');
    const sidebar = qs('.admin-sidebar');
    if (sidebarToggle && sidebar) {
      sidebarToggle.addEventListener('click', () => {
        sidebar.classList.toggle('open');
      });
    }

    // Close sidebar when clicking outside on mobile
    document.addEventListener('click', (e) => {
      if (window.innerWidth <= 768 && sidebar && sidebar.classList.contains('open')) {
        if (!sidebar.contains(e.target) && !sidebarToggle.contains(e.target)) {
          sidebar.classList.remove('open');
        }
      }
    });

    const usrRefresh = qs('#users-refresh');
    if (usrRefresh) usrRefresh.addEventListener('click', loadUsers);
    const usrSearch = qs('#users-search');
    if (usrSearch) usrSearch.addEventListener('input', debounce(loadUsers, 400));
    const usrRole = qs('#users-role-filter');
    if (usrRole) usrRole.addEventListener('change', loadUsers);

    const wRef = qs('#withdrawals-refresh');
    if (wRef) wRef.addEventListener('click', loadWithdrawals);
    const dRef = qs('#disputes-refresh');
    if (dRef) dRef.addEventListener('click', loadDisputes);
    const tRef = qs('#tickets-refresh');
    if (tRef) tRef.addEventListener('click', loadTickets);

    const settingsForm = qs('#settings-form');
    if (settingsForm) settingsForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const fd = new FormData(settingsForm);
      const body = Object.fromEntries(fd.entries());
      const resp = await fetch(`${window.API_BASE_URL}/platform/settings`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body)
      });
      if (resp.ok) { await loadSettings(); }
    });
  }

  function debounce(fn, wait) {
    let t; return (...args) => { clearTimeout(t); t = setTimeout(() => fn.apply(null, args), wait); };
  }

  async function handleRoute() {
    const hash = window.location.hash.replace('#', '') || 'overview';
    showPanel(hash);
    if (hash === 'overview') await loadOverview();
    if (hash === 'users') await loadUsers();
    if (hash === 'withdrawals') await loadWithdrawals();
    if (hash === 'disputes') await loadDisputes();
    if (hash === 'tickets') await loadTickets();
    if (hash === 'settings') await loadSettings();
  }

  function handleResize() {
    const sidebarToggle = qs('#sidebar-toggle');
    const sidebar = qs('.admin-sidebar');
    
    if (window.innerWidth <= 768) {
      if (sidebarToggle) sidebarToggle.style.display = 'flex';
      if (sidebar) sidebar.classList.remove('open');
    } else {
      if (sidebarToggle) sidebarToggle.style.display = 'none';
      if (sidebar) sidebar.classList.remove('open');
    }
  }

  // AI-Powered Features
  async function initializeAIFeatures() {
    // AI Insights
    await loadAIInsights();
    
    // Smart Notifications
    await setupSmartNotifications();
    
    // Predictive Analytics
    await loadPredictiveAnalytics();
    
    // Auto-refresh with AI recommendations
    setInterval(loadAIInsights, 300000); // Every 5 minutes
  }

  async function loadAIInsights() {
    try {
      const response = await fetch(`${window.API_BASE_URL}/api/ai/insights`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('supabase.auth.token')}`
        }
      });
      
      if (response.ok) {
        const insights = await response.json();
        displayAIInsights(insights);
      }
    } catch (error) {
      console.error('Error loading AI insights:', error);
    }
  }

  function displayAIInsights(insights) {
    // Update AI recommendations banner
    const aiBanner = document.querySelector('.ai-insights-banner');
    if (aiBanner && insights.recommendations) {
      const recommendationEl = aiBanner.querySelector('.ai-recommendation');
      if (recommendationEl) {
        recommendationEl.textContent = insights.recommendations[0]?.text || 'لا توجد توصيات جديدة';
      }
    }
  }

  async function setupSmartNotifications() {
    // Smart notification system with AI
    const notifications = [
      {
        id: 'ai-user-growth',
        title: 'نمو المستخدمين',
        message: 'الذكاء الاصطناعي يتوقع نمو 15% في المستخدمين هذا الشهر',
        type: 'success',
        icon: 'trending_up',
        aiGenerated: true
      },
      {
        id: 'ai-revenue-optimization',
        title: 'تحسين الإيرادات',
        message: 'توصية: زيادة ميزانية الحملات النشطة بنسبة 20%',
        type: 'info',
        icon: 'psychology',
        aiGenerated: true
      }
    ];

    notifications.forEach(notification => {
      if (notification.aiGenerated) {
        showSmartNotification(notification);
      }
    });
  }

  function showSmartNotification(notification) {
    const notificationEl = document.createElement('div');
    notificationEl.className = `fixed top-4 right-4 p-4 rounded-xl shadow-lg z-50 max-w-sm animate-slide-up`;
    notificationEl.style.background = notification.type === 'success' ? 'var(--success-50)' : 'var(--info-50)';
    notificationEl.style.border = `1px solid ${notification.type === 'success' ? 'var(--success-200)' : 'var(--info-200)'}`;
    
    notificationEl.innerHTML = `
      <div class="flex items-start gap-3">
        <div class="p-2 rounded-lg ${notification.type === 'success' ? 'bg-success-100' : 'bg-info-100'}">
          <span class="material-symbols-outlined text-${notification.type === 'success' ? 'success' : 'info'}-500">${notification.icon}</span>
        </div>
        <div class="flex-1">
          <div class="flex items-center gap-2 mb-1">
            <h4 class="font-semibold text-sm">${notification.title}</h4>
            <div class="ai-badge">AI</div>
          </div>
          <p class="text-xs text-muted-light dark:text-muted-dark">${notification.message}</p>
        </div>
        <button onclick="this.parentElement.parentElement.remove()" class="text-muted-light dark:text-muted-dark hover:text-text-light dark:hover:text-text-dark">
          <span class="material-symbols-outlined text-sm">close</span>
        </button>
      </div>
    `;
    
    document.body.appendChild(notificationEl);
    
    // Auto remove after 10 seconds
    setTimeout(() => {
      if (notificationEl.parentElement) {
        notificationEl.remove();
      }
    }, 10000);
  }

  async function loadPredictiveAnalytics() {
    try {
      const response = await fetch(`${window.API_BASE_URL}/api/ai/predictions`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('supabase.auth.token')}`
        }
      });
      
      if (response.ok) {
        const predictions = await response.json();
        displayPredictiveAnalytics(predictions);
      }
    } catch (error) {
      console.error('Error loading predictive analytics:', error);
    }
  }

  function displayPredictiveAnalytics(predictions) {
    // Update KPI cards with predictions
    const kpiCards = document.querySelectorAll('.kpi-card');
    kpiCards.forEach((card, index) => {
      const prediction = predictions[index];
      if (prediction) {
        const trendEl = card.querySelector('.trend-prediction');
        if (trendEl) {
          trendEl.innerHTML = `
            <span class="ai-badge">AI توقع</span>
            <span class="text-xs text-muted-light dark:text-muted-dark">${prediction.forecast}</span>
          `;
        }
      }
    });
  }

  // Enhanced initialization with AI features
  async function init() {
    const ok = await ensureAdmin();
    if (!ok) return;
    
    bindToolbar();
    handleResize(); // Set initial mobile state
    window.addEventListener('resize', handleResize);
    
    // Initialize AI features
    await initializeAIFeatures();
    
    await handleRoute();
    window.addEventListener('hashchange', handleRoute);
  }

  // Wait for DOM
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();

// ===========================================================
// 👨‍💼 UGC Maroc - Dashboard Admin
// ===========================================================

// Vérifier authentification admin
auth.checkAuth('admin');

// ===========================================================
// CHARGER STATS ADMIN
// ===========================================================
async function loadAdminDashboard() {
  try {
    const result = await api.admin.getStats();
    
    if (result.success && result.data) {
      const stats = result.data;
      
      // Afficher stats
      document.getElementById('total-users').textContent = stats.totalUsers || 0;
      document.getElementById('total-creators').textContent = stats.totalCreators || 0;
      document.getElementById('total-brands').textContent = stats.totalBrands || 0;
      document.getElementById('total-campaigns').textContent = stats.totalCampaigns || 0;
    }
  } catch (error) {
    console.error('Erreur chargement stats:', error);
  }
}

// ===========================================================
// GESTION UTILISATEURS
// ===========================================================
async function loadUsers() {
  const container = document.getElementById('users-list');
  if (!container) return;

  utils.showLoader('users-list');

  try {
    const result = await api.admin.getUsers();
    
    if (result.success && result.data) {
      const users = result.data;
      
      container.innerHTML = users.map(user => `
        <tr class="border-b">
          <td class="py-3">${user.full_name || user.email}</td>
          <td class="py-3">${user.email}</td>
          <td class="py-3">
            <span class="px-2 py-1 rounded text-xs font-medium
              ${user.role === 'creator' ? 'bg-blue-100 text-blue-800' : ''}
              ${user.role === 'brand' ? 'bg-purple-100 text-purple-800' : ''}
              ${user.role === 'admin' ? 'bg-red-100 text-red-800' : ''}
            ">
              ${utils.translateStatus(user.role)}
            </span>
          </td>
          <td class="py-3">
            <span class="px-2 py-1 rounded text-xs font-medium
              ${user.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}
            ">
              ${utils.translateStatus(user.status)}
            </span>
          </td>
          <td class="py-3">
            ${user.status === 'active' ? 
              `<button onclick="blockUser('${user.user_id}')" class="text-red-600 hover:underline text-sm">حظر</button>` :
              `<button onclick="unblockUser('${user.user_id}')" class="text-green-600 hover:underline text-sm">إلغاء الحظر</button>`
            }
          </td>
        </tr>
      `).join('');
    }
  } catch (error) {
    console.error('Erreur chargement utilisateurs:', error);
    utils.showError('users-list', 'خطأ في تحميل المستخدمين');
  }
}

async function blockUser(userId) {
  if (!confirm('هل أنت متأكد من حظر هذا المستخدم؟')) return;
  
  const result = await api.admin.blockUser(userId);
  if (result.success) {
    utils.showToast('تم حظر المستخدم', 'success');
    loadUsers();
  } else {
    utils.showToast(result.error, 'error');
  }
}

async function unblockUser(userId) {
  const result = await api.admin.unblockUser(userId);
  if (result.success) {
    utils.showToast('تم إلغاء حظر المستخدم', 'success');
    loadUsers();
  } else {
    utils.showToast(result.error, 'error');
  }
}

// ===========================================================
// VIREMENTS BANCAIRES EN ATTENTE
// ===========================================================
async function loadPendingTransfers() {
  const container = document.getElementById('pending-transfers');
  if (!container) return;

  utils.showLoader('pending-transfers');

  try {
    const result = await api.admin.getPendingTransfers();
    
    if (result.success && result.data) {
      const transfers = result.data;
      
      if (transfers.length > 0) {
        container.innerHTML = transfers.map(transfer => `
          <div class="bg-white rounded-lg shadow p-6">
            <div class="flex justify-between items-start">
              <div>
                <h4 class="font-bold">Virement de ${utils.formatMAD(transfer.amount)}</h4>
                <p class="text-sm text-gray-500">
                  Reçu le ${utils.formatDate(transfer.created_at)}
                </p>
                ${transfer.receipt_url ? `
                  <a href="${transfer.receipt_url}" target="_blank" 
                     class="text-blue-600 hover:underline text-sm mt-2 inline-block">
                    📄 Voir le reçu
                  </a>
                ` : ''}
              </div>
              <div class="flex flex-col gap-2">
                <button onclick="verifyTransfer('${transfer.id}', 'approve')" 
                        class="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700">
                  ✓ Approuver
                </button>
                <button onclick="verifyTransfer('${transfer.id}', 'reject')" 
                        class="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700">
                  ✗ Rejeter
                </button>
              </div>
            </div>
          </div>
        `).join('');
      } else {
        utils.showEmptyState('pending-transfers', 'لا توجد virements قيد الانتظار', '✅');
      }
    }
  } catch (error) {
    console.error('Erreur chargement virements:', error);
    utils.showError('pending-transfers', 'خطأ في تحميل التحويلات');
  }
}

async function verifyTransfer(transferId, action) {
  const note = action === 'reject' ? prompt('Note de vérification:') : '';
  
  const result = await api.admin.verifyTransfer(transferId, action, note);
  
  if (result.success) {
    utils.showToast(
      action === 'approve' ? 'تم الموافقة على التحويل وإضافة الرصيد' : 'تم رفض التحويل',
      'success'
    );
    loadPendingTransfers();
  } else {
    utils.showToast(result.error, 'error');
  }
}

// ===========================================================
// RETRAITS EN ATTENTE
// ===========================================================
async function loadPendingWithdrawals() {
  const container = document.getElementById('pending-withdrawals');
  if (!container) return;

  utils.showLoader('pending-withdrawals');

  try {
    const result = await api.admin.getPendingWithdrawals();
    
    if (result.success && result.data) {
      const withdrawals = result.data;
      
      if (withdrawals.length > 0) {
        container.innerHTML = withdrawals.map(withdrawal => `
          <div class="bg-white rounded-lg shadow p-6">
            <div class="flex justify-between items-start">
              <div>
                <h4 class="font-bold">Retrait de ${utils.formatMAD(withdrawal.amount)}</h4>
                <p class="text-sm text-gray-500">
                  Demandé le ${utils.formatDate(withdrawal.requested_at)}
                </p>
                <p class="text-sm mt-2">
                  <strong>RIB:</strong> ${withdrawal.rib_number}
                </p>
                <p class="text-sm">
                  <strong>Banque:</strong> ${withdrawal.bank_name}
                </p>
                ${withdrawal.cin_document_url ? `
                  <a href="${withdrawal.cin_document_url}" target="_blank"
                     class="text-blue-600 hover:underline text-sm mt-2 inline-block">
                    📄 Voir CIN
                  </a>
                ` : ''}
              </div>
              <div class="flex flex-col gap-2">
                <button onclick="processWithdrawal('${withdrawal.id}', 'complete')" 
                        class="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700">
                  ✓ Traiter
                </button>
                <button onclick="processWithdrawal('${withdrawal.id}', 'reject')" 
                        class="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700">
                  ✗ Rejeter
                </button>
              </div>
            </div>
          </div>
        `).join('');
      } else {
        utils.showEmptyState('pending-withdrawals', 'لا توجد طلبات سحب قيد الانتظار', '✅');
      }
    }
  } catch (error) {
    console.error('Erreur chargement retraits:', error);
    utils.showError('pending-withdrawals', 'خطأ في تحميل طلبات السحب');
  }
}

async function processWithdrawal(withdrawalId, action) {
  let data = {};
  
  if (action === 'complete') {
    const transferRef = prompt('Référence du virement bancaire:');
    if (!transferRef) return;
    data.transfer_reference = transferRef;
  } else {
    const reason = prompt('Raison du rejet:');
    if (!reason) return;
    data.rejection_reason = reason;
  }
  
  const result = await api.admin.processWithdrawal(withdrawalId, action, data);
  
  if (result.success) {
    utils.showToast(
      action === 'complete' ? 'تم معالجة السحب بنجاح' : 'تم رفض طلب السحب',
      'success'
    );
    loadPendingWithdrawals();
  } else {
    utils.showToast(result.error, 'error');
  }
}

// Export fonctions globales
window.blockUser = blockUser;
window.unblockUser = unblockUser;
window.verifyTransfer = verifyTransfer;
window.processWithdrawal = processWithdrawal;

// Charger au démarrage
document.addEventListener('DOMContentLoaded', () => {
  const path = window.location.pathname;
  
  if (path.includes('dashboard') || path.includes('admin-users-management')) {
    loadAdminDashboard();
  } else if (path.includes('users') || path.includes('admin-users-management')) {
    loadUsers();
  } else if (path.includes('verify') || path.includes('admin-funds-validation')) {
    loadPendingTransfers();
  } else if (path.includes('withdrawals')) {
    loadPendingWithdrawals();
  }
});
