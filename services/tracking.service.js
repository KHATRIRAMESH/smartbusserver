import { eq, and } from "drizzle-orm";
import db from "../config/connect.js";
import { busTable } from "../database/Bus.js";
import { childTable } from "../database/Child.js";
import { driverTable } from "../database/Driver.js";
import { routeTable } from "../database/Route.js";
import { BadRequestError } from "../errors/index.js";
import { calculateDistance } from "../utils/mapUtils.js";

export class TrackingService {
  static activeBuses = new Map(); // { busId: { socketId, coords, status, lastUpdate } }
  static busSubscriptions = new Map(); // { busId: Set<socketId> }

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

    const busLocation = this.activeBuses.get(child[0].busId);
    return {
      ...child[0],
      location: busLocation || null,
    };
  }

  static async updateBusLocation(busId, location, status) {
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

    this.activeBuses.set(busId, busData);
    return busData;
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
} 