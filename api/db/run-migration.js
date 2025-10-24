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

console.log("🚀 Starting database migration...");

try {
  // Create PostgreSQL client
  const client = postgres(connectionString, { 
    max: 1,
    idle_timeout: 20,
    connect_timeout: 10,
  });

  // Read SQL migration file
  const sqlFile = join(__dirname, 'migrations', '005_complete_database.sql');
  const sqlContent = readFileSync(sqlFile, 'utf8');

  console.log("📄 Executing SQL migration...");
  
  // Execute the migration
  await client.unsafe(sqlContent);
  
  console.log("✅ Database migration completed successfully!");
  console.log("📊 Tables created:");
  console.log("   - orders (payment system)");
  console.log("   - payments (Stripe integration)");
  console.log("   - creator_balances (creator wallets)");
  console.log("   - payout_requests (withdrawal requests)");
  console.log("   - webhook_events (Stripe webhooks)");
  console.log("   - gigs (marketplace services)");
  console.log("   - gig_options (service add-ons)");
  console.log("   - negotiations (brand-creator negotiations)");
  console.log("   - contracts (signed agreements)");
  console.log("🔒 Row Level Security (RLS) policies enabled");
  console.log("⚡ Performance indexes created");

  await client.end();
  
} catch (error) {
  console.error("❌ Migration failed:", error.message);
  process.exit(1);
}
