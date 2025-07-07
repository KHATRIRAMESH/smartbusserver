import { eq, and, sql } from "drizzle-orm";
import db from "../config/connect.js";
import { busTable } from "../database/Bus.js";
import { driverTable } from "../database/Driver.js";
import { routeTable } from "../database/Route.js";
import { childTable } from "../database/Child.js";
import { parentTable } from "../database/Parent.js";
import { StatusCodes } from "http-status-codes";
import { ForeignKeyError } from "../errors/custom-api.js";

// Create a new bus
export const createBus = async (req, res) => {
  try {
    const schoolAdminId = req.user.id;
    const { busNumber, capacity, model, plateNumber, driverId } = req.body;

    if (!busNumber || !capacity || !plateNumber) {
      return res.status(400).json({
        success: false,
        message: "Bus number, capacity, and plate number are required",
      });
    }

    // Check if bus number already exists for this school admin
    const existingBus = await db
      .select()
      .from(busTable)
      .where(
        and(
          eq(busTable.busNumber, busNumber),
          eq(busTable.schoolAdminId, schoolAdminId)
        )
      )
      .limit(1);

    if (existingBus.length > 0) {
      return res.status(409).json({
        success: false,
        message: "Bus number already exists",
      });
    }

    // Check if plate number already exists
    const existingPlate = await db
      .select()
      .from(busTable)
      .where(eq(busTable.plateNumber, plateNumber))
      .limit(1);

    if (existingPlate.length > 0) {
      return res.status(409).json({
        success: false,
        message: "Plate number already exists",
      });
    }

    // If driverId is provided, verify the driver exists and belongs to this school admin
    if (driverId) {
      const driver = await db
        .select()
        .from(driverTable)
        .where(
          and(
            eq(driverTable.id, driverId),
            eq(driverTable.schoolAdminId, schoolAdminId)
          )
        )
        .limit(1);

      if (driver.length === 0) {
        return res.status(404).json({
          success: false,
          message: "Driver not found or not authorized",
        });
      }
    }

    // Create the bus
    const [newBus] = await db
      .insert(busTable)
      .values({
        busNumber,
        capacity,
        model,
        plateNumber,
        driverId,
        schoolAdminId,
      })
      .returning();

    res.status(StatusCodes.CREATED).json({
      success: true,
      message: "Bus created successfully",
      data: newBus,
    });
  } catch (error) {
    console.error("Error creating bus:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// Get all buses for a school admin
export const getAllBuses = async (req, res) => {
  try {
    const schoolAdminId = req.user.id;

    const buses = await db
      .select({
        id: busTable.id,
        busNumber: busTable.busNumber,
        capacity: busTable.capacity,
        model: busTable.model,
        plateNumber: busTable.plateNumber,
        isActive: busTable.isActive,
        createdAt: busTable.createdAt,
        updatedAt: busTable.updatedAt,
        driver: {
          id: driverTable.id,
          name: driverTable.name,
          email: driverTable.email,
          phone: driverTable.phone,
          licenseNumber: driverTable.licenseNumber,
        },
      })
      .from(busTable)
      .leftJoin(driverTable, eq(busTable.driverId, driverTable.id))
      .where(eq(busTable.schoolAdminId, schoolAdminId));

    res.status(200).json({
      success: true,
      data: buses,
      message: "Buses retrieved successfully",
    });
  } catch (error) {
    console.error("Error fetching buses:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// Get a specific bus by ID
export const getBusById = async (req, res) => {
  try {
    const schoolAdminId = req.user.id;
    const { id } = req.params;

    const bus = await db
      .select({
        id: busTable.id,
        busNumber: busTable.busNumber,
        capacity: busTable.capacity,
        model: busTable.model,
        plateNumber: busTable.plateNumber,
        isActive: busTable.isActive,
        createdAt: busTable.createdAt,
        updatedAt: busTable.updatedAt,
        driver: {
          id: driverTable.id,
          name: driverTable.name,
          email: driverTable.email,
          phone: driverTable.phone,
          licenseNumber: driverTable.licenseNumber,
        },
      })
      .from(busTable)
      .leftJoin(driverTable, eq(busTable.driverId, driverTable.id))
      .where(
        and(
          eq(busTable.id, id),
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

    res.status(200).json({
      success: true,
      data: bus[0],
      message: "Bus retrieved successfully",
    });
  } catch (error) {
    console.error("Error fetching bus:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// Update a bus
export const updateBus = async (req, res) => {
  try {
    const schoolAdminId = req.user.id;
    const { id } = req.params;
    const { busNumber, capacity, model, plateNumber, driverId, isActive } = req.body;

    // Check if bus exists and belongs to this school admin
    const existingBus = await db
      .select()
      .from(busTable)
      .where(
        and(
          eq(busTable.id, id),
          eq(busTable.schoolAdminId, schoolAdminId)
        )
      )
      .limit(1);

    if (existingBus.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Bus not found",
      });
    }

    // If bus number is being updated, check for duplicates
    if (busNumber && busNumber !== existingBus[0].busNumber) {
      const duplicateBus = await db
        .select()
        .from(busTable)
        .where(
          and(
            eq(busTable.busNumber, busNumber),
            eq(busTable.schoolAdminId, schoolAdminId)
          )
        )
        .limit(1);

      if (duplicateBus.length > 0) {
        return res.status(409).json({
          success: false,
          message: "Bus number already exists",
        });
      }
    }

    // If plate number is being updated, check for duplicates
    if (plateNumber && plateNumber !== existingBus[0].plateNumber) {
      const duplicatePlate = await db
        .select()
        .from(busTable)
        .where(eq(busTable.plateNumber, plateNumber))
        .limit(1);

      if (duplicatePlate.length > 0) {
        return res.status(409).json({
          success: false,
          message: "Plate number already exists",
        });
      }
    }

    // If driverId is being updated, verify the driver exists and belongs to this school admin
    if (driverId && driverId !== existingBus[0].driverId) {
      const driver = await db
        .select()
        .from(driverTable)
        .where(
          and(
            eq(driverTable.id, driverId),
            eq(driverTable.schoolAdminId, schoolAdminId)
          )
        )
        .limit(1);
    
      if (driver.length === 0) {
        return res.status(404).json({
          success: false,
          message: "Driver not found or not authorized",
        });
      }
    
      const driverAssignedBus = await db
        .select()
        .from(busTable)
        .where(
          and(
            eq(busTable.driverId, driverId),
            eq(busTable.schoolAdminId, schoolAdminId)
          )
        )
        .limit(1);
    
      if (driverAssignedBus.length > 0) {
        return res.status(409).json({
          success: false,
          message: "Driver is already assigned to another bus",
        });
      }
    }
    

    // Update the bus
    const [updatedBus] = await db
      .update(busTable)
      .set({
        busNumber,
        capacity,
        model,
        plateNumber,
        driverId,
        isActive,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(busTable.id, id),
          eq(busTable.schoolAdminId, schoolAdminId)
        )
      )
      .returning();

    res.status(200).json({
      success: true,
      message: "Bus updated successfully",
      data: updatedBus,
    });
  } catch (error) {
    console.error("Error updating bus:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// Delete a bus
export const deleteBus = async (req, res, next) => {
  try {
    const schoolAdminId = req.user.id;
    const { id } = req.params;

    // Check if bus exists and belongs to this school admin
    const existingBus = await db
      .select()
      .from(busTable)
      .where(
        and(
          eq(busTable.id, id),
          eq(busTable.schoolAdminId, schoolAdminId)
        )
      )
      .limit(1);

    if (existingBus.length === 0) {
      return res.status(404).json({
        success: false,
        error: "Bus not found",
      });
    }

    // First, unassign any children from this bus
    await db
      .update(childTable)
      .set({
        busId: null,
        updatedAt: new Date(),
      })
      .where(eq(childTable.busId, id));

    // Then, unassign any routes from this bus
    await db
      .update(routeTable)
      .set({
        busId: null,
        updatedAt: new Date(),
      })
      .where(eq(routeTable.busId, id));

    // Now delete the bus
    await db
      .delete(busTable)
      .where(
        and(
          eq(busTable.id, id),
          eq(busTable.schoolAdminId, schoolAdminId)
        )
      );

    res.status(200).json({
      success: true,
      message: "Bus deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};


// Get bus statistics
export const getBusStats = async (req, res) => {
  try {
    const schoolAdminId = req.user.id;

    const stats = await db
      .select({
        totalBuses: sql`count(*)`,
        activeBuses: sql`count(*) filter (where ${busTable.isActive} = true)`,
        busesWithDrivers: sql`count(*) filter (where ${busTable.driverId} is not null)`,
        totalCapacity: sql`sum(${busTable.capacity})`,
      })
      .from(busTable)
      .where(eq(busTable.schoolAdminId, schoolAdminId))
      .limit(1);

    res.status(200).json({
      success: true,
      data: stats[0],
      message: "Bus statistics retrieved successfully",
    });
  } catch (error) {
    console.error("Error fetching bus stats:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
}; 