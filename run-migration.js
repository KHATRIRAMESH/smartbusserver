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
    const migrationPath = path.join(process.cwd(), "drizzle/migrations/0004_route_cascade.sql");
    const migrationSQL = fs.readFileSync(migrationPath, "utf8");
    
    // Execute each statement
    const statements = migrationSQL.split(';').map(stmt => stmt.trim()).filter(stmt => stmt.length > 0);
    
    for (const statement of statements) {
      if (statement.trim()) {
        console.log("Executing:", statement.substring(0, 100) + "...");
        await client.unsafe(statement + ';');
      }
    }
    
    console.log("Migration completed successfully!");
  } catch (error) {
    console.error("Migration failed:", error);
    if (error.code === 'ENOENT') {
      console.error("Migration file not found. Please check if the file exists in the migrations directory.");
    }
  } finally {
    await client.end();
  }
}

runMigration(); 