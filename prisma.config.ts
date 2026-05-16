import { defineConfig } from "prisma/config";
import { config } from "dotenv";

// Load .env.local for local dev; in CI env vars are injected directly
config({ path: ".env.local" });

export default defineConfig({
  schema: "prisma/schema.prisma",
  datasource: {
    url: process.env.DIRECT_URL ?? process.env.DATABASE_URL ?? "",
  },
});
