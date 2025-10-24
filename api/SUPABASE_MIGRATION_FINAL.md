# 🗄️ MIGRATION FINALE SUPABASE - SOLUTION MANUELLE

## 📋 Instructions pour migration manuelle

### 1. Accéder à l'éditeur SQL Supabase
1. Allez sur https://supabase.com/dashboard
2. Sélectionnez votre projet UGC Maroc
3. Cliquez sur **"SQL Editor"**
4. Cliquez sur **"New query"**

### 2. Exécuter les migrations dans l'ordre

**ÉTAPE 1 - Table de migrations :**
```sql
-- =====================================================
-- UGC MAROC - SCHEMA MIGRATIONS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS schema_migrations (
  id SERIAL PRIMARY KEY,
  version VARCHAR NOT NULL UNIQUE,
  name VARCHAR NOT NULL,
  applied_at TIMESTAMP DEFAULT NOW() NOT NULL,
  checksum VARCHAR,
  execution_time_ms INTEGER
);

CREATE INDEX IF NOT EXISTS idx_schema_migrations_version ON schema_migrations(version);

INSERT INTO schema_migrations (version, name) 
VALUES ('000', 'Schema migrations table created')
ON CONFLICT (version) DO NOTHING;

SELECT '✅ Schema migrations table created!' as status;
```

**ÉTAPE 2 - Tables de base :**
```sql
-- =====================================================
-- UGC MAROC - CORE TABLES
-- =====================================================

-- Profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id VARCHAR PRIMARY KEY,
  email VARCHAR NOT NULL UNIQUE,
  full_name VARCHAR NOT NULL,
  role VARCHAR NOT NULL,
  avatar_url TEXT,
  phone VARCHAR,
  bio TEXT,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Creators table
CREATE TABLE IF NOT EXISTS creators (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  specialization VARCHAR,
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

-- Brands table
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

-- Wallets table
CREATE TABLE IF NOT EXISTS wallets (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR NOT NULL UNIQUE REFERENCES profiles(id) ON DELETE CASCADE,
  balance DECIMAL(10,2) DEFAULT 0.00 NOT NULL,
  pending_balance DECIMAL(10,2) DEFAULT 0.00 NOT NULL,
  currency VARCHAR DEFAULT 'MAD' NOT NULL,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Campaigns table
CREATE TABLE IF NOT EXISTS campaigns (
  id SERIAL PRIMARY KEY,
  brand_id VARCHAR NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title VARCHAR NOT NULL,
  description TEXT NOT NULL,
  budget DECIMAL(10,2),
  price_per_ugc DECIMAL(10,2),
  content_type TEXT,
  video_duration INTEGER,
  start_date TIMESTAMP,
  deadline TIMESTAMP,
  status VARCHAR DEFAULT 'active' NOT NULL,
  category VARCHAR DEFAULT 'other',
  difficulty VARCHAR DEFAULT 'intermediate',
  requirements TEXT,
  target_audience TEXT,
  language VARCHAR,
  platforms TEXT,
  product_name VARCHAR,
  product_link TEXT,
  delivery_method VARCHAR,
  media_files TEXT,
  additional_notes TEXT,
  max_creators INTEGER DEFAULT 10,
  current_creators INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Campaign agreements table
CREATE TABLE IF NOT EXISTS campaign_agreements (
  id SERIAL PRIMARY KEY,
  campaign_id INTEGER NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  brand_id VARCHAR NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  creator_id VARCHAR NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  price_offered DECIMAL(10,2),
  final_price DECIMAL(10,2),
  deadline TIMESTAMP,
  status VARCHAR DEFAULT 'pending' NOT NULL,
  invitation_type VARCHAR NOT NULL,
  custom_terms TEXT,
  custom_clauses TEXT,
  template_clauses TEXT,
  application_message TEXT,
  portfolio_links TEXT,
  delivery_days INTEGER,
  additional_notes TEXT,
  portfolio_files TEXT,
  revision_count INTEGER DEFAULT 0,
  max_revisions INTEGER DEFAULT 2,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL,
  finalized_at TIMESTAMP,
  expires_at TIMESTAMP
);

-- Submissions table
CREATE TABLE IF NOT EXISTS submissions (
  id SERIAL PRIMARY KEY,
  campaign_id INTEGER NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  creator_id VARCHAR NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  agreement_id INTEGER REFERENCES campaign_agreements(id) ON DELETE SET NULL,
  video_url TEXT NOT NULL,
  r2_key TEXT NOT NULL,
  file_size INTEGER,
  status VARCHAR DEFAULT 'pending' NOT NULL,
  feedback TEXT,
  submitted_at TIMESTAMP DEFAULT NOW() NOT NULL,
  reviewed_at TIMESTAMP
);

-- Transactions table
CREATE TABLE IF NOT EXISTS transactions (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  amount DECIMAL(10,2) NOT NULL,
  type VARCHAR NOT NULL,
  status VARCHAR DEFAULT 'pending' NOT NULL,
  description TEXT,
  related_campaign_id INTEGER REFERENCES campaigns(id),
  related_agreement_id INTEGER REFERENCES campaign_agreements(id),
  created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

SELECT '✅ Core tables created!' as status;
```

