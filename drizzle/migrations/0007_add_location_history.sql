CREATE TABLE IF NOT EXISTS "bus_location_history" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"bus_id" uuid NOT NULL,
	"latitude" text NOT NULL,
	"longitude" text NOT NULL,
	"speed" text,
	"heading" text,
	"accuracy" text,
	"status" text DEFAULT 'online',
	"timestamp" timestamp DEFAULT now(),
	"created_at" timestamp DEFAULT now()
);

DO $$ BEGIN
 ALTER TABLE "bus_location_history" ADD CONSTRAINT "bus_location_history_bus_id_bus_id_fk" FOREIGN KEY ("bus_id") REFERENCES "bus"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

-- Create index for better query performance on busId and timestamp
CREATE INDEX IF NOT EXISTS "idx_bus_location_history_bus_id" ON "bus_location_history" ("bus_id");
CREATE INDEX IF NOT EXISTS "idx_bus_location_history_timestamp" ON "bus_location_history" ("timestamp" DESC);
CREATE INDEX IF NOT EXISTS "idx_bus_location_history_bus_id_timestamp" ON "bus_location_history" ("bus_id", "timestamp" DESC); 