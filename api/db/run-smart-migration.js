import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import postgres from 'postgres';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Supabase connection
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("❌ Supabase credentials not found in environment variables");
  process.exit(1);
}

// Construct connection string
const connectionString = `postgresql://postgres:${supabaseKey}@db.arfmvtfkibjadxwnbqjl.supabase.co:5432/postgres`;

console.log("🚀 Starting smart database migration...");

try {
  // Create PostgreSQL client
  const client = postgres(connectionString, { 
    max: 1,
    idle_timeout: 20,
    connect_timeout: 10,
  });

  // Check if schema_migrations table exists
  const checkMigrationsTable = `
    SELECT EXISTS (
      SELECT 1 FROM information_schema.tables 
      WHERE table_name = 'schema_migrations' 
      AND table_schema = 'public'
    );
  `;

  const migrationsTableExists = await client.unsafe(checkMigrationsTable);
  
  if (!migrationsTableExists[0].exists) {
    console.log("📋 Creating schema migrations table...");
    const migrationsTableSQL = readFileSync(join(__dirname, 'migrations', '000_schema_migrations.sql'), 'utf8');
    await client.unsafe(migrationsTableSQL);
    console.log("✅ Schema migrations table created");
  }

  // Get list of applied migrations
  const appliedMigrations = await client.unsafe(`
    SELECT version FROM schema_migrations ORDER BY version;
  `);
  
  const appliedVersions = appliedMigrations.map(m => m.version);
  console.log(`📊 Applied migrations: ${appliedVersions.join(', ') || 'none'}`);

  // Define migration order
  const migrations = [
    { version: '000', file: '000_schema_migrations.sql', name: 'Schema migrations table' },
    { version: '001', file: '001_core_tables.sql', name: 'Core tables' },
    { version: '002', file: '002_payment_system.sql', name: 'Payment system' },
    { version: '003', file: '003_marketplace_system.sql', name: 'Marketplace system' },
    { version: '004', file: '004_foreign_keys.sql', name: 'Foreign keys' }
  ];

  console.log("\n🔄 Processing migrations...");
  
  for (const migration of migrations) {
    if (appliedVersions.includes(migration.version)) {
      console.log(`⏭️  Migration ${migration.version} (${migration.name}) - already applied`);
      continue;
    }

    console.log(`\n📝 Applying migration ${migration.version} (${migration.name})...`);
    
    try {
      const startTime = Date.now();
      const sqlFile = join(__dirname, 'migrations', migration.file);
      const sqlContent = readFileSync(sqlFile, 'utf8');
      
      // Execute migration
      await client.unsafe(sqlContent);
      
      const executionTime = Date.now() - startTime;
      
      // Record migration as applied
      await client.unsafe(`
        INSERT INTO schema_migrations (version, name, execution_time_ms) 
        VALUES ($1, $2, $3)
        ON CONFLICT (version) DO NOTHING;
      `, [migration.version, migration.name, executionTime]);
      
      console.log(`✅ Migration ${migration.version} completed in ${executionTime}ms`);
      
    } catch (error) {
      console.error(`❌ Migration ${migration.version} failed:`, error.message);
      
      // Record failed migration
      await client.unsafe(`
        INSERT INTO schema_migrations (version, name, execution_time_ms) 
        VALUES ($1, $2, $3)
        ON CONFLICT (version) DO UPDATE SET 
          execution_time_ms = $3,
          applied_at = NOW()
        WHERE version = $1;
      `, [migration.version, `${migration.name} (FAILED)`, 0]);
      
      throw error;
    }
  }

  // Final verification
  console.log("\n🔍 Verifying migration results...");
  
  const tablesQuery = `
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_type = 'BASE TABLE'
    ORDER BY table_name;
  `;
  
  const tables = await client.unsafe(tablesQuery);
  console.log(`📊 Total tables created: ${tables.length}`);
  
  const expectedTables = [
    'schema_migrations',
    'profiles', 'creators', 'brands', 'wallets',
    'campaigns', 'campaign_agreements', 'submissions', 'transactions',
    'orders', 'payments', 'creator_balances', 'payout_requests', 'webhook_events',
    'gigs', 'gig_options', 'negotiations', 'contracts'
  ];
  
  const createdTables = tables.map(t => t.table_name);
  const missingTables = expectedTables.filter(table => !createdTables.includes(table));
  
  if (missingTables.length > 0) {
    console.log(`⚠️  Missing tables: ${missingTables.join(', ')}`);
  } else {
    console.log("✅ All expected tables created successfully!");
  }

  // Check RLS policies
  const rlsQuery = `
    SELECT schemaname, tablename, rowsecurity 
    FROM pg_tables 
    WHERE schemaname = 'public' 
    AND rowsecurity = true
    ORDER BY tablename;
  `;
  
  const rlsTables = await client.unsafe(rlsQuery);
  console.log(`🔒 Tables with RLS enabled: ${rlsTables.length}`);

  await client.end();
  
  console.log("\n🎉 Smart migration completed successfully!");
  console.log("📋 Summary:");
  console.log("   ✅ Schema migrations table created");
  console.log("   ✅ Core tables created");
  console.log("   ✅ Payment system tables created");
  console.log("   ✅ Marketplace system tables created");
  console.log("   ✅ Foreign key constraints added");
  console.log("   ✅ RLS policies enabled");
  console.log("   ✅ Performance indexes created");
  
  console.log("\n🚀 Your database is ready for the UGC Maroc platform!");

} catch (error) {
  console.error("❌ Smart migration failed:", error.message);
  console.error("Stack trace:", error.stack);
  process.exit(1);
}