**ÉTAPE 3 - Système de paiement :**
```sql
-- =====================================================
-- UGC MAROC - PAYMENT SYSTEM
-- =====================================================

-- Orders table
CREATE TABLE IF NOT EXISTS orders (
  id SERIAL PRIMARY KEY,
  brand_id VARCHAR NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  creator_id VARCHAR NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  campaign_id INTEGER REFERENCES campaigns(id) ON DELETE CASCADE,
  agreement_id INTEGER REFERENCES campaign_agreements(id) ON DELETE CASCADE,
  source_type VARCHAR DEFAULT 'campaign' NOT NULL,
  contract_id INTEGER,
  gig_id INTEGER,
  amount_mad DECIMAL(10,2) NOT NULL,
  stripe_fee_mad DECIMAL(10,2) NOT NULL,
  total_paid_mad DECIMAL(10,2) NOT NULL,
  currency VARCHAR DEFAULT 'MAD' NOT NULL,
  status VARCHAR DEFAULT 'PENDING_PAYMENT' NOT NULL,
  description TEXT,
  metadata TEXT,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Payments table
CREATE TABLE IF NOT EXISTS payments (
  id SERIAL PRIMARY KEY,
  order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  provider VARCHAR NOT NULL,
  payment_intent_id VARCHAR NOT NULL UNIQUE,
  status VARCHAR DEFAULT 'PENDING' NOT NULL,
  amount_mad DECIMAL(10,2) NOT NULL,
  currency VARCHAR DEFAULT 'MAD' NOT NULL,
  fee_mad DECIMAL(10,2) DEFAULT 0.00 NOT NULL,
  payload TEXT,
  webhook_events TEXT DEFAULT '[]',
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Creator balances table
CREATE TABLE IF NOT EXISTS creator_balances (
  id SERIAL PRIMARY KEY,
  creator_id VARCHAR NOT NULL UNIQUE REFERENCES profiles(id) ON DELETE CASCADE,
  available_balance DECIMAL(10,2) DEFAULT 0.00 NOT NULL,
  pending_withdrawal DECIMAL(10,2) DEFAULT 0.00 NOT NULL,
  total_earned DECIMAL(10,2) DEFAULT 0.00 NOT NULL,
  total_withdrawn DECIMAL(10,2) DEFAULT 0.00 NOT NULL,
  currency VARCHAR DEFAULT 'MAD' NOT NULL,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Payout requests table
CREATE TABLE IF NOT EXISTS payout_requests (
  id SERIAL PRIMARY KEY,
  creator_id VARCHAR NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  requested_amount DECIMAL(10,2) NOT NULL,
  bank_fee DECIMAL(10,2) DEFAULT 17.00 NOT NULL,
  net_amount DECIMAL(10,2) NOT NULL,
  bank_details TEXT,
  status VARCHAR DEFAULT 'PENDING' NOT NULL,
  processed_by VARCHAR REFERENCES profiles(id) ON DELETE SET NULL,
  processed_at TIMESTAMP,
  receipt_url TEXT,
  notes TEXT,
  rejection_reason TEXT,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Webhook events table
CREATE TABLE IF NOT EXISTS webhook_events (
  id SERIAL PRIMARY KEY,
  provider VARCHAR NOT NULL,
  event_id VARCHAR NOT NULL,
  event_type VARCHAR NOT NULL,
  status VARCHAR DEFAULT 'PENDING' NOT NULL,
  payload TEXT NOT NULL,
  processed_at TIMESTAMP,
  error_message TEXT,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  UNIQUE(provider, event_id)
);

SELECT '✅ Payment system created!' as status;
```

