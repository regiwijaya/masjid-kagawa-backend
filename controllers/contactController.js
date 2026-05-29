import prisma from "../prisma/client.js";

// =======================
// CREATE CONTACT (PUBLIC)
// =======================
export const createContact = async (req, res) => {
  try {
    const { name, contact, message, category, isAnonymous, type } = req.body;

    if (!message) {
      return res.status(400).json({ msg: "Pesan wajib diisi" });
    }

    const newContact = await prisma.contact.create({
      data: {
        name: isAnonymous ? null : name || null,
        contact: contact || null,
        message,
        category: category || "Umum",
        type: type || "general",
        isAnonymous: !!isAnonymous,
      },
    });

    return res.status(201).json(newContact);
  } catch (err) {
    console.error("createContact ERROR:", err);
    return res.status(500).json({ msg: "Server error" });
  }
};

// =======================
// ADMIN - GET ALL
// =======================
export const getAllContacts = async (req, res) => {
  try {
    const items = await prisma.contact.findMany({
      orderBy: { createdAt: "desc" },
    });

    return res.json(items);
  } catch (err) {
    console.error("getAllContacts ERROR:", err);
    return res.status(500).json({ msg: "Server error" });
  }
};

// =======================
// ADMIN - DELETE
// =======================
export const deleteContact = async (req, res) => {
  try {
    const id = Number(req.params.id);

    if (!id) {
      return res.status(400).json({ msg: "ID tidak valid" });
    }

    await prisma.contact.delete({
      where: { id },
    });

    return res.json({ msg: "Pesan dihapus" });
  } catch (err) {
    console.error("deleteContact ERROR:", err);
    return res.status(500).json({ msg: "Server error" });
  }
};