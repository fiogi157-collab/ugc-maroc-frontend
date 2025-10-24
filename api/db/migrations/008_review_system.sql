-- 🎯 MIGRATION 008: Review System & Trust Features
-- UGC Maroc - Système de notation et badges de confiance

-- Table des reviews/notations
CREATE TABLE IF NOT EXISTS reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reviewer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    reviewee_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
    campaign_id UUID REFERENCES campaigns(id) ON DELETE SET NULL,
    gig_id UUID REFERENCES gigs(id) ON DELETE SET NULL,
    
    -- Notation (1-5 étoiles)
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    
    -- Commentaires
    title VARCHAR(200),
    comment TEXT,
    
    -- Catégories de notation
    quality_rating INTEGER CHECK (quality_rating >= 1 AND quality_rating <= 5),
    communication_rating INTEGER CHECK (communication_rating >= 1 AND communication_rating <= 5),
    delivery_rating INTEGER CHECK (delivery_rating >= 1 AND delivery_rating <= 5),
    value_rating INTEGER CHECK (value_rating >= 1 AND value_rating <= 5),
    
    -- Métadonnées
    is_verified BOOLEAN DEFAULT false,
    is_public BOOLEAN DEFAULT true,
    is_featured BOOLEAN DEFAULT false,
    
    -- Statut
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'hidden', 'reported', 'deleted')),
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    reviewed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index pour les performances
CREATE INDEX IF NOT EXISTS idx_reviews_reviewer ON reviews(reviewer_id);
CREATE INDEX IF NOT EXISTS idx_reviews_reviewee ON reviews(reviewee_id);
CREATE INDEX IF NOT EXISTS idx_reviews_order ON reviews(order_id);
CREATE INDEX IF NOT EXISTS idx_reviews_rating ON reviews(rating);
CREATE INDEX IF NOT EXISTS idx_reviews_status ON reviews(status);
CREATE INDEX IF NOT EXISTS idx_reviews_created ON reviews(created_at);

-- Table des badges de vérification
CREATE TABLE IF NOT EXISTS verification_badges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    
    -- Types de badges
    badge_type VARCHAR(50) NOT NULL CHECK (badge_type IN (
        'verified', 'top_rated', 'fast_delivery', 'high_quality', 
        'excellent_communication', 'value_for_money', 'repeat_client',
        'premium_creator', 'brand_verified', 'influencer'
    )),
    
    -- Métadonnées du badge
    title VARCHAR(100) NOT NULL,
    description TEXT,
    icon VARCHAR(50),
    color VARCHAR(20) DEFAULT '#5B13EC',
    
    -- Critères d'attribution
    criteria JSONB,
    
    -- Statut
    is_active BOOLEAN DEFAULT true,
    is_featured BOOLEAN DEFAULT false,
    
    -- Timestamps
    awarded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index pour les badges
CREATE INDEX IF NOT EXISTS idx_badges_user ON verification_badges(user_id);
CREATE INDEX IF NOT EXISTS idx_badges_type ON verification_badges(badge_type);
CREATE INDEX IF NOT EXISTS idx_badges_active ON verification_badges(is_active);

