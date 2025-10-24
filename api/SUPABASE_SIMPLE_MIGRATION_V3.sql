-- =====================================================
-- UGC MAROC - SIMPLE MIGRATION V3 (SANS DÉPENDANCE PROFILES)
-- Crée uniquement les nouvelles tables sans toucher aux existantes
-- =====================================================

-- ===== PAYMENT SYSTEM TABLES =====

-- Orders table (commandes entre brand et creator)
CREATE TABLE IF NOT EXISTS orders (
  id SERIAL PRIMARY KEY,
  brand_id VARCHAR NOT NULL,
  creator_id VARCHAR NOT NULL,
  campaign_id INTEGER,
  agreement_id INTEGER,
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

-- Payments table (paiements Stripe)
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

-- Creator balances table (soldes virtuels des créateurs)
CREATE TABLE IF NOT EXISTS creator_balances (
  id SERIAL PRIMARY KEY,
  creator_id VARCHAR NOT NULL UNIQUE,
  available_balance DECIMAL(10,2) DEFAULT 0.00 NOT NULL,
  pending_withdrawal DECIMAL(10,2) DEFAULT 0.00 NOT NULL,
  total_earned DECIMAL(10,2) DEFAULT 0.00 NOT NULL,
  total_withdrawn DECIMAL(10,2) DEFAULT 0.00 NOT NULL,
  currency VARCHAR DEFAULT 'MAD' NOT NULL,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Payout requests table (demandes de retrait des créateurs)
CREATE TABLE IF NOT EXISTS payout_requests (
  id SERIAL PRIMARY KEY,
  creator_id VARCHAR NOT NULL,
  requested_amount DECIMAL(10,2) NOT NULL,
  bank_fee DECIMAL(10,2) DEFAULT 17.00 NOT NULL,
  net_amount DECIMAL(10,2) NOT NULL,
  bank_details TEXT,
  status VARCHAR DEFAULT 'PENDING' NOT NULL,
  processed_by VARCHAR,
  processed_at TIMESTAMP,
  receipt_url TEXT,
  notes TEXT,
  rejection_reason TEXT,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Webhook events table (journal des événements webhook)
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

-- ===== MARKETPLACE SYSTEM TABLES =====

-- Gigs table (services offerts par les créateurs)
CREATE TABLE IF NOT EXISTS gigs (
  id SERIAL PRIMARY KEY,
  creator_id VARCHAR NOT NULL,
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

-- Gig options table (options supplémentaires pour les gigs)
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

-- Negotiations table (négociations entre brand et creator pour un gig)
CREATE TABLE IF NOT EXISTS negotiations (
  id SERIAL PRIMARY KEY,
  gig_id INTEGER NOT NULL REFERENCES gigs(id) ON DELETE CASCADE,
  brand_id VARCHAR NOT NULL,
  creator_id VARCHAR NOT NULL,
  proposed_price DECIMAL(10,2) NOT NULL,
  proposed_delivery_days INTEGER NOT NULL,
  message TEXT,
  status VARCHAR DEFAULT 'PENDING' NOT NULL,
  initiated_by VARCHAR NOT NULL,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Contracts table (contrats signés entre brand et creator)
CREATE TABLE IF NOT EXISTS contracts (
  id SERIAL PRIMARY KEY,
  gig_id INTEGER NOT NULL REFERENCES gigs(id) ON DELETE CASCADE,
  negotiation_id INTEGER NOT NULL REFERENCES negotiations(id) ON DELETE CASCADE,
  brand_id VARCHAR NOT NULL,
  creator_id VARCHAR NOT NULL,
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

-- ===== INDEXES FOR PERFORMANCE =====

-- Orders indexes
CREATE INDEX IF NOT EXISTS idx_orders_brand_id ON orders(brand_id);
CREATE INDEX IF NOT EXISTS idx_orders_creator_id ON orders(creator_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at);

-- Payments indexes
CREATE INDEX IF NOT EXISTS idx_payments_order_id ON payments(order_id);
CREATE INDEX IF NOT EXISTS idx_payments_payment_intent_id ON payments(payment_intent_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);

-- Creator balances indexes
CREATE INDEX IF NOT EXISTS idx_creator_balances_creator_id ON creator_balances(creator_id);

-- Payout requests indexes
CREATE INDEX IF NOT EXISTS idx_payout_requests_creator_id ON payout_requests(creator_id);
CREATE INDEX IF NOT EXISTS idx_payout_requests_status ON payout_requests(status);
CREATE INDEX IF NOT EXISTS idx_payout_requests_created_at ON payout_requests(created_at);

-- Webhook events indexes
CREATE INDEX IF NOT EXISTS idx_webhook_events_provider ON webhook_events(provider);
CREATE INDEX IF NOT EXISTS idx_webhook_events_event_id ON webhook_events(event_id);
CREATE INDEX IF NOT EXISTS idx_webhook_events_status ON webhook_events(status);

-- Gigs indexes
CREATE INDEX IF NOT EXISTS idx_gigs_creator_id ON gigs(creator_id);
CREATE INDEX IF NOT EXISTS idx_gigs_category ON gigs(category);
CREATE INDEX IF NOT EXISTS idx_gigs_is_active ON gigs(is_active);
CREATE INDEX IF NOT EXISTS idx_gigs_created_at ON gigs(created_at);

-- Gig options indexes
CREATE INDEX IF NOT EXISTS idx_gig_options_gig_id ON gig_options(gig_id);

-- Negotiations indexes
CREATE INDEX IF NOT EXISTS idx_negotiations_gig_id ON negotiations(gig_id);
CREATE INDEX IF NOT EXISTS idx_negotiations_brand_id ON negotiations(brand_id);
CREATE INDEX IF NOT EXISTS idx_negotiations_creator_id ON negotiations(creator_id);
CREATE INDEX IF NOT EXISTS idx_negotiations_status ON negotiations(status);
CREATE INDEX IF NOT EXISTS idx_negotiations_created_at ON negotiations(created_at);

-- Contracts indexes
CREATE INDEX IF NOT EXISTS idx_contracts_gig_id ON contracts(gig_id);
CREATE INDEX IF NOT EXISTS idx_contracts_negotiation_id ON contracts(negotiation_id);
CREATE INDEX IF NOT EXISTS idx_contracts_brand_id ON contracts(brand_id);
CREATE INDEX IF NOT EXISTS idx_contracts_creator_id ON contracts(creator_id);
CREATE INDEX IF NOT EXISTS idx_contracts_status ON contracts(status);
CREATE INDEX IF NOT EXISTS idx_contracts_created_at ON contracts(created_at);

-- ===== ROW LEVEL SECURITY =====
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE creator_balances ENABLE ROW LEVEL SECURITY;
ALTER TABLE payout_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE webhook_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE gigs ENABLE ROW LEVEL SECURITY;
ALTER TABLE gig_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE negotiations ENABLE ROW LEVEL SECURITY;
ALTER TABLE contracts ENABLE ROW LEVEL SECURITY;

-- ===== RLS POLICIES (SIMPLIFIED - NO PROFILES DEPENDENCY) =====

-- Drop existing policies if they exist, then recreate them
DO $$
BEGIN
    -- Orders policies
    IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'orders' AND policyname = 'Users can view their own orders') THEN
        DROP POLICY "Users can view their own orders" ON orders;
    END IF;
    CREATE POLICY "Users can view their own orders" ON orders
      FOR SELECT USING (auth.uid()::text = brand_id OR auth.uid()::text = creator_id);

    IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'orders' AND policyname = 'Brands can create orders') THEN
        DROP POLICY "Brands can create orders" ON orders;
    END IF;
    CREATE POLICY "Brands can create orders" ON orders
      FOR INSERT WITH CHECK (auth.uid()::text = brand_id);

    -- Payments policies
    IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'payments' AND policyname = 'Users can view their own payments') THEN
        DROP POLICY "Users can view their own payments" ON payments;
    END IF;
    CREATE POLICY "Users can view their own payments" ON payments
      FOR SELECT USING (
        EXISTS (
          SELECT 1 FROM orders 
          WHERE orders.id = payments.order_id 
          AND (orders.brand_id = auth.uid()::text OR orders.creator_id = auth.uid()::text)
        )
      );

    -- Creator balances policies
    IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'creator_balances' AND policyname = 'Creators can view their own balance') THEN
        DROP POLICY "Creators can view their own balance" ON creator_balances;
    END IF;
    CREATE POLICY "Creators can view their own balance" ON creator_balances
      FOR SELECT USING (auth.uid()::text = creator_id);

    IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'creator_balances' AND policyname = 'Creators can update their own balance') THEN
        DROP POLICY "Creators can update their own balance" ON creator_balances;
    END IF;
    CREATE POLICY "Creators can update their own balance" ON creator_balances
      FOR UPDATE USING (auth.uid()::text = creator_id);

    -- Payout requests policies (simplified - no admin check)
    IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'payout_requests' AND policyname = 'Creators can manage their own payout requests') THEN
        DROP POLICY "Creators can manage their own payout requests" ON payout_requests;
    END IF;
    CREATE POLICY "Creators can manage their own payout requests" ON payout_requests
      FOR ALL USING (auth.uid()::text = creator_id);

    -- Webhook events policies (simplified - allow all for now)
    IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'webhook_events' AND policyname = 'Allow all webhook events') THEN
        DROP POLICY "Allow all webhook events" ON webhook_events;
    END IF;
    CREATE POLICY "Allow all webhook events" ON webhook_events
      FOR ALL USING (true);

    -- Gigs policies
    IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'gigs' AND policyname = 'Anyone can view active gigs') THEN
        DROP POLICY "Anyone can view active gigs" ON gigs;
    END IF;
    CREATE POLICY "Anyone can view active gigs" ON gigs
      FOR SELECT USING (is_active = true);

    IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'gigs' AND policyname = 'Creators can manage their own gigs') THEN
        DROP POLICY "Creators can manage their own gigs" ON gigs;
    END IF;
    CREATE POLICY "Creators can manage their own gigs" ON gigs
      FOR ALL USING (auth.uid()::text = creator_id);

    -- Gig options policies
    IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'gig_options' AND policyname = 'Anyone can view gig options for active gigs') THEN
        DROP POLICY "Anyone can view gig options for active gigs" ON gig_options;
    END IF;
    CREATE POLICY "Anyone can view gig options for active gigs" ON gig_options
      FOR SELECT USING (
        EXISTS (
          SELECT 1 FROM gigs 
          WHERE gigs.id = gig_options.gig_id 
          AND gigs.is_active = true
        )
      );

    IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'gig_options' AND policyname = 'Creators can manage options for their gigs') THEN
        DROP POLICY "Creators can manage options for their gigs" ON gig_options;
    END IF;
    CREATE POLICY "Creators can manage options for their gigs" ON gig_options
      FOR ALL USING (
        EXISTS (
          SELECT 1 FROM gigs 
          WHERE gigs.id = gig_options.gig_id 
          AND gigs.creator_id = auth.uid()::text
        )
      );

    -- Negotiations policies
    IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'negotiations' AND policyname = 'Users can view their own negotiations') THEN
        DROP POLICY "Users can view their own negotiations" ON negotiations;
    END IF;
    CREATE POLICY "Users can view their own negotiations" ON negotiations
      FOR SELECT USING (auth.uid()::text = brand_id OR auth.uid()::text = creator_id);

    IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'negotiations' AND policyname = 'Users can create negotiations') THEN
        DROP POLICY "Users can create negotiations" ON negotiations;
    END IF;
    CREATE POLICY "Users can create negotiations" ON negotiations
      FOR INSERT WITH CHECK (auth.uid()::text = brand_id OR auth.uid()::text = creator_id);

    IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'negotiations' AND policyname = 'Users can update their own negotiations') THEN
        DROP POLICY "Users can update their own negotiations" ON negotiations;
    END IF;
    CREATE POLICY "Users can update their own negotiations" ON negotiations
      FOR UPDATE USING (auth.uid()::text = brand_id OR auth.uid()::text = creator_id);

    -- Contracts policies
    IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'contracts' AND policyname = 'Users can view their own contracts') THEN
        DROP POLICY "Users can view their own contracts" ON contracts;
    END IF;
    CREATE POLICY "Users can view their own contracts" ON contracts
      FOR SELECT USING (auth.uid()::text = brand_id OR auth.uid()::text = creator_id);

    IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'contracts' AND policyname = 'Users can create contracts') THEN
        DROP POLICY "Users can create contracts" ON contracts;
    END IF;
    CREATE POLICY "Users can create contracts" ON contracts
      FOR INSERT WITH CHECK (auth.uid()::text = brand_id OR auth.uid()::text = creator_id);

    IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'contracts' AND policyname = 'Users can update their own contracts') THEN
        DROP POLICY "Users can update their own contracts" ON contracts;
    END IF;
    CREATE POLICY "Users can update their own contracts" ON contracts
      FOR UPDATE USING (auth.uid()::text = brand_id OR auth.uid()::text = creator_id);

END $$;

-- ===== SUCCESS MESSAGE =====
SELECT '✅ UGC Maroc migration V3 completed successfully! 9 new tables created with simplified RLS policies.' as status;
