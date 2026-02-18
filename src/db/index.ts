import { config } from "dotenv";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";

// Load env for CLI scripts (Next.js loads it automatically)
config({ path: ".env.local" });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }, // TODO: do we need to tighten this up?
});

export const db = drizzle(pool, { schema });
