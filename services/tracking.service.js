import { eq, and, desc } from "drizzle-orm";
import db from "../config/connect.js";
import { busTable } from "../database/Bus.js";
import { childTable } from "../database/Child.js";
import { driverTable } from "../database/Driver.js";
import { routeTable } from "../database/Route.js";
import { busLocationHistoryTable } from "../database/BusLocationHistory.js";
import { BadRequestError } from "../errors/index.js";
import { calculateDistance } from "../utils/mapUtils.js";

export class TrackingService {
  static activeBuses = new Map(); // { busId: { socketId, coords, status, lastUpdate } }
  static busSubscriptions = new Map(); // { busId: Set<socketId> }
  static lastBroadcastPositions = new Map(); // { busId: { latitude, longitude, timestamp } }
  
  // Distance threshold in kilometers (50 meters = 0.05 km)
  static DISTANCE_THRESHOLD = 0.05;

  static async saveLocationHistory(busId, location, status = "online") {
    try {
      const locationHistory = await db
        .insert(busLocationHistoryTable)
        .values({
          busId,
          latitude: location.latitude.toString(),
          longitude: location.longitude.toString(),
          speed: location.speed ? location.speed.toString() : null,
          heading: location.heading ? location.heading.toString() : null,
          accuracy: location.accuracy ? location.accuracy.toString() : null,
          status,
          timestamp: new Date(),
        })
        .returning();
      
      console.log(`Location history saved for bus ${busId}:`, locationHistory[0]);
      return locationHistory[0];
    } catch (error) {
      console.error("Error saving location history:", error);
      throw error;
    }
  }

  static async getLastKnownLocation(busId) {
    try {
      const lastLocation = await db
        .select()
        .from(busLocationHistoryTable)
        .where(eq(busLocationHistoryTable.busId, busId))
        .orderBy(desc(busLocationHistoryTable.timestamp))
        .limit(1);

      if (lastLocation && lastLocation.length > 0) {
        const location = lastLocation[0];
        return {
          coords: {
            latitude: parseFloat(location.latitude),
            longitude: parseFloat(location.longitude),
            speed: location.speed ? parseFloat(location.speed) : null,
            heading: location.heading ? parseFloat(location.heading) : null,
            accuracy: location.accuracy ? parseFloat(location.accuracy) : null,
          },
          status: location.status,
          lastUpdate: location.timestamp,
        };
      }
      return null;
    } catch (error) {
      console.error("Error retrieving last known location:", error);
      throw error;
    }
  }

  static async getLocationHistory(busId, limit = 100) {
    try {
      const history = await db
        .select()
        .from(busLocationHistoryTable)
        .where(eq(busLocationHistoryTable.busId, busId))
        .orderBy(desc(busLocationHistoryTable.timestamp))
        .limit(limit);

      return history.map(location => ({
        id: location.id,
        coords: {
          latitude: parseFloat(location.latitude),
          longitude: parseFloat(location.longitude),
          speed: location.speed ? parseFloat(location.speed) : null,
          heading: location.heading ? parseFloat(location.heading) : null,
          accuracy: location.accuracy ? parseFloat(location.accuracy) : null,
        },
        status: location.status,
        timestamp: location.timestamp,
      }));
    } catch (error) {
      console.error("Error retrieving location history:", error);
      throw error;
    }
  }

  static async getBusLocationForChild(childId) {
    const child = await db
      .select({
        id: childTable.id,
        busId: childTable.busId,
        bus: {
          id: busTable.id,
          busNumber: busTable.busNumber,
          plateNumber: busTable.plateNumber,
          driver: {
            id: driverTable.id,
            name: driverTable.name,
            phone: driverTable.phone,
          },
          route: {
            id: routeTable.id,
            name: routeTable.name,
            stops: routeTable.stops,
          },
        },
      })
      .from(childTable)
      .leftJoin(busTable, eq(childTable.busId, busTable.id))
      .leftJoin(driverTable, eq(busTable.driverId, driverTable.id))
      .leftJoin(routeTable, eq(busTable.id, routeTable.busId))
      .where(eq(childTable.id, childId))
      .limit(1);

    if (!child || child.length === 0 || !child[0].busId) {
      throw new BadRequestError("Child not found or not assigned to a bus");
    }

    // Check for current active location first
    let busLocation = this.activeBuses.get(child[0].busId);
    
    // If no active location, get last known location from database
    if (!busLocation) {
      try {
        busLocation = await this.getLastKnownLocation(child[0].busId);
        console.log(`Retrieved last known location for bus ${child[0].busId}:`, busLocation);
      } catch (error) {
        console.error("Error retrieving last known location:", error);
      }
    }

    return {
      ...child[0],
      location: busLocation || null,
    };
  }

