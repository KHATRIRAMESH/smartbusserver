import "dotenv/config";
import postgres from "postgres";

const client = postgres(process.env.DATABASE_URL);

async function fixStopsColumn() {
  try {
    console.log("Dropping stops column...");
    await client`ALTER TABLE route DROP COLUMN IF EXISTS stops`;
    console.log("Adding stops column as jsonb...");
    await client`ALTER TABLE route ADD COLUMN stops jsonb`;
    console.log("✓ stops column is now jsonb");
  } catch (error) {
    console.error("Error fixing stops column:", error);
  } finally {
    await client.end();
  }
}

fixStopsColumn(); 