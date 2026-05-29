// server/controllers/announcementController.js

import prisma from "../prisma/client.js";

// =========================
// HELPER
// =========================
function parseId(id) {
  const parsed = Number(id);
  return isNaN(parsed) ? null : parsed;
}

// =========================
// PUBLIC
// =========================
export const getPublishedAnnouncements = async (req, res) => {
  try {
    const items = await prisma.announcement.findMany({
      where: { isPublished: true },
      orderBy: [
        { date: "desc" },
        { createdAt: "desc" },
      ],
    });

    return res.json(items);
  } catch (err) {
    console.error("getPublishedAnnouncements ERROR:", err);
    return res.status(500).json({ msg: "Server error" });
  }
};

export const getAnnouncementById = async (req, res) => {
  try {
    const id = parseId(req.params.id);

    if (!id) {
      return res.status(400).json({ msg: "ID tidak valid" });
    }

    const item = await prisma.announcement.findFirst({
      where: {
        id,
        isPublished: true,
      },
    });

    if (!item) {
      return res.status(404).json({ msg: "Pengumuman tidak ditemukan" });
    }

    return res.json(item);
  } catch (err) {
    console.error("getAnnouncementById ERROR:", err);
    return res.status(500).json({ msg: "Server error" });
  }
};

// =========================
// ADMIN
// =========================
export const getAllAnnouncementsAdmin = async (req, res) => {
  try {
    const items = await prisma.announcement.findMany({
      orderBy: [
        { date: "desc" },
        { createdAt: "desc" },
      ],
    });

    return res.json(items);
  } catch (err) {
    console.error("getAllAnnouncementsAdmin ERROR:", err);
    return res.status(500).json({ msg: "Server error" });
  }
};

export const createAnnouncement = async (req, res) => {
  try {
    const {
      title,
      category,
      date,
      description,
      imageUrl,
      isPublished,
      isFeatured,
    } = req.body;

    if (!title || !date) {
      return res.status(400).json({
        msg: "Title dan date wajib diisi",
      });
    }

    const created = await prisma.announcement.create({
      data: {
        title: title.trim(),
        category: category?.trim() || "Umum",
        date: new Date(date),
        description: description?.trim() || "",
        imageUrl: imageUrl?.trim() || "",
        isPublished:
          typeof isPublished === "boolean" ? isPublished : true,
        isFeatured:
          typeof isFeatured === "boolean" ? isFeatured : false,
        createdBy: req.admin?.id || null,
        updatedBy: req.admin?.id || null,
      },
    });

    return res.status(201).json(created);
  } catch (err) {
    console.error("createAnnouncement ERROR:", err);
    return res.status(500).json({ msg: "Server error" });
  }
};

export const updateAnnouncement = async (req, res) => {
  try {
    const id = parseId(req.params.id);

    if (!id) {
      return res.status(400).json({ msg: "ID tidak valid" });
    }

    const existing = await prisma.announcement.findUnique({
      where: { id },
    });

    if (!existing) {
      return res.status(404).json({ msg: "Pengumuman tidak ditemukan" });
    }

    const updated = await prisma.announcement.update({
      where: { id },
      data: {
        title:
          typeof req.body.title === "string"
            ? req.body.title.trim()
            : existing.title,

        category:
          typeof req.body.category === "string"
            ? req.body.category.trim()
            : existing.category,

        description:
          typeof req.body.description === "string"
            ? req.body.description.trim()
            : existing.description,

        imageUrl:
          typeof req.body.imageUrl === "string"
            ? req.body.imageUrl.trim()
            : existing.imageUrl,

        date: req.body.date
          ? new Date(req.body.date)
          : existing.date,

        isPublished:
          typeof req.body.isPublished === "boolean"
            ? req.body.isPublished
            : existing.isPublished,

        isFeatured:
          typeof req.body.isFeatured === "boolean"
            ? req.body.isFeatured
            : existing.isFeatured,

        updatedBy: req.admin?.id || null,
      },
    });

    return res.json(updated);
  } catch (err) {
    console.error("updateAnnouncement ERROR:", err);
    return res.status(500).json({ msg: "Server error" });
  }
};

export const deleteAnnouncement = async (req, res) => {
  try {
    const id = parseId(req.params.id);

    if (!id) {
      return res.status(400).json({ msg: "ID tidak valid" });
    }

    const existing = await prisma.announcement.findUnique({
      where: { id },
    });

    if (!existing) {
      return res.status(404).json({ msg: "Pengumuman tidak ditemukan" });
    }

    await prisma.announcement.delete({
      where: { id },
    });

    return res.json({ msg: "Pengumuman berhasil dihapus" });
  } catch (err) {
    console.error("deleteAnnouncement ERROR:", err);
    return res.status(500).json({ msg: "Server error" });
  }
};