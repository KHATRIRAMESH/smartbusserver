import express from "express";

import { verifySuperAdmin } from "../middleware/authentication.js";
import {
  createSuperAdmin,
  loginSuperAdmin,
  createSchool,
  createSchoolAdmin,
  deleteSchool,
  getAllSchools,
  getSystemStats,
  updateSchool,
  deleteSuperAdmin,
} from "../controllers/superAdmin.controller.js";

const router = express.Router();

// Authentication routes (no middleware needed)
router.post("/register", createSuperAdmin);
router.post("/login", loginSuperAdmin);
router.delete("/delete/:id", deleteSuperAdmin);

// Protected routes
router.post("/create-school", verifySuperAdmin, createSchool);
router.get("/schools", verifySuperAdmin, getAllSchools);
router.put("/schools/:id", verifySuperAdmin, updateSchool);
router.delete("/schools/:id", verifySuperAdmin, deleteSchool);

router.post("/create-school-admin", verifySuperAdmin, createSchoolAdmin);
router.get("/school-admins", verifySuperAdmin, (req, res) => {
  // Placeholder endpoint for school admins - will be implemented when schema is ready
  res.status(200).json({
    success: true,
    data: [],
    message: "School admins endpoint ready - schema migration pending"
  });
});

router.get("/stats", verifySuperAdmin, getSystemStats);

export default router;
