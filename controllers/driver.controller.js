import { eq, and, sql } from "drizzle-orm";
import db from "../config/connect.js";
import { driverTable } from "../database/Driver.js";
import { busTable } from "../database/Bus.js";
import { routeTable } from "../database/Route.js";
import { StatusCodes } from "http-status-codes";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config();

// Create a new driver
export const createDriver = async (req, res) => {
  try {
    const schoolAdminId = req.user.id;
    const { name, email, phone, licenseNumber, address, password } = req.body;

    if (!name || !email || !phone || !licenseNumber || !password) {
      return res.status(400).json({
        success: false,
        message:
          "Name, email, phone, license number, and password are required",
      });
    }

    // Check if email or license number already exists for this school admin
    const existingDriver = await db
      .select()
      .from(driverTable)
      .where(
        and(
          eq(driverTable.email, email),
          eq(driverTable.schoolAdminId, schoolAdminId)
        )
      )
      .limit(1);

    if (existingDriver.length > 0) {
      return res.status(409).json({
        success: false,
        message: "Email already exists for this school",
      });
    }

    const existingLicense = await db
      .select()
      .from(driverTable)
      .where(eq(driverTable.licenseNumber, licenseNumber))
      .limit(1);

    if (existingLicense.length > 0) {
      return res.status(409).json({
        success: false,
        message: "License number already exists",
      });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create the driver
    const [newDriver] = await db
      .insert(driverTable)
      .values({
        name,
        email,
        phone,
        licenseNumber,
        address,
        password: hashedPassword,
        schoolAdminId,
      })
      .returning();

    res.status(StatusCodes.CREATED).json({
      success: true,
      message: "Driver created successfully",
      data: newDriver,
    });
  } catch (error) {
    console.error("Error creating driver:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// Login driver
export const loginDriver = async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({
      success: false,
      message: "Email and password are required",
    });
  }
  try {
    // Find driver by email
    const driver = await db
      .select()
      .from(driverTable)
      .where(eq(driverTable.email, email))
      .limit(1);

    if (driver.length === 0) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    // Check if driver is active
    if (!driver[0].isActive) {
      return res.status(401).json({
        success: false,
        message: "Your account is inactive. Please contact your administrator.",
      });
    }

    // Check password using bcrypt.compare
    const isPasswordValid = await bcrypt.compare(password, driver[0].password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    const payload = {
      id: driver[0].id,
      email: driver[0].email,
      role: "driver",
      schoolAdminId: driver[0].schoolAdminId,
    };

    // Generate JWT tokens
    const access_token = jwt.sign(payload, process.env.ACCESS_TOKEN_SECRET, {
      expiresIn: process.env.ACCESS_TOKEN_EXPIRY,
    });
    const refresh_token = jwt.sign(payload, process.env.REFRESH_TOKEN_SECRET, {
      expiresIn: process.env.REFRESH_TOKEN_EXPIRY,
    });

    // Remove password from response
    const { password: _, ...driverWithoutPassword } = driver[0];

    res.status(200).json({
      success: true,
      access_token,
      refresh_token,
      message: "Driver logged in successfully",
      user: driverWithoutPassword,
    });
  } catch (error) {
    console.error("Driver login error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// Get driver profile
export const getDriverProfile = async (req, res) => {
  try {
    const driverId = req.user.id;
    const driver = await db
      .select({
        id: driverTable.id,
        name: driverTable.name,
        email: driverTable.email,
        phone: driverTable.phone,
        licenseNumber: driverTable.licenseNumber,
        address: driverTable.address,
        isActive: driverTable.isActive,
        createdAt: driverTable.createdAt,
        updatedAt: driverTable.updatedAt,
        assignedBus: {
          id: busTable.id,
          busNumber: busTable.busNumber,
          plateNumber: busTable.plateNumber,
          capacity: busTable.capacity,
          model: busTable.model,
        },
      })
      .from(driverTable)
      .leftJoin(busTable, eq(driverTable.id, busTable.driverId))
      .where(eq(driverTable.id, driverId))
      .limit(1);

    if (driver.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Driver not found",
      });
    }
    res.status(200).json({
      success: true,
      data: driver[0],
      message: "Driver profile retrieved successfully",
    });
  } catch (error) {
    console.error("Error fetching driver profile:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// Get driver's assigned bus
export const getDriverBus = async (req, res) => {
  try {
    const driverId = req.user.id;
    const bus = await db
      .select({
        id: busTable.id,
        busNumber: busTable.busNumber,
        plateNumber: busTable.plateNumber,
        capacity: busTable.capacity,
        model: busTable.model,
        isActive: busTable.isActive,
        route: {
          id: routeTable.id,
          name: routeTable.name,
          startStop: routeTable.startStop,
          endStop: routeTable.endStop,
          stops: routeTable.stops,
        },
      })
      .from(busTable)
      .leftJoin(routeTable, eq(busTable.id, routeTable.busId))
      .where(eq(busTable.driverId, driverId))
      .limit(1);

    if (bus.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No bus assigned to this driver",
      });
    }

    res.status(200).json({
      success: true,
      data: bus[0],
      message: "Driver's assigned bus retrieved successfully",
    });
  } catch (error) {
    console.error("Error fetching driver's bus:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// Get all drivers for a school admin
export const getAllDrivers = async (req, res) => {
  try {
    const schoolAdminId = req.user.id;

    const drivers = await db
      .select({
        id: driverTable.id,
        name: driverTable.name,
        email: driverTable.email,
        phone: driverTable.phone,
        licenseNumber: driverTable.licenseNumber,
        address: driverTable.address,
        isActive: driverTable.isActive,
        createdAt: driverTable.createdAt,
        updatedAt: driverTable.updatedAt,
        assignedBus: {
          id: busTable.id,
          busNumber: busTable.busNumber,
          plateNumber: busTable.plateNumber,
        },
      })
      .from(driverTable)
      .leftJoin(busTable, eq(driverTable.id, busTable.driverId))
      .where(eq(driverTable.schoolAdminId, schoolAdminId));

    res.status(200).json({
      success: true,
      data: drivers,
      message: "Drivers retrieved successfully",
    });
  } catch (error) {
    console.error("Error fetching drivers:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// Get a specific driver by ID
export const getDriverById = async (req, res) => {
  try {
    const schoolAdminId = req.user.id;
    const { id } = req.params;

    const driver = await db
      .select({
        id: driverTable.id,
        name: driverTable.name,
        email: driverTable.email,
        phone: driverTable.phone,
        licenseNumber: driverTable.licenseNumber,
        address: driverTable.address,
        isActive: driverTable.isActive,
        createdAt: driverTable.createdAt,
        updatedAt: driverTable.updatedAt,
        assignedBus: {
          id: busTable.id,
          busNumber: busTable.busNumber,
          plateNumber: busTable.plateNumber,
          capacity: busTable.capacity,
          model: busTable.model,
        },
      })
      .from(driverTable)
      .leftJoin(busTable, eq(driverTable.id, busTable.driverId))
      .where(
        and(
          eq(driverTable.id, id),
          eq(driverTable.schoolAdminId, schoolAdminId)
        )
      )
      .limit(1);

    if (driver.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Driver not found",
      });
    }

    res.status(200).json({
      success: true,
      data: driver[0],
      message: "Driver retrieved successfully",
    });
  } catch (error) {
    console.error("Error fetching driver:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// Update a driver
export const updateDriver = async (req, res) => {
  try {
    const schoolAdminId = req.user.id;
    const { id } = req.params;
    const { name, email, phone, licenseNumber, address, isActive } = req.body;

    // Check if driver exists and belongs to this school admin
    const existingDriver = await db
      .select()
      .from(driverTable)
      .where(
        and(
          eq(driverTable.id, id),
          eq(driverTable.schoolAdminId, schoolAdminId)
        )
      )
      .limit(1);

    if (existingDriver.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Driver not found",
      });
    }

    // If email is being updated, check for duplicates
    if (email && email !== existingDriver[0].email) {
      const duplicateEmail = await db
        .select()
        .from(driverTable)
        .where(eq(driverTable.email, email))
        .limit(1);

      if (duplicateEmail.length > 0) {
        return res.status(409).json({
          success: false,
          message: "Email already exists",
        });
      }
    }

    // If license number is being updated, check for duplicates
    if (licenseNumber && licenseNumber !== existingDriver[0].licenseNumber) {
      const duplicateLicense = await db
        .select()
        .from(driverTable)
        .where(eq(driverTable.licenseNumber, licenseNumber))
        .limit(1);

      if (duplicateLicense.length > 0) {
        return res.status(409).json({
          success: false,
          message: "License number already exists",
        });
      }
    }

    // Update the driver
    const [updatedDriver] = await db
      .update(driverTable)
      .set({
        name,
        email,
        phone,
        licenseNumber,
        address,
        isActive,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(driverTable.id, id),
          eq(driverTable.schoolAdminId, schoolAdminId)
        )
      )
      .returning();

    res.status(200).json({
      success: true,
      message: "Driver updated successfully",
      data: updatedDriver,
    });
  } catch (error) {
    console.error("Error updating driver:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// Delete a driver
export const deleteDriver = async (req, res, next) => {
  try {
    const schoolAdminId = req.user.id;
    const { id } = req.params;

    // Check if driver exists and belongs to this school admin
    const existingDriver = await db
      .select()
      .from(driverTable)
      .where(
        and(
          eq(driverTable.id, id),
          eq(driverTable.schoolAdminId, schoolAdminId)
        )
      )
      .limit(1);

    if (existingDriver.length === 0) {
      return res.status(404).json({
        success: false,
        error: "Driver not found",
      });
    }

    // First, unassign the driver from any bus
    await db
      .update(busTable)
      .set({
        driverId: null,
        updatedAt: new Date(),
      })
      .where(eq(busTable.driverId, id));

    // Now delete the driver
    await db
      .delete(driverTable)
      .where(
        and(
          eq(driverTable.id, id),
          eq(driverTable.schoolAdminId, schoolAdminId)
        )
      );

    res.status(200).json({
      success: true,
      message: "Driver deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};

// Get driver statistics
export const getDriverStats = async (req, res) => {
  try {
    const schoolAdminId = req.user.id;

    // Get total drivers
    const totalDrivers = await db
      .select({ count: sql`count(*)` })
      .from(driverTable)
      .where(eq(driverTable.schoolAdminId, schoolAdminId));

    // Get active drivers
    const activeDrivers = await db
      .select({ count: sql`count(*)` })
      .from(driverTable)
      .where(
        and(
          eq(driverTable.schoolAdminId, schoolAdminId),
          eq(driverTable.isActive, true)
        )
      );

    // Get assigned drivers
    const assignedDrivers = await db
      .select({ count: sql`count(distinct ${driverTable.id})` })
      .from(driverTable)
      .leftJoin(busTable, eq(driverTable.id, busTable.driverId))
      .where(
        and(
          eq(driverTable.schoolAdminId, schoolAdminId),
          sql`${busTable.driverId} is not null`
        )
      );

    const stats = {
      totalDrivers: totalDrivers[0]?.count || 0,
      activeDrivers: activeDrivers[0]?.count || 0,
      assignedDrivers: assignedDrivers[0]?.count || 0,
      unassignedDrivers:
        (totalDrivers[0]?.count || 0) - (assignedDrivers[0]?.count || 0),
    };

    res.status(200).json({
      success: true,
      data: stats,
      message: "Driver statistics retrieved successfully",
    });
  } catch (error) {
    console.error("Error fetching driver stats:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
}; 
