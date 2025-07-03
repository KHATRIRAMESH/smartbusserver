import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { eq, sql } from "drizzle-orm";
import db from "../config/connect.js";
import { schoolAdminTable } from "../database/SchoolAdmin.js";
import { schoolTable } from "../database/School.js";
import { busTable } from "../database/Bus.js";
import { routeTable } from "../database/Route.js";
import { driverTable } from "../database/Driver.js";
import { parentTable } from "../database/Parent.js";
import { childTable } from "../database/Child.js";
import { StatusCodes } from "http-status-codes";

// School Admin Authentication
export const loginSchoolAdmin = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({
      success: false,
      message: "Email and password are required",
    });
  }

  console.log(email, password);

  try {
    // Find school admin by email
    const schoolAdmin = await db
      .select()
      .from(schoolAdminTable)
      .where(eq(schoolAdminTable.email, email))
      .limit(1);

    if (schoolAdmin.length === 0) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    // Check password using bcrypt.compare
    const isPasswordValid = await bcrypt.compare(
      password,
      schoolAdmin[0].password
    );
    
    console.log("Password validation result:", isPasswordValid);
    
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    // Get school information
    const school = await db
      .select()
      .from(schoolTable)
      .where(eq(schoolTable.id, schoolAdmin[0].schoolId))
      .limit(1);

    const payload = {
      id: schoolAdmin[0].id,
      email: schoolAdmin[0].email,
      role: "school_admin",
      schoolId: schoolAdmin[0].schoolId,
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

    // Remove password from response
    const { password: _, ...schoolAdminWithoutPassword } = schoolAdmin[0];

    res.status(StatusCodes.OK).json({
      success: true,
      access_token,
      refresh_token,
      message: "School admin logged in successfully",
      user: {
        ...schoolAdminWithoutPassword,
        school: school[0] || null,
      },
    });
  } catch (error) {
    console.error("Error logging in school admin:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// Get school admin profile
export const getSchoolAdminProfile = async (req, res) => {
  try {
    const schoolAdminId = req.user.id;

    const schoolAdmin = await db
      .select({
        id: schoolAdminTable.id,
        name: schoolAdminTable.name,
        email: schoolAdminTable.email,
        schoolId: schoolAdminTable.schoolId,
        phone: schoolAdminTable.phone,
        address: schoolAdminTable.address,
        createdAt: schoolAdminTable.createdAt,
        updatedAt: schoolAdminTable.updatedAt,
        school: {
          id: schoolTable.id,
          name: schoolTable.name,
          address: schoolTable.address,
          contact: schoolTable.contact,
        },
      })
      .from(schoolAdminTable)
      .leftJoin(schoolTable, eq(schoolAdminTable.schoolId, schoolTable.id))
      .where(eq(schoolAdminTable.id, schoolAdminId))
      .limit(1);

    if (schoolAdmin.length === 0) {
      return res.status(404).json({
        success: false,
        message: "School admin not found",
      });
    }

    res.status(200).json({
      success: true,
      data: schoolAdmin[0],
      message: "School admin profile retrieved successfully",
    });
  } catch (error) {
    console.error("Error fetching school admin profile:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// Update school admin profile
export const updateSchoolAdminProfile = async (req, res) => {
  try {
    const schoolAdminId = req.user.id;
    const { name, email, phone, address } = req.body;

    // Check if school admin exists
    const existingSchoolAdmin = await db
      .select()
      .from(schoolAdminTable)
      .where(eq(schoolAdminTable.id, schoolAdminId))
      .limit(1);

    if (existingSchoolAdmin.length === 0) {
      return res.status(404).json({
        success: false,
        message: "School admin not found",
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
          message: "Email already exists",
        });
      }
    }

    // Update school admin
    const [updatedSchoolAdmin] = await db
      .update(schoolAdminTable)
      .set({
        name,
        email,
        phone,
        address,
        updatedAt: new Date(),
      })
      .where(eq(schoolAdminTable.id, schoolAdminId))
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
        school: school[0] || null,
      },
      message: "School admin profile updated successfully",
    });
  } catch (error) {
    console.error("Error updating school admin profile:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// Change school admin password
export const changeSchoolAdminPassword = async (req, res) => {
  try {
    const schoolAdminId = req.user.id;
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "Current password and new password are required",
      });
    }

    // Get school admin with password
    const schoolAdmin = await db
      .select()
      .from(schoolAdminTable)
      .where(eq(schoolAdminTable.id, schoolAdminId))
      .limit(1);

    if (schoolAdmin.length === 0) {
      return res.status(404).json({
        success: false,
        message: "School admin not found",
      });
    }

    // Verify current password
    const isCurrentPasswordValid = await bcrypt.compare(
      currentPassword,
      schoolAdmin[0].password
    );

    if (!isCurrentPasswordValid) {
      return res.status(401).json({
        success: false,
        message: "Current password is incorrect",
      });
    }

    // Hash new password
    const hashedNewPassword = await bcrypt.hash(newPassword, 12);

    // Update password
    await db
      .update(schoolAdminTable)
      .set({
        password: hashedNewPassword,
        updatedAt: new Date(),
      })
      .where(eq(schoolAdminTable.id, schoolAdminId));

    res.status(200).json({
      success: true,
      message: "Password changed successfully",
    });
  } catch (error) {
    console.error("Error changing school admin password:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// Get school admin dashboard stats
export const getSchoolAdminStats = async (req, res) => {
  try {
    const schoolAdminId = req.user.id;

    // Get school admin info
    const schoolAdmin = await db
      .select()
      .from(schoolAdminTable)
      .where(eq(schoolAdminTable.id, schoolAdminId))
      .limit(1);

    if (schoolAdmin.length === 0) {
      return res.status(404).json({
        success: false,
        message: "School admin not found",
      });
    }

    // Get school information
    const school = await db
      .select()
      .from(schoolTable)
      .where(eq(schoolTable.id, schoolAdmin[0].schoolId))
      .limit(1);

    // Get real statistics from database
    const [busStats] = await db
      .select({
        totalBuses: sql`count(*)`,
        activeBuses: sql`count(*) filter (where is_active = true)`,
        inactiveBuses: sql`count(*) filter (where is_active = false)`,
      })
      .from(busTable)
      .where(eq(busTable.schoolAdminId, schoolAdminId));

    const [routeStats] = await db
      .select({
        totalRoutes: sql`count(*)`,
        activeRoutes: sql`count(*) filter (where is_active = true)`,
        inactiveRoutes: sql`count(*) filter (where is_active = false)`,
      })
      .from(routeTable)
      .where(eq(routeTable.schoolAdminId, schoolAdminId));

    const [driverStats] = await db
      .select({
        totalDrivers: sql`count(*)`,
        activeDrivers: sql`count(*) filter (where is_active = true)`,
        inactiveDrivers: sql`count(*) filter (where is_active = false)`,
      })
      .from(driverTable)
      .where(eq(driverTable.schoolAdminId, schoolAdminId));

    const [parentStats] = await db
      .select({
        totalParents: sql`count(*)`,
        activeParents: sql`count(*) filter (where is_active = true)`,
        inactiveParents: sql`count(*) filter (where is_active = false)`,
      })
      .from(parentTable)
      .where(eq(parentTable.schoolAdminId, schoolAdminId));

    const [childStats] = await db
      .select({
        totalChildren: sql`count(*)`,
        activeChildren: sql`count(*) filter (where is_active = true)`,
        inactiveChildren: sql`count(*) filter (where is_active = false)`,
      })
      .from(childTable)
      .where(eq(childTable.schoolAdminId, schoolAdminId));

    const stats = {
      school: school[0] || null,
      totalBuses: parseInt(busStats.totalBuses) || 0,
      activeBuses: parseInt(busStats.activeBuses) || 0,
      inactiveBuses: parseInt(busStats.inactiveBuses) || 0,
      totalRoutes: parseInt(routeStats.totalRoutes) || 0,
      activeRoutes: parseInt(routeStats.activeRoutes) || 0,
      inactiveRoutes: parseInt(routeStats.inactiveRoutes) || 0,
      totalDrivers: parseInt(driverStats.totalDrivers) || 0,
      activeDrivers: parseInt(driverStats.activeDrivers) || 0,
      inactiveDrivers: parseInt(driverStats.inactiveDrivers) || 0,
      totalParents: parseInt(parentStats.totalParents) || 0,
      activeParents: parseInt(parentStats.activeParents) || 0,
      inactiveParents: parseInt(parentStats.inactiveParents) || 0,
      totalChildren: parseInt(childStats.totalChildren) || 0,
      activeChildren: parseInt(childStats.activeChildren) || 0,
      inactiveChildren: parseInt(childStats.inactiveChildren) || 0,
    };

    res.status(200).json({
      success: true,
      data: stats,
      message: "School admin stats retrieved successfully",
    });
  } catch (error) {
    console.error("Error fetching school admin stats:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// Logout school admin
export const logoutSchoolAdmin = async (req, res) => {
  try {
    // Clear the access token cookie
    res.clearCookie("access_token", {
      httpOnly: true,
      secure: true,
      sameSite: "strict",
    });

    res.status(200).json({
      success: true,
      message: "School admin logged out successfully",
    });
  } catch (error) {
    console.error("Error logging out school admin:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};
