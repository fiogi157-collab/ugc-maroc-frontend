# 🗃️ Instructions de Migration Marketplace

## 📋 **Étapes pour créer les tables Marketplace dans Supabase**

### **1. Accéder à Supabase Dashboard**
1. Allez sur [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. Connectez-vous à votre compte
3. Sélectionnez votre projet UGC Maroc

### **2. Ouvrir l'éditeur SQL**
1. Dans le menu de gauche, cliquez sur **"SQL Editor"**
2. Cliquez sur **"New query"**

### **3. Exécuter la migration**
1. Copiez tout le contenu du fichier `004_marketplace_complete.sql`
2. Collez-le dans l'éditeur SQL
3. Cliquez sur **"Run"** (ou Ctrl+Enter)

### **4. Vérifier la création**
Après exécution, vous devriez voir :
```
✅ Success. No rows returned.
Marketplace database tables created successfully!
```

### **5. Vérifier les tables créées**
Dans le menu de gauche :
1. Allez sur **"Table Editor"**
2. Vous devriez voir les nouvelles tables :
   - ✅ `gigs`
   - ✅ `gig_options`
   - ✅ `negotiations`
   - ✅ `contracts`
   - ✅ `orders` (mise à jour avec nouvelles colonnes)

---

## 🎯 **Tables créées**

### **`gigs`** - Offres des créateurs
- `id`, `creator_id`, `title`, `description`
- `base_price`, `delivery_days`, `category`
- `languages[]`, `platforms[]`, `content_types[]`
- `portfolio_urls[]`, `is_active`, `views`, `orders_count`, `rating`

### **`gig_options`** - Options supplémentaires
- `id`, `gig_id`, `name`, `price`, `description`

### **`negotiations`** - Négociations
- `id`, `gig_id`, `brand_id`, `creator_id`
- `status`, `proposed_price`, `proposed_details`
- `brand_message`, `creator_response`

### **`contracts`** - Contrats formels
- `id`, `gig_id`, `negotiation_id`, `brand_id`, `creator_id`
- `title`, `description`, `deliverables`, `delivery_deadline`
- `agreed_price`, `stripe_fee`, `platform_fee`, `creator_amount`
- `usage_rights`, `usage_duration`
- `brand_accepted`, `creator_accepted`, `brand_signature`, `creator_signature`
- `status`, `contract_pdf_url`

### **`orders`** - Mise à jour
- ✅ Ajout de `contract_id` (référence vers contracts)
- ✅ Ajout de `gig_id` (référence vers gigs)
- ✅ Ajout de `source_type` ('campaign' ou 'marketplace')

---

## 🔒 **Sécurité (RLS)**

Toutes les tables ont **Row Level Security** activé :
- ✅ Les créateurs voient seulement leurs gigs
- ✅ Les brands voient seulement leurs négociations/contrats
- ✅ Le marketplace public voit les gigs actifs
- ✅ Isolation complète des données

---

## 🚀 **Prochaines étapes**

Après la migration :
1. ✅ **Backend API** - Créer les routes pour les gigs
2. ✅ **Frontend** - Créer les pages marketplace
3. ✅ **Intégration** - Connecter tout le système

---

## ⚠️ **En cas d'erreur**

Si vous obtenez une erreur :
1. Vérifiez que vous êtes connecté au bon projet Supabase
2. Assurez-vous que la table `profiles` existe
3. Vérifiez que vous avez les permissions d'admin
4. Contactez-moi avec le message d'erreur exact

---

**🎉 Une fois terminé, nous pourrons créer les APIs et les pages frontend !**