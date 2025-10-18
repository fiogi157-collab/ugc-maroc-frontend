-- ============================================
-- SETUP RLS POLICIES - UGC MAROC
-- ============================================
-- Ce fichier contient TOUTES les politiques RLS nécessaires
-- pour le fonctionnement de l'authentification et de l'application
--
-- INSTRUCTIONS :
-- 1. Ouvrir Supabase Dashboard → SQL Editor
-- 2. Copier/coller ce fichier complet
-- 3. Cliquer sur "Run"
-- ============================================

-- ============================================
-- TABLE: profiles
-- ============================================

-- Activer RLS sur profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Politique: Les utilisateurs peuvent créer leur propre profil
CREATE POLICY "Users can insert their own profile"
ON profiles FOR INSERT
TO authenticated
WITH CHECK (auth.uid()::text = id);

-- Politique: Les utilisateurs peuvent voir leur propre profil
CREATE POLICY "Users can view their own profile"
ON profiles FOR SELECT
TO authenticated
USING (auth.uid()::text = id);

-- Politique: Les utilisateurs peuvent mettre à jour leur propre profil
CREATE POLICY "Users can update their own profile"
ON profiles FOR UPDATE
TO authenticated
USING (auth.uid()::text = id)
WITH CHECK (auth.uid()::text = id);

-- Politique: Les utilisateurs authentifiés peuvent voir tous les profils (pour découverte)
CREATE POLICY "Authenticated users can view all profiles"
ON profiles FOR SELECT
TO authenticated
USING (true);

-- ============================================
-- TABLE: wallets
-- ============================================

-- Activer RLS sur wallets
ALTER TABLE wallets ENABLE ROW LEVEL SECURITY;

-- Politique: Les utilisateurs peuvent créer leur propre wallet
CREATE POLICY "Users can insert their own wallet"
ON wallets FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid()::text);

-- Politique: Les utilisateurs peuvent voir leur propre wallet uniquement
CREATE POLICY "Users can view their own wallet"
ON wallets FOR SELECT
TO authenticated
USING (user_id = auth.uid()::text);

-- Politique: Les utilisateurs peuvent mettre à jour leur propre wallet
CREATE POLICY "Users can update their own wallet"
ON wallets FOR UPDATE
TO authenticated
USING (user_id = auth.uid()::text)
WITH CHECK (user_id = auth.uid()::text);

-- ============================================
-- TABLE: creators
-- ============================================

-- Activer RLS sur creators
ALTER TABLE creators ENABLE ROW LEVEL SECURITY;

-- Politique: Les créateurs peuvent créer leur propre profil étendu
CREATE POLICY "Creators can insert their own profile"
ON creators FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid()::text);

-- Politique: Tout le monde peut voir les profils créateurs (découverte)
CREATE POLICY "Anyone can view creator profiles"
ON creators FOR SELECT
TO authenticated, anon
USING (true);

-- Politique: Les créateurs peuvent mettre à jour leur propre profil
CREATE POLICY "Creators can update their own profile"
ON creators FOR UPDATE
TO authenticated
USING (user_id = auth.uid()::text)
WITH CHECK (user_id = auth.uid()::text);

-- ============================================
-- TABLE: brands
-- ============================================

-- Activer RLS sur brands
ALTER TABLE brands ENABLE ROW LEVEL SECURITY;

-- Politique: Les marques peuvent créer leur propre profil étendu
CREATE POLICY "Brands can insert their own profile"
ON brands FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid()::text);

-- Politique: Tout le monde peut voir les profils marques
CREATE POLICY "Anyone can view brand profiles"
ON brands FOR SELECT
TO authenticated, anon
USING (true);

-- Politique: Les marques peuvent mettre à jour leur propre profil
CREATE POLICY "Brands can update their own profile"
ON brands FOR UPDATE
TO authenticated
USING (user_id = auth.uid()::text)
WITH CHECK (user_id = auth.uid()::text);

-- ============================================
-- TABLE: campaigns
-- ============================================

-- Activer RLS sur campaigns
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;

-- Politique: Les marques peuvent créer des campagnes
CREATE POLICY "Brands can insert campaigns"
ON campaigns FOR INSERT
TO authenticated
WITH CHECK (brand_id = auth.uid()::text);

-- Politique: Tout le monde peut voir les campagnes (découverte)
CREATE POLICY "Anyone can view campaigns"
ON campaigns FOR SELECT
TO authenticated, anon
USING (true);

-- Politique: Les marques peuvent mettre à jour leurs propres campagnes
CREATE POLICY "Brands can update their own campaigns"
ON campaigns FOR UPDATE
TO authenticated
USING (brand_id = auth.uid()::text)
WITH CHECK (brand_id = auth.uid()::text);

-- Politique: Les marques peuvent supprimer leurs propres campagnes
CREATE POLICY "Brands can delete their own campaigns"
ON campaigns FOR DELETE
TO authenticated
USING (brand_id = auth.uid()::text);

-- ============================================
-- TABLE: submissions
-- ============================================

-- Activer RLS sur submissions
ALTER TABLE submissions ENABLE ROW LEVEL SECURITY;

-- Politique: Les créateurs peuvent soumettre des vidéos
CREATE POLICY "Creators can insert submissions"
ON submissions FOR INSERT
TO authenticated
WITH CHECK (creator_id = auth.uid()::text);

-- Politique: Les créateurs peuvent voir leurs propres soumissions
CREATE POLICY "Creators can view their own submissions"
ON submissions FOR SELECT
TO authenticated
USING (creator_id = auth.uid()::text);

-- Politique: Les marques peuvent voir les soumissions de leurs campagnes
CREATE POLICY "Brands can view submissions for their campaigns"
ON submissions FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM campaigns
    WHERE campaigns.id = submissions.campaign_id
    AND campaigns.brand_id = auth.uid()::text
  )
);

-- Politique: Les créateurs peuvent mettre à jour leurs propres soumissions
CREATE POLICY "Creators can update their own submissions"
ON submissions FOR UPDATE
TO authenticated
USING (creator_id = auth.uid()::text)
WITH CHECK (creator_id = auth.uid()::text);

-- ============================================
-- TABLE: transactions
-- ============================================

-- Activer RLS sur transactions
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- Politique: Les utilisateurs peuvent voir leurs propres transactions
CREATE POLICY "Users can view their own transactions"
ON transactions FOR SELECT
TO authenticated
USING (user_id = auth.uid()::text);

-- Politique: Le système peut créer des transactions (via backend)
CREATE POLICY "System can insert transactions"
ON transactions FOR INSERT
TO authenticated
WITH CHECK (true);

-- ============================================
-- VERIFICATION
-- ============================================

-- Afficher toutes les politiques créées
SELECT schemaname, tablename, policyname, permissive, roles, cmd
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
