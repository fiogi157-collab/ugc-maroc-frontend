-- =============================================
-- MIGRATION 004: MARKETPLACE COMPLETE SYSTEM
-- =============================================
-- Système Fiverr Hybride pour UGC Maroc
-- Tables: gigs, gig_options, negotiations, contracts
-- =============================================

-- ===== GIGS TABLE =====
-- Offres créées par les créateurs
CREATE TABLE IF NOT EXISTS gigs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    creator_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    title VARCHAR(200) NOT NULL,
    description TEXT NOT NULL,
    base_price DECIMAL(10,2) NOT NULL,
    delivery_days INTEGER NOT NULL CHECK (delivery_days > 0),
    category VARCHAR(50) NOT NULL,
    languages TEXT[] DEFAULT '{}',
    platforms TEXT[] DEFAULT '{}',
    content_types TEXT[] DEFAULT '{}',
    portfolio_urls TEXT[] DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    views INTEGER DEFAULT 0,
    orders_count INTEGER DEFAULT 0,
    rating DECIMAL(3,2) DEFAULT 0.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index pour performance
CREATE INDEX IF NOT EXISTS idx_gigs_creator_id ON gigs(creator_id);
CREATE INDEX IF NOT EXISTS idx_gigs_category ON gigs(category);
CREATE INDEX IF NOT EXISTS idx_gigs_active ON gigs(is_active);
CREATE INDEX IF NOT EXISTS idx_gigs_rating ON gigs(rating DESC);

-- ===== GIG OPTIONS TABLE =====
-- Options supplémentaires pour chaque gig
CREATE TABLE IF NOT EXISTS gig_options (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    gig_id UUID NOT NULL REFERENCES gigs(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_gig_options_gig_id ON gig_options(gig_id);

-- ===== NEGOTIATIONS TABLE =====
-- Négociations entre brands et créateurs
CREATE TABLE IF NOT EXISTS negotiations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    gig_id UUID NOT NULL REFERENCES gigs(id) ON DELETE CASCADE,
    brand_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    creator_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'expired')),
    proposed_price DECIMAL(10,2) NOT NULL,
    proposed_details TEXT,
    brand_message TEXT,
    creator_response TEXT,
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_negotiations_gig_id ON negotiations(gig_id);
CREATE INDEX IF NOT EXISTS idx_negotiations_brand_id ON negotiations(brand_id);
CREATE INDEX IF NOT EXISTS idx_negotiations_creator_id ON negotiations(creator_id);
CREATE INDEX IF NOT EXISTS idx_negotiations_status ON negotiations(status);

-- ===== CONTRACTS TABLE =====
-- Contrats formels entre parties
CREATE TABLE IF NOT EXISTS contracts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    gig_id UUID NOT NULL REFERENCES gigs(id) ON DELETE CASCADE,
    negotiation_id UUID REFERENCES negotiations(id) ON DELETE SET NULL,
    brand_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    creator_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    
    -- Détails de la commande
    title VARCHAR(200) NOT NULL,
    description TEXT NOT NULL,
    deliverables TEXT,
    delivery_deadline DATE NOT NULL,
    revisions_included INTEGER DEFAULT 1 CHECK (revisions_included >= 0),
    
    -- Financier
    agreed_price DECIMAL(10,2) NOT NULL,
    stripe_fee DECIMAL(10,2) NOT NULL,
    platform_fee DECIMAL(10,2) NOT NULL,
    creator_amount DECIMAL(10,2) NOT NULL,
    total_to_pay DECIMAL(10,2) NOT NULL,
    
    -- Légal
    usage_rights VARCHAR(20) DEFAULT 'non-exclusive' CHECK (usage_rights IN ('exclusive', 'non-exclusive')),
    usage_duration VARCHAR(20) DEFAULT '6 months' CHECK (usage_duration IN ('3 months', '6 months', '1 year', 'unlimited')),
    
    -- Validation
    brand_accepted BOOLEAN DEFAULT false,
    creator_accepted BOOLEAN DEFAULT false,
    brand_signature VARCHAR(255),
    creator_signature VARCHAR(255),
    brand_signed_at TIMESTAMP WITH TIME ZONE,
    creator_signed_at TIMESTAMP WITH TIME ZONE,
    
    -- Status
    status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'pending', 'active', 'completed', 'disputed', 'cancelled')),
    contract_pdf_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_contracts_gig_id ON contracts(gig_id);
