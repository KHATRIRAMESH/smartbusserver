import { eq, and, sql } from "drizzle-orm";
import db from "../config/connect.js";
import { routeTable } from "../database/Route.js";
import { busTable } from "../database/Bus.js";
import { childTable } from "../database/Child.js";
import { schoolTable } from "../database/School.js";
import { schoolAdminTable } from "../database/SchoolAdmin.js";
import { parentTable } from "../database/Parent.js";
import { StatusCodes } from "http-status-codes";

// Create a new route
export const createRoute = async (req, res) => {
  try {
    const schoolAdminId = req.user.id;
    const { name, description, startStop, endStop, stops, busId, schoolId } =
      req.body;
    console.log(req.body);

    if (!name || !startStop || !endStop) {
      return res.status(400).json({
        success: false,
        message: "Name, start stop, and end stop are required",
      });
    }

    // Get school ID for this school admin
    // const schoolAdmin = await db
    //   .select({ schoolId: schoolAdminTable.schoolId })
    //   .from(schoolAdminTable)
    //   .where(eq(schoolAdminTable.id, schoolAdminId))
    //   .limit(1);

    // if (schoolAdmin.length === 0) {
    //   return res.status(404).json({
    //     success: false,
    //     message: "School admin not found",
    //   });
    // }

    // Check if route name already exists for this school
    const existingRoute = await db
      .select()
      .from(routeTable)
      .where(and(eq(routeTable.name, name), eq(routeTable.schoolId, schoolId)))
      .limit(1);

    if (existingRoute.length > 0) {
      return res.status(409).json({
        success: false,
        message: "Route name already exists for this school",
      });
    }

    // If busId is provided, verify the bus exists and belongs to this school admin
    if (busId) {
      const bus = await db
        .select()
        .from(busTable)
        .where(
          and(eq(busTable.id, busId), eq(busTable.schoolAdminId, schoolAdminId))
        )
        .limit(1);

      if (bus.length === 0) {
        return res.status(404).json({
          success: false,
          message: "Bus not found or not authorized",
        });
      }
    }

    // Create the route
    const [newRoute] = await db
      .insert(routeTable)
      .values({
        name,
        description,
        startStop,
        endStop,
        stops,
        busId,
        schoolAdminId: schoolAdminId,
        schoolId: schoolId,
      })
      .returning();

    res.status(StatusCodes.CREATED).json({
      success: true,
      message: "Route created successfully",
      data: newRoute,
    });
  } catch (error) {
    console.error("Error creating route:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// Get all routes for a school admin
export const getAllRoutes = async (req, res) => {
  try {
    const schoolAdminId = req.user.id;
    console.log(schoolAdminId);

    // Get school ID for this school admin
    const schoolAdmin = await db
      .select({ schoolId: schoolAdminTable.schoolId })
      .from(schoolAdminTable)
      .where(eq(schoolAdminTable.id, schoolAdminId))
      .limit(1);

    if (schoolAdmin.length === 0) {
      return res.status(404).json({
        success: false,
        message: "School admin not found",
      });
    }

    const routes = await db
    .select({
      id: routeTable.id,
      name: routeTable.name,
      description: routeTable.description,
      startStop: routeTable.startStop,
      endStop: routeTable.endStop,
      stops: routeTable.stops,
      isActive: routeTable.isActive,
      createdAt: routeTable.createdAt,
      updatedAt: routeTable.updatedAt,
      busId: routeTable.busId,
      schoolId: routeTable.schoolId,
      assignedBusId: busTable.id,
      assignedBusNumber: busTable.busNumber,
      assignedPlateNumber: busTable.plateNumber,
      childrenCount: sql`(
        select count(*) from "child" where "child"."bus_id" = "route"."bus_id"
      )`,
    })
    .from(routeTable)
    .leftJoin(busTable, eq(routeTable.busId, busTable.id))
    .where(eq(routeTable.schoolAdminId, schoolAdminId));
  
  
  // console.log(routes);

    // Ensure stops is always an array
    const safeRoutes = routes.map((r) => ({
      ...r,
      stops: Array.isArray(r.stops) ? r.stops : r.stops ? [r.stops] : [],
      childrenCount: typeof r.childrenCount === 'object' && r.childrenCount !== null && 'count' in r.childrenCount ? Number(r.childrenCount.count) : Number(r.childrenCount) || 0,
    }));

    // console.log(safeRoutes);
    

    res.status(200).json({
      success: true,
      data: safeRoutes,
      message: "Routes retrieved successfully",
    });
  } catch (error) {
    console.error(
      "Error fetching routes:",
      error && error.stack ? error.stack : error
    );
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// Get a specific route by ID
export const getRouteById = async (req, res) => {
  try {
    const schoolAdminId = req.user.id;
    const { id } = req.params;

    // Get school ID for this school admin
    const schoolAdmin = await db
      .select({ schoolId: schoolAdminTable.schoolId })
      .from(schoolAdminTable)
      .where(eq(schoolAdminTable.id, schoolAdminId))
      .limit(1);

    if (schoolAdmin.length === 0) {
      return res.status(404).json({
        success: false,
        message: "School admin not found",
      });
    }

    const route = await db
      .select({
        id: routeTable.id,
        name: routeTable.name,
        description: routeTable.description,
        startStop: routeTable.startStop,
        endStop: routeTable.endStop,
        stops: routeTable.stops,
        estimatedDuration: routeTable.estimatedDuration,
        distance: routeTable.distance,
        isActive: routeTable.isActive,
        createdAt: routeTable.createdAt,
        updatedAt: routeTable.updatedAt,
        assignedBus: {
          id: busTable.id,
          busNumber: busTable.busNumber,
          plateNumber: busTable.plateNumber,
          capacity: busTable.capacity,
          model: busTable.model,
        },
        children: {
          id: childTable.id,
          name: childTable.name,
          class: childTable.class,
          pickupStop: childTable.pickupStop,
          dropStop: childTable.dropStop,
          parent: {
            id: parentTable.id,
            name: parentTable.name,
            email: parentTable.email,
            phone: parentTable.phone,
          },
        },
      })
      .from(routeTable)
      .leftJoin(busTable, eq(routeTable.busId, busTable.id))
      .leftJoin(childTable, eq(routeTable.id, childTable.routeId))
      .leftJoin(parentTable, eq(childTable.parentId, parentTable.id))
      .where(
        and(eq(routeTable.id, id), eq(routeTable.schoolAdminId, schoolAdminId))
      )
      .limit(1);

    if (route.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Route not found",
      });
    }

    res.status(200).json({
      success: true,
      data: route[0],
      message: "Route retrieved successfully",
    });
  } catch (error) {
    console.error("Error fetching route:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// Update a route
export const updateRoute = async (req, res) => {
  try {
    const schoolAdminId = req.user.id;
    const { id } = req.params;
    const {
      name,
      description,
      startStop,
      endStop,
      stops,
      estimatedDuration,
      distance,
      busId,
      isActive,
    } = req.body;

    // Get school ID for this school admin
    const schoolAdmin = await db
      .select({ schoolId: schoolAdminTable.schoolId })
      .from(schoolAdminTable)
      .where(eq(schoolAdminTable.id, schoolAdminId))
      .limit(1);

    if (schoolAdmin.length === 0) {
      return res.status(404).json({
        success: false,
        message: "School admin not found",
      });
    }

    // Check if route exists and belongs to this school
    const existingRoute = await db
      .select()
      .from(routeTable)
      .where(
        and(eq(routeTable.id, id), eq(routeTable.schoolAdminId, schoolAdminId))
      )
      .limit(1);

    if (existingRoute.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Route not found",
      });
    }

    // If name is being updated, check for duplicates
    if (name && name !== existingRoute[0].name) {
      const duplicateRoute = await db
        .select()
        .from(routeTable)
        .where(
          and(
            eq(routeTable.name, name),
            eq(routeTable.schoolAdminId, schoolAdminId)
          )
        )
        .limit(1);

      if (duplicateRoute.length > 0) {
        return res.status(409).json({
          success: false,
          message: "Route name already exists for this school",
        });
      }
    }

    // If busId is being updated, verify the bus exists and belongs to this school admin
    if (busId && busId !== existingRoute[0].busId) {
      const bus = await db
        .select()
        .from(busTable)
        .where(
          and(eq(busTable.id, busId), eq(busTable.schoolAdminId, schoolAdminId))
        )
        .limit(1);

      if (bus.length === 0) {
        return res.status(404).json({
          success: false,
          message: "Bus not found or not authorized",
        });
      }
    }

    // Update the route
    const [updatedRoute] = await db
      .update(routeTable)
      .set({
        name,
        description,
        startStop,
        endStop,
        stops,
        estimatedDuration,
        distance,
        busId,
        isActive,
        updatedAt: new Date(),
      })
      .where(
        and(eq(routeTable.id, id), eq(routeTable.schoolAdminId, schoolAdminId))
      )
      .returning();

    res.status(200).json({
      success: true,
      message: "Route updated successfully",
      data: updatedRoute,
    });
  } catch (error) {
    console.error("Error updating route:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// Delete a route
export const deleteRoute = async (req, res) => {
  try {
    const schoolAdminId = req.user.id;
    const { id } = req.params;

    // Get school ID for this school admin
    const schoolAdmin = await db
      .select({ schoolId: schoolAdminTable.schoolId })
      .from(schoolAdminTable)
      .where(eq(schoolAdminTable.id, schoolAdminId))
      .limit(1);

    if (schoolAdmin.length === 0) {
      return res.status(404).json({
        success: false,
        message: "School admin not found",
      });
    }

    // Check if route exists and belongs to this school
    const existingRoute = await db
      .select()
      .from(routeTable)
      .where(
        and(eq(routeTable.id, id), eq(routeTable.schoolAdminId, schoolAdminId))
      )
      .limit(1);

    if (existingRoute.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Route not found",
      });
    }

    // Check if route has assigned children
    const childrenCount = await db
      .select({ count: sql`count(*)` })
      .from(childTable)
      .where(eq(childTable.routeId, id))
      .limit(1);

    if (childrenCount[0].count > 0) {
      return res.status(400).json({
        success: false,
        message:
          "Cannot delete route with assigned children. Please reassign children first.",
      });
    }

    // Delete the route
    await db
      .delete(routeTable)
      .where(
        and(eq(routeTable.id, id), eq(routeTable.schoolAdminId, schoolAdminId))
      );

    res.status(200).json({
      success: true,
      message: "Route deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting route:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// Get route statistics
export const getRouteStats = async (req, res) => {
  try {
    const schoolAdminId = req.user.id;

    // Get school ID for this school admin
    const schoolAdmin = await db
      .select({ schoolId: schoolAdminTable.schoolId })
      .from(schoolAdminTable)
      .where(eq(schoolAdminTable.id, schoolAdminId))
      .limit(1);

    if (schoolAdmin.length === 0) {
      return res.status(404).json({
        success: false,
        message: "School admin not found",
      });
    }

    const stats = await db
      .select({
        totalRoutes: sql`count(*)`,
        activeRoutes: sql`count(*) filter (where ${routeTable.isActive} = true)`,
        routesWithBuses: sql`count(*) filter (where ${routeTable.busId} is not null)`,
      })
      .from(routeTable)
      .where(eq(routeTable.schoolAdminId, schoolAdminId))
      .limit(1);

    res.status(200).json({
      success: true,
      data: stats[0],
      message: "Route statistics retrieved successfully",
    });
  } catch (error) {
    console.error(
      "Error fetching route stats:",
      error && error.stack ? error.stack : error
    );
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};
