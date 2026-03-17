import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "./schema";

const { Pool } = pg;

const DATABASE_URL =
  (import.meta as any).env?.DATABASE_URL || process.env.DATABASE_URL;

if (!DATABASE_URL) {
  throw new Error("DATABASE_URL is not set");
}

export const pool = new Pool({
  connectionString: DATABASE_URL,
  ssl: DATABASE_URL.includes("localhost")
    ? undefined
    : { rejectUnauthorized: false },
});

// ✅ IMPORTANT: pass schema so db.query.* works
export const db = drizzle(pool, { schema });