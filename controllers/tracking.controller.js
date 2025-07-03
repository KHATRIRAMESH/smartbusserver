import { eq, and, sql } from "drizzle-orm";
import db from "../config/connect.js";
import { busTable } from "../database/Bus.js";
import { driverTable } from "../database/Driver.js";
import { childTable } from "../database/Child.js";
import { parentTable } from "../database/Parent.js";
import { routeTable } from "../database/Route.js";
import { StatusCodes } from "http-status-codes";

// Get bus location and tracking information for a specific child
export const getBusLocationForChild = async (req, res) => {
  try {
    const { childId } = req.params;

    // Get child information with bus and route details
    const childInfo = await db
      .select({
        id: childTable.id,
        name: childTable.name,
        class: childTable.class,
        pickupStop: childTable.pickupStop,
        dropStop: childTable.dropStop,
        pickupTime: childTable.pickupTime,
        dropTime: childTable.dropTime,
        bus: {
          id: busTable.id,
          busNumber: busTable.busNumber,
          plateNumber: busTable.plateNumber,
          capacity: busTable.capacity,
          model: busTable.model,
          isActive: busTable.isActive,
        },
        driver: {
          id: driverTable.id,
          name: driverTable.name,
          phone: driverTable.phone,
          licenseNumber: driverTable.licenseNumber,
        },
        route: {
          id: routeTable.id,
          name: routeTable.name,
          startStop: routeTable.startStop,
          endStop: routeTable.endStop,
          stops: routeTable.stops,
          estimatedDuration: routeTable.estimatedDuration,
          distance: routeTable.distance,
        },
        parent: {
          id: parentTable.id,
          name: parentTable.name,
          email: parentTable.email,
          phone: parentTable.phone,
        },
      })
      .from(childTable)
      .leftJoin(busTable, eq(childTable.busId, busTable.id))
      .leftJoin(driverTable, eq(busTable.driverId, driverTable.id))
      .leftJoin(routeTable, eq(childTable.routeId, routeTable.id))
      .leftJoin(parentTable, eq(childTable.parentId, parentTable.id))
      .where(eq(childTable.id, childId))
      .limit(1);

    if (childInfo.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Child not found",
      });
    }

    // TODO: Get real-time location from WebSocket or GPS tracking system
    // For now, return mock location data
    const trackingData = {
      ...childInfo[0],
      currentLocation: {
        latitude: 12.9716, // Mock coordinates
        longitude: 77.5946,
        timestamp: new Date().toISOString(),
        speed: 25, // km/h
        heading: 180, // degrees
        status: "in_transit", // in_transit, at_stop, completed
      },
      estimatedArrival: {
        pickup: "08:30 AM",
        drop: "03:45 PM",
      },
      routeProgress: {
        currentStop: "Stop 3",
        nextStop: "Stop 4",
        progress: 60, // percentage
      },
    };

    res.status(200).json({
      success: true,
      data: trackingData,
      message: "Bus tracking information retrieved successfully",
    });
  } catch (error) {
    console.error("Error fetching bus location:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// Get bus location and tracking information for a parent
export const getBusLocationForParent = async (req, res) => {
  try {
    const { parentId } = req.params;

    // Get all children for this parent with their bus and route details
    const childrenInfo = await db
      .select({
        child: {
          id: childTable.id,
          name: childTable.name,
          class: childTable.class,
          pickupStop: childTable.pickupStop,
          dropStop: childTable.dropStop,
          pickupTime: childTable.pickupTime,
          dropTime: childTable.dropTime,
        },
        bus: {
          id: busTable.id,
          busNumber: busTable.busNumber,
          plateNumber: busTable.plateNumber,
          capacity: busTable.capacity,
          model: busTable.model,
          isActive: busTable.isActive,
        },
        driver: {
          id: driverTable.id,
          name: driverTable.name,
          phone: driverTable.phone,
          licenseNumber: driverTable.licenseNumber,
        },
        route: {
          id: routeTable.id,
          name: routeTable.name,
          startStop: routeTable.startStop,
          endStop: routeTable.endStop,
          stops: routeTable.stops,
          estimatedDuration: routeTable.estimatedDuration,
          distance: routeTable.distance,
        },
      })
      .from(childTable)
      .leftJoin(busTable, eq(childTable.busId, busTable.id))
      .leftJoin(driverTable, eq(busTable.driverId, driverTable.id))
      .leftJoin(routeTable, eq(childTable.routeId, routeTable.id))
      .where(eq(childTable.parentId, parentId));

    if (childrenInfo.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No children found for this parent",
      });
    }

    // Group children by bus for easier tracking
    const busGroups = {};
    childrenInfo.forEach((info) => {
      const busId = info.bus.id;
      if (!busGroups[busId]) {
        busGroups[busId] = {
          bus: info.bus,
          driver: info.driver,
          route: info.route,
          children: [],
        };
      }
      busGroups[busId].children.push(info.child);
    });

    // Add tracking data for each bus
    const trackingData = Object.values(busGroups).map((group) => ({
      ...group,
      currentLocation: {
        latitude: 12.9716, // Mock coordinates
        longitude: 77.5946,
        timestamp: new Date().toISOString(),
        speed: 25, // km/h
        heading: 180, // degrees
        status: "in_transit", // in_transit, at_stop, completed
      },
      estimatedArrival: {
        pickup: "08:30 AM",
        drop: "03:45 PM",
      },
      routeProgress: {
        currentStop: "Stop 3",
        nextStop: "Stop 4",
        progress: 60, // percentage
      },
    }));

    res.status(200).json({
      success: true,
      data: trackingData,
      message: "Bus tracking information retrieved successfully",
    });
  } catch (error) {
    console.error("Error fetching bus location for parent:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// Get all buses with their current locations for school admin
export const getAllBusLocations = async (req, res) => {
  try {
    const schoolAdminId = req.user.id;

    const buses = await db
      .select({
        id: busTable.id,
        busNumber: busTable.busNumber,
        plateNumber: busTable.plateNumber,
        capacity: busTable.capacity,
        model: busTable.model,
        isActive: busTable.isActive,
        driver: {
          id: driverTable.id,
          name: driverTable.name,
          phone: driverTable.phone,
          licenseNumber: driverTable.licenseNumber,
        },
        route: {
          id: routeTable.id,
          name: routeTable.name,
          startStop: routeTable.startStop,
          endStop: routeTable.endStop,
          stops: routeTable.stops,
        },
        childrenCount: sql`(
          select count(*) 
          from ${childTable} 
          where ${childTable.busId} = ${busTable.id}
        )`,
      })
      .from(busTable)
      .leftJoin(driverTable, eq(busTable.driverId, driverTable.id))
      .leftJoin(routeTable, eq(busTable.id, routeTable.busId))
      .where(eq(busTable.schoolAdminId, schoolAdminId));

    // Add mock tracking data for each bus
    const trackingData = buses.map((bus, index) => ({
      ...bus,
      currentLocation: {
        latitude: 12.9716 + (index * 0.01), // Mock coordinates with slight variation
        longitude: 77.5946 + (index * 0.01),
        timestamp: new Date().toISOString(),
        speed: 20 + (index * 5), // km/h
        heading: 180 + (index * 30), // degrees
        status: index % 3 === 0 ? "in_transit" : index % 3 === 1 ? "at_stop" : "completed",
      },
      estimatedArrival: {
        pickup: "08:30 AM",
        drop: "03:45 PM",
      },
      routeProgress: {
        currentStop: `Stop ${index + 1}`,
        nextStop: `Stop ${index + 2}`,
        progress: 20 + (index * 20), // percentage
      },
    }));

    res.status(200).json({
      success: true,
      data: trackingData,
      message: "All bus locations retrieved successfully",
    });
  } catch (error) {
    console.error("Error fetching all bus locations:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// Update bus location (called by driver app)
export const updateBusLocation = async (req, res) => {
  try {
    const { busId } = req.params;
    const { latitude, longitude, speed, heading, status } = req.body;

    if (!latitude || !longitude) {
      return res.status(400).json({
        success: false,
        message: "Latitude and longitude are required",
      });
    }

    // TODO: Store location in database or cache for real-time tracking
    // For now, just acknowledge the update
    
    // Emit WebSocket event for real-time updates
    if (req.io) {
      req.io.emit(`bus_location_update_${busId}`, {
        busId,
        location: {
          latitude,
          longitude,
          speed,
          heading,
          status,
          timestamp: new Date().toISOString(),
        },
      });
    }

    res.status(200).json({
      success: true,
      message: "Bus location updated successfully",
    });
  } catch (error) {
    console.error("Error updating bus location:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// Get tracking statistics for school admin
export const getTrackingStats = async (req, res) => {
  try {
    const schoolAdminId = req.user.id;

    const stats = await db
      .select({
        totalBuses: sql`count(*)`,
        activeBuses: sql`count(*) filter (where ${busTable.isActive} = true)`,
        busesWithDrivers: sql`count(*) filter (where ${busTable.driverId} is not null)`,
        totalChildren: sql`(
          select count(*) 
          from ${childTable} 
          where ${childTable.busId} in (
            select ${busTable.id} 
            from ${busTable} 
            where ${busTable.schoolAdminId} = ${schoolAdminId}
          )
        )`,
        totalRoutes: sql`(
          select count(*) 
          from ${routeTable} 
          where ${routeTable.busId} in (
            select ${busTable.id} 
            from ${busTable} 
            where ${busTable.schoolAdminId} = ${schoolAdminId}
          )
        )`,
      })
      .from(busTable)
      .where(eq(busTable.schoolAdminId, schoolAdminId))
      .limit(1);

    res.status(200).json({
      success: true,
      data: stats[0],
      message: "Tracking statistics retrieved successfully",
    });
  } catch (error) {
    console.error("Error fetching tracking stats:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// Get bus location for parent's children
export const getBusLocationForParentChildren = async (req, res) => {
  try {
    const parentId = req.user.id;

    console.log(parentId);
    // Get all children for this parent with their bus details
    const childrenWithBus = await db
      .select({
        child: {
          id: childTable.id,
          name: childTable.name,
          class: childTable.class,
          pickupStop: childTable.pickupStop,
          dropStop: childTable.dropStop,
        },
        bus: {
          id: busTable.id,
          busNumber: busTable.busNumber,
          plateNumber: busTable.plateNumber,
          capacity: busTable.capacity,
          model: busTable.model,
          isActive: busTable.isActive,
        },
        driver: {
          id: driverTable.id,
          name: driverTable.name,
          phone: driverTable.phone,
          licenseNumber: driverTable.licenseNumber,
        },
        route: {
          id: routeTable.id,
          name: routeTable.name,
          startStop: routeTable.startStop,
          endStop: routeTable.endStop,
          stops: routeTable.stops,
        },
      })
      .from(childTable)
      .leftJoin(busTable, eq(childTable.busId, busTable.id))
      .leftJoin(driverTable, eq(busTable.driverId, driverTable.id))
      .leftJoin(routeTable, eq(busTable.id, routeTable.busId))
      .where(eq(childTable.parentId, parentId));

    if (childrenWithBus.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No children found for this parent",
      });
    }

    // Group children by bus for easier tracking
    const busGroups = {};
    childrenWithBus.forEach((item) => {
      if (item.bus && item.bus.id) {
        if (!busGroups[item.bus.id]) {
          busGroups[item.bus.id] = {
            bus: item.bus,
            driver: item.driver,
            route: item.route,
            children: [],
          };
        }
        busGroups[item.bus.id].children.push(item.child);
      }
    });

    // For now, return mock location data
    // In production, you would get real-time location from driver's GPS
    const trackingData = Object.values(busGroups).map((group) => ({
      ...group,
      currentLocation: {
        latitude: 40.7128, // Mock coordinates (New York)
        longitude: -74.0060,
        timestamp: new Date().toISOString(),
        status: "in_transit", // in_transit, at_school, at_pickup, at_drop
        estimatedArrival: "10:30 AM",
        speed: "25 km/h",
      },
    }));

    res.status(200).json({
      success: true,
      data: trackingData,
      message: "Bus tracking data retrieved successfully",
    });
  } catch (error) {
    console.error("Error fetching bus location for parent children:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
}; 