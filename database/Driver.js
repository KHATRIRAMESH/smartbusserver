import { pgTable, uuid } from "drizzle-orm/pg-core";

export const driverTable = pgTable("driver", {
  id: uuid("id").primaryKey().default(),
  name: text("name").notNull(),
  phone: text("phone"),
  licenseNumber: text("license_number").notNull({
    message: "License number is required",
  }),
  schoolAdmin: uuid("school_admin_id")
    .references(() => schoolAdminTable.id)
    .notNull({
      message: "School admin ID is required",
    }),
});
