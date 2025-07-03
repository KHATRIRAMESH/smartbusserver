import express from "express";
import { refreshToken, auth, changePassword, getMe } from "../controllers/auth.js";
import { authenticate } from "../middleware/auth.js";

const router = express.Router();

router.post("/refresh-token", refreshToken);
router.post("/signin", auth);
router.post("/change-password", authenticate, changePassword);
router.get("/me", getMe);

export default router;
