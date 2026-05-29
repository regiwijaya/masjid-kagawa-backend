import express from "express";
import {
  getPublishedAnnouncements,
  getAnnouncementById,
  getAllAnnouncementsAdmin,
  createAnnouncement,
  updateAnnouncement,
  deleteAnnouncement,
} from "../controllers/announcementController.js";

import { protectAdmin } from "../middlewares/authAdmin.js";

const router = express.Router();

// =========================
// PUBLIC (TARUH DULUAN)
router.get("/", getPublishedAnnouncements);
router.get("/:id", getAnnouncementById);

// =========================
// ADMIN (BEDAKAN PATH!)
router.get("/admin/all", protectAdmin, getAllAnnouncementsAdmin);
router.post("/admin", protectAdmin, createAnnouncement);
router.put("/admin/:id", protectAdmin, updateAnnouncement);
router.delete("/admin/:id", protectAdmin, deleteAnnouncement);

export default router;