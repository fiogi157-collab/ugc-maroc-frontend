-- ============================================
-- SETUP RLS POLICIES - UGC MAROC
-- ============================================
-- Ce fichier NETTOIE toutes les politiques existantes
-- puis crée les nouvelles politiques RLS
--
-- INSTRUCTIONS :
-- 1. Ouvrir Supabase Dashboard → SQL Editor
-- 2. Copier/coller ce fichier complet
-- 3. Cliquer sur "Run"
-- ============================================

-- ============================================
-- ÉTAPE 1: NETTOYER LES POLITIQUES EXISTANTES
-- ============================================

DROP POLICY IF EXISTS "Users can insert their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
DROP POLICY IF EXISTS "Authenticated users can view all profiles" ON profiles;

DROP POLICY IF EXISTS "Users can insert their own wallet" ON wallets;
DROP POLICY IF EXISTS "Users can view their own wallet" ON wallets;
DROP POLICY IF EXISTS "Users can update their own wallet" ON wallets;

DROP POLICY IF EXISTS "Creators can insert their own profile" ON creators;
DROP POLICY IF EXISTS "Anyone can view creator profiles" ON creators;
DROP POLICY IF EXISTS "Creators can update their own profile" ON creators;

DROP POLICY IF EXISTS "Brands can insert their own profile" ON brands;
DROP POLICY IF EXISTS "Anyone can view brand profiles" ON brands;
DROP POLICY IF EXISTS "Brands can update their own profile" ON brands;

DROP POLICY IF EXISTS "Brands can insert campaigns" ON campaigns;
DROP POLICY IF EXISTS "Anyone can view campaigns" ON campaigns;
DROP POLICY IF EXISTS "Brands can update their own campaigns" ON campaigns;
DROP POLICY IF EXISTS "Brands can delete their own campaigns" ON campaigns;

DROP POLICY IF EXISTS "Creators can insert submissions" ON submissions;
DROP POLICY IF EXISTS "Creators can view their own submissions" ON submissions;
DROP POLICY IF EXISTS "Brands can view submissions for their campaigns" ON submissions;
DROP POLICY IF EXISTS "Creators can update their own submissions" ON submissions;

DROP POLICY IF EXISTS "Users can view their own transactions" ON transactions;
DROP POLICY IF EXISTS "Users can insert their own transactions" ON transactions;
DROP POLICY IF EXISTS "System can insert transactions" ON transactions;

-- ============================================
-- ÉTAPE 2: CRÉER LES NOUVELLES POLITIQUES
-- ============================================

-- ============================================
-- TABLE: profiles
-- ============================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert their own profile"
ON profiles FOR INSERT
TO authenticated
WITH CHECK (auth.uid()::text = id);

CREATE POLICY "Users can view their own profile"
ON profiles FOR SELECT
TO authenticated
USING (auth.uid()::text = id);

CREATE POLICY "Users can update their own profile"
ON profiles FOR UPDATE
TO authenticated
USING (auth.uid()::text = id)
WITH CHECK (auth.uid()::text = id);

-- ============================================
-- TABLE: wallets
-- ============================================

ALTER TABLE wallets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert their own wallet"
ON wallets FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid()::text);

CREATE POLICY "Users can view their own wallet"
ON wallets FOR SELECT
TO authenticated
USING (user_id = auth.uid()::text);

CREATE POLICY "Users can update their own wallet"
ON wallets FOR UPDATE
TO authenticated
USING (user_id = auth.uid()::text)
WITH CHECK (user_id = auth.uid()::text);

-- ============================================
-- TABLE: creators
-- ============================================

ALTER TABLE creators ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Creators can insert their own profile"
ON creators FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid()::text);

CREATE POLICY "Anyone can view creator profiles"
ON creators FOR SELECT
TO authenticated, anon
USING (true);

CREATE POLICY "Creators can update their own profile"
ON creators FOR UPDATE
TO authenticated
USING (user_id = auth.uid()::text)
WITH CHECK (user_id = auth.uid()::text);

-- ============================================
-- TABLE: brands
-- ============================================

ALTER TABLE brands ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Brands can insert their own profile"
ON brands FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid()::text);

CREATE POLICY "Anyone can view brand profiles"
ON brands FOR SELECT
TO authenticated, anon
USING (true);

CREATE POLICY "Brands can update their own profile"
ON brands FOR UPDATE
TO authenticated
USING (user_id = auth.uid()::text)
WITH CHECK (user_id = auth.uid()::text);

-- ============================================
-- TABLE: campaigns
-- ============================================

ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Brands can insert campaigns"
ON campaigns FOR INSERT
TO authenticated
WITH CHECK (brand_id = auth.uid()::text);

CREATE POLICY "Anyone can view campaigns"
ON campaigns FOR SELECT
TO authenticated, anon
USING (true);

CREATE POLICY "Brands can update their own campaigns"
ON campaigns FOR UPDATE
TO authenticated
USING (brand_id = auth.uid()::text)
WITH CHECK (brand_id = auth.uid()::text);

CREATE POLICY "Brands can delete their own campaigns"
ON campaigns FOR DELETE
TO authenticated
USING (brand_id = auth.uid()::text);

-- ============================================
-- TABLE: submissions
-- ============================================

ALTER TABLE submissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Creators can insert submissions"
ON submissions FOR INSERT
TO authenticated
WITH CHECK (creator_id = auth.uid()::text);

CREATE POLICY "Creators can view their own submissions"
ON submissions FOR SELECT
TO authenticated
USING (creator_id = auth.uid()::text);

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

CREATE POLICY "Creators can update their own submissions"
ON submissions FOR UPDATE
TO authenticated
USING (creator_id = auth.uid()::text)
WITH CHECK (creator_id = auth.uid()::text);

-- ============================================
-- TABLE: transactions
-- ============================================

ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own transactions"
ON transactions FOR SELECT
TO authenticated
USING (user_id = auth.uid()::text);

CREATE POLICY "Users can insert their own transactions"
ON transactions FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid()::text);

-- ============================================
-- VERIFICATION
-- ============================================

SELECT schemaname, tablename, policyname, permissive, roles, cmd
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
