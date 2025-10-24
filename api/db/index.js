import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema.js";
import dotenv from "dotenv";

dotenv.config();

// Supabase connection string format:
// postgresql://postgres.[PROJECT-REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("❌ Supabase credentials not found in environment variables");
  console.error("Please add SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY to your .env file");
  process.exit(1);
}

// Construct connection string from Supabase credentials
const connectionString = `postgresql://postgres:${supabaseKey}@db.arfmvtfkibjadxwnbqjl.supabase.co:5432/postgres`;

// Create PostgreSQL client
const client = postgres(connectionString, { 
  max: 10,
  idle_timeout: 20,
  connect_timeout: 10,
});

// Create Drizzle instance
export const db = drizzle(client, { schema });

// Test connection
try {
  await client`SELECT 1`;
  console.log("✅ Database connection successful");
} catch (error) {
  console.error("❌ Database connection failed:", error.message);
}

export default db;
