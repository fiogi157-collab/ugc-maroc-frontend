-- Migration 007: Système de Cookies et Consentements RGPD
-- UGC Maroc - Cookie Management System

-- Table pour stocker les consentements RGPD des utilisateurs
CREATE TABLE IF NOT EXISTS cookie_consents (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    essential BOOLEAN NOT NULL DEFAULT true,
    functional BOOLEAN NOT NULL DEFAULT true,
    analytics BOOLEAN NOT NULL DEFAULT true,
    marketing BOOLEAN NOT NULL DEFAULT false,
    ip_address TEXT,
    user_agent TEXT,
    consent_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table pour les préférences utilisateur
CREATE TABLE IF NOT EXISTS user_preferences (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    language VARCHAR(5) DEFAULT 'ar',
    theme VARCHAR(10) DEFAULT 'light',
    notifications BOOLEAN DEFAULT true,
    auto_save BOOLEAN DEFAULT true,
    email_notifications BOOLEAN DEFAULT true,
    push_notifications BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table pour les événements analytics personnalisés
CREATE TABLE IF NOT EXISTS analytics_events (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    session_id TEXT,
    event_type VARCHAR(100) NOT NULL,
    event_data JSONB,
    page_url TEXT,
    referrer TEXT,
    user_agent TEXT,
    ip_address TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table pour les brouillons auto-sauvegardés
CREATE TABLE IF NOT EXISTS user_drafts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    draft_type VARCHAR(50) NOT NULL, -- 'campaign', 'gig', 'message'
    draft_data JSONB NOT NULL,
    page_url TEXT,
    last_saved TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index pour optimiser les requêtes
CREATE INDEX IF NOT EXISTS idx_cookie_consents_user_id ON cookie_consents(user_id);
CREATE INDEX IF NOT EXISTS idx_cookie_consents_consent_date ON cookie_consents(consent_date);
CREATE INDEX IF NOT EXISTS idx_user_preferences_user_id ON user_preferences(user_id);
CREATE INDEX IF NOT EXISTS idx_analytics_events_user_id ON analytics_events(user_id);
CREATE INDEX IF NOT EXISTS idx_analytics_events_event_type ON analytics_events(event_type);
CREATE INDEX IF NOT EXISTS idx_analytics_events_created_at ON analytics_events(created_at);
CREATE INDEX IF NOT EXISTS idx_user_drafts_user_id ON user_drafts(user_id);
CREATE INDEX IF NOT EXISTS idx_user_drafts_type ON user_drafts(draft_type);

-- Contraintes d'unicité
ALTER TABLE cookie_consents ADD CONSTRAINT unique_user_consent UNIQUE(user_id);
ALTER TABLE user_preferences ADD CONSTRAINT unique_user_preferences UNIQUE(user_id);

-- RLS (Row Level Security) Policies

-- Politiques pour cookie_consents
ALTER TABLE cookie_consents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own consent" ON cookie_consents
    FOR SELECT USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can update their own consent" ON cookie_consents
    FOR UPDATE USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can insert their own consent" ON cookie_consents
    FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);

-- Politiques pour user_preferences
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own preferences" ON user_preferences
    FOR SELECT USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can update their own preferences" ON user_preferences
    FOR UPDATE USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can insert their own preferences" ON user_preferences
    FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);

-- Politiques pour analytics_events
ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own analytics" ON analytics_events
    FOR SELECT USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can insert their own analytics" ON analytics_events
    FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);

-- Politiques pour user_drafts
ALTER TABLE user_drafts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own drafts" ON user_drafts
    FOR SELECT USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can update their own drafts" ON user_drafts
    FOR UPDATE USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can insert their own drafts" ON user_drafts
    FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);

CREATE POLICY "Users can delete their own drafts" ON user_drafts
    FOR DELETE USING (auth.uid()::text = user_id::text);

-- Politiques admin (pour les administrateurs)
CREATE POLICY "Admins can view all consents" ON cookie_consents
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid()::text 
            AND profiles.role = 'admin'
        )
    );

CREATE POLICY "Admins can view all preferences" ON user_preferences
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid()::text 
            AND profiles.role = 'admin'
        )
    );

