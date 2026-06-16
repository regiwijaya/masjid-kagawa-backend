// server.js
import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";

import activityRoutes from "./routes/activityRoutes.js";
import announcementRoutes from "./routes/announcementRoutes.js";
import postRoutes from "./routes/postRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import prayerRoutes from "./routes/prayerRoutes.js";
import donationSettingRoutes from "./routes/donationSettingRoutes.js";
import aboutSettingRoutes from "./routes/aboutSettingRoutes.js";
import uploadRoutes from "./routes/uploadRoutes.js";
import contactRoutes from "./routes/contactRoutes.js";
import kajianRoutes from "./routes/kajianRoutes.js";

dotenv.config();

const app = express();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(
  cors({
    origin: true,
    credentials: true,
  })
);

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.get("/", (req, res) => {
  res.json({
    status: "OK",
    message: "Masjid Kagawa API is running 🚀",
    env: process.env.NODE_ENV || "development",
  });
});

app.use("/api/uploads", uploadRoutes);
app.use("/api/upload", uploadRoutes);

app.use("/api/activities", activityRoutes);
app.use("/api/announcements", announcementRoutes);
app.use("/api/posts", postRoutes);
app.use("/api/donation-settings", donationSettingRoutes);
app.use("/api/about-settings", aboutSettingRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/prayer", prayerRoutes);
app.use("/api/contact", contactRoutes);
app.use("/api/kajian", kajianRoutes);

app.use((req, res) => {
  res.status(404).json({
    message: "Route tidak ditemukan",
    path: req.originalUrl,
  });
});

app.use((err, req, res, next) => {
  console.error("❌ SERVER ERROR:", err);

  res.status(err.status || 500).json({
    message: err.message || "Server error",
  });
});

const PORT = process.env.PORT || 5050;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});