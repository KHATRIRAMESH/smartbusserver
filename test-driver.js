import "dotenv/config";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { driverTable } from "./drizzle/schema.js";

const connectionString = process.env.DATABASE_URL;
const client = postgres(connectionString);
const db = drizzle(client);

async function testDriverCreation() {
  try {
    console.log("Testing driver creation...");
    
    // Test data
    const testDriver = {
      name: "Test Driver",
      email: "testdriver@test.com",
      phone: "1234567890",
      licenseNumber: "TEST123",
      address: "Test Address",
      schoolAdminId: "929b9f4f-6c28-4d55-9dd2-7d5a7a645c32" // School admin ID from earlier
    };
    
    console.log("Test data:", testDriver);
    
    // Check if school admin exists
    const schoolAdmin = await client`SELECT id, name FROM school_admin WHERE id = ${testDriver.schoolAdminId}`;
    console.log("School admin check:", schoolAdmin);
    
    // Check driver table structure
    const driverColumns = await client`SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'driver' ORDER BY ordinal_position`;
    console.log("Driver table columns:", driverColumns);
    
    // Try to create driver
    const [newDriver] = await db
      .insert(driverTable)
      .values(testDriver)
      .returning();
    
    console.log("Driver created successfully:", newDriver);
    
  } catch (error) {
    console.error("Error creating driver:", error);
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

testDriverCreation(); 