CREATE INDEX IF NOT EXISTS idx_contracts_brand_id ON contracts(brand_id);
CREATE INDEX IF NOT EXISTS idx_contracts_creator_id ON contracts(creator_id);
CREATE INDEX IF NOT EXISTS idx_contracts_status ON contracts(status);

-- ===== UPDATE ORDERS TABLE =====
-- Ajouter les colonnes pour le système marketplace
ALTER TABLE orders ADD COLUMN IF NOT EXISTS contract_id UUID REFERENCES contracts(id) ON DELETE SET NULL;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS gig_id UUID REFERENCES gigs(id) ON DELETE SET NULL;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS source_type VARCHAR(20) DEFAULT 'campaign' CHECK (source_type IN ('campaign', 'marketplace'));

-- Index pour les nouvelles colonnes
CREATE INDEX IF NOT EXISTS idx_orders_contract_id ON orders(contract_id);
CREATE INDEX IF NOT EXISTS idx_orders_gig_id ON orders(gig_id);
CREATE INDEX IF NOT EXISTS idx_orders_source_type ON orders(source_type);

-- ===== ROW LEVEL SECURITY (RLS) =====
-- Activer RLS sur toutes les tables
ALTER TABLE gigs ENABLE ROW LEVEL SECURITY;
ALTER TABLE gig_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE negotiations ENABLE ROW LEVEL SECURITY;
ALTER TABLE contracts ENABLE ROW LEVEL SECURITY;

-- ===== GIGS RLS POLICIES =====
-- Les créateurs peuvent voir/modifier leurs propres gigs
CREATE POLICY "Creators can manage their own gigs" ON gigs
    FOR ALL USING (creator_id = auth.uid());

-- Tout le monde peut voir les gigs actifs (marketplace public)
CREATE POLICY "Anyone can view active gigs" ON gigs
    FOR SELECT USING (is_active = true);

-- ===== GIG OPTIONS RLS POLICIES =====
-- Les créateurs peuvent gérer les options de leurs gigs
CREATE POLICY "Creators can manage gig options" ON gig_options
    FOR ALL USING (
        gig_id IN (
            SELECT id FROM gigs WHERE creator_id = auth.uid()
        )
    );

-- ===== NEGOTIATIONS RLS POLICIES =====
-- Les brands et créateurs peuvent voir leurs négociations
CREATE POLICY "Brands can manage their negotiations" ON negotiations
    FOR ALL USING (brand_id = auth.uid());

CREATE POLICY "Creators can manage their negotiations" ON negotiations
    FOR ALL USING (creator_id = auth.uid());

-- ===== CONTRACTS RLS POLICIES =====
-- Les brands et créateurs peuvent voir leurs contrats
CREATE POLICY "Brands can manage their contracts" ON contracts
    FOR ALL USING (brand_id = auth.uid());

CREATE POLICY "Creators can manage their contracts" ON contracts
    FOR ALL USING (creator_id = auth.uid());

-- ===== TRIGGERS =====
-- Trigger pour mettre à jour updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Appliquer le trigger aux tables
CREATE TRIGGER update_gigs_updated_at BEFORE UPDATE ON gigs
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_negotiations_updated_at BEFORE UPDATE ON negotiations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_contracts_updated_at BEFORE UPDATE ON contracts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ===== SAMPLE DATA (OPTIONNEL) =====
-- Insérer quelques gigs d'exemple pour tester
INSERT INTO gigs (creator_id, title, description, base_price, delivery_days, category, languages, platforms, content_types, portfolio_urls) VALUES
(
    (SELECT id FROM profiles WHERE role = 'creator' LIMIT 1),
    'إنشاء فيديو UGC للجمال',
    'سأنشئ فيديو احترافي لعلامتك التجارية في مجال الجمال مع ضمان جودة عالية',
    500.00,
    3,
    'beauty',
    ARRAY['arabic', 'french'],
    ARRAY['instagram', 'tiktok'],
    ARRAY['video'],
    ARRAY['https://example.com/portfolio1.jpg', 'https://example.com/portfolio2.jpg']
),
(
    (SELECT id FROM profiles WHERE role = 'creator' LIMIT 1),
    'تصوير منتجات تقنية',
    'تصوير احترافي لمنتجاتك التقنية مع إضاءة مثالية',
    300.00,
    2,
    'tech',
    ARRAY['arabic'],
    ARRAY['instagram'],
    ARRAY['photo'],
    ARRAY['https://example.com/tech1.jpg']
);

-- ===== SUCCESS MESSAGE =====
SELECT 'Marketplace database tables created successfully!' as message;

