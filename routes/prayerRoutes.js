// server/routes/prayerRoutes.js
import express from "express";
import { getPrayerTimes, updateIqamah } from "../controllers/prayerController.js";
import { protectAdmin } from "../middlewares/authAdmin.js";

const router = express.Router();

// PUBLIC
router.get("/", getPrayerTimes);

// ADMIN
router.put("/iqamah", protectAdmin, updateIqamah);

export default router;