CREATE POLICY "Admins can view all analytics" ON analytics_events
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid()::text 
            AND profiles.role = 'admin'
        )
    );

-- Fonction pour nettoyer automatiquement les anciens consentements
CREATE OR REPLACE FUNCTION clean_old_consents()
RETURNS void AS $$
BEGIN
    -- Supprimer les consentements de plus de 2 ans sans activité
    DELETE FROM cookie_consents 
    WHERE last_updated < NOW() - INTERVAL '2 years';
    
    -- Supprimer les événements analytics de plus de 13 mois
    DELETE FROM analytics_events 
    WHERE created_at < NOW() - INTERVAL '13 months';
    
    -- Supprimer les brouillons de plus de 30 jours
    DELETE FROM user_drafts 
    WHERE last_saved < NOW() - INTERVAL '30 days';
END;
$$ LANGUAGE plpgsql;

-- Fonction pour mettre à jour les timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers pour mettre à jour automatiquement les timestamps
CREATE TRIGGER update_cookie_consents_updated_at 
    BEFORE UPDATE ON cookie_consents 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_preferences_updated_at 
    BEFORE UPDATE ON user_preferences 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Fonction pour créer des préférences par défaut lors de l'inscription
CREATE OR REPLACE FUNCTION create_default_user_preferences()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO user_preferences (user_id, language, theme, notifications, auto_save, email_notifications, push_notifications)
    VALUES (NEW.id, 'ar', 'light', true, true, true, false);
    
    -- Créer un consentement par défaut (Option B+ - Équilibrée)
    INSERT INTO cookie_consents (user_id, essential, functional, analytics, marketing)
    VALUES (NEW.id, true, true, true, false);
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger pour créer automatiquement les préférences par défaut
CREATE TRIGGER create_default_preferences_trigger
    AFTER INSERT ON profiles
    FOR EACH ROW EXECUTE FUNCTION create_default_user_preferences();

-- Données de test (optionnel - à supprimer en production)
-- INSERT INTO cookie_consents (user_id, essential, functional, analytics, marketing)
-- VALUES ('00000000-0000-0000-0000-000000000000', true, true, true, false);

-- Commentaires sur les tables
COMMENT ON TABLE cookie_consents IS 'Stockage des consentements RGPD des utilisateurs';
COMMENT ON TABLE user_preferences IS 'Préférences utilisateur (langue, thème, notifications)';
COMMENT ON TABLE analytics_events IS 'Événements analytics personnalisés pour UGC Maroc';
COMMENT ON TABLE user_drafts IS 'Brouillons auto-sauvegardés (campagnes, gigs, messages)';

COMMENT ON COLUMN cookie_consents.essential IS 'Cookies essentiels (toujours true)';
COMMENT ON COLUMN cookie_consents.functional IS 'Cookies fonctionnels (pré-coché)';
COMMENT ON COLUMN cookie_consents.analytics IS 'Cookies analytics (pré-coché)';
COMMENT ON COLUMN cookie_consents.marketing IS 'Cookies marketing (opt-in)';

COMMENT ON COLUMN user_preferences.language IS 'Langue préférée (ar, fr, en)';
COMMENT ON COLUMN user_preferences.theme IS 'Thème (light, dark)';
COMMENT ON COLUMN user_preferences.auto_save IS 'Auto-sauvegarde activée';

COMMENT ON COLUMN analytics_events.event_type IS 'Type d événement (campaign_viewed, gig_created, etc.)';
COMMENT ON COLUMN analytics_events.event_data IS 'Données JSON de l événement';

COMMENT ON COLUMN user_drafts.draft_type IS 'Type de brouillon (campaign, gig, message)';
COMMENT ON COLUMN user_drafts.draft_data IS 'Données JSON du brouillon';

-- Vérification de la migration
DO $$
BEGIN
    RAISE NOTICE 'Migration 007 completed successfully!';
    RAISE NOTICE 'Tables created: cookie_consents, user_preferences, analytics_events, user_drafts';
    RAISE NOTICE 'RLS policies enabled for all tables';
    RAISE NOTICE 'Triggers created for automatic timestamp updates and default preferences';
END $$;
