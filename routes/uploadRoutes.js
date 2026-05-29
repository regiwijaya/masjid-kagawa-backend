import express from "express";
import { uploadImage } from "../middlewares/uploadImage.js";
import { protectAdmin } from "../middlewares/authAdmin.js";

const router = express.Router();

const allowedTypes = [
  "activities",
  "kajian",
  "posts",
  "announcements",
  "general",
  "about",
  "donation",
];

// =========================
// 🔥 UPLOAD DENGAN TYPE
// =========================
router.post(
  "/:type",
  protectAdmin,
  (req, res, next) => {
    const { type } = req.params;

    if (!allowedTypes.includes(type)) {
      return res.status(400).json({
        msg: "Tipe upload tidak valid",
      });
    }

    next();
  },
  (req, res, next) => {
    uploadImage.single("image")(req, res, function (err) {
      if (err) {
        console.error("UPLOAD ERROR:", err);
        return res.status(500).json({
          msg: err.message || "Upload gagal",
        });
      }
      next();
    });
  },
  (req, res) => {
    if (!req.file) {
      return res.status(400).json({ msg: "File gambar wajib diupload" });
    }

    const imageUrl = `/uploads/${req.params.type}/${req.file.filename}`;

    return res.status(201).json({
      msg: "Upload berhasil",
      imageUrl, // 🔥 gunakan imageUrl
    });
  }
);

// =========================
// 🔥 DEFAULT UPLOAD (EDITOR)
// =========================
router.post(
  "/",
  protectAdmin,
  (req, res, next) => {
    uploadImage.single("image")(req, res, function (err) {
      if (err) {
        console.error("UPLOAD ERROR:", err);
        return res.status(500).json({
          msg: err.message || "Upload gagal",
        });
      }
      next();
    });
  },
  (req, res) => {
    if (!req.file) {
      return res.status(400).json({ msg: "File gambar wajib diupload" });
    }

    const imageUrl = `/uploads/general/${req.file.filename}`;

    return res.status(201).json({
      msg: "Upload berhasil",
      imageUrl,
    });
  }
);

export default router;