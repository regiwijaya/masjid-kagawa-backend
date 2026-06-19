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
  "donation-confirmations",
];

function getUploadedFile(req) {
  if (req.file) return req.file;

  if (req.files?.image?.[0]) return req.files.image[0];
  if (req.files?.file?.[0]) return req.files.file[0];
  if (req.files?.photo?.[0]) return req.files.photo[0];

  return null;
}

function runUpload(req, res, next) {
  uploadImage.fields([
    { name: "image", maxCount: 1 },
    { name: "file", maxCount: 1 },
    { name: "photo", maxCount: 1 },
  ])(req, res, function (err) {
    if (err) {
      console.error("UPLOAD ERROR:", err);

      return res.status(400).json({
        msg: err.message || "Upload gambar gagal",
        message: err.message || "Upload gambar gagal",
      });
    }

    const uploadedFile = getUploadedFile(req);

    if (!uploadedFile) {
      return res.status(400).json({
        msg: "File gambar wajib diupload",
        message: "File gambar wajib diupload",
        debug: {
          contentType: req.headers["content-type"] || null,
          bodyKeys: req.body ? Object.keys(req.body) : [],
          fileKeys: req.files ? Object.keys(req.files) : [],
        },
      });
    }

    req.uploadedFile = uploadedFile;
    next();
  });
}

router.post(
  "/:type",
  protectAdmin,
  (req, res, next) => {
    const { type } = req.params;

    if (!allowedTypes.includes(type)) {
      return res.status(400).json({
        msg: "Tipe upload tidak valid",
        allowedTypes,
      });
    }

    next();
  },
  runUpload,
  (req, res) => {
    const file = req.uploadedFile;

    const imageUrl = `/uploads/${req.params.type}/${file.filename}`;

    return res.status(201).json({
      msg: "Upload berhasil",
      imageUrl,
      url: imageUrl,
    });
  }
);

router.post("/", protectAdmin, runUpload, (req, res) => {
  const file = req.uploadedFile;

  const imageUrl = `/uploads/general/${file.filename}`;

  return res.status(201).json({
    msg: "Upload berhasil",
    imageUrl,
    url: imageUrl,
  });
});

export default router;