CREATE TABLE "bus_location_history" (
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
--> statement-breakpoint
ALTER TABLE "school_admin" RENAME COLUMN "phone" TO "contact_number";--> statement-breakpoint
ALTER TABLE "school_admin" ADD COLUMN "is_verified" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "school_admin" ADD COLUMN "is_active" boolean DEFAULT true;--> statement-breakpoint
ALTER TABLE "school_admin" ADD COLUMN "last_login" timestamp;--> statement-breakpoint
ALTER TABLE "super_admin" ADD COLUMN "permissions" jsonb DEFAULT '[]'::jsonb;--> statement-breakpoint
ALTER TABLE "super_admin" ADD COLUMN "is_active" boolean DEFAULT true;--> statement-breakpoint
ALTER TABLE "super_admin" ADD COLUMN "last_login" timestamp;--> statement-breakpoint
ALTER TABLE "bus_location_history" ADD CONSTRAINT "bus_location_history_bus_id_bus_id_fk" FOREIGN KEY ("bus_id") REFERENCES "public"."bus"("id") ON DELETE no action ON UPDATE no action;