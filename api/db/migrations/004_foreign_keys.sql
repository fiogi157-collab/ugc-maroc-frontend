-- =====================================================
-- UGC MAROC - FOREIGN KEYS MIGRATION
-- Adds foreign key constraints for marketplace fields
-- =====================================================

-- ===== ADD FOREIGN KEY CONSTRAINTS TO ORDERS =====
-- Add foreign key constraints for marketplace fields in orders table
-- (These are added after all tables exist to avoid dependency issues)

-- Add foreign key constraint for contract_id (if contracts table exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'contracts') THEN
    -- Add foreign key constraint for contract_id
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.table_constraints 
      WHERE constraint_name = 'orders_contract_id_fkey'
    ) THEN
      ALTER TABLE orders 
      ADD CONSTRAINT orders_contract_id_fkey 
      FOREIGN KEY (contract_id) REFERENCES contracts(id) ON DELETE SET NULL;
    END IF;
  END IF;
END $$;

-- Add foreign key constraint for gig_id (if gigs table exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'gigs') THEN
    -- Add foreign key constraint for gig_id
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.table_constraints 
      WHERE constraint_name = 'orders_gig_id_fkey'
    ) THEN
      ALTER TABLE orders 
      ADD CONSTRAINT orders_gig_id_fkey 
      FOREIGN KEY (gig_id) REFERENCES gigs(id) ON DELETE SET NULL;
    END IF;
  END IF;
END $$;

-- ===== ADD FOREIGN KEY CONSTRAINTS TO CAMPAIGN_AGREEMENTS =====
-- Add foreign key constraint for order_id (if orders table exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'orders') THEN
    -- Add foreign key constraint for order_id
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.table_constraints 
      WHERE constraint_name = 'campaign_agreements_order_id_fkey'
    ) THEN
      ALTER TABLE campaign_agreements 
      ADD CONSTRAINT campaign_agreements_order_id_fkey 
      FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE SET NULL;
    END IF;
  END IF;
END $$;

-- ===== ADD FOREIGN KEY CONSTRAINTS TO SUBMISSIONS =====
-- Add foreign key constraint for agreement_id (if campaign_agreements table exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'campaign_agreements') THEN
    -- Add foreign key constraint for agreement_id
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.table_constraints 
      WHERE constraint_name = 'submissions_agreement_id_fkey'
    ) THEN
      ALTER TABLE submissions 
      ADD CONSTRAINT submissions_agreement_id_fkey 
      FOREIGN KEY (agreement_id) REFERENCES campaign_agreements(id) ON DELETE SET NULL;
    END IF;
  END IF;
END $$;

-- ===== SUCCESS MESSAGE =====
SELECT '✅ Foreign keys migration completed successfully!' as status;
