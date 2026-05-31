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

function runUpload(req, res, next) {
  uploadImage.single("image")(req, res, function (err) {
    if (err) {
      console.error("UPLOAD ERROR:", err);

      return res.status(400).json({
        msg: err.message || "Upload gambar gagal",
        message: err.message || "Upload gambar gagal",
      });
    }

    next();
  });
}

router.post("/:type", protectAdmin, (req, res, next) => {
  const { type } = req.params;

  if (!allowedTypes.includes(type)) {
    return res.status(400).json({
      msg: "Tipe upload tidak valid",
      allowedTypes,
    });
  }

  next();
}, runUpload, (req, res) => {
  if (!req.file) {
    return res.status(400).json({
      msg: "File gambar wajib diupload",
    });
  }

  const imageUrl = `/uploads/${req.params.type}/${req.file.filename}`;

  return res.status(201).json({
    msg: "Upload berhasil",
    imageUrl,
    url: imageUrl,
  });
});

router.post("/", protectAdmin, runUpload, (req, res) => {
  if (!req.file) {
    return res.status(400).json({
      msg: "File gambar wajib diupload",
    });
  }

  const imageUrl = `/uploads/general/${req.file.filename}`;

  return res.status(201).json({
    msg: "Upload berhasil",
    imageUrl,
    url: imageUrl,
  });
});

export default router;