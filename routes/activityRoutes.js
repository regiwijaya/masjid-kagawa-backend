// server/routes/activityRoutes.js

import express from "express";
import {
  getPublishedActivities,
  getPublishedActivityById,
  getAllActivitiesAdmin,
  createActivity,
  updateActivity,
  deleteActivity,
} from "../controllers/activityController.js";

import { protectAdmin } from "../middlewares/authAdmin.js";

const router = express.Router();

/**
 * =========================
 * ADMIN (HARUS DI ATAS)
 * =========================
 * GET    /api/activities/admin/all   -> list all (admin)
 * POST   /api/activities             -> create
 * PUT    /api/activities/:id         -> update
 * DELETE /api/activities/:id         -> delete
 */
router.get("/admin/all", protectAdmin, getAllActivitiesAdmin);
router.post("/", protectAdmin, createActivity);
router.put("/:id", protectAdmin, updateActivity);
router.delete("/:id", protectAdmin, deleteActivity);

/**
 * =========================
 * PUBLIC
 * =========================
 * GET /api/activities              -> list published
 * GET /api/activities/:id          -> detail published
 */
router.get("/", getPublishedActivities);
router.get("/:id", getPublishedActivityById);

export default router;