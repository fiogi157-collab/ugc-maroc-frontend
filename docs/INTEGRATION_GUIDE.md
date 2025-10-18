# 🔗 Guide d'Intégration - UGC Maroc

## 📦 Scripts Disponibles

### Scripts de Base (à inclure sur TOUTES les pages)
```html
<!-- Supabase CDN -->
<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>

<!-- Scripts UGC Maroc (ordre important!) -->
<script src="/js/config.js"></script>
<script src="/js/utils.js"></script>
<script src="/js/auth.js"></script>
<script src="/js/api.js"></script>
<script src="/js/main.js"></script>
```

### Scripts Spécialisés par Dashboard

#### 🎨 Pages Créateur
Ajouter **après** les scripts de base:
```html
<script src="/js/dashboard-creator.js"></script>
```

**Pages concernées:**
- `/creator/dashboard.html`
- `/creator/تصفح_الحملات.html` (campaigns)
- `/creator/submissions.html`
- `/creator/سحب_الأرباح.html` (wallet)

#### 🏢 Pages Marque
Ajouter **après** les scripts de base:
```html
<script src="/js/dashboard-brand.js"></script>
```

**Pages concernées:**
- `/brand/brand_dashboard.html`
- `/brand/المشاريع_الحالية.html` (my campaigns)
- `/brand/تفاصيل_الحملة_(للعلامات_التجارية).html` (campaign details)

#### 👨‍💼 Pages Admin
Ajouter **après** les scripts de base:
```html
<script src="/js/dashboard-admin.js"></script>
```

**Pages concernées:**
- `/admin/dashboard.html`
- `/admin/إدارة_المستخدمين.html` (users management)
- `/admin/verify-transfers.html`
- `/admin/process-withdrawals.html`

## 🎯 IDs HTML Requis

### Créateur Dashboard
```html
<!-- Stats -->
<div id="wallet-balance"></div>
<div id="total-earned"></div>
<div id="badges-container"></div>
<div id="recent-submissions"></div>

<!-- Campagnes -->
<div id="campaigns-list"></div>

<!-- Soumissions -->
<div id="my-submissions-list"></div>

<!-- Wallet -->
<div id="current-balance"></div>
<div id="total-earned-wallet"></div>
<div id="total-withdrawn"></div>
<div id="transactions-list"></div>
<button id="withdraw-btn"></button>
```

### Marque Dashboard
```html
<!-- Stats -->
<div id="wallet-balance"></div>
<div id="campaigns-stats"></div>

<!-- Campagnes -->
<div id="my-campaigns-list"></div>

<!-- Soumissions d'une campagne -->
<div id="campaign-submissions"></div>
```

### Admin Dashboard
```html
<!-- Stats -->
<div id="total-users"></div>
<div id="total-creators"></div>
<div id="total-brands"></div>
<div id="total-campaigns"></div>

<!-- Utilisateurs -->
<tbody id="users-list"></tbody>

<!-- Virements -->
<div id="pending-transfers"></div>

<!-- Retraits -->
<div id="pending-withdrawals"></div>
```

## ✅ Template Complet

```html
<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>UGC Maroc</title>
  
  <!-- Tailwind CSS -->
  <script src="https://cdn.tailwindcss.com"></script>
  
  <!-- Fonts -->
  <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;700&display=swap" rel="stylesheet"/>
  <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined" rel="stylesheet"/>
</head>
<body>

  <!-- Votre contenu HTML avec les IDs requis -->
  <div id="campaigns-list"></div>

  <!-- Scripts Supabase -->
  <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
  
  <!-- Scripts UGC Maroc de base -->
  <script src="/js/config.js"></script>
  <script src="/js/utils.js"></script>
  <script src="/js/auth.js"></script>
  <script src="/js/api.js"></script>
  <script src="/js/main.js"></script>
  
  <!-- Script spécialisé selon le rôle -->
  <script src="/js/dashboard-creator.js"></script>
  <!-- OU -->
  <script src="/js/dashboard-brand.js"></script>
  <!-- OU -->
  <script src="/js/dashboard-admin.js"></script>

</body>
</html>
```

## 🔐 Authentification

### Pages d'Authentification
Les pages login/signup doivent avoir:
```html
<!-- Login -->
<form id="login-form">
  <input id="email" name="email" type="email" required/>
  <input id="password" name="password" type="password" required/>
  <button type="submit">تسجيل الدخول</button>
</form>

<!-- Signup -->
<form id="signup-form" data-role="creator"> <!-- ou data-role="brand" -->
  <input id="fullname" name="fullname" type="text" required/>
  <input id="email" name="email" type="email" required/>
  <input id="password" name="password" type="password" required/>
  <input id="confirm_password" name="confirm_password" type="password" required/>
  <input id="phone" name="phone" type="tel" required/>
  <button type="submit">إنشاء حساب</button>
</form>
```

## 🚀 Démarrage Rapide

1. **Vérifier que les scripts existent:**
   - `/js/config.js`
   - `/js/utils.js`
   - `/js/auth.js`
   - `/js/api.js`
   - `/js/main.js`
   - `/js/dashboard-creator.js`
   - `/js/dashboard-brand.js`
   - `/js/dashboard-admin.js`

2. **Ajouter les scripts à chaque page HTML** (voir template ci-dessus)

3. **Ajouter les IDs requis** aux éléments HTML selon le dashboard

4. **Tester:**
   - Login/Signup fonctionne
   - Redirection selon rôle
   - Chargement automatique des données
   - Appels API fonctionnent

## ⚠️ Points Importants

1. **Ordre des scripts** : Toujours charger dans cet ordre:
   - config.js (configuration Supabase)
   - utils.js (fonctions utilitaires)
   - auth.js (authentification)
   - api.js (appels API)
   - main.js (initialisation)
   - dashboard-*.js (logique métier)

2. **IDs HTML** : Les IDs doivent correspondre exactement à ceux utilisés dans les scripts

3. **Protection des routes** : Les scripts vérifient automatiquement l'authentification

4. **API Backend** : Assurer que le backend tourne sur `http://localhost:3000`

## 🐛 Debugging

```javascript
// Dans la console du navigateur:

// Vérifier token
console.log(localStorage.getItem('supabase.auth.token'));

// Vérifier utilisateur
auth.getCurrentUser().then(console.log);

// Tester API
api.creator.getCampaigns().then(console.log);
```

---

**Note:** Ce guide sera mis à jour au fur et à mesure de l'intégration complète.
