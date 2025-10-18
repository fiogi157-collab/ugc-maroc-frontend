-- ============================================
-- UGC Maroc - Row Level Security Policies
-- ============================================

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE creators ENABLE ROW LEVEL SECURITY;
ALTER TABLE brands ENABLE ROW LEVEL SECURITY;
ALTER TABLE wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- ===== PROFILES POLICIES =====

-- Allow users to INSERT their own profile during signup
CREATE POLICY "Users can insert their own profile"
ON profiles FOR INSERT
TO authenticated
WITH CHECK (auth.uid()::text = id);

-- Allow users to SELECT their own profile
CREATE POLICY "Users can view their own profile"
ON profiles FOR SELECT
TO authenticated
USING (auth.uid()::text = id);

-- Allow users to UPDATE their own profile
CREATE POLICY "Users can update their own profile"
ON profiles FOR UPDATE
TO authenticated
USING (auth.uid()::text = id)
WITH CHECK (auth.uid()::text = id);

-- Allow public to view basic profile info (for discovery)
CREATE POLICY "Public can view profiles"
ON profiles FOR SELECT
TO anon
USING (true);

-- ===== CREATORS POLICIES =====

-- Allow creators to insert their own extended profile
CREATE POLICY "Creators can insert their own profile"
ON creators FOR INSERT
TO authenticated
WITH CHECK (
  user_id = auth.uid()::text
);

-- Allow anyone to view creator profiles (for discovery)
CREATE POLICY "Anyone can view creator profiles"
ON creators FOR SELECT
TO authenticated, anon
USING (true);

-- Allow creators to update their own profile
CREATE POLICY "Creators can update their own profile"
ON creators FOR UPDATE
TO authenticated
USING (user_id = auth.uid()::text)
WITH CHECK (user_id = auth.uid()::text);

-- ===== BRANDS POLICIES =====

-- Allow brands to insert their own extended profile
CREATE POLICY "Brands can insert their own profile"
ON brands FOR INSERT
TO authenticated
WITH CHECK (
  user_id = auth.uid()::text
);

-- Allow anyone to view brand profiles
CREATE POLICY "Anyone can view brand profiles"
ON brands FOR SELECT
TO authenticated, anon
USING (true);

-- Allow brands to update their own profile
CREATE POLICY "Brands can update their own profile"
ON brands FOR UPDATE
TO authenticated
USING (user_id = auth.uid()::text)
WITH CHECK (user_id = auth.uid()::text);

-- ===== WALLETS POLICIES =====

-- Allow users to insert their own wallet during signup
CREATE POLICY "Users can insert their own wallet"
ON wallets FOR INSERT
TO authenticated
WITH CHECK (
  user_id = auth.uid()::text
);

-- Allow users to view ONLY their own wallet
CREATE POLICY "Users can view their own wallet"
ON wallets FOR SELECT
TO authenticated
USING (user_id = auth.uid()::text);

-- Allow users to update their own wallet (for balance changes)
CREATE POLICY "Users can update their own wallet"
ON wallets FOR UPDATE
TO authenticated
USING (user_id = auth.uid()::text)
WITH CHECK (user_id = auth.uid()::text);

-- ===== CAMPAIGNS POLICIES =====

-- Allow brands to create campaigns
CREATE POLICY "Brands can create campaigns"
ON campaigns FOR INSERT
TO authenticated
WITH CHECK (
  brand_id = auth.uid()::text
);

-- Allow anyone to view active campaigns
CREATE POLICY "Anyone can view campaigns"
ON campaigns FOR SELECT
TO authenticated, anon
USING (true);

-- Allow brands to update/delete their own campaigns
CREATE POLICY "Brands can update their own campaigns"
ON campaigns FOR UPDATE
TO authenticated
USING (brand_id = auth.uid()::text)
WITH CHECK (brand_id = auth.uid()::text);

CREATE POLICY "Brands can delete their own campaigns"
ON campaigns FOR DELETE
TO authenticated
USING (brand_id = auth.uid()::text);

-- ===== SUBMISSIONS POLICIES =====

-- Allow creators to submit to campaigns
CREATE POLICY "Creators can create submissions"
ON submissions FOR INSERT
TO authenticated
WITH CHECK (
  creator_id = auth.uid()::text
);

-- Allow creators to view their own submissions
CREATE POLICY "Creators can view their own submissions"
ON submissions FOR SELECT
TO authenticated
USING (creator_id = auth.uid()::text);

-- Allow brands to view submissions to their campaigns
CREATE POLICY "Brands can view submissions to their campaigns"
ON submissions FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM campaigns
    WHERE campaigns.id = submissions.campaign_id
    AND campaigns.brand_id = auth.uid()::text
  )
);

-- Allow brands to update submissions to their campaigns
CREATE POLICY "Brands can update submissions to their campaigns"
ON submissions FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM campaigns
    WHERE campaigns.id = submissions.campaign_id
    AND campaigns.brand_id = auth.uid()::text
  )
);

-- ===== TRANSACTIONS POLICIES =====

-- Allow users to view their own transactions
CREATE POLICY "Users can view their own transactions"
ON transactions FOR SELECT
TO authenticated
USING (user_id = auth.uid()::text);

-- Allow system to insert transactions (handled by backend)
CREATE POLICY "System can insert transactions"
ON transactions FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid()::text);
