-- =====================================================
-- UGC MAROC - MARKETPLACE SYSTEM MIGRATION
-- Creates marketplace tables (depends on core tables)
-- =====================================================

-- ===== GIGS TABLE =====
-- Services offerts par les créateurs (système Fiverr-like)
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

-- ===== GIG OPTIONS TABLE =====
-- Options supplémentaires pour les gigs (comme Fiverr)
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

-- ===== NEGOTIATIONS TABLE =====
-- Négociations entre brand et creator pour un gig
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

-- ===== CONTRACTS TABLE =====
-- Contrats signés entre brand et creator
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

-- ===== UPDATE ORDERS TABLE FOR MARKETPLACE =====
-- Add foreign key constraints for marketplace fields
-- (These will be added after the tables exist)
-- Note: We'll add these constraints in a separate migration

-- ===== INDEXES FOR MARKETPLACE TABLES =====
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

-- ===== ROW LEVEL SECURITY =====
ALTER TABLE gigs ENABLE ROW LEVEL SECURITY;
ALTER TABLE gig_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE negotiations ENABLE ROW LEVEL SECURITY;
ALTER TABLE contracts ENABLE ROW LEVEL SECURITY;

-- ===== RLS POLICIES =====
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

-- ===== SUCCESS MESSAGE =====
SELECT '✅ Marketplace system migration completed successfully!' as status;