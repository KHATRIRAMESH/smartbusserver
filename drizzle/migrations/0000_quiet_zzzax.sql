CREATE TABLE "bus" (
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
);
--> statement-breakpoint
CREATE TABLE "child" (
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
);
--> statement-breakpoint
CREATE TABLE "driver" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"phone" text NOT NULL,
	"password" text,
	"license_number" text NOT NULL,
	"address" text,
	"is_active" boolean DEFAULT true,
	"school_admin_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "driver_email_unique" UNIQUE("email"),
	CONSTRAINT "driver_license_number_unique" UNIQUE("license_number")
);
--> statement-breakpoint
CREATE TABLE "parent" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"phone" text NOT NULL,
	"password" text,
	"address" text,
	"is_active" boolean DEFAULT true,
	"school_admin_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "parent_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "route" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"start_stop" text NOT NULL,
	"end_stop" text NOT NULL,
	"stops" jsonb,
	"is_active" boolean DEFAULT true,
	"bus_id" uuid,
	"school_admin_id" uuid,
	"school_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "school_admin" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"password" text NOT NULL,
	"school_id" uuid NOT NULL,
	"phone" text,
	"address" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "school_admin_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "school" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"address" text,
	"contact" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "super_admin" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"password" text NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "super_admin_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "bus" ADD CONSTRAINT "bus_driver_id_driver_id_fk" FOREIGN KEY ("driver_id") REFERENCES "public"."driver"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bus" ADD CONSTRAINT "bus_school_admin_id_school_admin_id_fk" FOREIGN KEY ("school_admin_id") REFERENCES "public"."school_admin"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "child" ADD CONSTRAINT "child_parent_id_parent_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."parent"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "child" ADD CONSTRAINT "child_bus_id_bus_id_fk" FOREIGN KEY ("bus_id") REFERENCES "public"."bus"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "child" ADD CONSTRAINT "child_school_admin_id_school_admin_id_fk" FOREIGN KEY ("school_admin_id") REFERENCES "public"."school_admin"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "driver" ADD CONSTRAINT "driver_school_admin_id_school_admin_id_fk" FOREIGN KEY ("school_admin_id") REFERENCES "public"."school_admin"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "parent" ADD CONSTRAINT "parent_school_admin_id_school_admin_id_fk" FOREIGN KEY ("school_admin_id") REFERENCES "public"."school_admin"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "route" ADD CONSTRAINT "route_bus_id_bus_id_fk" FOREIGN KEY ("bus_id") REFERENCES "public"."bus"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "route" ADD CONSTRAINT "route_school_admin_id_school_admin_id_fk" FOREIGN KEY ("school_admin_id") REFERENCES "public"."school_admin"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "route" ADD CONSTRAINT "route_school_id_school_id_fk" FOREIGN KEY ("school_id") REFERENCES "public"."school"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "school_admin" ADD CONSTRAINT "school_admin_school_id_school_id_fk" FOREIGN KEY ("school_id") REFERENCES "public"."school"("id") ON DELETE no action ON UPDATE no action;