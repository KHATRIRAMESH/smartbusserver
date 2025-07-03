import "dotenv/config";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { routeTable } from "./drizzle/schema.js";

const connectionString = process.env.DATABASE_URL;
const client = postgres(connectionString);
const db = drizzle(client);

async function testRouteCreation() {
  try {
    // Get a bus and school admin
    const [bus] = await client`SELECT id, school_admin_id FROM bus LIMIT 1`;
    if (!bus) {
      console.log("No bus found. Please create a bus first.");
      return;
    }
    const schoolAdminId = bus.school_admin_id;
    const busId = bus.id;
    // Get the school_id from the school_admin
    const [schoolAdmin] = await client`SELECT school_id FROM school_admin WHERE id = ${schoolAdminId}`;
    if (!schoolAdmin) {
      console.log("No school admin found for this bus.");
      return;
    }
    const schoolId = schoolAdmin.school_id;
    // Dummy route data
    const testRoute = {
      name: "Test Route",
      startStop: "Stop A",
      endStop: "Stop B",
      stops: ["Stop A", "Stop B", "Stop C"],
      isActive: true,
      busId,
      schoolAdminId,
      schoolId
    };
    console.log("Test data:", testRoute);
    // Try to create route
    const [newRoute] = await db
      .insert(routeTable)
      .values(testRoute)
      .returning();
    console.log("Route created successfully:", newRoute);
  } catch (error) {
    console.error("Error creating route:", error);
    console.error("Error details:", {
      message: error.message,
      code: error.code,
      detail: error.detail,
      hint: error.hint
    });
  } finally {
    await client.end();
  }
}

testRouteCreation(); 