import db from "../config/connect.js";
import { schoolAdminTable } from "../drizzle/schema.js";
import { eq } from "drizzle-orm";

async function getSchoolAdmin() {
  try {
    const schoolAdmin = await db
      .select()
      .from(schoolAdminTable)
      .where(eq(schoolAdminTable.email, "school@demo.com"))
      .limit(1);

    console.log("School Admin:", schoolAdmin[0]);
  } catch (error) {
    console.error("Error:", error);
  }
}

getSchoolAdmin(); 