import { pgTable, text, uuid } from "drizzle-orm/pg-core";

export const childTable = pgTable("child", {
  id: uuid("id").primaryKey().default(),
  parentId: uuid("parent_id")
    .references(() => parentTable.id)
    .notNull(),
  name: text("name").notNull(),
  class: text("class").notNull(),
  pickupStop: text("pickup_stop").notNull(),
  dropStop: text("drop_stop").notNull(),
  routeId: text("route_id"),
});
