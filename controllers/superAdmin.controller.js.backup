import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { eq } from "drizzle-orm";
import db from "../config/connect.js";
import { superAdminTable } from "../database/SuperAdmin.js";
import { schoolAdminTable } from "../database/SchoolAdmin.js";
import { StatusCodes } from "http-status-codes";
import { schoolTable } from "../database/School.js";

export const createSuperAdmin = async (req, res) => {
  const { name, email, password, secretKey } = req.body;
  if (!name || !email || !password || !secretKey) {
    return res.status(400).json({ 
      success: false,
      message: "All fields are required including secret key" 
    });
  }

  try {
    // Verify secret key
    const expectedSecretKey = process.env.SUPER_ADMIN_SECRET_KEY;
    if (!expectedSecretKey) {
      console.error("SUPER_ADMIN_SECRET_KEY environment variable is not set");
      return res.status(500).json({ 
        success: false,
        message: "Server configuration error" 
      });
    }

    if (secretKey !== expectedSecretKey) {
      return res.status(403).json({ 
        success: false,
        message: "Invalid secret key. Access denied." 
      });
    }

    // Check if super admin already exists
    const existingSuperAdmin = await db
      .select()
      .from(superAdminTable)
      .where(eq(superAdminTable.email, email))
      .limit(1);

    if (existingSuperAdmin.length > 0) {
      return res
        .status(400)
        .json({ 
          success: false,
          message: "Super admin already exists with this email" 
        });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create super admin
    const newSuperAdmin = await db
      .insert(superAdminTable)
      .values({
        name,
        email,
        password: hashedPassword,
      })
      .returning();

    const payload = {
      id: newSuperAdmin[0].id,
      email: newSuperAdmin[0].email,
      role: "super_admin",
    };

    // Generate JWT token
    const access_token = jwt.sign(payload, process.env.ACCESS_TOKEN_SECRET, {
      expiresIn: process.env.ACCESS_TOKEN_EXPIRY,
    });

    const refresh_token = jwt.sign(payload, process.env.REFRESH_TOKEN_SECRET, {
      expiresIn: process.env.REFRESH_TOKEN_EXPIRY,
    });

    res.cookie("access_token", access_token, {
      httpOnly: true,
      secure: true,
      sameSite: "strict",
      maxAge: 4 * 24 * 60 * 60 * 1000, // 4 days
    });

    res.status(StatusCodes.CREATED).json({
      success: true,
      access_token,
      refresh_token,
      message: "Super admin registered and logged in successfully",
      user: {
        id: newSuperAdmin[0].id,
        name: newSuperAdmin[0].name,
        email: newSuperAdmin[0].email,
        role: "super_admin",
      },
    });
  } catch (error) {
    console.error("Error creating super admin:", error);
    res.status(500).json({ 
      success: false,
      message: "Internal server error" 
    });
  }
};

export const loginSuperAdmin = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: "Email and password are required" });
  }

  try {
    // Find super admin by email
    const superAdmin = await db
      .select()
      .from(superAdminTable)
      .where(eq(superAdminTable.email, email))
      .limit(1);

    if (superAdmin.length === 0) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // Check password
    const isPasswordValid = await bcrypt.compare(
      password,
      superAdmin[0].password
    );
    if (!isPasswordValid) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const payload = {
      id: superAdmin[0].id,
      email: superAdmin[0].email,
      role: "super_admin",
    };

    // Generate JWT token
    const access_token = jwt.sign(payload, process.env.ACCESS_TOKEN_SECRET, {
      expiresIn: process.env.ACCESS_TOKEN_EXPIRY,
    });

    const refresh_token = jwt.sign(payload, process.env.REFRESH_TOKEN_SECRET, {
      expiresIn: process.env.REFRESH_TOKEN_EXPIRY,
    });

    res.cookie("access_token", access_token, {
      httpOnly: true,
      secure: true,
      sameSite: "strict",
      maxAge: 4 * 24 * 60 * 60 * 1000, // 4 days
    });

    res.status(StatusCodes.CREATED).json({
      access_token,
      refresh_token,
      message: "Super admin registered and logged in successfully",
      user: {
        id: superAdmin[0].id,
        name: superAdmin[0].name,
        email: superAdmin[0].email,
        role: "super_admin",
      },
    });
  } catch (error) {
    console.error("Error logging in super admin:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const deleteSuperAdmin = async (req, res) => {
  const { id } = req.params;
  console.log("Deleting super admin with ID:", id);
  try {
    await db.delete(superAdminTable).where(eq(superAdminTable.id, id));
    res.status(StatusCodes.OK).json({ message: "Super admin deleted" });
  } catch (error) {
    console.error("Error deleting super admin:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const createSchool = async (req, res) => {
  try {
    const { schoolName, address, contact } = req.body;

    console.log("Creating school with data:", {
      schoolName,
      address,
      contact,
    });
    if (!schoolName || !address || !contact) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const newSchool = await db
      .select()
      .from(schoolTable)
      .where(eq(schoolTable.name, schoolName))
      .limit(1);

    if (newSchool.length > 0) {
      return res.status(409).json({ message: "School already exists" });
    }

    // Create new school
    const [createdSchool] = await db
      .insert(schoolTable)
      .values({ name: schoolName, address, contact })
      .returning();

    res
      .status(201)
      .json({ message: "School created successfully", school: createdSchool });
  } catch (error) {
    console.error("Error creating school:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const getAllSchools = async (req, res) => {
  try {
    const schools = await db.select().from(schoolTable);
    res.status(200).json({
      success: true,
      data: schools,
      message: "Schools retrieved successfully"
    });
  } catch (error) {
    console.error("Error fetching schools:", error);
    res.status(500).json({ 
      success: false,
      message: "Internal server error" 
    });
  }
};

export const updateSchool = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, address, contact } = req.body;

    const updatedSchool = await db
      .update(schoolTable)
      .set({ name, address, contact })
      .where(eq(schoolTable.id, id))
      .returning();

    if (updatedSchool.length === 0) {
      return res.status(404).json({ 
        success: false,
        message: "School not found" 
      });
    }

    res.status(200).json({
      success: true,
      data: updatedSchool[0],
      message: "School updated successfully"
    });
  } catch (error) {
    console.error("Error updating school:", error);
    res.status(500).json({ 
      success: false,
      message: "Internal server error" 
    });
  }
};

export const deleteSchool = async (req, res) => {
  try {
    const { id } = req.params;
    
    const deletedSchool = await db
      .delete(schoolTable)
      .where(eq(schoolTable.id, id))
      .returning();

    if (deletedSchool.length === 0) {
      return res.status(404).json({ 
        success: false,
        message: "School not found" 
      });
    }

    res.status(200).json({
      success: true,
      message: "School deleted successfully"
    });
  } catch (error) {
    console.error("Error deleting school:", error);
    res.status(500).json({ 
      success: false,
      message: "Internal server error" 
    });
  }
};

export const getSystemStats = async (req, res) => {
  try {
    // Get schools count
    const schoolsResult = await db.select().from(schoolTable);
    const totalSchools = schoolsResult.length;

    // Get school admins count
    const schoolAdminsResult = await db.select().from(schoolAdminTable);
    const totalSchoolAdmins = schoolAdminsResult.length;

    const stats = {
      totalSchools,
      totalSchoolAdmins,
      totalBuses: 0, // Will be implemented when Bus schema is ready
      totalRoutes: 0, // Will be implemented when Route schema is ready
      totalChildren: 0, // Will be implemented when Child schema is ready
      totalParents: 0, // Will be implemented when Parent schema is ready
    };

    res.status(200).json({
      success: true,
      data: stats,
      message: "System stats retrieved successfully"
    });
  } catch (error) {
    console.error("Error fetching system stats:", error);
    res.status(500).json({ 
      success: false,
      message: "Internal server error" 
    });
  }
};

// School Admin Management (Super Admin functions)
export const createSchoolAdmin = async (req, res) => {
  try {
    const { name, email, password, schoolId, contactNumber, address } = req.body;

    if (!name || !email || !password || !schoolId) {
      return res.status(400).json({ 
        success: false,
        message: "Name, email, password, and school are required" 
      });
    }

    // Check if school exists
    const school = await db
      .select()
      .from(schoolTable)
      .where(eq(schoolTable.id, schoolId))
      .limit(1);

    if (school.length === 0) {
      return res.status(404).json({ 
        success: false,
        message: "School not found" 
      });
    }

    // Check if school admin already exists with this email
    const existingSchoolAdmin = await db
      .select()
      .from(schoolAdminTable)
      .where(eq(schoolAdminTable.email, email))
      .limit(1);

    if (existingSchoolAdmin.length > 0) {
      return res.status(409).json({ 
        success: false,
        message: "School admin already exists with this email" 
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create school admin
    const [newSchoolAdmin] = await db
      .insert(schoolAdminTable)
      .values({
        name,
        email,
        password: hashedPassword,
        schoolId,
        contactNumber,
        address,
      })
      .returning();

    // Get school information
    const schoolInfo = await db
      .select()
      .from(schoolTable)
      .where(eq(schoolTable.id, schoolId))
      .limit(1);

    // Remove password from response
    const { password: _, ...schoolAdminWithoutPassword } = newSchoolAdmin;

    res.status(201).json({
      success: true,
      data: {
        ...schoolAdminWithoutPassword,
        school: schoolInfo[0] || null
      },
      message: "School admin created successfully"
    });
  } catch (error) {
    console.error("Error creating school admin:", error);
    res.status(500).json({ 
      success: false,
      message: "Internal server error" 
    });
  }
};

export const getAllSchoolAdmins = async (req, res) => {
  try {
    const schoolAdmins = await db
      .select({
        id: schoolAdminTable.id,
        name: schoolAdminTable.name,
        email: schoolAdminTable.email,
        schoolId: schoolAdminTable.schoolId,
        contactNumber: schoolAdminTable.contactNumber,
        address: schoolAdminTable.address,
        createdAt: schoolAdminTable.createdAt,
        updatedAt: schoolAdminTable.updatedAt,
        school: {
          id: schoolTable.id,
          name: schoolTable.name,
          address: schoolTable.address,
          contact: schoolTable.contact,
        }
      })
      .from(schoolAdminTable)
      .leftJoin(schoolTable, eq(schoolAdminTable.schoolId, schoolTable.id));

    res.status(200).json({
      success: true,
      data: schoolAdmins,
      message: "School admins retrieved successfully"
    });
  } catch (error) {
    console.error("Error fetching school admins:", error);
    res.status(500).json({ 
      success: false,
      message: "Internal server error" 
    });
  }
};

export const verifySchoolAdmin = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if school admin exists
    const existingSchoolAdmin = await db
      .select()
      .from(schoolAdminTable)
      .where(eq(schoolAdminTable.id, id))
      .limit(1);

    if (existingSchoolAdmin.length === 0) {
      return res.status(404).json({ 
        success: false,
        message: "School admin not found" 
      });
    }

    // Update school admin verification status
    const [updatedSchoolAdmin] = await db
      .update(schoolAdminTable)
      .set({ 
        isVerified: true,
        updatedAt: new Date()
      })
      .where(eq(schoolAdminTable.id, id))
      .returning();

    // Get school information
    const school = await db
      .select()
      .from(schoolTable)
      .where(eq(schoolTable.id, updatedSchoolAdmin.schoolId))
      .limit(1);

    // Remove password from response
    const { password: _, ...schoolAdminWithoutPassword } = updatedSchoolAdmin;

    res.status(200).json({
      success: true,
      data: {
        ...schoolAdminWithoutPassword,
        school: school[0] || null
      },
      message: "School admin verified successfully"
    });
  } catch (error) {
    console.error("Error verifying school admin:", error);
    res.status(500).json({ 
      success: false,
      message: "Internal server error" 
    });
  }
};

export const updateSchoolAdmin = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, contactNumber, address, schoolId, isVerified } = req.body;

    // Check if school admin exists
    const existingSchoolAdmin = await db
      .select()
      .from(schoolAdminTable)
      .where(eq(schoolAdminTable.id, id))
      .limit(1);

    if (existingSchoolAdmin.length === 0) {
      return res.status(404).json({ 
        success: false,
        message: "School admin not found" 
      });
    }

    // If email is being updated, check for duplicates
    if (email && email !== existingSchoolAdmin[0].email) {
      const duplicateEmail = await db
        .select()
        .from(schoolAdminTable)
        .where(eq(schoolAdminTable.email, email))
        .limit(1);

      if (duplicateEmail.length > 0) {
        return res.status(409).json({ 
          success: false,
          message: "Email already exists" 
        });
      }
    }

    // If schoolId is being updated, check if school exists
    if (schoolId && schoolId !== existingSchoolAdmin[0].schoolId) {
      const school = await db
        .select()
        .from(schoolTable)
        .where(eq(schoolTable.id, schoolId))
        .limit(1);

      if (school.length === 0) {
        return res.status(404).json({ 
          success: false,
          message: "School not found" 
        });
      }
    }

    // Update school admin
    const [updatedSchoolAdmin] = await db
      .update(schoolAdminTable)
      .set({ 
        name, 
        email, 
        contactNumber: contactNumber || existingSchoolAdmin[0].contactNumber,
        address: address || existingSchoolAdmin[0].address,
        schoolId: schoolId || existingSchoolAdmin[0].schoolId,
        isVerified: isVerified !== undefined ? isVerified : existingSchoolAdmin[0].isVerified,
        updatedAt: new Date()
      })
      .where(eq(schoolAdminTable.id, id))
      .returning();

    // Get school information
    const school = await db
      .select()
      .from(schoolTable)
      .where(eq(schoolTable.id, updatedSchoolAdmin.schoolId))
      .limit(1);

    // Remove password from response
    const { password: _, ...schoolAdminWithoutPassword } = updatedSchoolAdmin;

    res.status(200).json({
      success: true,
      data: {
        ...schoolAdminWithoutPassword,
        school: school[0] || null
      },
      message: "School admin updated successfully"
    });
  } catch (error) {
    console.error("Error updating school admin:", error);
    res.status(500).json({ 
      success: false,
      message: "Internal server error" 
    });
  }
};

export const deleteSchoolAdmin = async (req, res) => {
  try {
    const { id } = req.params;
    
    const deletedSchoolAdmin = await db
      .delete(schoolAdminTable)
      .where(eq(schoolAdminTable.id, id))
      .returning();

    if (deletedSchoolAdmin.length === 0) {
      return res.status(404).json({ 
        success: false,
        message: "School admin not found" 
      });
    }

    res.status(200).json({
      success: true,
      message: "School admin deleted successfully"
    });
  } catch (error) {
    console.error("Error deleting school admin:", error);
    res.status(500).json({ 
      success: false,
      message: "Internal server error" 
    });
  }
};
