import jwt from "jsonwebtoken";
import { eq } from "drizzle-orm";
import db from "../config/connect.js";
import { superAdminTable } from "../database/SuperAdmin.js";
import { schoolAdminTable } from "../database/SchoolAdmin.js";
import { parentTable } from "../database/Parent.js";
import { driverTable } from "../database/Driver.js";

// Generic authentication middleware
export const authenticate = async (req, res, next) => {
  try {
    // Check for token in Authorization header first
    let token = req.headers.authorization?.split(" ")[1];

    // If no token in header, check for cookie
    if (!token) {
      token = req.cookies?.access_token;
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "No token provided",
      });
    }

    const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: "Invalid token",
    });
  }
};

// Super Admin authentication middleware
export const verifySuperAdmin = async (req, res, next) => {
  try {
    // Check for token in Authorization header first
    let token = req.headers.authorization?.split(" ")[1];

    // If no token in header, check for cookie
    if (!token) {
      token = req.cookies?.access_token;
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "No token provided",
      });
    }

    const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

    if (decoded.role !== "super_admin") {
      return res.status(403).json({
        success: false,
        message: "Forbidden: Access denied. Super admin privileges required.",
      });
    }

    // Verify user exists in super admin table
    const superAdmin = await db
      .select()
      .from(superAdminTable)
      .where(eq(superAdminTable.id, decoded.id))
      .limit(1);

    if (superAdmin.length === 0) {
      return res.status(401).json({
        success: false,
        message: "Super admin not found",
      });
    }

    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: "Invalid token",
    });
  }
};

// School Admin authentication middleware
export const verifySchoolAdmin = async (req, res, next) => {
  try {
    // Check for token in Authorization header first
    let token = req.headers.authorization?.split(" ")[1];

    // If no token in header, check for cookie
    if (!token) {
      token = req.cookies?.access_token;
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "No token provided",
      });
    }

    const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

    if (decoded.role !== "school_admin") {
      return res.status(403).json({
        success: false,
        message: "Forbidden: Access denied. School admin privileges required.",
      });
    }

    // Verify user exists in school admin table
    const schoolAdmin = await db
      .select()
      .from(schoolAdminTable)
      .where(eq(schoolAdminTable.id, decoded.id))
      .limit(1);

    if (schoolAdmin.length === 0) {
      return res.status(401).json({
        success: false,
        message: "School admin not found",
      });
    }

    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: "Invalid token",
    });
  }
};

// Verify parent authentication
export const verifyParent = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer")) {
      return res.status(401).json({
        success: false,
        message: "Access token required",
      });
    }

    const token = authHeader.split(" ")[1];
    const payload = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

    if (payload.role !== "parent") {
      return res.status(403).json({
        success: false,
        message: "Access denied. Parent role required.",
      });
    }

    // Verify parent exists in database
    const parent = await db
      .select()
      .from(parentTable)
      .where(eq(parentTable.id, payload.id))
      .limit(1);

    if (parent.length === 0) {
      return res.status(401).json({
        success: false,
        message: "Parent not found",
      });
    }

    req.user = {
      id: parent[0].id,
      email: parent[0].email,
      role: "parent",
      schoolAdminId: parent[0].schoolAdminId,
    };

    next();
  } catch (error) {
    console.error("Parent authentication error:", error);
    return res.status(401).json({
      success: false,
      message: "Invalid or expired token",
    });
  }
};

// Verify driver authentication
export const verifyDriver = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer")) {
      return res.status(401).json({
        success: false,
        message: "Access token required",
      });
    }

    const token = authHeader.split(" ")[1];
    const payload = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

    if (payload.role !== "driver") {
      return res.status(403).json({
        success: false,
        message: "Access denied. Driver role required.",
      });
    }

    // Verify driver exists in database
    const driver = await db
      .select()
      .from(driverTable)
      .where(eq(driverTable.id, payload.id))
      .limit(1);

    if (driver.length === 0) {
      return res.status(401).json({
        success: false,
        message: "Driver not found",
      });
    }

    req.user = {
      id: driver[0].id,
      email: driver[0].email,
      role: "driver",
      schoolAdminId: driver[0].schoolAdminId,
    };

    next();
  } catch (error) {
    console.error("Driver authentication error:", error);
    return res.status(401).json({
      success: false,
      message: "Invalid or expired token",
    });
  }
};

// Role-based access control middleware
export const requireRole = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: "Forbidden: Access denied. Insufficient privileges.",
      });
    }
    next();
  };
};

// Optional authentication middleware (for public routes that can work with or without auth)
export const optionalAuth = async (req, res, next) => {
  try {
    // Check for token in Authorization header first
    let token = req.headers.authorization?.split(" ")[1];

    // If no token in header, check for cookie
    if (!token) {
      token = req.cookies?.access_token;
    }

    if (token) {
      const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
      req.user = decoded;
    }

    next();
  } catch (error) {
    // Continue without authentication
    next();
  }
};

// Rate limiting middleware (basic implementation)
export const rateLimit = (windowMs = 15 * 60 * 1000, max = 100) => {
  const requests = new Map();

  return (req, res, next) => {
    const ip = req.ip || req.connection.remoteAddress;
    const now = Date.now();
    const windowStart = now - windowMs;

    // Clean old entries
    if (requests.has(ip)) {
      const userRequests = requests
        .get(ip)
        .filter((time) => time > windowStart);
      requests.set(ip, userRequests);
    } else {
      requests.set(ip, []);
    }

    const userRequests = requests.get(ip);

    if (userRequests.length >= max) {
      return res.status(429).json({
        success: false,
        message: "Too many requests. Please try again later.",
      });
    }

    userRequests.push(now);
    next();
  };
};

// Logging middleware
export const requestLogger = (req, res, next) => {
  const start = Date.now();

  res.on("finish", () => {
    const duration = Date.now() - start;
    console.log(
      `${req.method} ${req.originalUrl} ${res.statusCode} - ${duration}ms`
    );
  });

  next();
};

// Error handling middleware
export const errorHandler = (err, req, res, next) => {
  console.error("Error:", err);

  if (err.name === "ValidationError") {
    return res.status(400).json({
      success: false,
      message: "Validation Error",
      errors: err.errors,
    });
  }

  if (err.name === "UnauthorizedError") {
    return res.status(401).json({
      success: false,
      message: "Unauthorized",
    });
  }

  if (err.name === "ForbiddenError") {
    return res.status(403).json({
      success: false,
      message: "Forbidden",
    });
  }

  if (err.name === "NotFoundError") {
    return res.status(404).json({
      success: false,
      message: "Resource not found",
    });
  }

  // Default error
  res.status(500).json({
    success: false,
    message: "Internal server error",
  });
};
