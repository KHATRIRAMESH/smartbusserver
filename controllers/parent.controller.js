import { eq, and, sql } from "drizzle-orm";
import db from "../config/connect.js";
import { parentTable } from "../database/Parent.js";
import { childTable } from "../database/Child.js";
import { busTable } from "../database/Bus.js";
import { routeTable } from "../database/Route.js";
import { driverTable } from "../database/Driver.js";
import { StatusCodes } from "http-status-codes";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

// Create a new parent
export const createParent = async (req, res) => {
  try {
    const schoolAdminId = req.user.id;
    const { name, email, phone, address, password } = req.body;

    if (!name || !email || !phone || !password) {
      return res.status(400).json({
        success: false,
        message: "Name, email, phone, and password are required",
      });
    }

    // Check if email already exists for this school admin
    const existingParent = await db
      .select()
      .from(parentTable)
      .where(
        and(
          eq(parentTable.email, email),
          eq(parentTable.schoolAdminId, schoolAdminId)
        )
      )
      .limit(1);

    if (existingParent.length > 0) {
      return res.status(409).json({
        success: false,
        message: "Email already exists for this school",
      });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create the parent
    const [newParent] = await db
      .insert(parentTable)
      .values({
        name,
        email,
        phone,
        address,
        password: hashedPassword,
        schoolAdminId,
      })
      .returning();

    res.status(StatusCodes.CREATED).json({
      success: true,
      message: "Parent created successfully",
      data: newParent,
    });
  } catch (error) {
    console.error("Error creating parent:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// Get all parents for a school admin
export const getAllParents = async (req, res) => {
  try {
    const schoolAdminId = req.user.id;

    const parents = await db
      .select({
        id: parentTable.id,
        name: parentTable.name,
        email: parentTable.email,
        phone: parentTable.phone,
        address: parentTable.address,
        isActive: parentTable.isActive,
        createdAt: parentTable.createdAt,
        updatedAt: parentTable.updatedAt,
        childrenCount: sql`(
          select count(*) from ${childTable} where ${childTable.parentId} = ${parentTable.id}
        )`,
      })
      .from(parentTable)
      .where(eq(parentTable.schoolAdminId, schoolAdminId));

    // Convert childrenCount to number
    const safeParents = parents.map((p) => ({
      ...p,
      childrenCount:
        typeof p.childrenCount === "object" &&
        p.childrenCount !== null &&
        "count" in p.childrenCount
          ? Number(p.childrenCount.count)
          : Number(p.childrenCount) || 0,
    }));

    res.status(200).json({
      success: true,
      data: safeParents,
      message: "Parents retrieved successfully",
    });
  } catch (error) {
    console.error("Error fetching parents:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// Get a specific parent by ID
export const getParentById = async (req, res) => {
  try {
    const schoolAdminId = req.user.id;
    const { id } = req.params;

    const parent = await db
      .select({
        id: parentTable.id,
        name: parentTable.name,
        email: parentTable.email,
        phone: parentTable.phone,
        address: parentTable.address,
        isActive: parentTable.isActive,
        createdAt: parentTable.createdAt,
        updatedAt: parentTable.updatedAt,
        children: {
          id: childTable.id,
          name: childTable.name,
          class: childTable.class,
          pickupStop: childTable.pickupStop,
          dropStop: childTable.dropStop,
          isActive: childTable.isActive,
        },
      })
      .from(parentTable)
      .leftJoin(childTable, eq(parentTable.id, childTable.parentId))
      .where(
        and(
          eq(parentTable.id, id),
          eq(parentTable.schoolAdminId, schoolAdminId)
        )
      );

    if (parent.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Parent not found",
      });
    }

    // Group children by parent
    const parentData = {
      ...parent[0],
      children: parent
        .filter((p) => p.children && p.children.id)
        .map((p) => p.children),
    };

    res.status(200).json({
      success: true,
      data: parentData,
      message: "Parent retrieved successfully",
    });
  } catch (error) {
    console.error("Error fetching parent:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// Update a parent
export const updateParent = async (req, res) => {
  try {
    const schoolAdminId = req.user.id;
    const { id } = req.params;
    const { name, email, phone, address, isActive } = req.body;

    // Check if parent exists and belongs to this school admin
    const existingParent = await db
      .select()
      .from(parentTable)
      .where(
        and(
          eq(parentTable.id, id),
          eq(parentTable.schoolAdminId, schoolAdminId)
        )
      )
      .limit(1);

    if (existingParent.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Parent not found",
      });
    }

    // If email is being updated, check for duplicates
    if (email && email !== existingParent[0].email) {
      const duplicateParent = await db
        .select()
        .from(parentTable)
        .where(
          and(
            eq(parentTable.email, email),
            eq(parentTable.schoolAdminId, schoolAdminId)
          )
        )
        .limit(1);

      if (duplicateParent.length > 0) {
        return res.status(409).json({
          success: false,
          message: "Email already exists for this school",
        });
      }
    }

    // Update the parent
    const [updatedParent] = await db
      .update(parentTable)
      .set({
        name,
        email,
        phone,
        address,
        isActive,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(parentTable.id, id),
          eq(parentTable.schoolAdminId, schoolAdminId)
        )
      )
      .returning();

    res.status(200).json({
      success: true,
      message: "Parent updated successfully",
      data: updatedParent,
    });
  } catch (error) {
    console.error("Error updating parent:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// Delete a parent
export const deleteParent = async (req, res) => {
  try {
    const schoolAdminId = req.user.id;
    const { id } = req.params;

    // Check if parent exists and belongs to this school admin
    const existingParent = await db
      .select()
      .from(parentTable)
      .where(
        and(
          eq(parentTable.id, id),
          eq(parentTable.schoolAdminId, schoolAdminId)
        )
      )
      .limit(1);

    if (existingParent.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Parent not found",
      });
    }

    // Check if parent has assigned children
    const childrenCount = await db
      .select({ count: sql`count(*)` })
      .from(childTable)
      .where(eq(childTable.parentId, id))
      .limit(1);

    if (childrenCount[0].count > 0) {
      return res.status(400).json({
        success: false,
        message:
          "Cannot delete parent with assigned children. Please reassign children first.",
      });
    }

    // Delete the parent
    await db
      .delete(parentTable)
      .where(
        and(
          eq(parentTable.id, id),
          eq(parentTable.schoolAdminId, schoolAdminId)
        )
      );

    res.status(200).json({
      success: true,
      message: "Parent deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting parent:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// Get parent statistics
export const getParentStats = async (req, res) => {
  try {
    const schoolAdminId = req.user.id;

    const stats = await db
      .select({
        totalParents: sql`count(*)`,
        activeParents: sql`count(*) filter (where ${parentTable.isActive} = true)`,
        parentsWithChildren: sql`count(*) filter (where exists (
          select 1 from ${childTable} where ${childTable.parentId} = ${parentTable.id}
        ))`,
      })
      .from(parentTable)
      .where(eq(parentTable.schoolAdminId, schoolAdminId))
      .limit(1);

    res.status(200).json({
      success: true,
      data: stats[0],
      message: "Parent statistics retrieved successfully",
    });
  } catch (error) {
    console.error("Error fetching parent stats:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// Parent login
export const loginParent = async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({
      success: false,
      message: "Email and password are required",
    });
  }
  try {
    // Find parent by email
    const parent = await db
      .select()
      .from(parentTable)
      .where(eq(parentTable.email, email))
      .limit(1);
    if (parent.length === 0) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }
    // Check password using bcrypt.compare
    const isPasswordValid = await bcrypt.compare(password, parent[0].password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }
    const payload = {
      id: parent[0].id,
      email: parent[0].email,
      role: "parent",
      schoolAdminId: parent[0].schoolAdminId,
    };
    // Generate JWT tokens
    const access_token = jwt.sign(payload, process.env.ACCESS_TOKEN_SECRET, {
      expiresIn: process.env.ACCESS_TOKEN_EXPIRY,
    });
    const refresh_token = jwt.sign(payload, process.env.REFRESH_TOKEN_SECRET, {
      expiresIn: process.env.REFRESH_TOKEN_EXPIRY,
    });
    // Remove password from response
    const { password: _, ...parentWithoutPassword } = parent[0];
    res.status(200).json({
      success: true,
      access_token,
      refresh_token,
      message: "Parent logged in successfully",
      user: parentWithoutPassword,
    });
  } catch (error) {
    console.error("Parent login error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// Get all children for a specific parent
export const getParentChildren = async (req, res) => {
  try {
    const parentId = req.user.id; // From JWT token

    const children = await db
      .select({
        id: childTable.id,
        name: childTable.name,
        class: childTable.class,
        pickupStop: childTable.pickupStop,
        dropStop: childTable.dropStop,
        isActive: childTable.isActive,
        createdAt: childTable.createdAt,
        updatedAt: childTable.updatedAt,
        busId: childTable.busId,
        // Bus details
        busNumber: busTable.busNumber,
        plateNumber: busTable.plateNumber,
        capacity: busTable.capacity,
        model: busTable.model,
        // Driver details
        driverId: driverTable.id,
        driverName: driverTable.name,
        driverPhone: driverTable.phone,
        driverLicense: driverTable.licenseNumber,
        // Route details
        routeId: routeTable.id,
        routeName: routeTable.name,
        routeStartStop: routeTable.startStop,
        routeEndStop: routeTable.endStop,
        routeStops: routeTable.stops,
      })
      .from(childTable)
      .leftJoin(busTable, eq(childTable.busId, busTable.id))
      .leftJoin(driverTable, eq(busTable.driverId, driverTable.id))
      .leftJoin(routeTable, eq(busTable.id, routeTable.busId))
      .where(eq(childTable.parentId, parentId));

    // Transform the flat structure to nested objects
    const transformedChildren = children.map((child) => ({
      id: child.id,
      name: child.name,
      class: child.class,
      pickupStop: child.pickupStop,
      dropStop: child.dropStop,
      isActive: child.isActive,
      createdAt: child.createdAt,
      updatedAt: child.updatedAt,
      bus: child.busId
        ? {
            id: child.busId,
            busNumber: child.busNumber,
            plateNumber: child.plateNumber,
            capacity: child.capacity,
            model: child.model,
            driver: child.driverId
              ? {
                  id: child.driverId,
                  name: child.driverName,
                  phone: child.driverPhone,
                  licenseNumber: child.driverLicense,
                }
              : null,
          }
        : null,
      route: child.routeId
        ? {
            id: child.routeId,
            name: child.routeName,
            startStop: child.routeStartStop,
            endStop: child.routeEndStop,
            stops: child.routeStops,
          }
        : null,
    }));
    console.log(transformedChildren);
    res.status(200).json({
      success: true,
      data: transformedChildren,
      message: "Children retrieved successfully",
    });
  } catch (error) {
    console.error("Error fetching parent children:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// Get parent profile
export const getParentProfile = async (req, res) => {
  try {
    const parentId = req.user.id;

    const parent = await db
      .select()
      .from(parentTable)
      .where(eq(parentTable.id, parentId))
      .limit(1);

    if (parent.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Parent not found",
      });
    }

    // Remove password from response
    const { password: _, ...parentWithoutPassword } = parent[0];

    res.status(200).json({
      success: true,
      data: parentWithoutPassword,
      message: "Parent profile retrieved successfully",
    });
  } catch (error) {
    console.error("Error fetching parent profile:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const changePassword = async (req, res) => {
  try {
    const parentId = req.user.id;
    const { currentPassword, newPassword } = req.body;
    const parent = await db
      .select()
      .from(parentTable)
      .where(eq(parentTable.id, parentId))
      .limit(1);
    if (parent.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Parent not found",
      });
    }
    const isPasswordValid = await bcrypt.compare(
      currentPassword,
      parent[0].password
    );
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }
    const hashedPassword = await bcrypt.hash(newPassword, 12);
    await db
      .update(parentTable)
      .set({ password: hashedPassword })
      .where(eq(parentTable.id, parentId));
    res.status(200).json({
      success: true,
      message: "Password changed successfully",
    });
  } catch (error) {
    console.error("Error changing password:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};
