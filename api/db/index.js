import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema.js";
import dotenv from "dotenv";

dotenv.config();

// Supabase connection string format:
// postgresql://postgres.[PROJECT-REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres
const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error("❌ DATABASE_URL not found in environment variables");
  console.error("Please add DATABASE_URL to your Replit Secrets");
  process.exit(1);
}

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
