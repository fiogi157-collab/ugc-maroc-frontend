# 🔐 Guide de Configuration Authentification - UGC Maroc

## 📋 Vue d'ensemble

Ce dossier contient toutes les pages d'authentification de UGC Maroc avec un flux complet d'inscription et de vérification email.

## 🚀 Flux d'authentification

### Pour les Créateurs (Creators)
1. **Inscription** : `/auth/creator-signup.html`
2. **Email en attente** : `/auth/creator-pending.html`
3. **Vérification réussie** : `/auth/creator-verified.html`
4. **Connexion** : `/auth/creator-login.html`
5. **Dashboard** : `/creator/creator_dashboard_1.html`

### Pour les Marques (Brands)
1. **Inscription** : `/auth/brand-signup.html`
2. **Email en attente** : `/auth/brand-pending.html`
3. **Vérification réussie** : `/auth/brand-verified.html`
4. **Connexion** : `/auth/brand-login.html`
5. **Dashboard** : `/brand/brand_dashboard_-_variant_2.html`

### Mot de passe oublié
1. **Demande réinitialisation** : `/auth/forgot-password.html`
2. **Nouveau mot de passe** : `/auth/reset-password.html`
3. **Redirection automatique** vers login selon rôle

---

## ⚙️ Configuration Supabase (OBLIGATOIRE)

### 1. Configuration des URL de redirection

Dans votre **Supabase Dashboard** :

1. Allez dans **Authentication** → **URL Configuration**
2. Ajoutez les URLs suivantes dans **Redirect URLs** :

```
https://votre-domaine.com/auth/creator-verified.html
https://votre-domaine.com/auth/brand-verified.html
https://votre-domaine.com/auth/reset-password.html
```

Pour le développement local, ajoutez aussi :
```
http://localhost:5000/auth/creator-verified.html
http://localhost:5000/auth/brand-verified.html
http://localhost:5000/auth/reset-password.html
```

### 2. Configuration des Email Templates

#### Template de Vérification Email

Dans **Authentication** → **Email Templates** → **Confirm signup** :

**Sujet** : `Vérifiez votre compte UGC Maroc`

**Corps du message** (français/anglais) :
```html
<h2>Bienvenue sur UGC Maroc !</h2>
<p>Merci de vous être inscrit. Cliquez sur le lien ci-dessous pour vérifier votre compte :</p>
<p><a href="{{ .ConfirmationURL }}">Vérifier mon compte</a></p>
<p>Ce lien expirera dans 24 heures.</p>
```

**Corps du message** (arabe - optionnel) :
```html
<h2 dir="rtl">مرحبًا بك في UGC Maroc!</h2>
<p dir="rtl">شكرًا للتسجيل. انقر على الرابط أدناه للتحقق من حسابك:</p>
<p><a href="{{ .ConfirmationURL }}">تحقق من حسابي</a></p>
<p dir="rtl">ستنتهي صلاحية هذا الرابط خلال 24 ساعة.</p>
```

#### Template de Réinitialisation Mot de Passe

Dans **Authentication** → **Email Templates** → **Reset Password** :

**Sujet** : `Réinitialisation de votre mot de passe UGC Maroc`

**Corps du message** :
```html
<h2>Réinitialisation de mot de passe</h2>
<p>Vous avez demandé à réinitialiser votre mot de passe. Cliquez sur le lien ci-dessous :</p>
<p><a href="{{ .ConfirmationURL }}">Réinitialiser mon mot de passe</a></p>
<p>Si vous n'avez pas fait cette demande, ignorez cet email.</p>
<p>Ce lien expirera dans 1 heure.</p>
```

### 3. Configuration de la redirection intelligente

Pour que les utilisateurs soient redirigés vers la bonne page verified selon leur rôle, vous devez configurer :

**Option A : Utiliser les métadonnées utilisateur (Recommandé)**

Le système utilise déjà le champ `role` dans la table `profiles` pour déterminer la redirection.

**Option B : URLs de redirection dynamiques**

Modifiez dans votre code d'inscription (`auth.js` ligne 100-107) :

```javascript
const { data, error } = await window.supabaseClient.auth.signUp({
  email,
  password,
  options: {
    data: {
      full_name: fullName
    },
    emailRedirectTo: role === 'brand' 
      ? `${window.location.origin}/auth/brand-verified.html`
      : `${window.location.origin}/auth/creator-verified.html`
  }
});
```

