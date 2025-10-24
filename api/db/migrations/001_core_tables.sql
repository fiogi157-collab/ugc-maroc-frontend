-- =====================================================
-- UGC MAROC - CORE TABLES MIGRATION
-- Creates essential tables that other tables depend on
-- =====================================================

-- ===== PROFILES TABLE =====
-- Main user profiles (linked to Supabase auth.users via UUID)
CREATE TABLE IF NOT EXISTS profiles (
  id VARCHAR PRIMARY KEY, -- Supabase auth.users.id (UUID)
  email VARCHAR NOT NULL UNIQUE,
  full_name VARCHAR NOT NULL,
  role VARCHAR NOT NULL, -- 'creator' | 'brand' | 'admin'
  avatar_url TEXT,
  phone VARCHAR,
  bio TEXT,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- ===== CREATORS TABLE =====
-- Extended info for content creators
CREATE TABLE IF NOT EXISTS creators (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  specialization VARCHAR, -- 'fashion', 'tech', 'food', etc.
  portfolio_url TEXT,
  instagram_handle VARCHAR,
  tiktok_handle VARCHAR,
  youtube_handle VARCHAR,
  followers_count INTEGER DEFAULT 0,
  rating DECIMAL(3,2) DEFAULT 0.00,
  completed_campaigns INTEGER DEFAULT 0,
  is_verified BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- ===== BRANDS TABLE =====
-- Extended info for brands/companies
CREATE TABLE IF NOT EXISTS brands (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  company_name VARCHAR NOT NULL,
  industry VARCHAR,
  website TEXT,
  logo_url TEXT,
  description TEXT,
  total_campaigns INTEGER DEFAULT 0,
  is_verified BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- ===== WALLETS TABLE =====
-- Financial wallets for creators and brands
CREATE TABLE IF NOT EXISTS wallets (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR NOT NULL UNIQUE REFERENCES profiles(id) ON DELETE CASCADE,
  balance DECIMAL(10,2) DEFAULT 0.00 NOT NULL,
  pending_balance DECIMAL(10,2) DEFAULT 0.00 NOT NULL,
  currency VARCHAR DEFAULT 'MAD' NOT NULL,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- ===== CAMPAIGNS TABLE =====
-- Marketing campaigns created by brands
CREATE TABLE IF NOT EXISTS campaigns (
  id SERIAL PRIMARY KEY,
  brand_id VARCHAR NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title VARCHAR NOT NULL,
  description TEXT NOT NULL,
  budget DECIMAL(10,2), -- Optional - deprecated in favor of agreements
  price_per_ugc DECIMAL(10,2), -- Price per UGC content
  content_type TEXT, -- JSON array: ['video', 'image', 'story', 'reel']
  video_duration INTEGER, -- in seconds
  start_date TIMESTAMP, -- Optional campaign start
  deadline TIMESTAMP, -- Optional campaign end
  status VARCHAR DEFAULT 'active' NOT NULL, -- 'draft', 'active', 'completed', 'cancelled'
  category VARCHAR DEFAULT 'other', -- 'beauty', 'fashion', 'tech', 'food', 'travel', 'other'
  difficulty VARCHAR DEFAULT 'intermediate', -- 'beginner', 'intermediate', 'expert'
  requirements TEXT,
  target_audience TEXT,
  language VARCHAR, -- 'arabic', 'french', 'darija', 'english'
  platforms TEXT, -- JSON array: ['instagram', 'tiktok', 'youtube', 'facebook']
  product_name VARCHAR, -- Name of product/service
  product_link TEXT, -- Link to product/website
  delivery_method VARCHAR, -- 'free_delivery', 'pickup', 'no_product'
  media_files TEXT, -- JSON array of R2 URLs for product images/videos
  additional_notes TEXT, -- Optional notes/requirements from brand
  max_creators INTEGER DEFAULT 10,
  current_creators INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- ===== CAMPAIGN AGREEMENTS TABLE =====
-- Individual agreements between brand and creator
CREATE TABLE IF NOT EXISTS campaign_agreements (
  id SERIAL PRIMARY KEY,
  campaign_id INTEGER NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  brand_id VARCHAR NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  creator_id VARCHAR NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  price_offered DECIMAL(10,2), -- Initially offered price
  final_price DECIMAL(10,2), -- Final negotiated price
  deadline TIMESTAMP, -- Delivery deadline (optional)
  status VARCHAR DEFAULT 'pending' NOT NULL, -- 'pending', 'invited', 'negotiating', 'active', 'completed', 'rejected', 'expired', 'disputed', 'dispute_resolved'
  invitation_type VARCHAR NOT NULL, -- 'brand_invite' | 'creator_application'
  custom_terms TEXT, -- Message/terms from creator or brand
  custom_clauses TEXT, -- Custom contract conditions
  template_clauses TEXT, -- JSON array of selected template clauses
  application_message TEXT, -- Motivation message from creator
  portfolio_links TEXT, -- JSON array of portfolio URLs
  delivery_days INTEGER, -- Proposed delivery time in days
  additional_notes TEXT, -- Additional notes from creator
  portfolio_files TEXT, -- JSON array of uploaded portfolio file URLs
  revision_count INTEGER DEFAULT 0,
  max_revisions INTEGER DEFAULT 2,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL,
  finalized_at TIMESTAMP,
  expires_at TIMESTAMP -- For pending invitations (48h)
);

-- ===== SUBMISSIONS TABLE =====
-- Creator submissions (linked to agreements)
CREATE TABLE IF NOT EXISTS submissions (
  id SERIAL PRIMARY KEY,
  campaign_id INTEGER NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  creator_id VARCHAR NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  agreement_id INTEGER REFERENCES campaign_agreements(id) ON DELETE SET NULL,
  video_url TEXT NOT NULL, -- Cloudflare R2 URL
  r2_key TEXT NOT NULL, -- R2 storage key
  file_size INTEGER, -- bytes
  status VARCHAR DEFAULT 'pending' NOT NULL, -- 'pending', 'approved', 'rejected', 'revision_requested'
  feedback TEXT,
  submitted_at TIMESTAMP DEFAULT NOW() NOT NULL,
  reviewed_at TIMESTAMP
);

-- ===== TRANSACTIONS TABLE =====
-- Financial transactions history
CREATE TABLE IF NOT EXISTS transactions (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  amount DECIMAL(10,2) NOT NULL,
  type VARCHAR NOT NULL, -- 'deposit', 'withdrawal', 'payment', 'refund', 'earning', 'reservation', 'escrow'
  status VARCHAR DEFAULT 'pending' NOT NULL, -- 'pending', 'completed', 'failed', 'cancelled'
  description TEXT,
  related_campaign_id INTEGER REFERENCES campaigns(id),
  related_agreement_id INTEGER REFERENCES campaign_agreements(id),
  created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- ===== INDEXES FOR CORE TABLES =====
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_creators_user_id ON creators(user_id);
CREATE INDEX IF NOT EXISTS idx_brands_user_id ON brands(user_id);
CREATE INDEX IF NOT EXISTS idx_wallets_user_id ON wallets(user_id);
CREATE INDEX IF NOT EXISTS idx_campaigns_brand_id ON campaigns(brand_id);
CREATE INDEX IF NOT EXISTS idx_campaigns_status ON campaigns(status);
CREATE INDEX IF NOT EXISTS idx_campaign_agreements_campaign_id ON campaign_agreements(campaign_id);
CREATE INDEX IF NOT EXISTS idx_campaign_agreements_brand_id ON campaign_agreements(brand_id);
CREATE INDEX IF NOT EXISTS idx_campaign_agreements_creator_id ON campaign_agreements(creator_id);
CREATE INDEX IF NOT EXISTS idx_submissions_campaign_id ON submissions(campaign_id);
CREATE INDEX IF NOT EXISTS idx_submissions_creator_id ON submissions(creator_id);
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);

-- ===== ROW LEVEL SECURITY =====
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE creators ENABLE ROW LEVEL SECURITY;
ALTER TABLE brands ENABLE ROW LEVEL SECURITY;
ALTER TABLE wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaign_agreements ENABLE ROW LEVEL SECURITY;
ALTER TABLE submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- ===== RLS POLICIES =====
-- Profiles policies
CREATE POLICY "Users can view their own profile" ON profiles
  FOR SELECT USING (auth.uid()::text = id);

CREATE POLICY "Users can update their own profile" ON profiles
  FOR UPDATE USING (auth.uid()::text = id);

-- Creators policies
CREATE POLICY "Users can view creators" ON creators
  FOR SELECT USING (true);

CREATE POLICY "Users can manage their own creator profile" ON creators
  FOR ALL USING (auth.uid()::text = user_id);

-- Brands policies
CREATE POLICY "Users can view brands" ON brands
  FOR SELECT USING (true);

CREATE POLICY "Users can manage their own brand profile" ON brands
  FOR ALL USING (auth.uid()::text = user_id);

-- Campaigns policies
CREATE POLICY "Anyone can view active campaigns" ON campaigns
  FOR SELECT USING (status = 'active');

CREATE POLICY "Brands can manage their own campaigns" ON campaigns
  FOR ALL USING (auth.uid()::text = brand_id);

-- Campaign agreements policies
CREATE POLICY "Users can view their own agreements" ON campaign_agreements
  FOR SELECT USING (auth.uid()::text = brand_id OR auth.uid()::text = creator_id);

CREATE POLICY "Users can create agreements" ON campaign_agreements
  FOR INSERT WITH CHECK (auth.uid()::text = brand_id OR auth.uid()::text = creator_id);

-- Submissions policies
CREATE POLICY "Users can view their own submissions" ON submissions
  FOR SELECT USING (auth.uid()::text = creator_id);

CREATE POLICY "Creators can create submissions" ON submissions
  FOR INSERT WITH CHECK (auth.uid()::text = creator_id);

-- Transactions policies
CREATE POLICY "Users can view their own transactions" ON transactions
  FOR SELECT USING (auth.uid()::text = user_id);

-- ===== SUCCESS MESSAGE =====
SELECT '✅ Core tables migration completed successfully!' as status;