-- Table des statistiques de reviews
CREATE TABLE IF NOT EXISTS review_stats (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    
    -- Statistiques globales
    total_reviews INTEGER DEFAULT 0,
    average_rating DECIMAL(3,2) DEFAULT 0.00,
    
    -- Répartition des notes
    five_star_count INTEGER DEFAULT 0,
    four_star_count INTEGER DEFAULT 0,
    three_star_count INTEGER DEFAULT 0,
    two_star_count INTEGER DEFAULT 0,
    one_star_count INTEGER DEFAULT 0,
    
    -- Statistiques par catégorie
    avg_quality_rating DECIMAL(3,2) DEFAULT 0.00,
    avg_communication_rating DECIMAL(3,2) DEFAULT 0.00,
    avg_delivery_rating DECIMAL(3,2) DEFAULT 0.00,
    avg_value_rating DECIMAL(3,2) DEFAULT 0.00,
    
    -- Métriques de confiance
    response_rate DECIMAL(5,2) DEFAULT 0.00,
    completion_rate DECIMAL(5,2) DEFAULT 0.00,
    repeat_client_rate DECIMAL(5,2) DEFAULT 0.00,
    
    -- Timestamps
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index unique pour les stats
CREATE UNIQUE INDEX IF NOT EXISTS idx_review_stats_user ON review_stats(user_id);

-- Table des reports de reviews
CREATE TABLE IF NOT EXISTS review_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    review_id UUID NOT NULL REFERENCES reviews(id) ON DELETE CASCADE,
    reporter_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    
    -- Raison du report
    reason VARCHAR(50) NOT NULL CHECK (reason IN (
        'inappropriate', 'spam', 'fake', 'harassment', 'other'
    )),
    description TEXT,
    
    -- Statut du report
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'resolved', 'dismissed')),
    admin_notes TEXT,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    resolved_at TIMESTAMP WITH TIME ZONE
);

-- Index pour les reports
CREATE INDEX IF NOT EXISTS idx_reports_review ON review_reports(review_id);
CREATE INDEX IF NOT EXISTS idx_reports_reporter ON review_reports(reporter_id);
CREATE INDEX IF NOT EXISTS idx_reports_status ON review_reports(status);

-- Fonction pour calculer les statistiques de reviews
CREATE OR REPLACE FUNCTION calculate_review_stats(user_id_param UUID)
RETURNS VOID AS $$
DECLARE
    stats RECORD;
BEGIN
    -- Calculer les statistiques
    SELECT 
        COUNT(*) as total_reviews,
        AVG(rating) as average_rating,
        COUNT(CASE WHEN rating = 5 THEN 1 END) as five_star_count,
        COUNT(CASE WHEN rating = 4 THEN 1 END) as four_star_count,
        COUNT(CASE WHEN rating = 3 THEN 1 END) as three_star_count,
        COUNT(CASE WHEN rating = 2 THEN 1 END) as two_star_count,
        COUNT(CASE WHEN rating = 1 THEN 1 END) as one_star_count,
        AVG(quality_rating) as avg_quality_rating,
        AVG(communication_rating) as avg_communication_rating,
        AVG(delivery_rating) as avg_delivery_rating,
        AVG(value_rating) as avg_value_rating
    INTO stats
    FROM reviews 
    WHERE reviewee_id = user_id_param 
    AND status = 'active';
    
    -- Mettre à jour ou insérer les statistiques
    INSERT INTO review_stats (
        user_id, total_reviews, average_rating,
        five_star_count, four_star_count, three_star_count, two_star_count, one_star_count,
        avg_quality_rating, avg_communication_rating, avg_delivery_rating, avg_value_rating,
        last_updated
    ) VALUES (
        user_id_param, 
        COALESCE(stats.total_reviews, 0),
        COALESCE(stats.average_rating, 0.00),
        COALESCE(stats.five_star_count, 0),
        COALESCE(stats.four_star_count, 0),
        COALESCE(stats.three_star_count, 0),
        COALESCE(stats.two_star_count, 0),
        COALESCE(stats.one_star_count, 0),
        COALESCE(stats.avg_quality_rating, 0.00),
        COALESCE(stats.avg_communication_rating, 0.00),
        COALESCE(stats.avg_delivery_rating, 0.00),
        COALESCE(stats.avg_value_rating, 0.00),
        NOW()
    )
    ON CONFLICT (user_id) 
    DO UPDATE SET
        total_reviews = EXCLUDED.total_reviews,
        average_rating = EXCLUDED.average_rating,
        five_star_count = EXCLUDED.five_star_count,
        four_star_count = EXCLUDED.four_star_count,
        three_star_count = EXCLUDED.three_star_count,
        two_star_count = EXCLUDED.two_star_count,
        one_star_count = EXCLUDED.one_star_count,
        avg_quality_rating = EXCLUDED.avg_quality_rating,
        avg_communication_rating = EXCLUDED.avg_communication_rating,
        avg_delivery_rating = EXCLUDED.avg_delivery_rating,
        avg_value_rating = EXCLUDED.avg_value_rating,
        last_updated = NOW();
