import geolib from "geolib";
import jwt from "jsonwebtoken";
import { eq } from "drizzle-orm";
import db from "../config/connect.js";
import { userTable } from "../database/User.js";

const activeDrivers = new Map(); // { driverId: { socketId, coords } }

const handleSocketConnection = (io) => {
  // Middleware for authentication
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.headers.access_token;
      if (!token) return next(new Error("No token provided"));

      const payload = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
      const user = await db
        .select()
        .from(userTable)
        .where(eq(userTable.id, payload.id))
        .limit(1);
      if (user.length === 0) return next(new Error("User not found"));

      socket.user = { id: user[0].id, role: user[0].role };
      next();
    } catch (err) {
      console.error("Socket auth failed:", err.message);
      next(new Error("Authentication failed"));
    }
  });

  io.on("connection", (socket) => {
    const { id, role } = socket.user;
    console.log(`🔌 ${role} ${id} connected.`);

    // DRIVER: Go on duty
    socket.on("goOnDuty", (coords) => {
      if (role === "driver") {
        activeDrivers.set(id, { socketId: socket.id, coords });
        console.log(`🚖 Driver ${id} is now ON duty`);
      }
    });

    // DRIVER: Update location
    socket.on("updateLocation", (coords) => {
      console.log("Driver location update:",new Date().toLocaleTimeString(), id, coords);
      if (role === "driver" && activeDrivers.has(id)) {
        activeDrivers.get(id).coords = coords;
        // Broadcast to all users subscribed to this driver
        socket.to(`driver_${id}`).emit("driverLocationUpdate", {
          driverId: id,
          coords,
        });
      }
    });

    // USER: Subscribe to a specific driver's location
    socket.on("subscribeToDriver", (driverId) => {
      const driver = activeDrivers.get(driverId);
      if (driver) {
        socket.join(`driver_${driverId}`);
        socket.emit("driverLocationUpdate", {
          driverId,
          coords: driver.coords,
        });
        console.log(`📡 User ${id} subscribed to Driver ${driverId}`);
      } else {
        socket.emit("error", { message: "Driver not available" });
      }
    });

    // USER: Get nearby drivers (optional)
    socket.on("getNearbyDrivers", (coords) => {
      const nearby = Array.from(activeDrivers.entries())
        .map(([driverId, data]) => ({
          driverId,
          distance: geolib.getDistance(data.coords, coords),
          coords: data.coords,
        }))
        .filter((d) => d.distance < 5000) // 5km
        .sort((a, b) => a.distance - b.distance);

      socket.emit("nearbyDrivers", nearby);
    });

    // Handle disconnect
    socket.on("disconnect", () => {
      if (role === "driver") {
        activeDrivers.delete(id);
        console.log(`🛑 Driver ${id} disconnected`);
      }
    });
  });
};

export default handleSocketConnection;
