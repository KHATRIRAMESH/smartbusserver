import db from "../config/connect.js";
import { schoolTable, schoolAdminTable, superAdminTable } from "../drizzle/schema.js";
import { AuthService } from "../services/auth.service.js";

async function setupTestData() {
  try {
    // Create super admin
    const superAdminPassword = await AuthService.hashPassword("admin123");
    const [superAdmin] = await db
      .insert(superAdminTable)
      .values({
        name: "Super Admin",
        email: "admin@smartbus.com",
        password: superAdminPassword,
        permissions: ["all"],
        isActive: true,
      })
      .returning();

    console.log("Created super admin:", superAdmin.email);

    // Create a test school
    const [school] = await db
      .insert(schoolTable)
      .values({
        name: "Demo School",
        address: "123 School Street, City",
        contact: "+1234567890",
      })
      .returning();

    console.log("Created school:", school.name);

    // Create school admin
    const schoolAdminPassword = await AuthService.hashPassword("school123");
    const [schoolAdmin] = await db
      .insert(schoolAdminTable)
      .values({
        name: "School Admin",
        email: "school@demo.com",
        password: schoolAdminPassword,
        schoolId: school.id,
        contactNumber: "+0987654321",
        address: "456 Admin Street, City",
        isVerified: true,
        isActive: true,
      })
      .returning();

    console.log("Created school admin:", schoolAdmin.email);

    console.log("\nTest credentials:");
    console.log("Super Admin - Email: admin@smartbus.com, Password: admin123");
    console.log("School Admin - Email: school@demo.com, Password: school123");

  } catch (error) {
    console.error("Error setting up test data:", error);
    process.exit(1);
  }
}

setupTestData(); 