END;
$$ LANGUAGE plpgsql;

-- Trigger pour recalculer les stats après chaque review
CREATE OR REPLACE FUNCTION trigger_calculate_review_stats()
RETURNS TRIGGER AS $$
BEGIN
    -- Recalculer les stats pour le reviewee
    PERFORM calculate_review_stats(NEW.reviewee_id);
    
    -- Si c'est une update, recalculer aussi pour l'ancien reviewee
    IF TG_OP = 'UPDATE' AND OLD.reviewee_id != NEW.reviewee_id THEN
        PERFORM calculate_review_stats(OLD.reviewee_id);
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Créer les triggers
DROP TRIGGER IF EXISTS trigger_review_stats_insert ON reviews;
DROP TRIGGER IF EXISTS trigger_review_stats_update ON reviews;
DROP TRIGGER IF EXISTS trigger_review_stats_delete ON reviews;

CREATE TRIGGER trigger_review_stats_insert
    AFTER INSERT ON reviews
    FOR EACH ROW
    EXECUTE FUNCTION trigger_calculate_review_stats();

CREATE TRIGGER trigger_review_stats_update
    AFTER UPDATE ON reviews
    FOR EACH ROW
    EXECUTE FUNCTION trigger_calculate_review_stats();

CREATE TRIGGER trigger_review_stats_delete
    AFTER DELETE ON reviews
    FOR EACH ROW
    EXECUTE FUNCTION trigger_calculate_review_stats();

-- Fonction pour attribuer automatiquement des badges
CREATE OR REPLACE FUNCTION assign_verification_badges(user_id_param UUID)
RETURNS VOID AS $$
DECLARE
    user_stats RECORD;
BEGIN
    -- Récupérer les statistiques de l'utilisateur
    SELECT * INTO user_stats
    FROM review_stats 
    WHERE user_id = user_id_param;
    
    -- Badge "Verified" - Utilisateur avec au moins 5 reviews et 4+ étoiles
    IF user_stats.total_reviews >= 5 AND user_stats.average_rating >= 4.0 THEN
        INSERT INTO verification_badges (user_id, badge_type, title, description, icon, color)
        VALUES (user_id_param, 'verified', 'Vérifié', 'Utilisateur vérifié avec d\'excellentes notes', 'verified', '#00C851')
        ON CONFLICT DO NOTHING;
    END IF;
    
    -- Badge "Top Rated" - Utilisateur avec 4.5+ étoiles et 10+ reviews
    IF user_stats.total_reviews >= 10 AND user_stats.average_rating >= 4.5 THEN
        INSERT INTO verification_badges (user_id, badge_type, title, description, icon, color)
        VALUES (user_id_param, 'top_rated', 'Top Rated', 'Excellent créateur avec des notes exceptionnelles', 'star', '#FFD700')
        ON CONFLICT DO NOTHING;
    END IF;
    
    -- Badge "Fast Delivery" - Utilisateur avec 4.5+ en delivery
    IF user_stats.avg_delivery_rating >= 4.5 THEN
        INSERT INTO verification_badges (user_id, badge_type, title, description, icon, color)
        VALUES (user_id_param, 'fast_delivery', 'Livraison Rapide', 'Livraison toujours dans les temps', 'schedule', '#00BCD4')
        ON CONFLICT DO NOTHING;
    END IF;
    
    -- Badge "High Quality" - Utilisateur avec 4.5+ en qualité
    IF user_stats.avg_quality_rating >= 4.5 THEN
        INSERT INTO verification_badges (user_id, badge_type, title, description, icon, color)
        VALUES (user_id_param, 'high_quality', 'Haute Qualité', 'Travail de qualité exceptionnelle', 'diamond', '#9C27B0')
        ON CONFLICT DO NOTHING;
    END IF;
    
    -- Badge "Excellent Communication" - Utilisateur avec 4.5+ en communication
    IF user_stats.avg_communication_rating >= 4.5 THEN
        INSERT INTO verification_badges (user_id, badge_type, title, description, icon, color)
        VALUES (user_id_param, 'excellent_communication', 'Excellente Communication', 'Communication claire et professionnelle', 'chat', '#4CAF50')
        ON CONFLICT DO NOTHING;
    END IF;
    
    -- Badge "Value for Money" - Utilisateur avec 4.5+ en valeur
    IF user_stats.avg_value_rating >= 4.5 THEN
        INSERT INTO verification_badges (user_id, badge_type, title, description, icon, color)
        VALUES (user_id_param, 'value_for_money', 'Rapport Qualité-Prix', 'Excellent rapport qualité-prix', 'attach_money', '#FF9800')
        ON CONFLICT DO NOTHING;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- RLS Policies pour les reviews
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE verification_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE review_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE review_reports ENABLE ROW LEVEL SECURITY;

