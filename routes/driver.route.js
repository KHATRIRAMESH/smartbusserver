import express from "express";
import {
  createDriver,
  getAllDrivers,
  getDriverById,
  updateDriver,
  deleteDriver,
  getDriverStats,
  getDriverProfile,
  loginDriver,
  getDriverBus,
} from "../controllers/driver.controller.js";
import { verifySchoolAdmin } from "../middleware/auth.js";
import { verifyDriver } from "../middleware/auth.js";
const router = express.Router();

// Public driver login route
router.post("/login", loginDriver);

// Driver-specific routes (require driver authentication)
router.get("/profile", verifyDriver, getDriverProfile);
router.get("/bus", verifyDriver, getDriverBus);

// All routes require school admin authentication
router.use(verifySchoolAdmin);

// Driver management routes
router.post("/", createDriver);
router.get("/", getAllDrivers);
router.get("/stats", getDriverStats);
router.get("/:id", getDriverById);
router.put("/:id", updateDriver);
router.delete("/:id", deleteDriver);

export default router;
