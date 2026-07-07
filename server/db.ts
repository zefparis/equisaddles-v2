import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "@shared/schema";

const { Pool } = pg;

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

// Initialize PostgreSQL connection pool for Railway
// Configure SSL to work with Railway's internal proxy
const pool = new Pool({ 
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? {
    rejectUnauthorized: false // Required for Railway's internal proxy
  } : false
});

// Create Drizzle instance with standard PostgreSQL driver
export const db = drizzle(pool, { schema });

// Test connection
console.log("✅ PostgreSQL connection established (Railway)");
console.log("📊 Database URL configured:", process.env.DATABASE_URL.substring(0, 30) + "...");
