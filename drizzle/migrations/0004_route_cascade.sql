-- Drop existing foreign key constraints
ALTER TABLE "route" DROP CONSTRAINT IF EXISTS "route_bus_id_bus_id_fk";
ALTER TABLE "route" DROP CONSTRAINT IF EXISTS "route_school_admin_id_school_admin_id_fk";
ALTER TABLE "route" DROP CONSTRAINT IF EXISTS "route_school_id_school_id_fk";

-- Add constraints with ON DELETE SET NULL
ALTER TABLE "route" ADD CONSTRAINT "route_bus_id_bus_id_fk" 
  FOREIGN KEY ("bus_id") REFERENCES "bus"("id") ON DELETE SET NULL;

ALTER TABLE "route" ADD CONSTRAINT "route_school_admin_id_school_admin_id_fk" 
  FOREIGN KEY ("school_admin_id") REFERENCES "school_admin"("id") ON DELETE SET NULL;

ALTER TABLE "route" ADD CONSTRAINT "route_school_id_school_id_fk" 
  FOREIGN KEY ("school_id") REFERENCES "school"("id") ON DELETE CASCADE;

-- Add index for better performance
CREATE INDEX IF NOT EXISTS "route_bus_id_idx" ON "route"("bus_id");
CREATE INDEX IF NOT EXISTS "route_school_admin_id_idx" ON "route"("school_admin_id");
CREATE INDEX IF NOT EXISTS "route_school_id_idx" ON "route"("school_id"); 