### 4. Politique de confirmation email

Dans **Authentication** → **Providers** → **Email** :

- ✅ Activez **Enable email confirmation**
- ✅ Activez **Secure email change**
- ⚠️ **Double Opt-in** : Recommandé pour éviter les faux comptes

---

## 🔄 Flux technique détaillé

### Inscription
```
Utilisateur remplit formulaire 
  ↓
signupUser() dans auth.js
  ↓
Supabase crée compte (email non vérifié)
  ↓
Création profil dans table profiles
  ↓
Création wallet dans table wallets
  ↓
Email sauvegardé dans localStorage
  ↓
Redirection vers creator-pending.html ou brand-pending.html
```

### Vérification Email
```
Utilisateur clique lien dans email
  ↓
Supabase vérifie token
  ↓
Redirection vers creator-verified.html ou brand-verified.html
  ↓
Utilisateur peut se connecter
```

### Connexion
```
Utilisateur entre email/password
  ↓
loginUser() dans auth.js
  ↓
Vérification dans Supabase
  ↓
Récupération profil depuis table profiles
  ↓
Vérification status != 'blocked'
  ↓
Sauvegarde role/name dans localStorage
  ↓
Redirection vers dashboard selon rôle
```

---

## 📁 Structure des fichiers

```
/auth/
├── creator-signup.html      # Inscription créateur
├── creator-pending.html     # Attente vérification email créateur
├── creator-verified.html    # Succès vérification créateur
├── creator-login.html       # Connexion créateur
├── brand-signup.html        # Inscription marque
├── brand-pending.html       # Attente vérification email marque
├── brand-verified.html      # Succès vérification marque
├── brand-login.html         # Connexion marque
├── forgot-password.html     # Demande reset password
├── reset-password.html      # Nouveau password
└── README.md               # Ce fichier
```

---

## 🎨 Design System

Toutes les pages utilisent :
- **Couleur primaire** : `#5b13ec`
- **Glassmorphism** : `bg-white/60 backdrop-blur-lg`
- **Direction** : RTL (arabe)
- **Police** : Manrope
- **Framework CSS** : Tailwind CSS

---

## ✅ Checklist de déploiement

Avant de déployer en production :

- [ ] URLs de redirection configurées dans Supabase
- [ ] Templates email configurés et traduits
- [ ] Email confirmation activée
- [ ] SMTP configuré (ou utiliser SMTP de Supabase)
- [ ] Variables d'environnement configurées :
  - `SUPABASE_URL`
  - `SUPABASE_ANON_KEY`
- [ ] Tests effectués :
  - [ ] Inscription créateur → vérification → login
  - [ ] Inscription marque → vérification → login
  - [ ] Mot de passe oublié → reset → login
  - [ ] Fonction resend email
- [ ] Pages error 404/500 configurées
- [ ] SSL/HTTPS activé

---

## 🐛 Dépannage

### L'utilisateur ne reçoit pas l'email de vérification

1. Vérifiez les **logs email** dans Supabase Dashboard → Authentication → Logs
2. Vérifiez le dossier spam
3. Testez avec `auth.resend()` depuis la page pending
4. Vérifiez la configuration SMTP

### Erreur "Email not confirmed"

L'utilisateur doit cliquer sur le lien de vérification. Renvoyez l'email depuis la page pending.

### Redirection vers mauvaise page verified

Vérifiez que :
1. Le rôle est bien enregistré dans la table `profiles`
2. La redirection dans `auth.js` utilise bien le rôle
3. Les URLs dans Supabase sont correctes

### Erreur "User already registered"

L'email existe déjà. L'utilisateur doit :
1. Se connecter directement
2. Ou utiliser "Mot de passe oublié" s'il ne se souvient pas

---

## 📞 Support

Pour toute question technique :
- **Email** : tech@ugcmaroc.com
- **Documentation Supabase** : https://supabase.com/docs/guides/auth
- **Issues GitHub** : [Lien vers votre repo]

---

## 📝 Notes importantes

1. **Sécurité** : Ne jamais exposer `SUPABASE_SERVICE_KEY` côté client
2. **Rate limiting** : Supabase limite à 4 emails/heure par défaut
3. **Table profiles** : Automatiquement créée via trigger lors de l'inscription
4. **Wallet** : Créé avec balance 0 lors de l'inscription
5. **Rôles supportés** : `creator`, `brand`, `admin`

---

Dernière mise à jour : Octobre 2025
