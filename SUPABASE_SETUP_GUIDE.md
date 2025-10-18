# Guide de Configuration Supabase - UGC Maroc

## 🚀 SOLUTION DÉFINITIVE - Fonction RPC (2 MINUTES)

Cette solution contourne complètement le problème de cache PostgREST en utilisant une fonction PostgreSQL avec `SECURITY DEFINER` qui s'exécute avec des privilèges élevés.

### Étape 1 : Appliquer la fonction RPC dans Supabase

1. Ouvrez [Supabase Dashboard](https://supabase.com/dashboard) → Votre projet
2. Allez à **SQL Editor** (menu gauche)
3. Cliquez **New query**
4. Dans Replit, ouvrez le fichier **`api/db/create-profile-function.sql`**
5. **Copiez TOUT le contenu** (environ 120 lignes)
6. **Collez dans Supabase SQL Editor**
7. Cliquez **Run**

✅ Vous devriez voir : **"Success. No rows returned"**

### Étape 2 : Vérifier que la fonction existe

Dans le même SQL Editor, exécutez cette requête pour confirmer :

```sql
SELECT proname, proowner 
FROM pg_proc 
WHERE proname = 'create_complete_profile';
```

✅ Vous devriez voir une ligne avec `create_complete_profile`

### Étape 3 : Désactiver confirmation email (si pas déjà fait)

1. **Authentication** → **Providers** → **Email**
2. **Désactivez "Confirm email"** (mettez sur OFF)
3. **Save**

### Étape 4 : Tester l'inscription

1. **Videz le cache de votre navigateur** (Cmd+Shift+Delete / Ctrl+Shift+Delete)
2. Rafraîchissez la page d'inscription
3. **Utilisez un NOUVEL email** que vous n'avez jamais utilisé (ex: `test999@gmail.com`)
4. Remplissez le formulaire et inscrivez-vous

✅ **L'inscription devrait fonctionner sans erreur de cache !**

---

## 🔧 Comment ça marche ?

### Ancienne méthode (problématique)
```
Frontend → INSERT direct dans tables → Cache RLS invalide → ERREUR
```

### Nouvelle méthode (robuste)
```
Frontend → Fonction RPC SECURITY DEFINER → S'exécute sans cache RLS → SUCCÈS
```

La fonction RPC :
- S'exécute avec `SECURITY DEFINER` (privilèges élevés)
- Ignore complètement le cache PostgREST
- Insère profile + wallet + creator/brand en UNE transaction atomique
- Retourne un JSON avec succès/erreur

---

## 🐛 Dépannage

### Erreur "function create_complete_profile does not exist"
→ Vous n'avez pas appliqué le SQL de l'Étape 1. Retournez appliquer `api/db/create-profile-function.sql`

### Erreur "User already registered"
→ Cet email a déjà été utilisé. Utilisez un email complètement nouveau.

### Erreur persistante de cache
→ Dans Supabase SQL Editor, exécutez :
```sql
NOTIFY pgrst, 'reload schema';
```
Puis attendez 15 secondes et réessayez.

---

## 📦 Politiques RLS (déjà appliquées)

Si vous avez appliqué `api/db/setup-rls-simple.sql` auparavant, vos tables ont déjà RLS activé avec des politiques permissives. C'est suffisant pour le développement.

Pour la production, on pourra affiner les politiques pour que chaque utilisateur ne puisse modifier que ses propres données.

---

## ✅ Vérification Complète

Pour vérifier que tout est correctement configuré :

1. **Fonction RPC existe** :
```sql
SELECT proname FROM pg_proc WHERE proname = 'create_complete_profile';
```

2. **RLS activé sur toutes les tables** :
```sql
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' AND rowsecurity = true;
```

3. **Email confirmation désactivée** :
   - Authentication → Providers → Email → "Confirm email" est OFF

Si tout est ✅, l'inscription fonctionnera !
