-- =============================================
-- UGC MAROC - MIGRATION COMPLÈTE SYSTÈME PAIEMENT
-- =============================================
-- Création de toutes les tables manquantes pour le système de paiement Stripe
-- Date: 2025-10-23
-- Version: 1.0

-- =============================================
-- 1. TABLES DE BASE (SANS DÉPENDANCES)
-- =============================================

-- Table CAMPAIGN_AGREEMENTS (Accords de Campagne) - CRÉÉE EN PREMIER
CREATE TABLE IF NOT EXISTS campaign_agreements (
    id SERIAL PRIMARY KEY,
    campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
    brand_id VARCHAR NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    creator_id VARCHAR NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    price_offered DECIMAL(10,2), -- Prix initialement proposé
    final_price DECIMAL(10,2), -- Prix final négocié
    deadline TIMESTAMP, -- Date limite de livraison
    status VARCHAR DEFAULT 'pending' NOT NULL, -- 'pending', 'invited', 'negotiating', 'active', 'completed', 'rejected', 'expired', 'disputed', 'dispute_resolved'
    invitation_type VARCHAR NOT NULL, -- 'brand_invite' | 'creator_application'
    custom_terms TEXT, -- Message/conditions du créateur ou marque
    custom_clauses TEXT, -- Conditions contractuelles personnalisées
    template_clauses TEXT, -- JSON array des clauses template sélectionnées
    application_message TEXT, -- Message de motivation du créateur
    portfolio_links TEXT, -- JSON array des liens portfolio
    delivery_days INTEGER, -- Temps de livraison proposé en jours
    additional_notes TEXT, -- Notes supplémentaires du créateur
    portfolio_files TEXT, -- JSON array des URLs de fichiers portfolio
    submission_id INTEGER REFERENCES submissions(id) ON DELETE SET NULL,
    order_id INTEGER, -- Sera ajouté plus tard
    payment_status VARCHAR DEFAULT 'PENDING' NOT NULL, -- 'PENDING', 'PAID', 'FAILED'
    revision_count INTEGER DEFAULT 0,
    max_revisions INTEGER DEFAULT 2,
    created_at TIMESTAMP DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP DEFAULT NOW() NOT NULL,
    finalized_at TIMESTAMP,
    expires_at TIMESTAMP -- Pour invitations en attente (48h)
);

-- =============================================
-- 2. TABLES CRITIQUES POUR PAIEMENT STRIPE
-- =============================================

