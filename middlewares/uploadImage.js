import multer from "multer";
import path from "path";
import fs from "fs";

const allowedFolders = [
  "announcements",
  "activities",
  "kajian",
  "posts",
  "about",
  "general",
  "donation",
];

// =========================
// STORAGE
// =========================
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    try {
      let folder = req.params.type;

      // 🔥 FIX: fallback
      if (!folder) {
        folder = "general";
      }

      if (!allowedFolders.includes(folder)) {
        return cb(new Error("Tipe upload tidak valid"));
      }

      const uploadPath = path.join(process.cwd(), "uploads", folder);

      if (!fs.existsSync(uploadPath)) {
        fs.mkdirSync(uploadPath, { recursive: true });
      }

      cb(null, uploadPath);
    } catch (err) {
      console.error("DESTINATION ERROR:", err);
      cb(err);
    }
  },

  filename: (req, file, cb) => {
    try {
      const ext = path.extname(file.originalname).toLowerCase() || ".jpg";
      const filename = `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
      cb(null, filename);
    } catch (err) {
      console.error("FILENAME ERROR:", err);
      cb(err);
    }
  },
});

// =========================
// FILTER
// =========================
const fileFilter = (req, file, cb) => {
  const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/jpg"];

  if (!allowedTypes.includes(file.mimetype)) {
    return cb(new Error("Format harus JPG, PNG, WEBP"));
  }

  cb(null, true);
};

// =========================
// EXPORT
// =========================
export const uploadImage = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 🔥 naikkan ke 10MB
  },
});