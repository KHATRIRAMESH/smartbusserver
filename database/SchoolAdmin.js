import { pgTable } from "drizzle-orm/pg-core";


export const schoolAdminTable = pgTable("school_admin", {
  id: uuid("id").primaryKey().default(),
  name: text("name").notNull(),
  schoolId: uuid("school_id")
    .references(() => schoolTable.id)
    .notNull(),
  email: text("email").notNull().unique(),
  phone: text("phone").notNull(),
  address: text("address").notNull(),
});
