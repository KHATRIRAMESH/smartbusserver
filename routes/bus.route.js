import express from "express";
import { 
  createBus,
  getAllBuses,
  getBusById,
  updateBus,
  deleteBus,
  getBusStats
} from "../controllers/bus.controller.js";
import { verifySchoolAdmin } from "../middleware/auth.js";

const router = express.Router();

// All routes require school admin authentication
router.use(verifySchoolAdmin);

// Bus management routes
router.post("/", createBus);
router.get("/", getAllBuses);
router.get("/stats", getBusStats);
router.get("/:id", getBusById);
router.put("/:id", updateBus);
router.delete("/:id", deleteBus);

export default router; 