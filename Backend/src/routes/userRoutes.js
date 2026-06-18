import express from "express";
import {
  registerUser,
  loginUser,
  getMe,
  updateMe,
  verifyEmail,
  resendVerification,
} from "../controllers/userController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/register", registerUser);

router.post("/login", loginUser);
router.post("/verify-email", verifyEmail);
router.post("/resend-verification", resendVerification);
router.get("/me", protect, getMe);
router.put("/me", protect, updateMe);

export default router;
