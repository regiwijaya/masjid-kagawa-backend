import express from "express";
import {
  createContact,
  getAllContacts,
  deleteContact,
} from "../controllers/contactController.js";

import { protectAdmin } from "../middlewares/authAdmin.js";

const router = express.Router();

// PUBLIC
router.post("/", createContact);

// ADMIN
router.get("/admin", protectAdmin, getAllContacts);
router.delete("/:id", protectAdmin, deleteContact);

export default router;