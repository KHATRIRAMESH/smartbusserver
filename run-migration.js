import "dotenv/config";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import fs from "fs";
import path from "path";

const connectionString = process.env.DATABASE_URL;
const client = postgres(connectionString);
const db = drizzle(client);

async function runMigration() {
  try {
    console.log("Running migration...");
    
    // Read the migration file
    const migrationPath = path.join(process.cwd(), "drizzle/migrations/0004_add_missing_tables.sql");
    const migrationSQL = fs.readFileSync(migrationPath, "utf8");
    
    // Split by statement breakpoints and execute each statement
    const statements = migrationSQL.split("--> statement-breakpoint").map(stmt => stmt.trim()).filter(stmt => stmt.length > 0);
    
    for (const statement of statements) {
      if (statement.trim()) {
        console.log("Executing:", statement.substring(0, 50) + "...");
        await client.unsafe(statement);
      }
    }
    
    console.log("Migration completed successfully!");
  } catch (error) {
    console.error("Migration failed:", error);
  } finally {
    await client.end();
  }
}

runMigration(); 