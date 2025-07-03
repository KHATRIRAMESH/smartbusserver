import express from "express";
import {
  loginSchoolAdmin,
  getSchoolAdminProfile,
  updateSchoolAdminProfile,
  changeSchoolAdminPassword,
  getSchoolAdminStats,
  logoutSchoolAdmin,
} from "../controllers/schoolAdmin.controller.js";
import { verifySchoolAdmin, rateLimit } from "../middleware/auth.js";

const router = express.Router();

// Rate limiting for authentication routes
const authRateLimit = rateLimit(15 * 60 * 1000, 5); // 5 attempts per 15 minutes

// Public routes (no authentication required)
router.post("/login", authRateLimit, loginSchoolAdmin);
router.post("/logout", logoutSchoolAdmin);

// Protected routes (authentication required)
router.get("/profile", verifySchoolAdmin, getSchoolAdminProfile);
router.put("/profile", verifySchoolAdmin, updateSchoolAdminProfile);
router.put("/change-password", verifySchoolAdmin, changeSchoolAdminPassword);
router.get("/stats", verifySchoolAdmin, getSchoolAdminStats);

// Future routes for transportation management
// These will be implemented when bus, route, student, and parent schemas are ready
router.get("/buses", verifySchoolAdmin, (req, res) => {
  res.redirect('/bus');
});

router.get("/drivers", verifySchoolAdmin, (req, res) => {
  res.redirect('/driver');
});

router.get("/routes", verifySchoolAdmin, (req, res) => {
  res.redirect('/route');
});

router.get("/tracking", verifySchoolAdmin, (req, res) => {
  res.redirect('/tracking/admin/all');
});

// Future routes for student and parent management
router.get("/students", verifySchoolAdmin, (req, res) => {
  res.status(200).json({
    success: true,
    data: [],
    message: "Student management coming soon"
  });
});

router.get("/parents", verifySchoolAdmin, (req, res) => {
  res.status(200).json({
    success: true,
    data: [],
    message: "Parent management coming soon"
  });
});

export default router;
