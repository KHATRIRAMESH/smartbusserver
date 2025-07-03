import express from "express";
import { 
  createDriver,
  getAllDrivers,
  getDriverById,
  updateDriver,
  deleteDriver,
  getDriverStats
} from "../controllers/driver.controller.js";
import { verifySchoolAdmin } from "../middleware/auth.js";

const router = express.Router();

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