-- Policies pour reviews
CREATE POLICY "Users can view public reviews" ON reviews
    FOR SELECT USING (is_public = true AND status = 'active');

CREATE POLICY "Users can view their own reviews" ON reviews
    FOR ALL USING (auth.uid()::text = reviewer_id::text OR auth.uid()::text = reviewee_id::text);

CREATE POLICY "Users can create reviews" ON reviews
    FOR INSERT WITH CHECK (auth.uid()::text = reviewer_id::text);

CREATE POLICY "Users can update their own reviews" ON reviews
    FOR UPDATE USING (auth.uid()::text = reviewer_id::text);

-- Policies pour verification_badges
CREATE POLICY "Users can view all badges" ON verification_badges
    FOR SELECT USING (is_active = true);

CREATE POLICY "Users can view their own badges" ON verification_badges
    FOR ALL USING (auth.uid()::text = user_id::text);

-- Policies pour review_stats
CREATE POLICY "Users can view all stats" ON review_stats
    FOR SELECT USING (true);

CREATE POLICY "Users can view their own stats" ON review_stats
    FOR ALL USING (auth.uid()::text = user_id::text);

-- Policies pour review_reports
CREATE POLICY "Users can create reports" ON review_reports
    FOR INSERT WITH CHECK (auth.uid()::text = reporter_id::text);

CREATE POLICY "Users can view their own reports" ON review_reports
    FOR SELECT USING (auth.uid()::text = reporter_id::text);

-- Admin policies
CREATE POLICY "Admins can manage all reviews" ON reviews
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid()::text 
            AND profiles.role = 'admin'
        )
    );

CREATE POLICY "Admins can manage all badges" ON verification_badges
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid()::text 
            AND profiles.role = 'admin'
        )
    );

CREATE POLICY "Admins can manage all reports" ON review_reports
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid()::text 
            AND profiles.role = 'admin'
        )
    );