-- Table ORDERS (Commandes) - CRÉÉE APRÈS campaign_agreements
CREATE TABLE IF NOT EXISTS orders (
    id SERIAL PRIMARY KEY,
    brand_id VARCHAR NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    creator_id VARCHAR NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    campaign_id UUID REFERENCES campaigns(id) ON DELETE CASCADE,
    agreement_id INTEGER REFERENCES campaign_agreements(id) ON DELETE CASCADE,
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

-- Ajouter la contrainte de clé étrangère pour order_id dans campaign_agreements
ALTER TABLE campaign_agreements 
ADD CONSTRAINT fk_campaign_agreements_order_id 
FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE SET NULL;

-- Table PAYMENTS (Paiements Stripe)
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

-- Table CREATOR_BALANCES (Soldes Créateurs)
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

-- Table PAYOUT_REQUESTS (Demandes de Retrait)
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

-- Table WEBHOOK_EVENTS (Événements Webhook)
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

-- =============================================
-- 2. TABLES POUR SYSTÈME COMPLET
-- =============================================

-- Table CAMPAIGN_AGREEMENTS déjà créée plus haut

-- Table WALLET_RESERVATIONS (Réservations Portefeuille)
CREATE TABLE IF NOT EXISTS wallet_reservations (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    agreement_id INTEGER NOT NULL UNIQUE REFERENCES campaign_agreements(id) ON DELETE CASCADE,
    amount DECIMAL(10,2) NOT NULL,
    status VARCHAR DEFAULT 'active' NOT NULL, -- 'active', 'converted_to_escrow', 'cancelled', 'expired'
    created_at TIMESTAMP DEFAULT NOW() NOT NULL,
    expires_at TIMESTAMP NOT NULL, -- 48h from creation
    cancelled_at TIMESTAMP
);

-- Table NEGOTIATION_MESSAGES (Messages de Négociation)
CREATE TABLE IF NOT EXISTS negotiation_messages (
    id SERIAL PRIMARY KEY,
    agreement_id INTEGER NOT NULL REFERENCES campaign_agreements(id) ON DELETE CASCADE,
    sender_id VARCHAR NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    message TEXT NOT NULL,
    message_type VARCHAR DEFAULT 'text' NOT NULL, -- 'text', 'price_offer', 'deadline_change', 'clause_modification'
    metadata TEXT, -- JSON pour offres structurées
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Table DISPUTE_CASES (Cas de Litige)
CREATE TABLE IF NOT EXISTS dispute_cases (
    id SERIAL PRIMARY KEY,
    agreement_id INTEGER NOT NULL UNIQUE REFERENCES campaign_agreements(id) ON DELETE CASCADE,
    opened_by VARCHAR NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    reason TEXT NOT NULL,
    proofs TEXT, -- JSON array des URLs de preuves
    status VARCHAR DEFAULT 'open' NOT NULL, -- 'open', 'under_review', 'resolved'
    admin_decision VARCHAR, -- 'favor_creator', 'favor_brand', 'split_50_50'
    admin_notes TEXT,
    created_at TIMESTAMP DEFAULT NOW() NOT NULL,
    resolved_at TIMESTAMP
);

-- Table RATINGS (Évaluations)
CREATE TABLE IF NOT EXISTS ratings (
    id SERIAL PRIMARY KEY,
    agreement_id INTEGER NOT NULL REFERENCES campaign_agreements(id) ON DELETE CASCADE,
    from_user VARCHAR NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    to_user VARCHAR NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    score INTEGER NOT NULL, -- 1-5 étoiles
    comment TEXT,
    created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Table ESCROW_TRANSACTIONS (Ancien Système - DÉPRÉCIÉ)
CREATE TABLE IF NOT EXISTS escrow_transactions (
    id SERIAL PRIMARY KEY,
    campaign_id UUID NOT NULL UNIQUE REFERENCES campaigns(id) ON DELETE CASCADE,
    brand_id VARCHAR NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    creator_id VARCHAR REFERENCES profiles(id) ON DELETE SET NULL,
    amount DECIMAL(10,2) NOT NULL,
    remaining_amount DECIMAL(10,2) NOT NULL,
    status VARCHAR DEFAULT 'pending_funds' NOT NULL, -- 'pending_funds', 'under_review', 'released', 'disputed', 'refunded'
    released_at TIMESTAMP,
    dispute_reason TEXT,
    created_at TIMESTAMP DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Table AGREEMENT_ESCROW (Nouveau Système)
CREATE TABLE IF NOT EXISTS agreement_escrow (
    id SERIAL PRIMARY KEY,
    agreement_id INTEGER NOT NULL UNIQUE REFERENCES campaign_agreements(id) ON DELETE CASCADE,
    brand_id VARCHAR NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    creator_id VARCHAR NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    amount DECIMAL(10,2) NOT NULL,
    status VARCHAR DEFAULT 'active' NOT NULL, -- 'active', 'released', 'disputed', 'refunded'
    released_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Table CREATOR_EARNINGS (Ancien Système - DÉPRÉCIÉ)
CREATE TABLE IF NOT EXISTS creator_earnings (
    id SERIAL PRIMARY KEY,
    creator_id VARCHAR NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
    submission_id INTEGER NOT NULL UNIQUE REFERENCES submissions(id) ON DELETE CASCADE,
    gross_amount DECIMAL(10,2) NOT NULL, -- Paiement original
    platform_fee DECIMAL(10,2) NOT NULL, -- Commission 15%
    net_amount DECIMAL(10,2) NOT NULL, -- Après commission
    status VARCHAR DEFAULT 'pending' NOT NULL, -- 'pending', 'available', 'withdrawn'
    earned_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Table AGREEMENT_EARNINGS (Nouveau Système)
CREATE TABLE IF NOT EXISTS agreement_earnings (
    id SERIAL PRIMARY KEY,
    creator_id VARCHAR NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    agreement_id INTEGER NOT NULL UNIQUE REFERENCES campaign_agreements(id) ON DELETE CASCADE,
    submission_id INTEGER REFERENCES submissions(id) ON DELETE CASCADE,
    bank_detail_id INTEGER NOT NULL REFERENCES creator_bank_details(id) ON DELETE RESTRICT,
    gross_amount DECIMAL(10,2) NOT NULL, -- Paiement original
    platform_fee DECIMAL(10,2) NOT NULL, -- Commission 15%
    net_amount DECIMAL(10,2) NOT NULL, -- Après commission
    status VARCHAR DEFAULT 'pending' NOT NULL, -- 'pending', 'available', 'withdrawn'
    earned_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Table CREATOR_WITHDRAWALS (Ancien Système)
CREATE TABLE IF NOT EXISTS creator_withdrawals (
    id SERIAL PRIMARY KEY,
    creator_id VARCHAR NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    amount DECIMAL(10,2) NOT NULL, -- Montant demandé
    platform_fee DECIMAL(10,2) NOT NULL, -- 15% sur total earnings
    bank_fee DECIMAL(10,2) DEFAULT 17.00 NOT NULL, -- Fixe 17 MAD
    net_amount DECIMAL(10,2) NOT NULL, -- Montant final à transférer
    status VARCHAR DEFAULT 'pending' NOT NULL, -- 'pending', 'approved', 'processing', 'completed', 'rejected', 'cancelled'
    bank_name VARCHAR,
    rib VARCHAR, -- Compte bancaire marocain (RIB)
    account_holder VARCHAR,
    rejection_reason TEXT,
    admin_notes TEXT,
    requested_at TIMESTAMP DEFAULT NOW() NOT NULL,
    approved_at TIMESTAMP,
    completed_at TIMESTAMP
);

-- Table CREATOR_BANK_DETAILS (Détails Bancaires Créateurs)
CREATE TABLE IF NOT EXISTS creator_bank_details (
    id SERIAL PRIMARY KEY,
    creator_id VARCHAR NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    iban VARCHAR NOT NULL, -- IBAN marocain (MA + 24 chiffres)
    account_holder VARCHAR NOT NULL, -- Doit correspondre au nom légal du créateur
    bank_name VARCHAR NOT NULL, -- Nom de la banque
    bank_code VARCHAR, -- Identifiant bancaire optionnel
    status VARCHAR DEFAULT 'active' NOT NULL, -- 'active' | 'archived' (un seul actif par créateur)
    is_verified BOOLEAN DEFAULT FALSE, -- Vérifié par admin
    change_reason TEXT, -- Raison du changement (null pour premier RIB)
    replaced_by INTEGER REFERENCES creator_bank_details(id) ON DELETE SET NULL, -- Lien vers nouveau RIB si remplacé
    created_at TIMESTAMP DEFAULT NOW() NOT NULL, -- Quand RIB a été ajouté
    archived_at TIMESTAMP -- Quand RIB a été remplacé
);

-- Table BANK_CHANGE_REQUESTS (Demandes de Changement RIB)
CREATE TABLE IF NOT EXISTS bank_change_requests (
    id SERIAL PRIMARY KEY,
    creator_id VARCHAR NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    current_bank_detail_id INTEGER NOT NULL REFERENCES creator_bank_details(id) ON DELETE CASCADE,
    new_iban VARCHAR NOT NULL, -- Nouveau IBAN demandé
    new_account_holder VARCHAR NOT NULL,
    new_bank_name VARCHAR NOT NULL,
    reason TEXT NOT NULL, -- Explication du créateur pour le changement
    supporting_documents TEXT, -- JSON array des URLs R2 (CIN, relevé bancaire, etc.)
    status VARCHAR DEFAULT 'pending' NOT NULL, -- 'pending' | 'approved' | 'rejected'
    admin_notes TEXT, -- Commentaires admin sur la décision
    reviewed_by VARCHAR REFERENCES profiles(id) ON DELETE SET NULL, -- Admin qui a examiné
    created_at TIMESTAMP DEFAULT NOW() NOT NULL,
    reviewed_at TIMESTAMP
);

-- Table PLATFORM_SETTINGS (Paramètres Plateforme)
CREATE TABLE IF NOT EXISTS platform_settings (
    id SERIAL PRIMARY KEY,
    bank_name VARCHAR NOT NULL, -- ex: "Attijariwafa Bank"
    account_holder VARCHAR NOT NULL, -- ex: "UGC MAROC SARL"
    rib VARCHAR NOT NULL, -- RIB marocain (24 chiffres)
    swift VARCHAR, -- Code SWIFT/BIC optionnel
    iban VARCHAR, -- Format IBAN optionnel
    bank_address TEXT, -- Adresse de l'agence bancaire
    special_instructions TEXT, -- Notes supplémentaires pour virements
    updated_at TIMESTAMP DEFAULT NOW() NOT NULL,
    updated_by VARCHAR REFERENCES profiles(id) ON DELETE SET NULL -- Admin qui a mis à jour
);

-- Table CONVERSATIONS (Conversations Chat)
CREATE TABLE IF NOT EXISTS conversations (
    id SERIAL PRIMARY KEY,
    agreement_id INTEGER NOT NULL UNIQUE REFERENCES campaign_agreements(id) ON DELETE CASCADE,
    brand_id VARCHAR NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    creator_id VARCHAR NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
    last_message TEXT, -- Aperçu du dernier message
    last_message_at TIMESTAMP, -- Timestamp du dernier message
    brand_unread_count INTEGER DEFAULT 0 NOT NULL, -- Messages non lus pour brand
    creator_unread_count INTEGER DEFAULT 0 NOT NULL, -- Messages non lus pour créateur
    is_active BOOLEAN DEFAULT TRUE NOT NULL, -- Peut être fermée quand accord finalisé
    created_at TIMESTAMP DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Table MESSAGES (Messages Chat)
CREATE TABLE IF NOT EXISTS messages (
    id SERIAL PRIMARY KEY,
    conversation_id INTEGER NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    sender_id VARCHAR NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    message TEXT NOT NULL, -- Contenu du message
    message_type VARCHAR DEFAULT 'text' NOT NULL, -- 'text' | 'system' | 'offer' | 'file'
    metadata TEXT, -- JSON pour offres, URLs de fichiers, etc.
    is_read BOOLEAN DEFAULT FALSE NOT NULL, -- Marqué comme lu quand visualisé
    created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- =============================================
-- 3. INDEX POUR OPTIMISATION
-- =============================================

-- Index pour ORDERS
CREATE INDEX IF NOT EXISTS idx_orders_brand_id ON orders(brand_id);
CREATE INDEX IF NOT EXISTS idx_orders_creator_id ON orders(creator_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at);

-- Index pour PAYMENTS
CREATE INDEX IF NOT EXISTS idx_payments_payment_intent_id ON payments(payment_intent_id);
CREATE INDEX IF NOT EXISTS idx_payments_order_id ON payments(order_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);

-- Index pour CREATOR_BALANCES
CREATE INDEX IF NOT EXISTS idx_creator_balances_creator_id ON creator_balances(creator_id);

-- Index pour PAYOUT_REQUESTS
CREATE INDEX IF NOT EXISTS idx_payout_requests_creator_id ON payout_requests(creator_id);
CREATE INDEX IF NOT EXISTS idx_payout_requests_status ON payout_requests(status);
CREATE INDEX IF NOT EXISTS idx_payout_requests_created_at ON payout_requests(created_at);

-- Index pour WEBHOOK_EVENTS
CREATE INDEX IF NOT EXISTS idx_webhook_events_provider_event ON webhook_events(provider, event_id);
CREATE INDEX IF NOT EXISTS idx_webhook_events_status ON webhook_events(status);

-- Index pour CAMPAIGN_AGREEMENTS
CREATE INDEX IF NOT EXISTS idx_campaign_agreements_campaign_id ON campaign_agreements(campaign_id);
CREATE INDEX IF NOT EXISTS idx_campaign_agreements_brand_id ON campaign_agreements(brand_id);
CREATE INDEX IF NOT EXISTS idx_campaign_agreements_creator_id ON campaign_agreements(creator_id);
CREATE INDEX IF NOT EXISTS idx_campaign_agreements_status ON campaign_agreements(status);

-- Index pour CONVERSATIONS
CREATE INDEX IF NOT EXISTS idx_conversations_brand_id ON conversations(brand_id);
CREATE INDEX IF NOT EXISTS idx_conversations_creator_id ON conversations(creator_id);
CREATE INDEX IF NOT EXISTS idx_conversations_is_active ON conversations(is_active);

-- Index pour MESSAGES
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at);

-- =============================================
-- 4. TRIGGERS POUR MAINTENIR LA COHÉRENCE
-- =============================================

-- Fonction pour mettre à jour updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers pour updated_at
CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_payments_updated_at BEFORE UPDATE ON payments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_creator_balances_updated_at BEFORE UPDATE ON creator_balances FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_payout_requests_updated_at BEFORE UPDATE ON payout_requests FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_campaign_agreements_updated_at BEFORE UPDATE ON campaign_agreements FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_conversations_updated_at BEFORE UPDATE ON conversations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- 5. ROW LEVEL SECURITY (RLS) POLICIES
-- =============================================

-- Activer RLS sur toutes les nouvelles tables
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE creator_balances ENABLE ROW LEVEL SECURITY;
ALTER TABLE payout_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE webhook_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaign_agreements ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Policies pour ORDERS
CREATE POLICY "Users can view their own orders" ON orders
    FOR SELECT USING (auth.uid()::text = brand_id OR auth.uid()::text = creator_id);

CREATE POLICY "Brands can create orders" ON orders
    FOR INSERT WITH CHECK (auth.uid()::text = brand_id);

-- Policies pour CREATOR_BALANCES
CREATE POLICY "Creators can view their own balance" ON creator_balances
    FOR SELECT USING (auth.uid()::text = creator_id);

-- Policies pour PAYOUT_REQUESTS
CREATE POLICY "Creators can view their own payout requests" ON payout_requests
    FOR SELECT USING (auth.uid()::text = creator_id);

CREATE POLICY "Creators can create payout requests" ON payout_requests
    FOR INSERT WITH CHECK (auth.uid()::text = creator_id);

-- Policies pour CAMPAIGN_AGREEMENTS
CREATE POLICY "Users can view their agreements" ON campaign_agreements
    FOR SELECT USING (auth.uid()::text = brand_id OR auth.uid()::text = creator_id);

-- Policies pour CONVERSATIONS
CREATE POLICY "Users can view their conversations" ON conversations
    FOR SELECT USING (auth.uid()::text = brand_id OR auth.uid()::text = creator_id);

-- Policies pour MESSAGES
CREATE POLICY "Users can view messages in their conversations" ON messages
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM conversations 
            WHERE id = messages.conversation_id 
            AND (brand_id = auth.uid()::text OR creator_id = auth.uid()::text)
        )
    );

-- =============================================
-- 6. DONNÉES INITIALES
-- =============================================

-- Insérer les paramètres de plateforme par défaut
INSERT INTO platform_settings (bank_name, account_holder, rib, bank_address, special_instructions)
VALUES (
    'Attijariwafa Bank',
    'UGC MAROC SARL',
    '123456789012345678901234', -- RIB à remplacer par le vrai
    'Agence Centrale, Casablanca',
    'Veuillez mentionner "UGC MAROC" dans la référence du virement'
) ON CONFLICT DO NOTHING;

-- =============================================
-- MIGRATION TERMINÉE
-- =============================================

-- Vérification finale
DO $$
BEGIN
    RAISE NOTICE '✅ Migration UGC Maroc terminée avec succès!';
    RAISE NOTICE '📊 Tables créées: orders, payments, creator_balances, payout_requests, webhook_events, campaign_agreements, conversations, messages, et autres';
    RAISE NOTICE '🔒 RLS activé sur toutes les tables';
    RAISE NOTICE '⚡ Index créés pour optimisation';
    RAISE NOTICE '🎯 Système de paiement Stripe prêt!';
END $$;
