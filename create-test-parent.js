import db from "./config/connect.js";
import { parentTable } from "./database/Parent.js";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";

async function createTestParent() {
  try {
    console.log('Creating test parent account...');
    
    // First, let's check if we have any school admins to associate with
    const { schoolAdminTable } = await import("./database/SchoolAdmin.js");
    const schoolAdmins = await db.select().from(schoolAdminTable).limit(1);
    
    if (schoolAdmins.length === 0) {
      console.log('❌ No school admin found. Please create a school admin first.');
      return;
    }
    
    const schoolAdminId = schoolAdmins[0].id;
    console.log(`Using school admin ID: ${schoolAdminId}`);
    
    // Check if test parent already exists
    const existingParent = await db
      .select()
      .from(parentTable)
      .where(eq(parentTable.email, 'parent@example.com'))
      .limit(1);
    
    if (existingParent.length > 0) {
      console.log('✅ Test parent already exists');
      console.log('Email: parent@example.com');
      console.log('Password: password123');
      return;
    }
    
    // Hash the password
    const hashedPassword = await bcrypt.hash('password123', 12);
    
    // Create the parent
    const [newParent] = await db
      .insert(parentTable)
      .values({
        name: 'Test Parent',
        email: 'parent@example.com',
        phone: '+1234567890',
        address: '123 Test Street, Test City',
        password: hashedPassword,
        schoolAdminId,
        isActive: true,
      })
      .returning();
    
    console.log('✅ Test parent created successfully!');
    console.log('Email: parent@example.com');
    console.log('Password: password123');
    console.log('Parent ID:', newParent.id);
    
  } catch (error) {
    console.error('❌ Error creating test parent:', error);
  }
}

createTestParent(); 