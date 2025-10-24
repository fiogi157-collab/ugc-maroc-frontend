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

console.log("🔍 Checking existing tables in Supabase...");

try {
  // Create PostgreSQL client
  const client = postgres(connectionString, { 
    max: 1,
    idle_timeout: 20,
    connect_timeout: 10,
  });

  // Query to get all tables in public schema
  const tablesQuery = `
    SELECT 
      table_name,
      table_type
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_type = 'BASE TABLE'
    ORDER BY table_name;
  `;

  console.log("📊 Fetching existing tables...");
  const existingTables = await client.unsafe(tablesQuery);
  
  console.log("\n📋 EXISTING TABLES IN SUPABASE:");
  console.log("=====================================");
  
  if (existingTables.length === 0) {
    console.log("❌ No tables found in public schema");
  } else {
    existingTables.forEach((table, index) => {
      console.log(`${index + 1}. ${table.table_name} (${table.table_type})`);
    });
  }

  // Check for specific tables we need
  const requiredTables = [
    'profiles',
    'campaigns', 
    'campaign_agreements',
    'orders',
    'payments',
    'creator_balances',
    'payout_requests',
    'webhook_events',
    'gigs',
    'gig_options',
    'negotiations',
    'contracts'
  ];

  console.log("\n🎯 REQUIRED TABLES STATUS:");
  console.log("============================");
  
  const existingTableNames = existingTables.map(t => t.table_name);
  const missingTables = [];
  const presentTables = [];

  requiredTables.forEach(tableName => {
    if (existingTableNames.includes(tableName)) {
      console.log(`✅ ${tableName} - EXISTS`);
      presentTables.push(tableName);
    } else {
      console.log(`❌ ${tableName} - MISSING`);
      missingTables.push(tableName);
    }
  });

  console.log("\n📊 SUMMARY:");
  console.log("============");
  console.log(`Total tables found: ${existingTables.length}`);
  console.log(`Required tables present: ${presentTables.length}/${requiredTables.length}`);
  console.log(`Missing tables: ${missingTables.length}`);

  if (missingTables.length > 0) {
    console.log("\n❌ MISSING TABLES:");
    missingTables.forEach(table => console.log(`   - ${table}`));
  }

  // Check for foreign key dependencies
  console.log("\n🔗 CHECKING FOREIGN KEY DEPENDENCIES:");
  console.log("=====================================");
  
  const fkQuery = `
    SELECT 
      tc.table_name,
      kcu.column_name,
      ccu.table_name AS foreign_table_name,
      ccu.column_name AS foreign_column_name
    FROM information_schema.table_constraints AS tc 
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
    JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
      AND ccu.table_schema = tc.table_schema
    WHERE tc.constraint_type = 'FOREIGN KEY' 
    AND tc.table_schema = 'public'
    ORDER BY tc.table_name;
  `;

  const foreignKeys = await client.unsafe(fkQuery);
  
  if (foreignKeys.length > 0) {
    console.log("Existing foreign key relationships:");
    foreignKeys.forEach(fk => {
      console.log(`   ${fk.table_name}.${fk.column_name} → ${fk.foreign_table_name}.${fk.foreign_column_name}`);
    });
  } else {
    console.log("No foreign key relationships found");
  }

  await client.end();
  
  console.log("\n✅ Database analysis completed!");
  
  // Generate migration recommendations
  console.log("\n💡 MIGRATION RECOMMENDATIONS:");
  console.log("==============================");
  
  if (missingTables.length === 0) {
    console.log("🎉 All required tables already exist!");
  } else {
    console.log("📝 Next steps:");
    console.log("1. Create missing tables in dependency order");
    console.log("2. Add foreign key constraints after all tables exist");
    console.log("3. Enable RLS policies");
    console.log("4. Create performance indexes");
  }

} catch (error) {
  console.error("❌ Database analysis failed:", error.message);
  process.exit(1);
}