**ÉTAPE 4 - Système marketplace :**
```sql
-- =====================================================
-- UGC MAROC - MARKETPLACE SYSTEM
-- =====================================================

-- Gigs table
CREATE TABLE IF NOT EXISTS gigs (
  id SERIAL PRIMARY KEY,
  creator_id VARCHAR NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title VARCHAR NOT NULL,
  description TEXT NOT NULL,
  category VARCHAR NOT NULL,
  subcategory VARCHAR,
  base_price DECIMAL(10,2) NOT NULL,
  delivery_days INTEGER NOT NULL,
  is_active BOOLEAN DEFAULT true NOT NULL,
  portfolio_files TEXT,
  tags TEXT,
  requirements TEXT,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Gig options table
CREATE TABLE IF NOT EXISTS gig_options (
  id SERIAL PRIMARY KEY,
  gig_id INTEGER NOT NULL REFERENCES gigs(id) ON DELETE CASCADE,
  name VARCHAR NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL,
  delivery_days INTEGER DEFAULT 0,
  is_required BOOLEAN DEFAULT false NOT NULL,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Negotiations table
CREATE TABLE IF NOT EXISTS negotiations (
  id SERIAL PRIMARY KEY,
  gig_id INTEGER NOT NULL REFERENCES gigs(id) ON DELETE CASCADE,
  brand_id VARCHAR NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  creator_id VARCHAR NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  proposed_price DECIMAL(10,2) NOT NULL,
  proposed_delivery_days INTEGER NOT NULL,
  message TEXT,
  status VARCHAR DEFAULT 'PENDING' NOT NULL,
  initiated_by VARCHAR NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Contracts table
CREATE TABLE IF NOT EXISTS contracts (
  id SERIAL PRIMARY KEY,
  gig_id INTEGER NOT NULL REFERENCES gigs(id) ON DELETE CASCADE,
  negotiation_id INTEGER NOT NULL REFERENCES negotiations(id) ON DELETE CASCADE,
  brand_id VARCHAR NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  creator_id VARCHAR NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  final_price DECIMAL(10,2) NOT NULL,
  delivery_days INTEGER NOT NULL,
  requirements TEXT,
  brand_signed_at TIMESTAMP,
  creator_signed_at TIMESTAMP,
  status VARCHAR DEFAULT 'PENDING_SIGNATURES' NOT NULL,
  pdf_url TEXT,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

SELECT '✅ Marketplace system created!' as status;
```

