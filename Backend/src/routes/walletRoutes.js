import express from "express";
import { getWallet, updateWallet } from "../controllers/walletController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.use(protect);
router.get("/", getWallet);
router.put("/", updateWallet);

export default router;
