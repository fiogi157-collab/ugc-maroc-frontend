# Guide de Configuration Supabase - UGC Maroc

## 🚨 SOLUTION SIMPLIFIÉE (2 MINUTES)

### Étape 1 : Appliquer les politiques RLS simplifiées

1. Ouvrez [Supabase Dashboard](https://supabase.com/dashboard) → Votre projet
2. Allez à **SQL Editor** (menu gauche)
3. Cliquez **New query**
4. Dans Replit, ouvrez le fichier **`api/db/setup-rls-simple.sql`**
5. **Copiez TOUT le contenu**
6. **Collez dans Supabase SQL Editor**
7. Cliquez **Run**

✅ Vous devriez voir un tableau montrant le nombre de politiques par table (2 politiques pour la plupart des tables)

### Étape 2 : Désactiver confirmation email

1. **Authentication** → **Providers** → **Email**
2. **Désactivez "Confirm email"** (OFF)
3. **Save**

### Étape 3 : Rafraîchir le cache API

1. **Settings** → **API**  
2. Cliquez **"Reload schema cache"** ou **"Restart PostgREST"**
3. Attendez 15 secondes

### Étape 4 : Tester l'inscription

1. Videz le cache de votre navigateur (Cmd+Shift+Delete ou Ctrl+Shift+Delete)
2. Rafraîchissez la page d'inscription
3. Essayez de vous inscrire comme créateur ou brand

✅ **L'inscription devrait marcher immédiatement**

---

## 📝 Note Importante

Les politiques RLS appliquées sont **volontairement permissives** pour débloquer l'authentification rapidement :
- Tous les utilisateurs authentifiés peuvent créer/lire/modifier/supprimer leurs données
- Les utilisateurs non-authentifiés peuvent voir les profils publics (creators, brands, campaigns)

**Sécurité** : Ces politiques sont suffisantes pour le développement. Pour la production, on affinera les permissions pour que chaque utilisateur ne puisse modifier que ses propres données.

---

## 🔍 Vérification

Si l'inscription ne marche toujours pas :

1. Vérifiez dans **Database** → **Policies** que vous avez des politiques sur toutes les tables
2. Vérifiez que l'email confirmation est bien désactivée
3. Videz complètement le cache navigateur
4. Vérifiez la console du navigateur (F12) pour voir les erreurs exactes

---

## 📦 Tables dans votre base

- ✅ `profiles` - Profils utilisateurs
- ✅ `wallets` - Portefeuilles
- ✅ `creators` - Profils créateurs
- ✅ `brands` - Profils marques  
- ✅ `campaigns` - Campagnes
- ✅ `submissions` - Soumissions vidéos
- ✅ `transactions` - Transactions
