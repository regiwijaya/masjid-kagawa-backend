// server/routes/postRoutes.js

import express from "express";
import {
  getPublishedPosts,
  getPostBySlug,
  getAllPostsAdmin,
  createPost,
  updatePost,
  deletePost,
} from "../controllers/postController.js";

import { protectAdmin } from "../middlewares/authAdmin.js";

const router = express.Router();

/**
 * =========================
 * ADMIN (HARUS DI ATAS)
 * =========================
 */
router.get("/admin/all", protectAdmin, getAllPostsAdmin);
router.post("/", protectAdmin, createPost);
router.put("/:id", protectAdmin, updatePost);
router.delete("/:id", protectAdmin, deletePost);

/**
 * =========================
 * PUBLIC (URUTAN KRITIS)
 * =========================
 */

// 🔥 FIX: slug route harus di atas
router.get("/slug/:slug", getPostBySlug);

// list semua artikel
router.get("/", getPublishedPosts);

export default router;