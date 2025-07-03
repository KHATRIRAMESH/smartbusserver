import geolib from "geolib";
import jwt from "jsonwebtoken";
import { eq } from "drizzle-orm";
import db from "../config/connect.js";
import { driverTable } from "../database/Driver.js";
import { parentTable } from "../database/Parent.js";
import { busTable } from "../database/Bus.js";

// Store active buses and their locations
const activeBuses = new Map(); // { busId: { socketId, coords, status, lastUpdate } }
const busSubscriptions = new Map(); // { busId: Set<socketId> }

const handleSocketConnection = (io) => {
  // Middleware for authentication
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.headers.access_token;
      if (!token) return next(new Error("No token provided"));

      const payload = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
      let user;
      
      if (payload.role === "driver") {
        user = await db
          .select()
          .from(driverTable)
          .where(eq(driverTable.id, payload.id))
          .limit(1);
          
        // Get assigned bus for driver
        if (user && user.length > 0) {
          const bus = await db
            .select()
            .from(busTable)
            .where(eq(busTable.driverId, user[0].id))
            .limit(1);
          if (bus && bus.length > 0) {
            socket.busId = bus[0].id;
          }
        }
      } else if (payload.role === "parent") {
        user = await db
          .select()
          .from(parentTable)
          .where(eq(parentTable.id, payload.id))
          .limit(1);
      } else {
        return next(new Error("Invalid role in token"));
      }

      if (!user || user.length === 0) return next(new Error("User not found"));
      socket.user = { id: user[0].id, role: payload.role };
      next();
    } catch (err) {
      console.error("Socket auth failed:", err.message);
      next(new Error("Authentication failed"));
    }
  });

  io.on("connection", (socket) => {
    const { id, role } = socket.user;
    console.log(`🔌 ${role} ${id} connected`);

    // DRIVER: Start bus service
    socket.on("startBusService", (initialData) => {
      if (role === "driver" && socket.busId) {
        const busId = socket.busId;
        activeBuses.set(busId, {
          socketId: socket.id,
          coords: initialData.coords,
          status: initialData.status || "in_service",
          lastUpdate: new Date(),
          driverId: id
        });
        console.log(`🚌 Bus ${busId} started service`);
      }
    });

    // DRIVER: Update bus location
    socket.on("updateBusLocation", (data) => {
      if (role === "driver" && socket.busId) {
        const busId = socket.busId;
        const busData = activeBuses.get(busId);
        
        if (busData) {
          // Update bus data
          busData.coords = data.coords;
          busData.status = data.status || busData.status;
          busData.lastUpdate = new Date();
          activeBuses.set(busId, busData);

          // Broadcast to subscribed clients
          io.to(`bus_${busId}`).emit("busLocationUpdate", {
            busId,
            coords: data.coords,
            status: data.status,
            lastUpdate: busData.lastUpdate
          });

          console.log(`📍 Bus ${busId} location updated:`, new Date().toLocaleTimeString());
        }
      }
    });

    // DRIVER: Update bus status
    socket.on("updateBusStatus", (data) => {
      if (role === "driver" && socket.busId) {
        const busId = socket.busId;
        const busData = activeBuses.get(busId);
        
        if (busData) {
          busData.status = data.status;
          busData.lastUpdate = new Date();
          activeBuses.set(busId, busData);

          // Broadcast status change
          io.to(`bus_${busId}`).emit("busStatusUpdate", {
            busId,
            status: data.status,
            lastUpdate: busData.lastUpdate
          });

          console.log(`🚦 Bus ${busId} status updated to ${data.status}`);
        }
      }
    });

    // PARENT: Subscribe to bus updates
    socket.on("subscribeToBus", (busId) => {
      if (role === "parent") {
        socket.join(`bus_${busId}`);
        
        // Add to subscriptions
        if (!busSubscriptions.has(busId)) {
          busSubscriptions.set(busId, new Set());
        }
        busSubscriptions.get(busId).add(socket.id);

        // Send current bus data if available
        const busData = activeBuses.get(busId);
        if (busData) {
          socket.emit("busLocationUpdate", {
            busId,
            coords: busData.coords,
            status: busData.status,
            lastUpdate: busData.lastUpdate
          });
        }

        console.log(`👨‍👩‍👧‍👦 Parent ${id} subscribed to bus ${busId}`);
      }
    });

    // PARENT: Unsubscribe from bus updates
    socket.on("unsubscribeToBus", (busId) => {
      if (role === "parent") {
        socket.leave(`bus_${busId}`);
        
        // Remove from subscriptions
        const subs = busSubscriptions.get(busId);
        if (subs) {
          subs.delete(socket.id);
          if (subs.size === 0) {
            busSubscriptions.delete(busId);
          }
        }

        console.log(`👋 Parent ${id} unsubscribed from bus ${busId}`);
      }
    });

    // Handle disconnection
    socket.on("disconnect", () => {
      if (role === "driver" && socket.busId) {
        // Mark bus as inactive but keep last known position
        const busData = activeBuses.get(socket.busId);
        if (busData) {
          busData.status = "offline";
          busData.lastUpdate = new Date();
          activeBuses.set(socket.busId, busData);

          // Notify subscribers
          io.to(`bus_${socket.busId}`).emit("busStatusUpdate", {
            busId: socket.busId,
            status: "offline",
            lastUpdate: busData.lastUpdate
          });
        }
      }

      // Clean up parent subscriptions
      if (role === "parent") {
        for (const [busId, subs] of busSubscriptions.entries()) {
          if (subs.has(socket.id)) {
            subs.delete(socket.id);
            if (subs.size === 0) {
              busSubscriptions.delete(busId);
            }
          }
        }
      }

      console.log(`❌ ${role} ${id} disconnected`);
    });
  });
};

export default handleSocketConnection;
