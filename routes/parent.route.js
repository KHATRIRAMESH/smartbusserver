import express from "express";
import { 
  createParent,
  getAllParents,
  getParentById,
  updateParent,
  deleteParent,
  getParentStats,
  loginParent,
  getParentChildren,
  getParentProfile,
  changePassword
} from "../controllers/parent.controller.js";
import { verifySchoolAdmin, verifyParent } from "../middleware/auth.js";

const router = express.Router();

// Public parent login route
router.post("/login", loginParent);

// Parent-specific routes (require parent authentication)
router.get("/children", verifyParent, getParentChildren);
router.get("/profile", verifyParent, getParentProfile);
router.post("/change-password", verifyParent, changePassword);

// All routes require school admin authentication
router.use(verifySchoolAdmin);

// Parent management routes
router.post("/", createParent);
router.get("/", getAllParents);
router.get("/stats", getParentStats);
router.get("/:id", getParentById);
router.put("/:id", updateParent);
router.delete("/:id", deleteParent);

export default router; 