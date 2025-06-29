// models/School.js// import mongoose from "mongoose";
import { pgTable, text, uuid } from "drizzle-orm/pg-core";



export const schoolTable = pgTable("school", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  address: text("address"),
  contact: text("contact"),
});
