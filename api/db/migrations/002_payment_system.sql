-- =====================================================
-- UGC MAROC - PAYMENT SYSTEM MIGRATION
-- Creates payment-related tables (depends on core tables)
-- =====================================================

-- ===== ORDERS TABLE =====
-- Commandes entre brand et creator (remplace wallet system)
CREATE TABLE IF NOT EXISTS orders (
  id SERIAL PRIMARY KEY,
  brand_id VARCHAR NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  creator_id VARCHAR NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  campaign_id INTEGER REFERENCES campaigns(id) ON DELETE CASCADE,
  agreement_id INTEGER REFERENCES campaign_agreements(id) ON DELETE CASCADE,
  source_type VARCHAR DEFAULT 'campaign' NOT NULL, -- 'campaign' | 'marketplace'
  contract_id INTEGER, -- Pour marketplace (will be added later)
  gig_id INTEGER, -- Pour marketplace (will be added later)
  amount_mad DECIMAL(10,2) NOT NULL, -- Montant créateur
  stripe_fee_mad DECIMAL(10,2) NOT NULL, -- Frais Stripe (5%)
  total_paid_mad DECIMAL(10,2) NOT NULL, -- Total payé par brand
  currency VARCHAR DEFAULT 'MAD' NOT NULL,
  status VARCHAR DEFAULT 'PENDING_PAYMENT' NOT NULL, -- 'PENDING_PAYMENT', 'PAID', 'FAILED', 'CANCELLED', 'REFUNDED'
  description TEXT,
  metadata TEXT, -- JSON pour données supplémentaires
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- ===== PAYMENTS TABLE =====
-- Paiements Stripe (PaymentIntent)
CREATE TABLE IF NOT EXISTS payments (
  id SERIAL PRIMARY KEY,
  order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  provider VARCHAR NOT NULL, -- 'stripe' | 'payzone' (future)
  payment_intent_id VARCHAR NOT NULL UNIQUE,
  status VARCHAR DEFAULT 'PENDING' NOT NULL, -- 'PENDING', 'CAPTURED', 'FAILED', 'REFUNDED'
  amount_mad DECIMAL(10,2) NOT NULL,
  currency VARCHAR DEFAULT 'MAD' NOT NULL,
  fee_mad DECIMAL(10,2) DEFAULT 0.00 NOT NULL,
  payload TEXT, -- JSON response Stripe
  webhook_events TEXT DEFAULT '[]', -- JSON array des événements reçus
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- ===== CREATOR BALANCES TABLE =====
-- Soldes virtuels des créateurs (remplace wallets pour creators)
CREATE TABLE IF NOT EXISTS creator_balances (
  id SERIAL PRIMARY KEY,
  creator_id VARCHAR NOT NULL UNIQUE REFERENCES profiles(id) ON DELETE CASCADE,
  available_balance DECIMAL(10,2) DEFAULT 0.00 NOT NULL, -- Disponible pour retrait
  pending_withdrawal DECIMAL(10,2) DEFAULT 0.00 NOT NULL, -- En attente de retrait
  total_earned DECIMAL(10,2) DEFAULT 0.00 NOT NULL, -- Total gagné
  total_withdrawn DECIMAL(10,2) DEFAULT 0.00 NOT NULL, -- Total retiré
  currency VARCHAR DEFAULT 'MAD' NOT NULL,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- ===== PAYOUT REQUESTS TABLE =====
-- Demandes de retrait des créateurs
CREATE TABLE IF NOT EXISTS payout_requests (
  id SERIAL PRIMARY KEY,
  creator_id VARCHAR NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  requested_amount DECIMAL(10,2) NOT NULL,
  bank_fee DECIMAL(10,2) DEFAULT 17.00 NOT NULL, -- Frais bancaires fixes
  net_amount DECIMAL(10,2) NOT NULL, -- Montant final reçu
  bank_details TEXT, -- JSON avec RIB
  status VARCHAR DEFAULT 'PENDING' NOT NULL, -- 'PENDING', 'APPROVED', 'PROCESSING', 'COMPLETED', 'REJECTED', 'CANCELLED'
  processed_by VARCHAR REFERENCES profiles(id) ON DELETE SET NULL, -- Admin qui a traité
  processed_at TIMESTAMP,
  receipt_url TEXT, -- URL du reçu de virement
  notes TEXT, -- Notes admin
  rejection_reason TEXT,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- ===== WEBHOOK EVENTS TABLE =====
-- Journal des événements webhook (idempotence)
CREATE TABLE IF NOT EXISTS webhook_events (
  id SERIAL PRIMARY KEY,
  provider VARCHAR NOT NULL, -- 'stripe' | 'payzone'
  event_id VARCHAR NOT NULL, -- ID unique de l'événement
  event_type VARCHAR NOT NULL, -- Type d'événement
  status VARCHAR DEFAULT 'PENDING' NOT NULL, -- 'PENDING', 'PROCESSED', 'FAILED'
  payload TEXT NOT NULL, -- JSON payload complet
  processed_at TIMESTAMP,
  error_message TEXT,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  UNIQUE(provider, event_id)
);

-- ===== INDEXES FOR PAYMENT TABLES =====
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

-- ===== ROW LEVEL SECURITY =====
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE creator_balances ENABLE ROW LEVEL SECURITY;
ALTER TABLE payout_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE webhook_events ENABLE ROW LEVEL SECURITY;

-- ===== RLS POLICIES =====
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

-- ===== SUCCESS MESSAGE =====
SELECT '✅ Payment system migration completed successfully!' as status;
