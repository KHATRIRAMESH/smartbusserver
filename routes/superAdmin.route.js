import express from "express";

import { verifySuperAdmin, rateLimit } from "../middleware/auth.js";
import {
  createSuperAdmin,
  loginSuperAdmin,
  createSchool,
  createSchoolAdmin,
  getAllSchoolAdmins,
  updateSchoolAdmin,
  deleteSchoolAdmin,
  deleteSchool,
  getAllSchools,
  getSystemStats,
  updateSchool,
  deleteSuperAdmin,
  verifySchoolAdmin,
} from "../controllers/superAdmin.controller.js";

const router = express.Router();

// Rate limiting for authentication routes
const authRateLimit = rateLimit(15 * 60 * 1000, 5); // 5 attempts per 15 minutes

// Authentication routes (no middleware needed)
router.post("/register", authRateLimit, createSuperAdmin);
router.post("/login", authRateLimit, loginSuperAdmin);
router.delete("/delete/:id", verifySuperAdmin, deleteSuperAdmin);

// Protected routes
router.post("/create-school", verifySuperAdmin, createSchool);
router.get("/schools", verifySuperAdmin, getAllSchools);
router.put("/schools/:id", verifySuperAdmin, updateSchool);
router.delete("/schools/:id", verifySuperAdmin, deleteSchool);

// School Admin Management (Super Admin functions)
router.post("/create-school-admin", verifySuperAdmin, createSchoolAdmin);
router.get("/school-admins", verifySuperAdmin, getAllSchoolAdmins);
router.put("/school-admins/:id", verifySuperAdmin, updateSchoolAdmin);
router.delete("/school-admins/:id", verifySuperAdmin, deleteSchoolAdmin);
router.post("/school-admins/:id/verify", verifySuperAdmin, verifySchoolAdmin);

router.get("/stats", verifySuperAdmin, getSystemStats);

export default router;
