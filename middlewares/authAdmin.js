// server/middlewares/authAdmin.js

import jwt from "jsonwebtoken";
import prisma from "../prisma/client.js";

// ===========================================
// PROTECT ADMIN (HARUS LOGIN)
// ===========================================
export const protectAdmin = async (req, res, next) => {
  try {
    const auth = req.headers.authorization;

    if (!auth || !auth.startsWith("Bearer ")) {
      return res.status(401).json({ msg: "Tidak ada token" });
    }

    const token = auth.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "secret");

    const admin = await prisma.admin.findUnique({
      where: { id: decoded.id },
    });

    if (!admin) {
      return res.status(401).json({ msg: "Admin tidak valid" });
    }

    req.admin = admin;
    next();
  } catch (err) {
    console.error("AUTH ERROR:", err);
    return res.status(401).json({ msg: "Token tidak valid" });
  }
};

// ===========================================
// IZINKAN REGISTER ADMIN
// ===========================================
export const allowSuperAdminOrFirstTime = async (req, res, next) => {
  try {
    const count = await prisma.admin.count();

    // admin pertama
    if (count === 0) {
      return next();
    }

    // harus login
    const auth = req.headers.authorization;

    if (!auth || !auth.startsWith("Bearer ")) {
      return res.status(403).json({
        msg: "Hanya admin yang sudah login boleh menambah admin",
      });
    }

    const token = auth.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "secret");

    const admin = await prisma.admin.findUnique({
      where: { id: decoded.id },
    });

    if (!admin) {
      return res.status(403).json({ msg: "Token admin tidak valid" });
    }

    req.admin = admin;
    next();
  } catch (err) {
    console.error("ADMIN REGISTER AUTH ERROR:", err);
    res.status(500).json({ msg: "Server error" });
  }
};