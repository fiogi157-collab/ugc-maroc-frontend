# FIX DÉFINITIF - Cache Supabase

## LE PROBLÈME

Erreur : `PGRST204 - Could not find the 'id' column of 'profiles' in the schema cache`

**Cause** : Le cache PostgREST (API Supabase) n'a pas rafraîchi le schéma après l'application des politiques RLS.

## LA SOLUTION (1 minute)

### Option 1 : Rafraîchir le cache API (RECOMMANDÉ)

1. Allez sur [Supabase Dashboard](https://supabase.com/dashboard)
2. Sélectionnez votre projet
3. Dans le menu de gauche, allez à **Settings** (roue crantée en bas)
4. Cliquez sur **API**
5. En haut de la page, cliquez sur le bouton **"Reload schema cache"** ou **"Restart PostgREST"**
6. Attendez 10-15 secondes

### Option 2 : Redémarrer le projet Supabase

1. Supabase Dashboard → **Settings** → **General**
2. Cliquez sur **"Pause project"**
3. Attendez 30 secondes
4. Cliquez sur **"Resume project"**
5. Attendez 1-2 minutes pour que tout redémarre

### Option 3 : Force refresh via SQL (si les 2 autres ne marchent pas)

1. Supabase Dashboard → **SQL Editor**
2. Exécutez cette commande :

```sql
NOTIFY pgrst, 'reload schema';
```

## APRÈS LE REFRESH

1. Videz le cache de votre navigateur (Cmd+Shift+Delete / Ctrl+Shift+Delete)
2. Rafraîchissez la page d'inscription (F5 ou Cmd+R)
3. Essayez de vous inscrire à nouveau

✅ L'inscription devrait marcher immédiatement.

## POURQUOI CE PROBLÈME ?

PostgREST (l'API auto-générée de Supabase) garde un cache du schéma database pour la performance. Quand vous ajoutez des politiques RLS ou modifiez le schéma, il faut parfois forcer le rafraîchissement du cache.

C'est un problème ponctuel qui n'arrivera plus une fois que tout est configuré.
