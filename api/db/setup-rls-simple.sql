-- ============================================
-- SETUP RLS SIMPLE - UGC MAROC
-- ============================================
-- Version simplifiée pour débloquer l'authentification
-- Politiques permissives qui seront affinées plus tard
-- ============================================

-- Nettoyer toutes les politiques existantes
DO $$ 
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT schemaname, tablename, policyname 
              FROM pg_policies 
              WHERE schemaname = 'public') 
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', 
                      r.policyname, r.schemaname, r.tablename);
    END LOOP;
END $$;

-- ============================================
-- PROFILES - Politiques simplifiées
-- ============================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Permettre à tous les utilisateurs authentifiés de tout faire
CREATE POLICY "authenticated_all" ON profiles
    FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- ============================================
-- WALLETS - Politiques simplifiées
-- ============================================

ALTER TABLE wallets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "authenticated_all" ON wallets
    FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- ============================================
-- CREATORS - Politiques simplifiées
-- ============================================

ALTER TABLE creators ENABLE ROW LEVEL SECURITY;

CREATE POLICY "authenticated_all" ON creators
    FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- Permettre aussi aux utilisateurs non-authentifiés de voir les créateurs
CREATE POLICY "anon_select" ON creators
    FOR SELECT
    TO anon
    USING (true);

-- ============================================
-- BRANDS - Politiques simplifiées
-- ============================================

ALTER TABLE brands ENABLE ROW LEVEL SECURITY;

CREATE POLICY "authenticated_all" ON brands
    FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

CREATE POLICY "anon_select" ON brands
    FOR SELECT
    TO anon
    USING (true);

-- ============================================
-- CAMPAIGNS - Politiques simplifiées
-- ============================================

ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "authenticated_all" ON campaigns
    FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

CREATE POLICY "anon_select" ON campaigns
    FOR SELECT
    TO anon
    USING (true);

-- ============================================
-- SUBMISSIONS - Politiques simplifiées
-- ============================================

ALTER TABLE submissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "authenticated_all" ON submissions
    FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- ============================================
-- TRANSACTIONS - Politiques simplifiées
-- ============================================

ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "authenticated_all" ON transactions
    FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- ============================================
-- VERIFICATION
-- ============================================

SELECT 
    tablename, 
    COUNT(*) as policy_count
FROM pg_policies 
WHERE schemaname = 'public'
GROUP BY tablename
ORDER BY tablename;
