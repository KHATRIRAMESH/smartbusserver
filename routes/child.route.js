import express from "express";
import { 
  createChild,
  getAllChildren,
  getChildById,
  updateChild,
  deleteChild,
  getChildStats
} from "../controllers/child.controller.js";
import { verifySchoolAdmin } from "../middleware/auth.js";

const router = express.Router();

// All routes require school admin authentication
router.use(verifySchoolAdmin);

// Child management routes
router.post("/", createChild);
router.get("/", getAllChildren);
router.get("/stats", getChildStats);
router.get("/:id", getChildById);
router.put("/:id", updateChild);
router.delete("/:id", deleteChild);

export default router; 