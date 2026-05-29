// server/createAdmin.js
import mongoose from "mongoose";
import dotenv from "dotenv";
import bcrypt from "bcryptjs";
import Admin from "./models/Admin.js";

dotenv.config();

async function createAdmin() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("MongoDB Connected");

    const name = "Super Admin";
    const email = "admin@mail.com";
    const rawPassword = "admin123";

    const exists = await Admin.findOne({ email });
    if (exists) {
      console.log("Admin sudah ada:", exists.email);
      process.exit(0);
    }

    const hashedPassword = await bcrypt.hash(rawPassword, 10);

    const admin = await Admin.create({
      name,
      email,
      password: hashedPassword,
      role: "superadmin",
    });

    console.log("Admin berhasil dibuat:");
    console.log("Email:", admin.email);
    console.log("Password:", rawPassword);

    process.exit(0);
  } catch (err) {
    console.error("ERROR:", err);
    process.exit(1);
  }
}

createAdmin();
