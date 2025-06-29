import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { eq } from "drizzle-orm";
import db from "../config/connect.js";
import { superAdminTable } from "../database/SuperAdmin.js";
import { StatusCodes } from "http-status-codes";
import { schoolTable } from "../database/School.js";

export const createSuperAdmin = async (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ message: "All fields are required" });
  }

  try {
    // Check if super admin already exists
    const existingSuperAdmin = await db
      .select()
      .from(superAdminTable)
      .where(eq(superAdminTable.email, email))
      .limit(1);

    if (existingSuperAdmin.length > 0) {
      return res
        .status(400)
        .json({ message: "Super admin already exists with this email" });
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
    res.status(500).json({ message: "Internal server error" });
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

export const createSchoolAdmin = async (req, res) => {
  try {
    const { name, email, password, schoolId } = req.body;

    if (!name || !email || !password || !schoolId) {
      return res.status(400).json({ 
        success: false,
        message: "All fields are required" 
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

    // For now, return a placeholder response since SchoolAdmin schema is not implemented
    res.status(200).json({
      success: true,
      message: "School admin creation endpoint ready - schema migration pending",
      data: {
        id: "placeholder-id",
        name,
        email,
        schoolId,
        school: school[0],
        createdAt: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error("Error creating school admin:", error);
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

    // For now, return placeholder stats since other schemas are not implemented
    const stats = {
      totalSchools,
      totalSchoolAdmins: 0, // Will be implemented when SchoolAdmin schema is ready
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