**ÉTAPE 5 - Indexes et RLS :**
```sql
-- =====================================================
-- UGC MAROC - INDEXES AND RLS
-- =====================================================

-- Create indexes for performance
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

CREATE INDEX IF NOT EXISTS idx_orders_brand_id ON orders(brand_id);
CREATE INDEX IF NOT EXISTS idx_orders_creator_id ON orders(creator_id);
CREATE INDEX IF NOT EXISTS idx_orders_campaign_id ON orders(campaign_id);
CREATE INDEX IF NOT EXISTS idx_orders_agreement_id ON orders(agreement_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at);

CREATE INDEX IF NOT EXISTS idx_payments_order_id ON payments(order_id);
CREATE INDEX IF NOT EXISTS idx_payments_payment_intent_id ON payments(payment_intent_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);

CREATE INDEX IF NOT EXISTS idx_creator_balances_creator_id ON creator_balances(creator_id);
CREATE INDEX IF NOT EXISTS idx_payout_requests_creator_id ON payout_requests(creator_id);
CREATE INDEX IF NOT EXISTS idx_payout_requests_status ON payout_requests(status);
CREATE INDEX IF NOT EXISTS idx_payout_requests_created_at ON payout_requests(created_at);

CREATE INDEX IF NOT EXISTS idx_webhook_events_provider ON webhook_events(provider);
CREATE INDEX IF NOT EXISTS idx_webhook_events_event_id ON webhook_events(event_id);
CREATE INDEX IF NOT EXISTS idx_webhook_events_status ON webhook_events(status);

CREATE INDEX IF NOT EXISTS idx_gigs_creator_id ON gigs(creator_id);
CREATE INDEX IF NOT EXISTS idx_gigs_category ON gigs(category);
CREATE INDEX IF NOT EXISTS idx_gigs_subcategory ON gigs(subcategory);
CREATE INDEX IF NOT EXISTS idx_gigs_is_active ON gigs(is_active);
CREATE INDEX IF NOT EXISTS idx_gigs_created_at ON gigs(created_at);

CREATE INDEX IF NOT EXISTS idx_gig_options_gig_id ON gig_options(gig_id);
CREATE INDEX IF NOT EXISTS idx_negotiations_gig_id ON negotiations(gig_id);
CREATE INDEX IF NOT EXISTS idx_negotiations_brand_id ON negotiations(brand_id);
CREATE INDEX IF NOT EXISTS idx_negotiations_creator_id ON negotiations(creator_id);
CREATE INDEX IF NOT EXISTS idx_negotiations_status ON negotiations(status);
CREATE INDEX IF NOT EXISTS idx_negotiations_created_at ON negotiations(created_at);

CREATE INDEX IF NOT EXISTS idx_contracts_gig_id ON contracts(gig_id);
CREATE INDEX IF NOT EXISTS idx_contracts_negotiation_id ON contracts(negotiation_id);
CREATE INDEX IF NOT EXISTS idx_contracts_brand_id ON contracts(brand_id);
CREATE INDEX IF NOT EXISTS idx_contracts_creator_id ON contracts(creator_id);
CREATE INDEX IF NOT EXISTS idx_contracts_status ON contracts(status);
CREATE INDEX IF NOT EXISTS idx_contracts_created_at ON contracts(created_at);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE creators ENABLE ROW LEVEL SECURITY;
ALTER TABLE brands ENABLE ROW LEVEL SECURITY;
ALTER TABLE wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaign_agreements ENABLE ROW LEVEL SECURITY;
ALTER TABLE submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE creator_balances ENABLE ROW LEVEL SECURITY;
ALTER TABLE payout_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE webhook_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE gigs ENABLE ROW LEVEL SECURITY;
ALTER TABLE gig_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE negotiations ENABLE ROW LEVEL SECURITY;
ALTER TABLE contracts ENABLE ROW LEVEL SECURITY;

SELECT '✅ Indexes and RLS enabled!' as status;
```

