import express from "express";
import { 
  getBusLocationForChild,
  getBusLocationForParent,
  getAllBusLocations,
  updateBusLocation,
  getTrackingStats,
  getBusLocationForParentChildren,
  getLastKnownBusLocation,
  getBusLocationHistory
} from "../controllers/tracking.controller.js";
import { verifySchoolAdmin, verifyParent, authenticate } from "../middleware/auth.js";

const router = express.Router();

// Public routes (for mobile apps)
router.get("/child/:childId", getBusLocationForChild);
router.get("/parent/:parentId", getBusLocationForParent);
router.put("/bus/:busId/location", updateBusLocation);
router.post("/bus/:busId/location", updateBusLocation);

// Protected routes (for school admin)
router.get("/admin/all", verifySchoolAdmin, getAllBusLocations);
router.get("/admin/stats", verifySchoolAdmin, getTrackingStats);

// Parent bus tracking route
router.get("/parent-children", verifyParent, getBusLocationForParentChildren);

// Last known location and history routes
router.get("/bus/:busId/last-location", authenticate, getLastKnownBusLocation);
router.get("/bus/:busId/history", authenticate, getBusLocationHistory);

export default router; 