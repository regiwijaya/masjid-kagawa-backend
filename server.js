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
  skippedRoutes: [],
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

async function mountRoute(label, url, importPath, options = {}) {
  const required = options.required === true;

  try {
    const mod = await import(importPath);

    if (!mod?.default) {
      throw new Error(`Route ${label} does not export default router`);
    }

    app.use(url, mod.default);
    routeStatus.mountedRoutes.push(url);
    console.log(`✅ Mounted ${label}: ${url}`);
  } catch (err) {
    const errorInfo = {
      label,
      url,
      importPath,
      message: err.message,
    };

    if (required) {
      routeStatus.error = errorInfo;
      console.error(`❌ Failed mounting required route ${label}:`, err);
    } else {
      routeStatus.skippedRoutes.push(errorInfo);
      console.warn(`⚠️ Skipped optional route ${label}: ${err.message}`);
    }
  }
}

async function mountRoutes() {
  await mountRoute("uploads", "/api/uploads", "./routes/uploadRoutes.js", {
    required: true,
  });

  await mountRoute("upload alias", "/api/upload", "./routes/uploadRoutes.js", {
    required: true,
  });

  await mountRoute("activities", "/api/activities", "./routes/activityRoutes.js", {
    required: true,
  });

  await mountRoute(
    "announcements",
    "/api/announcements",
    "./routes/announcementRoutes.js",
    {
      required: true,
    }
  );

  await mountRoute("posts", "/api/posts", "./routes/postRoutes.js", {
    required: true,
  });

  await mountRoute(
    "donation-confirmations",
    "/api/donation-confirmations",
    "./routes/donationConfirmationRoutes.js",
    {
      required: true,
    }
  );

  await mountRoute(
    "donation-confirmations",
    "/api/donation-confirmations",
    "./routes/donationConfirmationRoutes.js",
    {
      required: true,
    }
  );

  await mountRoute(
    "about-settings",
    "/api/about-settings",
    "./routes/aboutSettingRoutes.js",
    {
      required: true,
    }
  );

  await mountRoute("admin", "/api/admin", "./routes/adminRoutes.js", {
    required: true,
  });

  await mountRoute("prayer", "/api/prayer", "./routes/prayerRoutes.js", {
    required: true,
  });

  await mountRoute("contact", "/api/contact", "./routes/contactRoutes.js", {
    required: true,
  });

  await mountRoute("kajian", "/api/kajian", "./routes/kajianRoutes.js", {
    required: false,
  });

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