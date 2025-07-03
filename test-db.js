import "dotenv/config";
import postgres from "postgres";

const client = postgres(process.env.DATABASE_URL);

async function testDB() {
  try {
    console.log("Testing database connection...");
    
    // Test connection
    const result = await client`SELECT 1 as test`;
    console.log("✓ Database connection successful:", result);
    
    // Check if driver table exists
    try {
      const driverCheck = await client`SELECT * FROM driver LIMIT 1`;
      console.log("✓ Driver table exists");
    } catch (e) {
      console.log("✗ Driver table does not exist, creating...");
      
      // Create driver table
      await client`
        CREATE TABLE IF NOT EXISTS "driver" (
          "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
          "name" text NOT NULL,
          "email" text NOT NULL,
          "phone" text NOT NULL,
          "license_number" text NOT NULL,
          "address" text,
          "is_active" boolean DEFAULT true,
          "school_admin_id" uuid NOT NULL,
          "created_at" timestamp DEFAULT now(),
          "updated_at" timestamp DEFAULT now(),
          CONSTRAINT "driver_email_unique" UNIQUE("email"),
          CONSTRAINT "driver_license_number_unique" UNIQUE("license_number")
        )
      `;
      console.log("✓ Driver table created");
    }
    
    // Check if bus table exists
    try {
      const busCheck = await client`SELECT * FROM bus LIMIT 1`;
      console.log("✓ Bus table exists");
    } catch (e) {
      console.log("✗ Bus table does not exist, creating...");
      
      // Create bus table
      await client`
        CREATE TABLE IF NOT EXISTS "bus" (
          "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
          "bus_number" text NOT NULL,
          "capacity" integer NOT NULL,
          "model" text,
          "plate_number" text NOT NULL,
          "is_active" boolean DEFAULT true,
          "driver_id" uuid,
          "school_admin_id" uuid NOT NULL,
          "created_at" timestamp DEFAULT now(),
          "updated_at" timestamp DEFAULT now(),
          CONSTRAINT "bus_plate_number_unique" UNIQUE("plate_number")
        )
      `;
      console.log("✓ Bus table created");
    }
    
    // Check if route table exists
    try {
      const routeCheck = await client`SELECT * FROM route LIMIT 1`;
      console.log("✓ Route table exists");
    } catch (e) {
      console.log("✗ Route table does not exist, creating...");
      
      // Create route table
      await client`
        CREATE TABLE IF NOT EXISTS "route" (
          "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
          "name" text NOT NULL,
          "start_stop" text NOT NULL,
          "end_stop" text NOT NULL,
          "stops" json,
          "is_active" boolean DEFAULT true,
          "bus_id" uuid,
          "school_admin_id" uuid NOT NULL,
          "created_at" timestamp DEFAULT now(),
          "updated_at" timestamp DEFAULT now()
        )
      `;
      console.log("✓ Route table created");
    }
    
    // Check if parent table exists
    try {
      const parentCheck = await client`SELECT * FROM parent LIMIT 1`;
      console.log("✓ Parent table exists");
    } catch (e) {
      console.log("✗ Parent table does not exist, creating...");
      
      // Create parent table
      await client`
        CREATE TABLE IF NOT EXISTS "parent" (
          "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
          "name" text NOT NULL,
          "email" text NOT NULL,
          "phone" text NOT NULL,
          "address" text,
          "is_active" boolean DEFAULT true,
          "school_admin_id" uuid NOT NULL,
          "created_at" timestamp DEFAULT now(),
          "updated_at" timestamp DEFAULT now(),
          CONSTRAINT "parent_email_unique" UNIQUE("email")
        )
      `;
      console.log("✓ Parent table created");
    }
    
    // Check if child table exists
    try {
      const childCheck = await client`SELECT * FROM child LIMIT 1`;
      console.log("✓ Child table exists");
    } catch (e) {
      console.log("✗ Child table does not exist, creating...");
      
      // Create child table
      await client`
        CREATE TABLE IF NOT EXISTS "child" (
          "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
          "name" text NOT NULL,
          "class" text NOT NULL,
          "pickup_stop" text NOT NULL,
          "drop_stop" text NOT NULL,
          "is_active" boolean DEFAULT true,
          "parent_id" uuid NOT NULL,
          "bus_id" uuid,
          "school_admin_id" uuid NOT NULL,
          "created_at" timestamp DEFAULT now(),
          "updated_at" timestamp DEFAULT now()
        )
      `;
      console.log("✓ Child table created");
    }
    
    console.log("✓ All tables checked/created successfully!");
    
  } catch (error) {
    console.error("Error:", error);
  } finally {
    await client.end();
  }
}

testDB(); 