**ÉTAPE 6 - RLS Policies :**
```sql
-- =====================================================
-- UGC MAROC - RLS POLICIES
-- =====================================================

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

-- Orders policies
CREATE POLICY "Users can view their own orders" ON orders
  FOR SELECT USING (auth.uid()::text = brand_id OR auth.uid()::text = creator_id);

CREATE POLICY "Brands can create orders" ON orders
  FOR INSERT WITH CHECK (auth.uid()::text = brand_id);

-- Payments policies
CREATE POLICY "Users can view their own payments" ON payments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM orders 
      WHERE orders.id = payments.order_id 
      AND (orders.brand_id = auth.uid()::text OR orders.creator_id = auth.uid()::text)
    )
  );

-- Creator balances policies
CREATE POLICY "Creators can view their own balance" ON creator_balances
  FOR SELECT USING (auth.uid()::text = creator_id);

CREATE POLICY "Creators can update their own balance" ON creator_balances
  FOR UPDATE USING (auth.uid()::text = creator_id);

-- Payout requests policies
CREATE POLICY "Creators can manage their own payout requests" ON payout_requests
  FOR ALL USING (auth.uid()::text = creator_id);

CREATE POLICY "Admins can view all payout requests" ON payout_requests
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid()::text 
      AND profiles.role = 'admin'
    )
  );

-- Webhook events policies (admin only)
CREATE POLICY "Only admins can view webhook events" ON webhook_events
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid()::text 
      AND profiles.role = 'admin'
    )
  );

-- Gigs policies
CREATE POLICY "Anyone can view active gigs" ON gigs
  FOR SELECT USING (is_active = true);

CREATE POLICY "Creators can manage their own gigs" ON gigs
  FOR ALL USING (auth.uid()::text = creator_id);

-- Gig options policies
CREATE POLICY "Anyone can view gig options for active gigs" ON gig_options
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM gigs 
      WHERE gigs.id = gig_options.gig_id 
      AND gigs.is_active = true
    )
  );

CREATE POLICY "Creators can manage options for their gigs" ON gig_options
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM gigs 
      WHERE gigs.id = gig_options.gig_id 
      AND gigs.creator_id = auth.uid()::text
    )
  );

-- Negotiations policies
CREATE POLICY "Users can view their own negotiations" ON negotiations
  FOR SELECT USING (auth.uid()::text = brand_id OR auth.uid()::text = creator_id);

CREATE POLICY "Users can create negotiations" ON negotiations
  FOR INSERT WITH CHECK (auth.uid()::text = brand_id OR auth.uid()::text = creator_id);

CREATE POLICY "Users can update their own negotiations" ON negotiations
  FOR UPDATE USING (auth.uid()::text = brand_id OR auth.uid()::text = creator_id);

-- Contracts policies
CREATE POLICY "Users can view their own contracts" ON contracts
  FOR SELECT USING (auth.uid()::text = brand_id OR auth.uid()::text = creator_id);

CREATE POLICY "Users can create contracts" ON contracts
  FOR INSERT WITH CHECK (auth.uid()::text = brand_id OR auth.uid()::text = creator_id);

CREATE POLICY "Users can update their own contracts" ON contracts
  FOR UPDATE USING (auth.uid()::text = brand_id OR auth.uid()::text = creator_id);

SELECT '✅ RLS policies created!' as status;
```

**ÉTAPE 7 - Finalisation :**
```sql
-- =====================================================
-- UGC MAROC - FINALIZATION
-- =====================================================

-- Record all migrations as applied
INSERT INTO schema_migrations (version, name) VALUES 
('001', 'Core tables created'),
('002', 'Payment system created'),
('003', 'Marketplace system created'),
('004', 'Indexes and RLS enabled')
ON CONFLICT (version) DO NOTHING;

-- Final verification
SELECT 
  '🎉 UGC MAROC DATABASE MIGRATION COMPLETED!' as status,
  COUNT(*) as total_tables
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_type = 'BASE TABLE';

-- Show all created tables
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_type = 'BASE TABLE'
ORDER BY table_name;
```

### 3. Vérification finale
Après avoir exécuté toutes les étapes, vérifiez que vous avez ces tables :
- ✅ `schema_migrations`
- ✅ `profiles`, `creators`, `brands`, `wallets`
- ✅ `campaigns`, `campaign_agreements`, `submissions`, `transactions`
- ✅ `orders`, `payments`, `creator_balances`, `payout_requests`, `webhook_events`
- ✅ `gigs`, `gig_options`, `negotiations`, `contracts`

### 4. Test de la connexion
Une fois terminé, testez avec :
```bash
curl http://localhost:5000/api/config
```

## 🎯 Résultat attendu
- ✅ 19 tables créées
- ✅ RLS policies activées
- ✅ Indexes de performance créés
- ✅ Système de migration versionné
- ✅ Base de données prête pour UGC Maroc
