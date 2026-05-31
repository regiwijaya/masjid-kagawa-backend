import multer from "multer";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const allowedFolders = [
  "announcements",
  "activities",
  "kajian",
  "posts",
  "about",
  "general",
  "donation",
];

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Folder root project backend
const projectRoot = path.resolve(__dirname, "..");

// Folder uploads utama
const uploadsRoot = path.join(projectRoot, "uploads");

function ensureDir(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

ensureDir(uploadsRoot);

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    try {
      const folder = req.params.type || "general";

      if (!allowedFolders.includes(folder)) {
        return cb(new Error("Tipe upload tidak valid"));
      }

      const uploadPath = path.join(uploadsRoot, folder);
      ensureDir(uploadPath);

      cb(null, uploadPath);
    } catch (err) {
      console.error("DESTINATION ERROR:", err);
      cb(err);
    }
  },

  filename: (req, file, cb) => {
    try {
      const originalExt = path.extname(file.originalname || "").toLowerCase();
      const safeExt = originalExt || ".jpg";
      const filename = `${Date.now()}-${Math.round(Math.random() * 1e9)}${safeExt}`;

      cb(null, filename);
    } catch (err) {
      console.error("FILENAME ERROR:", err);
      cb(err);
    }
  },
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/jpg"];

  if (!allowedTypes.includes(file.mimetype)) {
    return cb(new Error("Format gambar harus JPG, PNG, atau WEBP"));
  }

  cb(null, true);
};

export const uploadImage = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024,
  },
});