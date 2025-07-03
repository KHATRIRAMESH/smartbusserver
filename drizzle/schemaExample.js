import { pgTable, text, uuid, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";

export const busTable = pgTable("bus", {
  id: uuid("id").primaryKey().defaultRandom(),
  busNumber: text("bus_number").notNull(),
  capacity: integer("capacity").notNull(),
  model: text("model"),
  plateNumber: text("plate_number").notNull().unique(),
  isActive: boolean("is_active").default(true),
  driverId: uuid("driver_id"),
  schoolAdminId: uuid("school_admin_id").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const childTable = pgTable("child", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  class: text("class").notNull(),
  pickupStop: text("pickup_stop").notNull(),
  dropStop: text("drop_stop").notNull(),
  isActive: boolean("is_active").default(true),
  parentId: uuid("parent_id").notNull(),
  busId: uuid("bus_id"),
  schoolAdminId: uuid("school_admin_id").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const driverTable = pgTable("driver", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  phone: text("phone").notNull(),
  password: text("password"),
  licenseNumber: text("license_number").notNull().unique(),
  address: text("address"),
  isActive: boolean("is_active").default(true),
  schoolAdminId: uuid("school_admin_id").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const parentTable = pgTable("parent", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  phone: text("phone").notNull(),
  password: text("password"),
  address: text("address"),
  isActive: boolean("is_active").default(true),
  schoolAdminId: uuid("school_admin_id").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const routeTable = pgTable("route", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  description: text("description"),
  startStop: text("start_stop").notNull(),
  endStop: text("end_stop").notNull(),
  stops: jsonb("stops"),
  isActive: boolean("is_active").default(true),
  busId: uuid("bus_id"),
  schoolAdminId: uuid("school_admin_id"),
  schoolId: uuid("school_id").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const schoolAdminTable = pgTable("school_admin", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  schoolId: uuid("school_id").notNull(),
  phone: text("phone"),
  address: text("address"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const schoolTable = pgTable("school", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  address: text("address"),
  contact: text("contact"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const superAdminTable = pgTable("super_admin", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}); 