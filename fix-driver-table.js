import "dotenv/config";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

const connectionString = process.env.DATABASE_URL;
const client = postgres(connectionString);

async function fixDriverTable() {
  try {
    console.log("Fixing driver table...");
    
    // Fix the id column default value
    await client`ALTER TABLE driver ALTER COLUMN id SET DEFAULT gen_random_uuid()`;
    console.log("✓ Fixed driver table id default");
    
    // Also fix other tables that might have the same issue
    await client`ALTER TABLE bus ALTER COLUMN id SET DEFAULT gen_random_uuid()`;
    console.log("✓ Fixed bus table id default");
    
    await client`ALTER TABLE route ALTER COLUMN id SET DEFAULT gen_random_uuid()`;
    console.log("✓ Fixed route table id default");
    
    await client`ALTER TABLE parent ALTER COLUMN id SET DEFAULT gen_random_uuid()`;
    console.log("✓ Fixed parent table id default");
    
    await client`ALTER TABLE child ALTER COLUMN id SET DEFAULT gen_random_uuid()`;
    console.log("✓ Fixed child table id default");
    
    console.log("✓ All tables fixed successfully!");
    
  } catch (error) {
    console.error("Error fixing tables:", error);
  } finally {
    await client.end();
  }
}

fixDriverTable(); 