-- =====================================================
-- UGC MAROC - SCHEMA MIGRATIONS TABLE
-- Tracks which migrations have been applied
-- =====================================================

-- Create migrations tracking table
CREATE TABLE IF NOT EXISTS schema_migrations (
  id SERIAL PRIMARY KEY,
  version VARCHAR NOT NULL UNIQUE,
  name VARCHAR NOT NULL,
  applied_at TIMESTAMP DEFAULT NOW() NOT NULL,
  checksum VARCHAR, -- Optional: hash of migration content
  execution_time_ms INTEGER -- Optional: how long migration took
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_schema_migrations_version ON schema_migrations(version);

-- Insert initial migration record
INSERT INTO schema_migrations (version, name) 
VALUES ('000', 'Schema migrations table created')
ON CONFLICT (version) DO NOTHING;
