import { drizzle } from "drizzle-orm/node-postgres"; // Importação correta para o driver 'pg'
import { Pool } from "pg";
import * as schema from "./schema";
import "dotenv/config";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export const db = drizzle(pool, { schema });