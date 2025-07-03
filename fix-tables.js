import "dotenv/config";
import postgres from "postgres";

const client = postgres(process.env.DATABASE_URL);

async function fixTables() {
  try {
    console.log("Fixing database tables...");
    
    // Check if super_admin table has created_at and updated_at columns
    try {
      const superAdminCheck = await client`SELECT created_at, updated_at FROM super_admin LIMIT 1`;
      console.log("✓ Super admin table has timestamp columns");
    } catch (e) {
      console.log("✗ Super admin table missing timestamp columns, adding...");
      
      // Add missing columns to super_admin table
      await client`ALTER TABLE super_admin ADD COLUMN IF NOT EXISTS created_at timestamp DEFAULT now()`;
      await client`ALTER TABLE super_admin ADD COLUMN IF NOT EXISTS updated_at timestamp DEFAULT now()`;
      console.log("✓ Added timestamp columns to super_admin table");
    }
    
    // Check if school table has created_at and updated_at columns
    try {
      const schoolCheck = await client`SELECT created_at, updated_at FROM school LIMIT 1`;
      console.log("✓ School table has timestamp columns");
    } catch (e) {
      console.log("✗ School table missing timestamp columns, adding...");
      
      // Add missing columns to school table
      await client`ALTER TABLE school ADD COLUMN IF NOT EXISTS created_at timestamp DEFAULT now()`;
      await client`ALTER TABLE school ADD COLUMN IF NOT EXISTS updated_at timestamp DEFAULT now()`;
      console.log("✓ Added timestamp columns to school table");
    }
    
    // Check if school_admin table has created_at and updated_at columns
    try {
      const schoolAdminCheck = await client`SELECT created_at, updated_at FROM school_admin LIMIT 1`;
      console.log("✓ School admin table has timestamp columns");
    } catch (e) {
      console.log("✗ School admin table missing timestamp columns, adding...");
      
      // Add missing columns to school_admin table
      await client`ALTER TABLE school_admin ADD COLUMN IF NOT EXISTS created_at timestamp DEFAULT now()`;
      await client`ALTER TABLE school_admin ADD COLUMN IF NOT EXISTS updated_at timestamp DEFAULT now()`;
      console.log("✓ Added timestamp columns to school_admin table");
    }
    
    // Check if user table exists and has the right structure
    try {
      const userCheck = await client`SELECT * FROM "user" LIMIT 1`;
      console.log("✓ User table exists");
    } catch (e) {
      console.log("✗ User table does not exist, creating...");
      
      // Create user table
      await client`
        CREATE TABLE IF NOT EXISTS "user" (
          "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
          "name" text NOT NULL,
          "email" text NOT NULL,
          "phone" text NOT NULL,
          "password" text NOT NULL,
          "role" text DEFAULT 'user' NOT NULL,
          "is_active" boolean DEFAULT true,
          "created_at" timestamp DEFAULT now(),
          "updated_at" timestamp DEFAULT now(),
          CONSTRAINT "user_email_unique" UNIQUE("email")
        )
      `;
      console.log("✓ User table created");
    }
    
    // Add any missing foreign key constraints
    try {
      await client`ALTER TABLE school_admin ADD CONSTRAINT IF NOT EXISTS school_admin_school_id_school_id_fk 
        FOREIGN KEY ("school_id") REFERENCES "public"."school"("id") ON DELETE CASCADE ON UPDATE CASCADE`;
      console.log("✓ School admin foreign key constraint added");
    } catch (e) {
      console.log("School admin foreign key constraint already exists or failed");
    }
    
    try {
      await client`ALTER TABLE driver ADD CONSTRAINT IF NOT EXISTS driver_school_admin_id_school_admin_id_fk 
        FOREIGN KEY ("school_admin_id") REFERENCES "public"."school_admin"("id") ON DELETE CASCADE ON UPDATE CASCADE`;
      console.log("✓ Driver foreign key constraint added");
    } catch (e) {
      console.log("Driver foreign key constraint already exists or failed");
    }
    
    try {
      await client`ALTER TABLE bus ADD CONSTRAINT IF NOT EXISTS bus_school_admin_id_school_admin_id_fk 
        FOREIGN KEY ("school_admin_id") REFERENCES "public"."school_admin"("id") ON DELETE CASCADE ON UPDATE CASCADE`;
      console.log("✓ Bus foreign key constraint added");
    } catch (e) {
      console.log("Bus foreign key constraint already exists or failed");
    }
    
    try {
      await client`ALTER TABLE bus ADD CONSTRAINT IF NOT EXISTS bus_driver_id_driver_id_fk 
        FOREIGN KEY ("driver_id") REFERENCES "public"."driver"("id") ON DELETE SET NULL ON UPDATE CASCADE`;
      console.log("✓ Bus driver foreign key constraint added");
    } catch (e) {
      console.log("Bus driver foreign key constraint already exists or failed");
    }
    
    try {
      await client`ALTER TABLE route ADD CONSTRAINT IF NOT EXISTS route_school_admin_id_school_admin_id_fk 
        FOREIGN KEY ("school_admin_id") REFERENCES "public"."school_admin"("id") ON DELETE CASCADE ON UPDATE CASCADE`;
      console.log("✓ Route foreign key constraint added");
    } catch (e) {
      console.log("Route foreign key constraint already exists or failed");
    }
    
    try {
      await client`ALTER TABLE route ADD CONSTRAINT IF NOT EXISTS route_bus_id_bus_id_fk 
        FOREIGN KEY ("bus_id") REFERENCES "public"."bus"("id") ON DELETE SET NULL ON UPDATE CASCADE`;
      console.log("✓ Route bus foreign key constraint added");
    } catch (e) {
      console.log("Route bus foreign key constraint already exists or failed");
    }
    
    try {
      await client`ALTER TABLE parent ADD CONSTRAINT IF NOT EXISTS parent_school_admin_id_school_admin_id_fk 
        FOREIGN KEY ("school_admin_id") REFERENCES "public"."school_admin"("id") ON DELETE CASCADE ON UPDATE CASCADE`;
      console.log("✓ Parent foreign key constraint added");
    } catch (e) {
      console.log("Parent foreign key constraint already exists or failed");
    }
    
    try {
      await client`ALTER TABLE child ADD CONSTRAINT IF NOT EXISTS child_school_admin_id_school_admin_id_fk 
        FOREIGN KEY ("school_admin_id") REFERENCES "public"."school_admin"("id") ON DELETE CASCADE ON UPDATE CASCADE`;
      console.log("✓ Child foreign key constraint added");
    } catch (e) {
      console.log("Child foreign key constraint already exists or failed");
    }
    
    try {
      await client`ALTER TABLE child ADD CONSTRAINT IF NOT EXISTS child_parent_id_parent_id_fk 
        FOREIGN KEY ("parent_id") REFERENCES "public"."parent"("id") ON DELETE CASCADE ON UPDATE CASCADE`;
      console.log("✓ Child parent foreign key constraint added");
    } catch (e) {
      console.log("Child parent foreign key constraint already exists or failed");
    }
    
    try {
      await client`ALTER TABLE child ADD CONSTRAINT IF NOT EXISTS child_bus_id_bus_id_fk 
        FOREIGN KEY ("bus_id") REFERENCES "public"."bus"("id") ON DELETE SET NULL ON UPDATE CASCADE`;
      console.log("✓ Child bus foreign key constraint added");
    } catch (e) {
      console.log("Child bus foreign key constraint already exists or failed");
    }
    
    console.log("✓ All tables fixed successfully!");
    
  } catch (error) {
    console.error("Error fixing tables:", error);
  } finally {
    await client.end();
  }
}

fixTables(); 