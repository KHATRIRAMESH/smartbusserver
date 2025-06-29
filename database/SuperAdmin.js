import { pgTable, text, uuid } from "drizzle-orm/pg-core";

export const superAdminTable = pgTable("super_admin", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
});