  static async updateBusLocation(busId, location, status, forceUpdate = false) {
    const bus = await db
      .select()
      .from(busTable)
      .where(eq(busTable.id, busId))
      .limit(1);

    if (!bus || bus.length === 0) {
      throw new BadRequestError("Bus not found");
    }

    const busData = {
      coords: location,
      status: status || "online",
      lastUpdate: new Date(),
    };

    // Store in memory for real-time access
    this.activeBuses.set(busId, busData);
    
    // Check if we should broadcast this location update
    const shouldBroadcast = forceUpdate || this.shouldBroadcastLocation(busId, location);
    
    // Always save to database for historical analysis
    try {
      await this.saveLocationHistory(busId, location, status || "online");
    } catch (error) {
      console.error("Failed to save location history:", error);
      // Don't fail the update if history saving fails
    }

    // Update last broadcast position if we're broadcasting
    if (shouldBroadcast) {
      this.lastBroadcastPositions.set(busId, {
        latitude: location.latitude,
        longitude: location.longitude,
        timestamp: new Date(),
      });
    }

    return {
      ...busData,
      shouldBroadcast,
    };
  }

  static shouldBroadcastLocation(busId, newLocation) {
    const lastBroadcast = this.lastBroadcastPositions.get(busId);
    
    // If no previous broadcast position, always broadcast
    if (!lastBroadcast) {
      return true;
    }

    // Calculate distance from last broadcast position
    const distance = calculateDistance(
      lastBroadcast.latitude,
      lastBroadcast.longitude,
      newLocation.latitude,
      newLocation.longitude
    );

    // Convert distance from km to meters and check against threshold
    const distanceInMeters = distance * 1000;
    console.log(`Bus ${busId} moved ${distanceInMeters.toFixed(2)} meters from last broadcast`);
    
    return distanceInMeters >= 50; // 50 meters threshold
  }

  static async updateBusStatus(busId, status) {
    const bus = await db
      .select()
      .from(busTable)
      .where(eq(busTable.id, busId))
      .limit(1);

    if (!bus || bus.length === 0) {
      throw new BadRequestError("Bus not found");
    }

    // Get existing bus data or create new one
    const existingData = this.activeBuses.get(busId);
    const busData = {
      coords: existingData?.coords || null,
      status: status,
      lastUpdate: new Date(),
    };

    this.activeBuses.set(busId, busData);
    
    // Save status change to location history for record keeping
    if (existingData?.coords) {
      try {
        await this.saveLocationHistory(busId, existingData.coords, status);
        console.log(`Status change logged for bus ${busId}: ${status}`);
      } catch (error) {
        console.error("Failed to save status change to history:", error);
      }
    }
    
    return busData;
  }

  static subscribeToBus(busId, socketId) {
    if (!this.busSubscriptions.has(busId)) {
      this.busSubscriptions.set(busId, new Set());
    }
    this.busSubscriptions.get(busId).add(socketId);
  }

  static unsubscribeFromBus(busId, socketId) {
    const subs = this.busSubscriptions.get(busId);
    if (subs) {
      subs.delete(socketId);
      if (subs.size === 0) {
        this.busSubscriptions.delete(busId);
      }
    }
  }

  static getBusSubscribers(busId) {
    return this.busSubscriptions.get(busId) || new Set();
  }

  static async getAllActiveBuses(schoolAdminId) {
    const buses = await db
      .select({
        id: busTable.id,
        busNumber: busTable.busNumber,
        plateNumber: busTable.plateNumber,
        driver: {
          id: driverTable.id,
          name: driverTable.name,
          phone: driverTable.phone,
        },
      })
      .from(busTable)
      .leftJoin(driverTable, eq(busTable.driverId, driverTable.id))
      .where(eq(busTable.schoolAdminId, schoolAdminId));

    return buses.map(bus => ({
      ...bus,
      location: this.activeBuses.get(bus.id) || null,
    }));
  }

  static getActiveBusCount() {
    return this.activeBuses.size;
  }

  static getTotalSubscriptions() {
    let total = 0;
    for (const subs of this.busSubscriptions.values()) {
      total += subs.size;
    }
    return total;
  }

  static async calculateBusDistances(busId) {
    const busLocation = this.activeBuses.get(busId);
    if (!busLocation || !busLocation.coords) return null;

    const route = await db
      .select()
      .from(routeTable)
      .where(eq(routeTable.busId, busId))
      .limit(1);

    if (!route || route.length === 0 || !route[0].stops) return null;

    const distances = route[0].stops.map(stop => ({
      stop,
      distance: calculateDistance(
        busLocation.coords.latitude,
        busLocation.coords.longitude,
        stop.latitude,
        stop.longitude
      ),
    }));

    return distances.sort((a, b) => a.distance - b.distance);
  }

  static forceLocationBroadcast(busId) {
    // Reset last broadcast position to force next update to be broadcast
    this.lastBroadcastPositions.delete(busId);
    console.log(`Forced location broadcast reset for bus ${busId}`);
  }

  static getBusStatus(busId) {
    const busData = this.activeBuses.get(busId);
    return busData ? busData.status : 'offline';
  }

  static getAllBusStatuses() {
    const statuses = {};
    for (const [busId, busData] of this.activeBuses.entries()) {
      statuses[busId] = {
        status: busData.status,
        lastUpdate: busData.lastUpdate,
        hasLocation: !!busData.coords,
      };
    }
    return statuses;
  }
} 