-- =====================================================
-- UGC MAROC - COMPLETE DATABASE MIGRATION
-- Phase 1: Base de données (URGENT)
-- =====================================================

-- ===== PAYMENT SYSTEM TABLES =====

-- Orders table (commandes entre brand et creator)
CREATE TABLE IF NOT EXISTS orders (
  id SERIAL PRIMARY KEY,
  brand_id VARCHAR NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  creator_id VARCHAR NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  campaign_id INTEGER REFERENCES campaigns(id) ON DELETE CASCADE,
  agreement_id INTEGER REFERENCES campaign_agreements(id) ON DELETE CASCADE,
  source_type VARCHAR DEFAULT 'campaign' NOT NULL, -- 'campaign' | 'marketplace'
  contract_id INTEGER, -- Pour marketplace
  gig_id INTEGER, -- Pour marketplace
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

-- Payments table (paiements Stripe)
CREATE TABLE IF NOT EXISTS payments (
  id SERIAL PRIMARY KEY,
  order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  provider VARCHAR NOT NULL, -- 'stripe' | 'payzone'
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

-- Creator balances table (soldes virtuels des créateurs)
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

-- Payout requests table (demandes de retrait des créateurs)
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

-- Webhook events table (journal des événements webhook)
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

-- ===== MARKETPLACE SYSTEM TABLES =====

-- Gigs table (services offerts par les créateurs)
CREATE TABLE IF NOT EXISTS gigs (
  id SERIAL PRIMARY KEY,
  creator_id VARCHAR NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title VARCHAR NOT NULL,
  description TEXT NOT NULL,
  category VARCHAR NOT NULL, -- 'video', 'photo', 'design', 'writing', 'marketing'
  subcategory VARCHAR, -- 'instagram_reel', 'tiktok_video', 'product_photo', etc.
  base_price DECIMAL(10,2) NOT NULL, -- Prix de base en MAD
  delivery_days INTEGER NOT NULL, -- Délai de livraison en jours
  is_active BOOLEAN DEFAULT true NOT NULL,
  portfolio_files TEXT, -- JSON array des URLs des fichiers portfolio
  tags TEXT, -- JSON array des tags
  requirements TEXT, -- Exigences spécifiques
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Gig options table (options supplémentaires pour les gigs)
CREATE TABLE IF NOT EXISTS gig_options (
  id SERIAL PRIMARY KEY,
  gig_id INTEGER NOT NULL REFERENCES gigs(id) ON DELETE CASCADE,
  name VARCHAR NOT NULL, -- 'Révision rapide', 'Fichiers source', etc.
  description TEXT,
  price DECIMAL(10,2) NOT NULL, -- Prix supplémentaire
  delivery_days INTEGER DEFAULT 0, -- Délai supplémentaire
  is_required BOOLEAN DEFAULT false NOT NULL,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Negotiations table (négociations entre brand et creator pour un gig)
CREATE TABLE IF NOT EXISTS negotiations (
  id SERIAL PRIMARY KEY,
  gig_id INTEGER NOT NULL REFERENCES gigs(id) ON DELETE CASCADE,
  brand_id VARCHAR NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  creator_id VARCHAR NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  proposed_price DECIMAL(10,2) NOT NULL,
  proposed_delivery_days INTEGER NOT NULL,
  message TEXT, -- Message de négociation
  status VARCHAR DEFAULT 'PENDING' NOT NULL, -- 'PENDING', 'ACCEPTED', 'REJECTED', 'COUNTERED', 'CANCELLED'
  initiated_by VARCHAR NOT NULL REFERENCES profiles(id) ON DELETE CASCADE, -- Qui a initié
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Contracts table (contrats signés entre brand et creator)
CREATE TABLE IF NOT EXISTS contracts (
  id SERIAL PRIMARY KEY,
  gig_id INTEGER NOT NULL REFERENCES gigs(id) ON DELETE CASCADE,
  negotiation_id INTEGER NOT NULL REFERENCES negotiations(id) ON DELETE CASCADE,
  brand_id VARCHAR NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  creator_id VARCHAR NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  final_price DECIMAL(10,2) NOT NULL,
  delivery_days INTEGER NOT NULL,
  requirements TEXT, -- Exigences spécifiques du contrat
  brand_signed_at TIMESTAMP,
  creator_signed_at TIMESTAMP,
  status VARCHAR DEFAULT 'PENDING_SIGNATURES' NOT NULL, -- 'PENDING_SIGNATURES', 'SIGNED', 'ACTIVE', 'COMPLETED', 'CANCELLED'
  pdf_url TEXT, -- URL du contrat PDF généré
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- ===== ROW LEVEL SECURITY (RLS) POLICIES =====

-- Enable RLS on all tables
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE creator_balances ENABLE ROW LEVEL SECURITY;
ALTER TABLE payout_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE webhook_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE gigs ENABLE ROW LEVEL SECURITY;
ALTER TABLE gig_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE negotiations ENABLE ROW LEVEL SECURITY;
ALTER TABLE contracts ENABLE ROW LEVEL SECURITY;

-- Orders policies
CREATE POLICY "Users can view their own orders" ON orders
  FOR SELECT USING (auth.uid()::text = brand_id OR auth.uid()::text = creator_id);

CREATE POLICY "Brands can create orders" ON orders
  FOR INSERT WITH CHECK (auth.uid()::text = brand_id);

-- Creator balances policies
CREATE POLICY "Creators can view their own balance" ON creator_balances
  FOR SELECT USING (auth.uid()::text = creator_id);

-- Payout requests policies
CREATE POLICY "Creators can manage their own payout requests" ON payout_requests
  FOR ALL USING (auth.uid()::text = creator_id);

-- Gigs policies
CREATE POLICY "Anyone can view active gigs" ON gigs
  FOR SELECT USING (is_active = true);

CREATE POLICY "Creators can manage their own gigs" ON gigs
  FOR ALL USING (auth.uid()::text = creator_id);

-- Negotiations policies
CREATE POLICY "Users can view their own negotiations" ON negotiations
  FOR SELECT USING (auth.uid()::text = brand_id OR auth.uid()::text = creator_id);

CREATE POLICY "Users can create negotiations" ON negotiations
  FOR INSERT WITH CHECK (auth.uid()::text = brand_id OR auth.uid()::text = creator_id);

-- Contracts policies
CREATE POLICY "Users can view their own contracts" ON contracts
  FOR SELECT USING (auth.uid()::text = brand_id OR auth.uid()::text = creator_id);

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

-- Gigs indexes
CREATE INDEX IF NOT EXISTS idx_gigs_creator_id ON gigs(creator_id);
CREATE INDEX IF NOT EXISTS idx_gigs_category ON gigs(category);
CREATE INDEX IF NOT EXISTS idx_gigs_is_active ON gigs(is_active);
CREATE INDEX IF NOT EXISTS idx_gigs_created_at ON gigs(created_at);

-- Negotiations indexes
CREATE INDEX IF NOT EXISTS idx_negotiations_gig_id ON negotiations(gig_id);
CREATE INDEX IF NOT EXISTS idx_negotiations_brand_id ON negotiations(brand_id);
CREATE INDEX IF NOT EXISTS idx_negotiations_creator_id ON negotiations(creator_id);
CREATE INDEX IF NOT EXISTS idx_negotiations_status ON negotiations(status);

-- Contracts indexes
CREATE INDEX IF NOT EXISTS idx_contracts_gig_id ON contracts(gig_id);
CREATE INDEX IF NOT EXISTS idx_contracts_brand_id ON contracts(brand_id);
CREATE INDEX IF NOT EXISTS idx_contracts_creator_id ON contracts(creator_id);
CREATE INDEX IF NOT EXISTS idx_contracts_status ON contracts(status);

-- ===== SUCCESS MESSAGE =====
SELECT '✅ Database migration completed successfully!' as status;
