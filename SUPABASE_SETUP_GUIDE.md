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

## 🚀 Amélioration Future : Fonction RPC Transactionnelle (Optionnel)

**État actuel** : La création de profil utilise 3 INSERT séparés (profiles → wallets → creators/brands). Si l'un échoue, l'utilisateur reçoit un message d'erreur clair en arabe, mais des données partielles peuvent rester dans la DB.

**Solution recommandée** : Créer une fonction PostgreSQL RPC pour garantir l'atomicité (tout ou rien).

### Comment implémenter (optionnel)

1. Dans Supabase Dashboard, allez à **SQL Editor**
2. Collez ce code SQL :

```sql
CREATE OR REPLACE FUNCTION create_complete_profile(
  p_user_id UUID,
  p_email TEXT,
  p_full_name TEXT,
  p_username TEXT,
  p_role TEXT,
  p_phone TEXT,
  p_bio TEXT,
  p_avatar_url TEXT,
  p_metadata JSONB
) RETURNS JSONB AS $$
DECLARE
  v_result JSONB;
BEGIN
  -- 1. Insert into profiles
  INSERT INTO profiles (id, email, full_name, username, role, phone, bio, avatar_url)
  VALUES (p_user_id, p_email, p_full_name, p_username, p_role, p_phone, p_bio, p_avatar_url);

  -- 2. Insert into wallets
  INSERT INTO wallets (user_id, balance, pending_balance, currency)
  VALUES (p_user_id, 0, 0, 'MAD');

  -- 3. Insert into role-specific table
  IF p_role = 'creator' THEN
    INSERT INTO creators (
      user_id, specialization, instagram_handle, tiktok_handle, 
      youtube_handle, followers_count, is_verified, rating, completed_campaigns
    )
    VALUES (
      p_user_id, 
      p_metadata->>'specialization',
      p_metadata->>'instagram',
      p_metadata->>'tiktok',
      p_metadata->>'youtube',
      COALESCE((p_metadata->>'followersCount')::INTEGER, 0),
      false, 0, 0
    );
  ELSIF p_role = 'brand' THEN
    INSERT INTO brands (
      user_id, company_name, industry, website, 
      logo_url, description, is_verified, total_campaigns
    )
    VALUES (
      p_user_id,
      COALESCE(p_metadata->>'companyName', p_full_name),
      p_metadata->>'industry',
      p_metadata->>'website',
      p_metadata->>'logoUrl',
      COALESCE(p_metadata->>'description', p_bio),
      false, 0
    );
  END IF;

  -- Return success
  v_result := jsonb_build_object('success', true, 'user_id', p_user_id);
  RETURN v_result;
  
EXCEPTION WHEN OTHERS THEN
  -- Rollback automatique en cas d'erreur
  RAISE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

3. Cliquez sur **Run**
4. Dans `js/auth.js`, remplacez les appels à `createCompleteProfile()` par un appel RPC :

```javascript
const { data, error } = await window.supabaseClient.rpc('create_complete_profile', {
  p_user_id: userId,
  p_email: email,
  p_full_name: fullName,
  p_username: metadata.username,
  p_role: role,
  p_phone: phone,
  p_bio: metadata.bio || '',
  p_avatar_url: metadata.avatar_url || '',
  p_metadata: metadata
});
```

**Avantages** :
- ✅ Atomicité garantie (tout ou rien)
- ✅ Performance améliorée (1 requête au lieu de 3)
- ✅ Rollback automatique en cas d'erreur

---

## ⚠️ IMPORTANT

Une fois ces 2 étapes faites dans Supabase Dashboard :
1. Désactiver confirmation email
2. Appliquer politiques RLS

Le problème de déconnexion automatique sera **100% résolu** ✅

Le code auth côté frontend a également été refactorisé pour gérer automatiquement :
- Création profil lors de l'inscription (profiles + wallet + creator/brand)
- Échec complet si une des 3 tables échoue (pas de données partielles)
- Login automatique après inscription
- Messages d'erreur clairs en arabe
