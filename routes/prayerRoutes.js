// server/routes/prayerRoutes.js
import express from "express";
import { getPrayerTimes, updateIqamah } from "../controllers/prayerController.js";
import { protectAdmin } from "../middlewares/authAdmin.js";

const router = express.Router();

// PUBLIC
router.get("/", getPrayerTimes);

// ADMIN
router.put("/iqamah", protectAdmin, updateIqamah);

// BACKWARD COMPATIBILITY
router.put("/", protectAdmin, updateIqamah);
router.post("/", protectAdmin, updateIqamah);

export default router;