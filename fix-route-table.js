import "dotenv/config";
import postgres from "postgres";
import db from "./config/connect.js";

const client = postgres(process.env.DATABASE_URL);

async function fixRouteTable() {
  try {
    console.log("Adding school_admin_id column to route table if missing...");
    await client`ALTER TABLE route ADD COLUMN IF NOT EXISTS school_admin_id uuid`;
    console.log("✓ Added school_admin_id column");
    try {
      await client`ALTER TABLE route ADD CONSTRAINT IF NOT EXISTS route_school_admin_id_school_admin_id_fk FOREIGN KEY (school_admin_id) REFERENCES school_admin(id) ON DELETE CASCADE ON UPDATE CASCADE`;
      console.log("✓ Added foreign key constraint");
    } catch (e) {
      console.log("Foreign key constraint may already exist or failed:", e.message);
    }

    // Check if columns exist
    const result = await db.execute(`
      SELECT column_name FROM information_schema.columns WHERE table_name = 'route';
    `);
    const columns = result.map(r => r.column_name);

    if (!columns.includes("distance")) {
      await db.execute(`ALTER TABLE "route" ADD COLUMN "distance" integer;`);
      console.log("Added 'distance' column to route table.");
    } else {
      console.log("'distance' column already exists.");
    }

    if (!columns.includes("estimated_duration")) {
      await db.execute(`ALTER TABLE "route" ADD COLUMN "estimated_duration" integer;`);
      console.log("Added 'estimated_duration' column to route table.");
    } else {
      console.log("'estimated_duration' column already exists.");
    }

    console.log("Route table check complete.");
    console.log("✓ Route table fixed!");
  } catch (error) {
    console.error("Error fixing route table:", error);
  } finally {
    await client.end();
  }
}

fixRouteTable().then(() => process.exit(0)); 