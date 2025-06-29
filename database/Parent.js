
import { pgTable, text, uuid } from "drizzle-orm/pg-core";

export const parentTable = pgTable("parent", {
  id: uuid("id").primaryKey().default(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  phone: text("phone").notNull(),
  address: text("address").notNull(),
});
