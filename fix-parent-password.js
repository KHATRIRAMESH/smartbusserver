import bcrypt from "bcryptjs";
import db from "./config/connect.js";
import { parentTable } from "./database/Parent.js";
import { eq } from "drizzle-orm";

const fixParentPassword = async () => {
  try {
    const email = "ramesh@parent.com";
    const plainPassword = "ramesh@parent.com";
    
    // Generate bcrypt hash
    const hashedPassword = await bcrypt.hash(plainPassword, 12);
    console.log("Generated hash:", hashedPassword);
    
    // Update the parent's password in database
    const result = await db
      .update(parentTable)
      .set({ password: hashedPassword })
      .where(eq(parentTable.email, email))
      .returning();
    
    if (result.length > 0) {
      console.log("✅ Password updated successfully for:", email);
      console.log("Updated parent:", result[0]);
    } else {
      console.log("❌ Parent not found with email:", email);
    }
    
    process.exit(0);
  } catch (error) {
    console.error("Error fixing password:", error);
    process.exit(1);
  }
};

fixParentPassword(); 