import {
  pgTable,
  text,
  uuid,
  integer,
  boolean,
  timestamp,
  jsonb,
  foreignKey,
} from "drizzle-orm/pg-core";

// ========== SCHOOL TABLE ==========
export const schoolTable = pgTable("school", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  address: text("address"),
  contact: text("contact"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// ========== SUPER ADMIN ==========
export const superAdminTable = pgTable("super_admin", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  permissions: jsonb("permissions").default([]),
  isActive: boolean("is_active").default(true),
  lastLogin: timestamp("last_login"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// ========== SCHOOL ADMIN ==========
export const schoolAdminTable = pgTable("school_admin", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  schoolId: uuid("school_id").notNull().references(() => schoolTable.id),
  contactNumber: text("contact_number"),
  address: text("address"),
  isVerified: boolean("is_verified").default(false),
  isActive: boolean("is_active").default(true),
  lastLogin: timestamp("last_login"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// ========== BUS TABLE ==========
export const busTable = pgTable("bus", {
  id: uuid("id").primaryKey().defaultRandom(),
  busNumber: text("bus_number").notNull(),
  capacity: integer("capacity").notNull(),
  model: text("model"),
  plateNumber: text("plate_number").notNull().unique(),
  isActive: boolean("is_active").default(true),
  driverId: uuid("driver_id").references(() => driverTable.id),
  schoolAdminId: uuid("school_admin_id").notNull().references(() => schoolAdminTable.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// ========== DRIVER TABLE ==========
export const driverTable = pgTable("driver", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  phone: text("phone").notNull(),
  password: text("password"),
  licenseNumber: text("license_number").notNull().unique(),
  address: text("address"),
  isActive: boolean("is_active").default(true),
  schoolAdminId: uuid("school_admin_id").notNull().references(() => schoolAdminTable.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// ========== PARENT TABLE ==========
export const parentTable = pgTable("parent", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  phone: text("phone").notNull(),
  password: text("password"),
  address: text("address"),
  isActive: boolean("is_active").default(true),
  schoolAdminId: uuid("school_admin_id").notNull().references(() => schoolAdminTable.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// ========== CHILD TABLE ==========
export const childTable = pgTable("child", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  class: text("class").notNull(),
  pickupStop: text("pickup_stop").notNull(),
  dropStop: text("drop_stop").notNull(),
  isActive: boolean("is_active").default(true),
  parentId: uuid("parent_id").notNull().references(() => parentTable.id),
  busId: uuid("bus_id").references(() => busTable.id),
  schoolAdminId: uuid("school_admin_id").notNull().references(() => schoolAdminTable.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// ========== ROUTE TABLE ==========
export const routeTable = pgTable("route", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  description: text("description"),
  startStop: text("start_stop").notNull(),
  endStop: text("end_stop").notNull(),
  stops: jsonb("stops"),
  isActive: boolean("is_active").default(true),
  busId: uuid("bus_id").references(() => busTable.id),
  schoolAdminId: uuid("school_admin_id").references(() => schoolAdminTable.id),
  schoolId: uuid("school_id").notNull().references(() => schoolTable.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// ========== BUS LOCATION HISTORY TABLE ==========
export const busLocationHistoryTable = pgTable("bus_location_history", {
  id: uuid("id").primaryKey().defaultRandom(),
  busId: uuid("bus_id").notNull().references(() => busTable.id),
  latitude: text("latitude").notNull(),
  longitude: text("longitude").notNull(),
  speed: text("speed"),
  heading: text("heading"),
  accuracy: text("accuracy"),
  status: text("status").default("online"),
  timestamp: timestamp("timestamp").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
});
