import { eq, and, sql } from "drizzle-orm";
import db from "../config/connect.js";
import { busTable } from "../database/Bus.js";
import { driverTable } from "../database/Driver.js";
import { childTable } from "../database/Child.js";
import { parentTable } from "../database/Parent.js";
import { routeTable } from "../database/Route.js";
import { StatusCodes } from "http-status-codes";
import { TrackingService } from "../services/tracking.service.js";

// Cache for storing real-time bus locations
const busLocationsCache = new Map();

// Get bus location and tracking information for a specific child
export const getBusLocationForChild = async (req, res) => {
  const { childId } = req.params;
  const result = await TrackingService.getBusLocationForChild(childId);
  res.status(StatusCodes.OK).json({
    success: true,
    data: result,
    message: "Bus location retrieved successfully",
  });
};

// Get bus location and tracking information for a parent
export const getBusLocationForParent = async (req, res) => {
  const parentId = req.user.id;
  const result = await TrackingService.getBusLocationsForParent(parentId);
  res.status(StatusCodes.OK).json({
    success: true,
    data: result,
    message: "Bus locations retrieved successfully",
  });
};

// Get all buses with their current locations for school admin
export const getAllBusLocations = async (req, res) => {
  const schoolAdminId = req.user.id;
  const result = await TrackingService.getAllActiveBuses(schoolAdminId);
  res.status(StatusCodes.OK).json({
    success: true,
    data: result,
    message: "All bus locations retrieved successfully",
  });
};

// Update bus location (called by driver app)
export const updateBusLocation = async (req, res) => {
  const { busId } = req.params;
  const { latitude, longitude, speed, heading, status } = req.body;
  
  const location = {
    latitude: parseFloat(latitude),
    longitude: parseFloat(longitude),
    speed: speed ? parseFloat(speed) : null,
    heading: heading ? parseFloat(heading) : null,
  };

  const result = await TrackingService.updateBusLocation(busId, location, status);
  
  // Notify subscribers through WebSocket
  const subscribers = TrackingService.getBusSubscribers(busId);
  if (subscribers.size > 0) {
    req.io.to(Array.from(subscribers)).emit("busLocationUpdate", {
      busId,
      ...result,
    });
  }

  res.status(StatusCodes.OK).json({
    success: true,
    data: result,
    message: "Bus location updated successfully",
  });
};

// Get tracking statistics for school admin
export const getTrackingStats = async (req, res) => {
  const schoolAdminId = req.user.id;
  const stats = {
    activeBuses: TrackingService.getActiveBusCount(),
    totalSubscriptions: TrackingService.getTotalSubscriptions(),
  };

  res.status(StatusCodes.OK).json({
    success: true,
    data: stats,
    message: "Tracking statistics retrieved successfully",
  });
};

// Get bus location for parent's children
export const getBusLocationForParentChildren = async (req, res) => {
  try {
    const parentId = req.user.id;

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

    // Group children by bus and add real-time tracking data
    const busGroups = {};
    childrenWithBus.forEach((item) => {
      if (item.bus && item.bus.id) {
        if (!busGroups[item.bus.id]) {
          // Get real-time location from cache
          const realtimeData = busLocationsCache.get(item.bus.id) || {
            latitude: null,
            longitude: null,
            status: "offline",
            timestamp: null,
          };

          busGroups[item.bus.id] = {
            bus: item.bus,
            driver: item.driver,
            route: item.route,
            children: [],
            currentLocation: {
              latitude: realtimeData.latitude,
              longitude: realtimeData.longitude,
              status: realtimeData.status,
              timestamp: realtimeData.timestamp,
              speed: realtimeData.speed || "0 km/h",
            },
          };
        }
        busGroups[item.bus.id].children.push(item.child);
      }
    });

    const trackingData = Object.values(busGroups);

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