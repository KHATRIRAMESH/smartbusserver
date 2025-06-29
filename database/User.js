import { pgTable, text, uuid, timestamp } from "drizzle-orm/pg-core";
import jwt from "jsonwebtoken";

export const userTable = pgTable("user", {
  id: uuid("id").primaryKey().defaultRandom(),
  role: text("role", { enum: ["user", "driver"] }).notNull(),
  phone: text("phone").notNull().unique(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Helper functions for JWT tokens (similar to Mongoose methods)
export const createAccessToken = (user) => {
  return jwt.sign(
    {
      id: user.id,
      phone: user.phone,
    },
    process.env.ACCESS_TOKEN_SECRET,
    { expiresIn: process.env.ACCESS_TOKEN_EXPIRY }
  );
};

export const createRefreshToken = (user) => {
  return jwt.sign(
    { id: user.id, phone: user.phone },
    process.env.REFRESH_TOKEN_SECRET,
    {
      expiresIn: process.env.REFRESH_TOKEN_EXPIRY,
    }
  );
};