-- Fonction pour obtenir les reviews d'un utilisateur avec pagination
CREATE OR REPLACE FUNCTION get_user_reviews(
    user_id_param UUID,
    limit_param INTEGER DEFAULT 10,
    offset_param INTEGER DEFAULT 0
)
RETURNS TABLE (
    id UUID,
    reviewer_name VARCHAR,
    reviewer_avatar TEXT,
    rating INTEGER,
    title VARCHAR,
    comment TEXT,
    quality_rating INTEGER,
    communication_rating INTEGER,
    delivery_rating INTEGER,
    value_rating INTEGER,
    is_verified BOOLEAN,
    created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        r.id,
        p.full_name as reviewer_name,
        p.avatar_url as reviewer_avatar,
        r.rating,
        r.title,
        r.comment,
        r.quality_rating,
        r.communication_rating,
        r.delivery_rating,
        r.value_rating,
        r.is_verified,
        r.created_at
    FROM reviews r
    JOIN profiles p ON r.reviewer_id = p.id
    WHERE r.reviewee_id = user_id_param 
    AND r.status = 'active'
    AND r.is_public = true
    ORDER BY r.created_at DESC
    LIMIT limit_param
    OFFSET offset_param;
END;
$$ LANGUAGE plpgsql;

-- Fonction pour obtenir les statistiques d'un utilisateur
CREATE OR REPLACE FUNCTION get_user_review_stats(user_id_param UUID)
RETURNS TABLE (
    total_reviews INTEGER,
    average_rating DECIMAL,
    five_star_count INTEGER,
    four_star_count INTEGER,
    three_star_count INTEGER,
    two_star_count INTEGER,
    one_star_count INTEGER,
    avg_quality_rating DECIMAL,
    avg_communication_rating DECIMAL,
    avg_delivery_rating DECIMAL,
    avg_value_rating DECIMAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        rs.total_reviews,
        rs.average_rating,
        rs.five_star_count,
        rs.four_star_count,
        rs.three_star_count,
        rs.two_star_count,
        rs.one_star_count,
        rs.avg_quality_rating,
        rs.avg_communication_rating,
        rs.avg_delivery_rating,
        rs.avg_value_rating
    FROM review_stats rs
    WHERE rs.user_id = user_id_param;
END;
$$ LANGUAGE plpgsql;

-- Fonction pour obtenir les badges d'un utilisateur
CREATE OR REPLACE FUNCTION get_user_badges(user_id_param UUID)
RETURNS TABLE (
    badge_type VARCHAR,
    title VARCHAR,
    description TEXT,
    icon VARCHAR,
    color VARCHAR,
    awarded_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        vb.badge_type,
        vb.title,
        vb.description,
        vb.icon,
        vb.color,
        vb.awarded_at
    FROM verification_badges vb
    WHERE vb.user_id = user_id_param 
    AND vb.is_active = true
    ORDER BY vb.awarded_at DESC;
END;
$$ LANGUAGE plpgsql;

-- Insertion des badges par défaut
INSERT INTO verification_badges (user_id, badge_type, title, description, icon, color, is_active) VALUES
-- Ces badges seront attribués automatiquement selon les critères
('00000000-0000-0000-0000-000000000000', 'verified', 'Vérifié', 'Utilisateur vérifié avec d\'excellentes notes', 'verified', '#00C851', false),
('00000000-0000-0000-0000-000000000000', 'top_rated', 'Top Rated', 'Excellent créateur avec des notes exceptionnelles', 'star', '#FFD700', false),
('00000000-0000-0000-0000-000000000000', 'fast_delivery', 'Livraison Rapide', 'Livraison toujours dans les temps', 'schedule', '#00BCD4', false),
('00000000-0000-0000-0000-000000000000', 'high_quality', 'Haute Qualité', 'Travail de qualité exceptionnelle', 'diamond', '#9C27B0', false),
('00000000-0000-0000-0000-000000000000', 'excellent_communication', 'Excellente Communication', 'Communication claire et professionnelle', 'chat', '#4CAF50', false),
('00000000-0000-0000-0000-000000000000', 'value_for_money', 'Rapport Qualité-Prix', 'Excellent rapport qualité-prix', 'attach_money', '#FF9800', false)
ON CONFLICT DO NOTHING;

-- ✅ Migration 008 Review System completed successfully!
-- 🎯 Système de notation 5 étoiles avec badges de confiance
-- 📊 Statistiques automatiques et triggers
-- 🛡️ RLS policies pour la sécurité
-- 🏆 Attribution automatique des badges selon les critères
