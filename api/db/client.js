import { drizzle } from 'drizzle-orm/node-postgres';
import pkg from 'pg';
const { Pool } = pkg;
import * as schema from './schema.js';

// Create PostgreSQL connection pool
const pool = new Pool({
  host: 'db.arfmvtfkibjadxwnbqjl.supabase.co',
  port: 5432,
  database: 'postgres',
  user: 'postgres',
  password: process.env.SUPABASE_SERVICE_ROLE_KEY,
  ssl: { rejectUnauthorized: false }
});

// Create Drizzle ORM instance
export const db = drizzle(pool, { schema });
