import express from "express";
import { 
  getBusLocationForChild,
  getBusLocationForParent,
  getAllBusLocations,
  updateBusLocation,
  getTrackingStats,
  getBusLocationForParentChildren
} from "../controllers/tracking.controller.js";
import { verifySchoolAdmin, verifyParent } from "../middleware/auth.js";

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

export default router; 