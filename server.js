import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";

dotenv.config();

const app = express();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let routeStatus = {
  mounted: false,
  error: null,
  mountedRoutes: [],
};

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
    routeStatus,
  });
});

async function mountRoute(label, url, importPath) {
  try {
    const mod = await import(importPath);
    app.use(url, mod.default);
    routeStatus.mountedRoutes.push(url);
    console.log(`✅ Mounted ${label}: ${url}`);
  } catch (err) {
    const errorInfo = {
      label,
      url,
      importPath,
      message: err.message,
      stack: err.stack,
    };

    routeStatus.error = errorInfo;
    console.error(`❌ Failed mounting ${label}:`, err);
  }
}

async function mountRoutes() {
  await mountRoute("uploads", "/api/uploads", "./routes/uploadRoutes.js");
  await mountRoute("upload alias", "/api/upload", "./routes/uploadRoutes.js");
  await mountRoute("activities", "/api/activities", "./routes/activityRoutes.js");
  await mountRoute("announcements", "/api/announcements", "./routes/announcementRoutes.js");
  await mountRoute("posts", "/api/posts", "./routes/postRoutes.js");
  await mountRoute("donation-settings", "/api/donation-settings", "./routes/donationSettingRoutes.js");
  await mountRoute("about-settings", "/api/about-settings", "./routes/aboutSettingRoutes.js");
  await mountRoute("admin", "/api/admin", "./routes/adminRoutes.js");
  await mountRoute("prayer", "/api/prayer", "./routes/prayerRoutes.js");
  await mountRoute("contact", "/api/contact", "./routes/contactRoutes.js");
  await mountRoute("kajian", "/api/kajian", "./routes/kajianRoutes.js");

  routeStatus.mounted = routeStatus.mountedRoutes.length > 0;

  app.use((req, res) => {
    res.status(404).json({
      message: "Route tidak ditemukan",
      path: req.originalUrl,
      routeStatus,
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