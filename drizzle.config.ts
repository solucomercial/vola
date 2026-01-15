import { defineConfig } from "drizzle-kit";
import "dotenv/config";

export default defineConfig({
  schema: "./db/schema.ts", // Onde definiremos as tabelas
  out: "./db/migrations",    // Onde as migrações serão salvas
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
});