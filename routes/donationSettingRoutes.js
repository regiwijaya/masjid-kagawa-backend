// server/routes/donationSettingRoutes.js
import express from "express";
import {
  getDonationSetting,
  updateDonationSetting,
} from "../controllers/donationSettingController.js";
import { protectAdmin } from "../middlewares/authAdmin.js";

const router = express.Router();

// PUBLIC
router.get("/", getDonationSetting);

// ADMIN
router.put("/", protectAdmin, updateDonationSetting);

export default router;