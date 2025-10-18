# Guide de Configuration Supabase - UGC Maroc

## 🚨 ACTIONS CRITIQUES À FAIRE DANS SUPABASE DASHBOARD

### ✅ Étape 1 : Désactiver la confirmation email (OBLIGATOIRE)

**Problème actuel** : Les utilisateurs s'inscrivent mais ne peuvent pas se connecter car Supabase attend la confirmation email.

**Solution** :

1. Allez sur [Supabase Dashboard](https://supabase.com/dashboard)
2. Sélectionnez votre projet UGC Maroc
3. Dans le menu de gauche, allez à **Authentication** → **Providers**
4. Cliquez sur **Email**
5. Désactivez l'option **"Confirm email"** (mettre sur OFF)
6. Cliquez sur **Save**

**Résultat** : Les utilisateurs peuvent se connecter immédiatement après inscription, sans attendre un email de confirmation.

---

### ✅ Étape 2 : Appliquer les politiques RLS (Row Level Security)

**Problème actuel** : Les tables ont RLS activé mais sans politiques, donc INSERT/SELECT bloquent.

**Solution** :

1. Dans Supabase Dashboard, allez à **Database** → **Tables**
2. Pour chaque table (`profiles`, `wallets`, `creators`, `brands`, etc.), cliquez dessus
3. Allez à l'onglet **Policies**
4. Cliquez sur **New Policy**
5. Utilisez le template **"Enable insert for authenticated users only"** ou créez manuellement

#### Politiques essentielles pour `profiles` :

```sql
-- Permettre aux utilisateurs de créer leur propre profil
CREATE POLICY "Users can insert their own profile"
ON profiles FOR INSERT
TO authenticated
WITH CHECK (auth.uid()::text = id);

-- Permettre aux utilisateurs de voir leur propre profil
CREATE POLICY "Users can view their own profile"
ON profiles FOR SELECT
TO authenticated
USING (auth.uid()::text = id);
```

#### Politiques essentielles pour `wallets` :

```sql
-- Permettre aux utilisateurs de créer leur propre wallet
CREATE POLICY "Users can insert their own wallet"
ON wallets FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid()::text);

-- Permettre aux utilisateurs de voir leur propre wallet
CREATE POLICY "Users can view their own wallet"
ON wallets FOR SELECT
TO authenticated
USING (user_id = auth.uid()::text);
```

#### Politiques essentielles pour `creators` :

```sql
-- Permettre aux créateurs de créer leur profil étendu
CREATE POLICY "Creators can insert their own profile"
ON creators FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid()::text);

-- Permettre à tous de voir les profils créateurs (pour découverte)
CREATE POLICY "Anyone can view creator profiles"
ON creators FOR SELECT
TO authenticated, anon
USING (true);
```

#### Politiques essentielles pour `brands` :

```sql
-- Permettre aux marques de créer leur profil étendu
CREATE POLICY "Brands can insert their own profile"
ON brands FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid()::text);

-- Permettre à tous de voir les profils marques
CREATE POLICY "Anyone can view brand profiles"
ON brands FOR SELECT
TO authenticated, anon
USING (true);
```

**Fichier complet** : Voir `api/db/rls-policies.sql` pour toutes les politiques.

---

### ✅ Étape 3 : Vérifier le schéma database

Le schéma complet a été poussé via Drizzle. Vérifiez dans **Database** → **Tables** que vous avez :

- ✅ `profiles` - Profils utilisateurs de base
- ✅ `creators` - Informations étendues créateurs
- ✅ `brands` - Informations étendues marques
- ✅ `wallets` - Portefeuilles financiers
- ✅ `campaigns` - Campagnes marketing
- ✅ `submissions` - Soumissions vidéos créateurs
- ✅ `transactions` - Historique transactions

---

## 🔧 Commandes utiles (backend)

```bash
# Pousser le schéma vers Supabase
cd api && npm run db:push

# Générer les migrations
cd api && npm run db:generate

# Ouvrir Drizzle Studio (interface visuelle)
cd api && npm run db:studio
```

---

## ⚠️ IMPORTANT

Une fois ces 2 étapes faites dans Supabase Dashboard :
1. Désactiver confirmation email
2. Appliquer politiques RLS

Le problème de déconnexion automatique sera **100% résolu** ✅

Le code auth côté frontend a également été refactorisé pour gérer automatiquement :
- Création profil lors de l'inscription
- Création wallet automatique
- Login automatique après inscription
- Gestion d'erreurs complète
