import "dotenv/config";

import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./database/schema.js",
  out: "./drizzle/migrations",

  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL,
  },
});
