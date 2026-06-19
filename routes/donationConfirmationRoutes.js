import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { protectAdmin } from "../middlewares/authAdmin.js";
import {
  createDonationConfirmation,
  deleteDonationConfirmation,
  getDonationConfirmations,
  getPendingDonationConfirmationCount,
  updateDonationConfirmationStatus,
} from "../controllers/donationConfirmationController.js";

const router = express.Router();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const uploadDir = path.join(
  __dirname,
  "..",
  "uploads",
  "donation-confirmations"
);

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination(req, file, cb) {
    cb(null, uploadDir);
  },
  filename(req, file, cb) {
    const ext = path.extname(file.originalname || "").toLowerCase() || ".jpg";
    cb(null, `proof-${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
  fileFilter(req, file, cb) {
    if (!file.mimetype?.startsWith("image/")) {
      cb(new Error("Bukti transfer harus berupa gambar."));
      return;
    }

    cb(null, true);
  },
});

function runUpload(req, res, next) {
  upload.single("proofImage")(req, res, (err) => {
    if (err) {
      return res.status(400).json({
        msg: err.message || "Upload bukti transfer gagal.",
      });
    }

    next();
  });
}

// PUBLIC
router.post("/", runUpload, createDonationConfirmation);

// ADMIN
router.get("/", protectAdmin, getDonationConfirmations);
router.get("/pending-count", protectAdmin, getPendingDonationConfirmationCount);
router.put("/:id/status", protectAdmin, updateDonationConfirmationStatus);
router.delete("/:id", protectAdmin, deleteDonationConfirmation);

export default router;