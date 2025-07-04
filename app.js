import dotenv from "dotenv";
import cors from "cors";
import "express-async-errors";
import EventEmitter from "events";
import express from "express";
import http from "http";
import { Server as socketIo } from "socket.io";
import cookieParser from "cookie-parser";
import db from "./config/connect.js";
import notFoundMiddleware from "./middleware/not-found.js";
import errorHandlerMiddleware from "./middleware/error-handler.js";
import { requestLogger } from "./middleware/auth.js";
import superAdminRouter from "./routes/superAdmin.route.js";
import schoolAdminRouter from "./routes/schoolAdmin.route.js";
import busRouter from "./routes/bus.route.js";
import driverRouter from "./routes/driver.route.js";
import routeRouter from "./routes/route.route.js";
import parentRouter from "./routes/parent.route.js";
import childRouter from "./routes/child.route.js";
import trackingRouter from "./routes/tracking.route.js";

// Routers
import authRouter from "./routes/auth.route.js";
// import rideRouter from "./routes/ride.route.js";

// Import socket handler
import handleSocketConnection from "./controllers/sockets.js";

dotenv.config();

EventEmitter.defaultMaxListeners = 20;

const app = express();
app.use(express.json());
app.use(cookieParser());

// Add request logging middleware
app.use(requestLogger);

// CORS configuration for independent deployment
const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(",").map((origin) => origin.trim())
  : [
      "http://localhost:3000", // Admin panel
      "https://smartbusserver-ug44.vercel.app", // Admin panel
      "http://localhost:3001", // Alternative admin port
      "http://localhost:8081", // Expo development
      "exp://localhost:8081", // Expo development
      "http://192.168.18.16:3000", // Mobile app (Android)
      "http://192.168.18.16:3001", // Mobile app alternative
      "http://192.168.18.16:8000", // Mobile app (Android) - old port
      "exp://192.168.18.16:8081", // Expo development
    ];

app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests with no origin (like mobile apps or Postman)
      if (!origin) return callback(null, true);

      if (allowedOrigins.indexOf(origin) !== -1) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
  })
);

const server = http.createServer(app);

const io = new socketIo(server, {
  cors: {
    origin: allowedOrigins,
    credentials: true,
    methods: ["GET", "POST"],
  },
});

// Attach the WebSocket instance to the request object
app.use((req, res, next) => {
  req.io = io;
  return next();
});

// Initialize the WebSocket handling logic
handleSocketConnection(io);

// Health check endpoint
app.get("/health", (req, res) => {
  res.status(200).json({
    status: "ok",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || "development",
  });
});

//home route
app.get("/", (req, res) => {
  res.status(200).json({
    message: "Welcome to SmartBus API Server",
    version: "1.0.0",
    environment: process.env.NODE_ENV || "development",
    endpoints: {
      health: "/health",
      auth: "/auth",
      superAdmin: "/super-admin",
      schoolAdmin: "/school-admin",
    },
  });
});

// Routes
app.use("/auth", authRouter);
// app.use("/ride", authMiddleware, rideRouter);
app.use("/super-admin", superAdminRouter);
app.use("/school-admin", schoolAdminRouter);
app.use("/bus", busRouter);
app.use("/driver", driverRouter);
app.use("/route", routeRouter);
app.use("/parent", parentRouter);
app.use("/child", childRouter);
app.use("/tracking", trackingRouter);

// Middleware
app.use(notFoundMiddleware);
app.use(errorHandlerMiddleware);

const start = async () => {
  try {
    // Database connection is already established in config/connect.js
    console.log("Database connected successfully");

    const port = process.env.PORT || 3001;
    server.listen(port, "0.0.0.0", () => {
      console.log(`🚀 SmartBus API Server running on port ${port}`);
      console.log(`📊 Health check: http://localhost:${port}/health`);
      console.log(`🌐 Environment: ${process.env.NODE_ENV || "development"}`);
      console.log(`🔗 Allowed origins: ${allowedOrigins.join(", ")}`);
    });
  } catch (error) {
    console.error("❌ Failed to start server:", error);
    process.exit(1);
  }
};

start();
