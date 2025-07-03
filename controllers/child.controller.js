import { eq, and, sql } from "drizzle-orm";
import db from "../config/connect.js";
import { childTable } from "../database/Child.js";
import { parentTable } from "../database/Parent.js";
import { busTable } from "../database/Bus.js";
import { routeTable } from "../database/Route.js";
import { StatusCodes } from "http-status-codes";

// Create a new child
export const createChild = async (req, res) => {
  try {
    const schoolAdminId = req.user.id;
    const { name, class: className, pickupStop, dropStop, parentId, busId } = req.body;

    if (!name || !className || !pickupStop || !dropStop || !parentId) {
      return res.status(400).json({
        success: false,
        message: "Name, class, pickup stop, drop stop, and parent are required",
      });
    }

    // Check if parent exists and belongs to this school admin
    const parent = await db
      .select()
      .from(parentTable)
      .where(
        and(
          eq(parentTable.id, parentId),
          eq(parentTable.schoolAdminId, schoolAdminId)
        )
      )
      .limit(1);

    if (parent.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Parent not found",
      });
    }

    // If bus is assigned, check if it exists and belongs to this school admin
    if (busId) {
      const bus = await db
        .select()
        .from(busTable)
        .where(
          and(
            eq(busTable.id, busId),
            eq(busTable.schoolAdminId, schoolAdminId)
          )
        )
        .limit(1);

      if (bus.length === 0) {
        return res.status(404).json({
          success: false,
          message: "Bus not found",
        });
      }
    }

    // Create the child
    const [newChild] = await db
      .insert(childTable)
      .values({
        name,
        class: className,
        pickupStop,
        dropStop,
        parentId,
        busId,
        schoolAdminId,
      })
      .returning();

    res.status(StatusCodes.CREATED).json({
      success: true,
      message: "Child created successfully",
      data: newChild,
    });
  } catch (error) {
    console.error("Error creating child:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// Get all children for a school admin
export const getAllChildren = async (req, res) => {
  try {
    const schoolAdminId = req.user.id;

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
        parentId: childTable.parentId,
        busId: childTable.busId,
        // Parent fields
        parentId: parentTable.id,
        parentName: parentTable.name,
        parentEmail: parentTable.email,
        parentPhone: parentTable.phone,
        // Bus fields
        busId: busTable.id,
        busNumber: busTable.busNumber,
        busPlateNumber: busTable.plateNumber,
      })
      .from(childTable)
      .leftJoin(parentTable, eq(childTable.parentId, parentTable.id))
      .leftJoin(busTable, eq(childTable.busId, busTable.id))
      .where(eq(childTable.schoolAdminId, schoolAdminId));

    // Transform the flat structure to nested objects
    const transformedChildren = children.map(child => ({
      id: child.id,
      name: child.name,
      class: child.class,
      pickupStop: child.pickupStop,
      dropStop: child.dropStop,
      isActive: child.isActive,
      createdAt: child.createdAt,
      updatedAt: child.updatedAt,
      parentId: child.parentId,
      busId: child.busId,
      parent: child.parentId ? {
        id: child.parentId,
        name: child.parentName,
        email: child.parentEmail,
        phone: child.parentPhone,
      } : null,
      bus: child.busId ? {
        id: child.busId,
        busNumber: child.busNumber,
        plateNumber: child.busPlateNumber,
      } : null,
    }));

    res.status(200).json({
      success: true,
      data: transformedChildren,
      message: "Children retrieved successfully",
    });
  } catch (error) {
    console.error("Error fetching children:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// Get a specific child by ID
export const getChildById = async (req, res) => {
  try {
    const schoolAdminId = req.user.id;
    const { id } = req.params;

    const child = await db
      .select({
        id: childTable.id,
        name: childTable.name,
        class: childTable.class,
        pickupStop: childTable.pickupStop,
        dropStop: childTable.dropStop,
        isActive: childTable.isActive,
        createdAt: childTable.createdAt,
        updatedAt: childTable.updatedAt,
        parentId: childTable.parentId,
        busId: childTable.busId,
        // Parent fields
        parentId: parentTable.id,
        parentName: parentTable.name,
        parentEmail: parentTable.email,
        parentPhone: parentTable.phone,
        parentAddress: parentTable.address,
        // Bus fields
        busId: busTable.id,
        busNumber: busTable.busNumber,
        busPlateNumber: busTable.plateNumber,
        busCapacity: busTable.capacity,
        busModel: busTable.model,
      })
      .from(childTable)
      .leftJoin(parentTable, eq(childTable.parentId, parentTable.id))
      .leftJoin(busTable, eq(childTable.busId, busTable.id))
      .where(
        and(
          eq(childTable.id, id),
          eq(childTable.schoolAdminId, schoolAdminId)
        )
      )
      .limit(1);

    if (child.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Child not found",
      });
    }

    // Transform the flat structure to nested objects
    const childData = child[0];
    const transformedChild = {
      id: childData.id,
      name: childData.name,
      class: childData.class,
      pickupStop: childData.pickupStop,
      dropStop: childData.dropStop,
      isActive: childData.isActive,
      createdAt: childData.createdAt,
      updatedAt: childData.updatedAt,
      parentId: childData.parentId,
      busId: childData.busId,
      parent: childData.parentId ? {
        id: childData.parentId,
        name: childData.parentName,
        email: childData.parentEmail,
        phone: childData.parentPhone,
        address: childData.parentAddress,
      } : null,
      bus: childData.busId ? {
        id: childData.busId,
        busNumber: childData.busNumber,
        plateNumber: childData.busPlateNumber,
        capacity: childData.busCapacity,
        model: childData.busModel,
      } : null,
    };

    res.status(200).json({
      success: true,
      data: transformedChild,
      message: "Child retrieved successfully",
    });
  } catch (error) {
    console.error("Error fetching child:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// Update a child
export const updateChild = async (req, res) => {
  try {
    const schoolAdminId = req.user.id;
    const { id } = req.params;
    const { name, class: className, pickupStop, dropStop, parentId, busId, isActive } = req.body;

    // Check if child exists and belongs to this school admin
    const existingChild = await db
      .select()
      .from(childTable)
      .where(
        and(
          eq(childTable.id, id),
          eq(childTable.schoolAdminId, schoolAdminId)
        )
      )
      .limit(1);

    if (existingChild.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Child not found",
      });
    }

    // If parent is being updated, check if it exists and belongs to this school admin
    if (parentId) {
      const parent = await db
        .select()
        .from(parentTable)
        .where(
          and(
            eq(parentTable.id, parentId),
            eq(parentTable.schoolAdminId, schoolAdminId)
          )
        )
        .limit(1);

      if (parent.length === 0) {
        return res.status(404).json({
          success: false,
          message: "Parent not found",
        });
      }
    }

    // If bus is being updated, check if it exists and belongs to this school admin
    if (busId) {
      const bus = await db
        .select()
        .from(busTable)
        .where(
          and(
            eq(busTable.id, busId),
            eq(busTable.schoolAdminId, schoolAdminId)
          )
        )
        .limit(1);

      if (bus.length === 0) {
        return res.status(404).json({
          success: false,
          message: "Bus not found",
        });
      }
    }



    // Update the child
    const [updatedChild] = await db
      .update(childTable)
      .set({
        name,
        class: className,
        pickupStop,
        dropStop,
        parentId,
        busId,
        isActive,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(childTable.id, id),
          eq(childTable.schoolAdminId, schoolAdminId)
        )
      )
      .returning();

    res.status(200).json({
      success: true,
      message: "Child updated successfully",
      data: updatedChild,
    });
  } catch (error) {
    console.error("Error updating child:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// Delete a child
export const deleteChild = async (req, res) => {
  try {
    const schoolAdminId = req.user.id;
    const { id } = req.params;

    // Check if child exists and belongs to this school admin
    const existingChild = await db
      .select()
      .from(childTable)
      .where(
        and(
          eq(childTable.id, id),
          eq(childTable.schoolAdminId, schoolAdminId)
        )
      )
      .limit(1);

    if (existingChild.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Child not found",
      });
    }

    // Delete the child
    await db
      .delete(childTable)
      .where(
        and(
          eq(childTable.id, id),
          eq(childTable.schoolAdminId, schoolAdminId)
        )
      );

    res.status(200).json({
      success: true,
      message: "Child deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting child:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// Get child statistics
export const getChildStats = async (req, res) => {
  try {
    const schoolAdminId = req.user.id;

    const stats = await db
      .select({
        totalChildren: sql`count(*)`,
        activeChildren: sql`count(*) filter (where ${childTable.isActive} = true)`,
        childrenWithBus: sql`count(*) filter (where ${childTable.busId} is not null)`,
      })
      .from(childTable)
      .where(eq(childTable.schoolAdminId, schoolAdminId))
      .limit(1);

    res.status(200).json({
      success: true,
      data: stats[0],
      message: "Child statistics retrieved successfully",
    });
  } catch (error) {
    console.error("Error fetching child stats:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
}; 