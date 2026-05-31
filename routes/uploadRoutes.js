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

function getBaseUrl(req) {
  const envBaseUrl = process.env.API_BASE_URL || process.env.BACKEND_URL;

  if (envBaseUrl) {
    return envBaseUrl.replace(/\/$/, "");
  }

  const protocol = req.headers["x-forwarded-proto"] || req.protocol || "https";
  const host = req.headers["x-forwarded-host"] || req.headers.host;

  return `${protocol}://${host}`;
}

function runUpload(req, res, next) {
  uploadImage.single("image")(req, res, function (err) {
    if (err) {
      console.error("UPLOAD ERROR:", err);

      return res.status(400).json({
        msg: err.message || "Upload gambar gagal",
        detail: String(err),
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

  const relativeUrl = `/uploads/${req.params.type}/${req.file.filename}`;
  const absoluteUrl = `${getBaseUrl(req)}${relativeUrl}`;

  return res.status(201).json({
    msg: "Upload berhasil",
    imageUrl: relativeUrl,
    url: absoluteUrl,
    file: {
      filename: req.file.filename,
      path: relativeUrl,
      size: req.file.size,
      mimetype: req.file.mimetype,
    },
  });
});

router.post("/", protectAdmin, runUpload, (req, res) => {
  if (!req.file) {
    return res.status(400).json({
      msg: "File gambar wajib diupload",
    });
  }

  const relativeUrl = `/uploads/general/${req.file.filename}`;
  const absoluteUrl = `${getBaseUrl(req)}${relativeUrl}`;

  return res.status(201).json({
    msg: "Upload berhasil",
    imageUrl: relativeUrl,
    url: absoluteUrl,
    file: {
      filename: req.file.filename,
      path: relativeUrl,
      size: req.file.size,
      mimetype: req.file.mimetype,
    },
  });
});

export default router;