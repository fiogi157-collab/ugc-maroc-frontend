# 🚀 Instructions Migration Supabase - UGC Maroc

## ⚠️ IMPORTANT : Exécution Manuelle Requise

L'exécution automatique via l'API ne fonctionne pas. Vous devez exécuter le SQL manuellement dans l'interface Supabase.

## 📋 Étapes à Suivre

### 1. Accéder au SQL Editor Supabase
1. Allez sur https://supabase.com/dashboard/project/arfmvtfkibjadxwnbqjl/sql
2. Cliquez sur "New Query"

### 2. Copier le Script SQL
Copiez tout le contenu du fichier `api/db/migrations/001_payment_system.sql` dans l'éditeur SQL.

### 3. Exécuter la Migration
1. Cliquez sur "Run" pour exécuter le script
2. Attendez que l'exécution se termine (peut prendre 1-2 minutes)
3. Vérifiez qu'il n'y a pas d'erreurs

### 4. Vérifier les Tables Créées
Après l'exécution, vous devriez voir ces nouvelles tables dans l'onglet "Table Editor" :

#### Tables Critiques pour Paiement Stripe :
- ✅ `orders` - Commandes entre brands et creators
- ✅ `payments` - Paiements Stripe
- ✅ `creator_balances` - Soldes des créateurs
- ✅ `payout_requests` - Demandes de retrait
- ✅ `webhook_events` - Événements webhook Stripe

#### Tables Système Complet :
- ✅ `campaign_agreements` - Accords de campagne
- ✅ `conversations` - Conversations chat
- ✅ `messages` - Messages chat
- ✅ `wallet_reservations` - Réservations portefeuille
- ✅ `negotiation_messages` - Messages de négociation
- ✅ `dispute_cases` - Cas de litige
- ✅ `ratings` - Évaluations
- ✅ `escrow_transactions` - Ancien système escrow
- ✅ `agreement_escrow` - Nouveau système escrow
- ✅ `creator_earnings` - Ancien système gains
- ✅ `agreement_earnings` - Nouveau système gains
- ✅ `creator_withdrawals` - Ancien système retraits
- ✅ `creator_bank_details` - Détails bancaires créateurs
- ✅ `bank_change_requests` - Demandes changement RIB
- ✅ `platform_settings` - Paramètres plateforme

## 🔒 Sécurité Configurée

Le script configure automatiquement :
- **Row Level Security (RLS)** sur toutes les tables
- **Policies** pour que les utilisateurs ne voient que leurs données
- **Index** pour optimiser les performances
- **Triggers** pour maintenir la cohérence

## ✅ Vérification Finale

Après l'exécution, testez que le serveur fonctionne :

```bash
cd "/Users/mac/Desktop/UGC 70%/ugc-maroc-frontend/api"
npm start
```

Le serveur devrait démarrer sans erreurs et vous devriez voir :
- ✅ Service Stripe initialisé
- ✅ Server running on http://0.0.0.0:5000
- ✅ Stripe payment endpoints: /api/payments/*
- ✅ Orders endpoints: /api/orders/*
- ✅ Withdrawal endpoints: /api/withdrawal/*

## 🎯 Prochaines Étapes

Une fois les tables créées :
1. **Tester le flux de paiement** : `http://localhost:5000/brand/checkout.html`
2. **Configurer Cloudflare R2** pour le stockage vidéos
3. **Tester un paiement complet** de bout en bout

## 📞 Support

Si vous rencontrez des erreurs lors de l'exécution du SQL, partagez-moi le message d'erreur et je vous aiderai à le résoudre.

