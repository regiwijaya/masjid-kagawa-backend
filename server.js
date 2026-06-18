import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";

dotenv.config();

const app = express();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(cors({ origin: true, credentials: true }));
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

app.get("/__debug", (req, res) => {
  res.json({
    ok: true,
    node: process.version,
    env: process.env.NODE_ENV || null,
    hasDatabaseUrl: !!process.env.DATABASE_URL,
    hasJwtSecret: !!process.env.JWT_SECRET,
  });
});

async function mountRoutes() {
  try {
    const activityRoutes = (await import("./routes/activityRoutes.js")).default;
    const announcementRoutes = (await import("./routes/announcementRoutes.js")).default;
    const postRoutes = (await import("./routes/postRoutes.js")).default;
    const adminRoutes = (await import("./routes/adminRoutes.js")).default;
    const prayerRoutes = (await import("./routes/prayerRoutes.js")).default;
    const donationSettingRoutes = (await import("./routes/donationSettingRoutes.js")).default;
    const aboutSettingRoutes = (await import("./routes/aboutSettingRoutes.js")).default;
    const uploadRoutes = (await import("./routes/uploadRoutes.js")).default;
    const contactRoutes = (await import("./routes/contactRoutes.js")).default;
    const kajianRoutes = (await import("./routes/kajianRoutes.js")).default;

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

    console.log("✅ All routes mounted");
  } catch (err) {
    console.error("❌ ROUTE IMPORT ERROR:", err);
  }

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
}

const PORT = process.env.PORT || 5050;

mountRoutes().then(() => {
  app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
  });
});

process.on("uncaughtException", (err) => {
  console.error("❌ uncaughtException:", err);
});

process.on("unhandledRejection", (err) => {
  console.error("❌ unhandledRejection:", err);
});