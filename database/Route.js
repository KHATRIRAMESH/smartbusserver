import { text, uuid } from "drizzle-orm/pg-core";

export const routeTable = pgTable("route", {
  id: uuid("id").primaryKey().default(),
  name: text("name"),
  startStop: text("start_stop"),
  endStop: text("end_stop"),
  stops: text("stops").array(),
  schoolId: uuid("school_id").references(() => schoolTable.id),
  busId: uuid("bus_id").references(() => busTable.id),
});
