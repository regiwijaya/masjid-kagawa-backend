// server/routes/adminRoutes.js
import express from "express";
import {
  registerAdmin,
  loginAdmin,
  getAdminProfile,
} from "../controllers/adminController.js";

import { protectAdmin, allowSuperAdminOrFirstTime } from "../middlewares/authAdmin.js";

const router = express.Router();

// REGISTER ADMIN
router.post("/register", allowSuperAdminOrFirstTime, registerAdmin);

// LOGIN
router.post("/login", loginAdmin);

// GET PROFILE
router.get("/me", protectAdmin, getAdminProfile);

export default router;
