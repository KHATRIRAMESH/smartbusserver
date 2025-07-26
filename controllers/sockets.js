import { TrackingService } from "../services/tracking.service.js";
import jwt from "jsonwebtoken";
import { eq } from "drizzle-orm";
import db from "../config/connect.js";
import { driverTable } from "../database/Driver.js";
import { parentTable } from "../database/Parent.js";
import { busTable } from "../database/Bus.js";

// Store active buses and their locations
const activeBuses = new Map(); // { busId: { socketId, coords, status, lastUpdate } }
const busSubscriptions = new Map(); // { busId: Set<socketId> }
const driverSockets = new Map(); // { driverId: { socketId, busId } }

const handleSocketConnection = (io) => {
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      if (!token) {
        return next(new Error("Authentication error"));
      }

      const payload = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
      socket.user = payload;
      next();
    } catch (error) {
      next(new Error("Authentication error"));
    }
  });

  io.on("connection", (socket) => {
    console.log(`Socket connected: ${socket.id}`);
    console.log(`User: ${socket.user.id}, Role: ${socket.user.role}`);

    // Track driver connections
    if (socket.user.role === "driver") {
      driverSockets.set(socket.user.id, { socketId: socket.id, busId: null });
      console.log(`Driver ${socket.user.id} connected with socket ${socket.id}`);
    }

    // Test ping-pong to verify socket communication
    socket.on("ping", (data) => {
      console.log(`Received ping from ${socket.id}:`, data);
      socket.emit("pong", { message: "pong", timestamp: new Date(), originalData: data });
    });

    socket.on("subscribeToBus", async (data) => {
      const { busId } = data;
      console.log(`Parent ${socket.user.id} subscribing to bus ${busId}`);
      console.log(`Socket ${socket.id} user role: ${socket.user.role}`);
      TrackingService.subscribeToBus(busId, socket.id);
      socket.join(busId);
      console.log(`Socket ${socket.id} subscribed to bus ${busId}`);
      console.log(`Total subscribers for bus ${busId}:`, TrackingService.getBusSubscribers(busId).size);
      
      // Send last known location immediately if available
      try {
        let lastLocation = TrackingService.activeBuses.get(busId);
        if (!lastLocation) {
          lastLocation = await TrackingService.getLastKnownLocation(busId);
          if (lastLocation) {
            console.log(`Sending last known location to new subscriber for bus ${busId}`);
            socket.emit("busLocationUpdate", {
              busId,
              ...lastLocation,
            });
          }
        } else {
          console.log(`Sending current active location to new subscriber for bus ${busId}`);
          socket.emit("busLocationUpdate", {
            busId,
            ...lastLocation,
          });
        }
      } catch (error) {
        console.error("Error retrieving last known location for new subscriber:", error);
      }
    });

    socket.on("unsubscribeFromBus", (data) => {
      const busId = typeof data === 'string' ? data : data.busId;
      console.log(`Socket ${socket.id} unsubscribing from bus ${busId}`);
      TrackingService.unsubscribeFromBus(busId, socket.id);
      socket.leave(busId);
      console.log(`Socket ${socket.id} unsubscribed from bus ${busId}`);
    });

    socket.on("startBusService", (data) => {
      const { busId, coords, status } = data;
      console.log(`Bus service started for bus ${busId} with status: ${status}`);
      
      if (socket.user.role === "driver") {
        // Update driver's bus assignment
        const driverInfo = driverSockets.get(socket.user.id);
        if (driverInfo) {
          driverInfo.busId = busId;
          driverSockets.set(socket.user.id, driverInfo);
        }
        
        // Broadcast to subscribers that bus is now online
        const subscribers = TrackingService.getBusSubscribers(busId);
        if (subscribers.size > 0) {
          const broadcastData = {
            busId,
            coords,
            status,
            lastUpdated: new Date(),
          };
          console.log(`Broadcasting bus service start to ${subscribers.size} subscribers`);
          io.to(Array.from(subscribers)).emit("busLocationUpdate", broadcastData);
        }
      }
    });

    socket.on("updateBusStatus", async (data) => {
      const { busId, status } = data;
      console.log(`Received bus status update for bus ${busId}: ${status}`);
      
      if (socket.user.role !== "driver") {
        console.log(`Unauthorized status update attempt by ${socket.user.role}`);
        socket.emit("error", { message: "Not authorized to update bus status" });
        return;
      }

      try {
        // Update status in database
        await TrackingService.updateBusStatus(busId, status);
        
        // Broadcast status update to subscribers
        const subscribers = TrackingService.getBusSubscribers(busId);
        if (subscribers.size > 0) {
          const broadcastData = {
            busId,
            status,
            lastUpdated: new Date(),
          };
          console.log(`Broadcasting status update to ${subscribers.size} subscribers for bus ${busId}`);
          io.to(Array.from(subscribers)).emit("busStatusUpdate", broadcastData);
        }
      } catch (error) {
        console.error("Error updating bus status:", error);
        socket.emit("error", { message: error.message });
      }
    });

    socket.on("updateBusLocation", async (data) => {
      try {
        const { busId, latitude, longitude, speed, heading, status } = data;
        console.log(`Received location update for bus ${busId}:`, { latitude, longitude, status });
        
        // Verify driver is authorized for this bus
        if (socket.user.role !== "driver") {
          console.log(`Unauthorized location update attempt by ${socket.user.role}`);
          socket.emit("error", { message: "Not authorized to update bus location" });
          return;
        }

        const location = {
          latitude: parseFloat(latitude),
          longitude: parseFloat(longitude),
          speed: speed ? parseFloat(speed) : null,
          heading: heading ? parseFloat(heading) : null,
        };

        const result = await TrackingService.updateBusLocation(busId, location, status);
        console.log(`Updated bus location result:`, result);
        
        // Notify subscribers
        const subscribers = TrackingService.getBusSubscribers(busId);
        console.log(`Broadcasting location to ${subscribers.size} subscribers for bus ${busId}`);
        console.log(`Subscriber socket IDs:`, Array.from(subscribers));
        
        if (subscribers.size > 0) {
          const broadcastData = {
            busId,
            ...result,
          };
          console.log(`Broadcasting data:`, broadcastData);
          io.to(Array.from(subscribers)).emit("busLocationUpdate", broadcastData);
          console.log(`Broadcast sent to subscribers`);
        }
      } catch (error) {
        console.error("Error updating bus location:", error);
        socket.emit("error", { message: error.message });
      }
    });

    socket.on("disconnect", () => {
      console.log(`Socket disconnected: ${socket.id}`);
      
      // Handle driver disconnection
      if (socket.user.role === "driver") {
        const driverInfo = driverSockets.get(socket.user.id);
        if (driverInfo && driverInfo.busId) {
          const busId = driverInfo.busId;
          console.log(`Driver ${socket.user.id} disconnected, setting bus ${busId} to offline`);
          
          // Broadcast offline status to subscribers
          const subscribers = TrackingService.getBusSubscribers(busId);
          if (subscribers.size > 0) {
            const broadcastData = {
              busId,
              status: 'offline',
              lastUpdated: new Date(),
            };
            console.log(`Broadcasting offline status to ${subscribers.size} subscribers for bus ${busId}`);
            io.to(Array.from(subscribers)).emit("busStatusUpdate", broadcastData);
          }
          
          // Update status in database
          try {
            TrackingService.updateBusStatus(busId, 'offline');
          } catch (error) {
            console.error("Error updating bus status to offline:", error);
          }
        }
        
        // Remove driver from tracking
        driverSockets.delete(socket.user.id);
      }
      
      // Clean up subscriptions
      for (const [busId, subscribers] of TrackingService.busSubscriptions.entries()) {
        if (subscribers.has(socket.id)) {
          TrackingService.unsubscribeFromBus(busId, socket.id);
        }
      }
    });
  });
};

export default handleSocketConnection;
