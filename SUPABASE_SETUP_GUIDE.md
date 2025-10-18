# Guide de Configuration Supabase - UGC Maroc

## 🚨 PROBLÈME ACTUEL

L'erreur "Could not find the 'id' column" signifie que **les politiques RLS manquent**. Les tables existent mais Supabase bloque toutes les opérations sans politiques de sécurité.

---

## ✅ SOLUTION EN 2 ÉTAPES (5 MINUTES)

### Étape 1 : Appliquer les politiques RLS

1. Ouvrez [Supabase Dashboard](https://supabase.com/dashboard) → Sélectionnez votre projet
2. Allez à **SQL Editor** (dans le menu de gauche)
3. Cliquez sur **New query**
4. Ouvrez le fichier `api/db/setup-rls-policies.sql` dans votre éditeur
5. **Copiez TOUT le contenu du fichier**
6. **Collez-le dans l'éditeur SQL de Supabase**
7. Cliquez sur **Run** (en bas à droite)

✅ Vous devriez voir : "Success. No rows returned"

### Étape 2 : Désactiver la confirmation email

1. Dans Supabase Dashboard, allez à **Authentication** → **Providers**
2. Cliquez sur **Email**
3. **Désactivez "Confirm email"** (mettre sur OFF)
4. Cliquez sur **Save**

✅ Les utilisateurs pourront se connecter immédiatement après inscription

---

## 🎯 C'EST TOUT !

Après ces 2 étapes, l'authentification fonctionnera parfaitement :
- ✅ Inscription créateur → Auto-login → Dashboard créateur
- ✅ Inscription brand → Auto-login → Dashboard brand
- ✅ Création automatique de : profil + wallet + creator/brand
- ✅ Messages d'erreur clairs en arabe

---

## 🔍 Vérification (optionnel)

Pour vérifier que les politiques sont bien appliquées :

1. Dans Supabase Dashboard, allez à **Database** → **Policies**
2. Vous devriez voir des politiques pour toutes les tables :
   - `profiles` : 4 politiques
   - `wallets` : 3 politiques
   - `creators` : 3 politiques
   - `brands` : 3 politiques
   - `campaigns` : 4 politiques
   - `submissions` : 4 politiques
   - `transactions` : 2 politiques

---

## ⚠️ Si l'inscription ne marche toujours pas

1. Vérifiez que vous avez bien désactivé la confirmation email
2. Vérifiez que le SQL s'est exécuté sans erreur
3. Essayez de rafraîchir la page d'inscription (Ctrl+F5 / Cmd+Shift+R)
4. Vérifiez les logs dans la console du navigateur (F12)

---

## 📦 Tables dans Supabase

Votre base de données contient déjà toutes les tables :
- ✅ `profiles` - Profils utilisateurs
- ✅ `wallets` - Portefeuilles financiers
- ✅ `creators` - Profils créateurs étendus
- ✅ `brands` - Profils marques étendus
- ✅ `campaigns` - Campagnes marketing
- ✅ `submissions` - Soumissions vidéos
- ✅ `transactions` - Historique des transactions

---

## 🚀 Amélioration Future (Optionnel)

Pour une atomicité complète (garantie que profil + wallet + creator/brand sont créés ensemble ou pas du tout), vous pouvez créer une fonction RPC PostgreSQL.

**Actuellement** : Le code crée les 3 entrées séparément. Si l'une échoue, l'utilisateur voit un message d'erreur clair en arabe.

**Avec RPC** : Transaction atomique garantie (tout ou rien) avec rollback automatique.

Les instructions détaillées sont disponibles dans ce même fichier (section archivée en bas).

---

## 📝 Archive : Fonction RPC Transactionnelle (pour référence)

<details>
<summary>Cliquez pour voir le code SQL de la fonction RPC (optionnel)</summary>

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

Pour utiliser cette fonction dans `js/auth.js` :

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

</details>
