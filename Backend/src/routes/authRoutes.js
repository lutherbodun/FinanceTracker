import express from "express";
import {
  registerUser,
  loginUser,
  verifyEmail,
  resendVerification,
} from "../controllers/authController.js";

const router = express.Router();


router.post("/register", registerUser);
router.post("/login", loginUser);
router.post("/verify-email", verifyEmail);
router.post("/resend-verification", resendVerification);

export default router;
