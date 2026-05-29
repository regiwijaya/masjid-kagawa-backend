// server/controllers/adminController.js

import prisma from "../prisma/client.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs"; // 🔥 FIX: gunakan bcryptjs

// ===============================
// REGISTER ADMIN
// ===============================
export const registerAdmin = async (req, res) => {
  try {
    console.log("👉 REGISTER BODY:", req.body);

    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ msg: "Semua kolom wajib diisi" });
    }

    const exists = await prisma.admin.findUnique({
      where: { email },
    });

    if (exists) {
      return res.status(400).json({ msg: "Email sudah terdaftar" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const count = await prisma.admin.count();

    const admin = await prisma.admin.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: count === 0 ? "superadmin" : "admin",
      },
    });

    console.log("✅ ADMIN CREATED:", admin);

    res.status(201).json({
      msg:
        count === 0
          ? "Admin pertama (Superadmin) berhasil dibuat"
          : "Admin baru berhasil ditambahkan",
      admin: {
        id: admin.id,
        name: admin.name,
        email: admin.email,
        role: admin.role,
      },
    });
  } catch (err) {
    console.error("❌ REGISTER ERROR:", err);
    res.status(500).json({
      msg: "Server error",
      error: err.message,
    });
  }
};

// ===============================
// LOGIN ADMIN
// ===============================
export const loginAdmin = async (req, res) => {
  try {
    console.log("👉 LOGIN BODY:", req.body);

    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ msg: "Email & password wajib diisi" });
    }

    const admin = await prisma.admin.findUnique({
      where: { email },
    });

    if (!admin) {
      return res.status(400).json({ msg: "Email tidak ditemukan" });
    }

    const match = await bcrypt.compare(password, admin.password);

    if (!match) {
      return res.status(400).json({ msg: "Password salah" });
    }

    const token = jwt.sign(
      { id: admin.id, role: admin.role },
      process.env.JWT_SECRET || "secret",
      {
        expiresIn: "7d",
      }
    );

    res.json({
      msg: "Login sukses",
      token,
      admin: {
        id: admin.id,
        name: admin.name,
        email: admin.email,
        role: admin.role,
      },
    });
  } catch (err) {
    console.error("❌ LOGIN ERROR:", err);
    res.status(500).json({
      msg: "Server error",
      error: err.message,
    });
  }
};

// ===============================
// GET PROFILE ADMIN
// ===============================
export const getAdminProfile = async (req, res) => {
  try {
    const admin = await prisma.admin.findUnique({
      where: { id: req.admin.id },
    });

    if (!admin) {
      return res.status(404).json({ msg: "Admin tidak ditemukan" });
    }

    const { password, ...safeAdmin } = admin;

    res.json(safeAdmin);
  } catch (err) {
    console.error("❌ PROFILE ERROR:", err);
    res.status(500).json({
      msg: "Server error",
      error: err.message,
    });
  }
};