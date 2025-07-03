import express from "express";
import { 
  createRoute,
  getAllRoutes,
  getRouteById,
  updateRoute,
  deleteRoute,
  getRouteStats
} from "../controllers/route.controller.js";
import { verifySchoolAdmin } from "../middleware/auth.js";

const router = express.Router();

// All routes require school admin authentication
router.use(verifySchoolAdmin);

// Route management routes
router.post("/create-route", createRoute);
router.get("/", getAllRoutes);
router.get("/stats", getRouteStats);
router.get("/:id", getRouteById);
router.put("/:id", updateRoute);
router.delete("/:id", deleteRoute);

export default router; 