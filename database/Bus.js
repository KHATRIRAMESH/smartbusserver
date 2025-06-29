import { integer, pgTable, uuid } from "drizzle-orm/pg-core";

export const busTable = pgTable("bus", {
  id: uuid("id").primaryKey().default(),
  driverId: uuid("driver_id")
    .references(() => driverTable.id)
    .notNull(),
  busNumber: text("bus_number").notNull({
    message: "Bus number is required",
  }),
  capacity: integer("capacity").notNull({
    message: "Bus capacity is required",
  }),
  schoolAdmin: uuid("school_admin_id")
    .references(() => schoolAdminTable.id)
    .notNull({
      message: "School admin ID is required",
    }),
});
