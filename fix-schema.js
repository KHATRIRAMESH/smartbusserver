import "dotenv/config";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

const connectionString = process.env.DATABASE_URL;
const client = postgres(connectionString);

async function fixSchema() {
  try {
    console.log("Fixing database schema...");
    
    // Add missing columns to super_admin table
    await client`ALTER TABLE super_admin ADD COLUMN IF NOT EXISTS created_at timestamp DEFAULT now()`;
    await client`ALTER TABLE super_admin ADD COLUMN IF NOT EXISTS updated_at timestamp DEFAULT now()`;
    console.log("✓ Added timestamp columns to super_admin");
    
    // Add missing columns to school table
    await client`ALTER TABLE school ADD COLUMN IF NOT EXISTS created_at timestamp DEFAULT now()`;
    await client`ALTER TABLE school ADD COLUMN IF NOT EXISTS updated_at timestamp DEFAULT now()`;
    console.log("✓ Added timestamp columns to school");
    
    // Add missing columns to school_admin table
    await client`ALTER TABLE school_admin ADD COLUMN IF NOT EXISTS created_at timestamp DEFAULT now()`;
    await client`ALTER TABLE school_admin ADD COLUMN IF NOT EXISTS updated_at timestamp DEFAULT now()`;
    console.log("✓ Added timestamp columns to school_admin");
    
    console.log("✓ Schema fixed successfully!");
    
  } catch (error) {
    console.error("Error fixing schema:", error);
  } finally {
    await client.end();
  }
}

fixSchema(); 