// server/controllers/activityController.js

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
export const getPublishedActivities = async (req, res) => {
  try {
    const { type } = req.query;

    const items = await prisma.activity.findMany({
      where: {
        isPublished: true,
        ...(type ? { type } : {}),
      },
      orderBy: [
        { date: "desc" },
        { createdAt: "desc" },
      ],
    });

    return res.json(items);
  } catch (err) {
    console.error("getPublishedActivities ERROR:", err);
    return res.status(500).json({ msg: "Server error" });
  }
};

export const getPublishedActivityById = async (req, res) => {
  try {
    const id = parseId(req.params.id);

    if (!id) {
      return res.status(400).json({ msg: "ID tidak valid" });
    }

const item = await prisma.activity.findUnique({
  where: { id },
});

    if (!item) {
      return res.status(404).json({ msg: "Kegiatan tidak ditemukan" });
    }

    return res.json(item);
  } catch (err) {
    console.error("getPublishedActivityById ERROR:", err);
    return res.status(500).json({ msg: "Server error" });
  }
};

// =========================
// ADMIN
// =========================
export const getAllActivitiesAdmin = async (req, res) => {
  try {
    const items = await prisma.activity.findMany({
      orderBy: [
        { date: "desc" },
        { createdAt: "desc" },
      ],
    });

    return res.json(items);
  } catch (err) {
    console.error("getAllActivitiesAdmin ERROR:", err);
    return res.status(500).json({ msg: "Server error" });
  }
};

export const createActivity = async (req, res) => {
  try {
    const {
      title,
      type,
      category,
      date,
      startTime,
      endTime,
      ustadz,
      location,
      description,
      imageUrl,
      isPublished,
    } = req.body;

    if (!title || !date) {
      return res.status(400).json({
        msg: "Title dan date wajib diisi",
      });
    }

    const created = await prisma.activity.create({
      data: {
        title: title.trim(),
        type: type || "kegiatan",
        category: category || "Kegiatan",
        date: new Date(date),
        startTime: startTime || null,
        endTime: endTime || null,
        ustadz: ustadz || null,
        location: location || null,
        description: description || null,
        imageUrl: imageUrl || null,
        isPublished:
          typeof isPublished === "boolean" ? isPublished : true,
        createdBy: req.admin?.id || null,
        updatedBy: req.admin?.id || null,
      },
    });

    return res.status(201).json(created);
  } catch (err) {
    console.error("createActivity ERROR:", err);
    return res.status(500).json({ msg: "Server error" });
  }
};

export const updateActivity = async (req, res) => {
  try {
    const id = parseId(req.params.id);

    if (!id) {
      return res.status(400).json({ msg: "ID tidak valid" });
    }

    const existing = await prisma.activity.findUnique({
      where: { id },
    });

    if (!existing) {
      return res.status(404).json({ msg: "Kegiatan tidak ditemukan" });
    }

    const updated = await prisma.activity.update({
      where: { id },
      data: {
        ...req.body,
        date: req.body.date ? new Date(req.body.date) : undefined,
        updatedBy: req.admin?.id || null,
      },
    });

    return res.json(updated);
  } catch (err) {
    console.error("updateActivity ERROR:", err);
    return res.status(500).json({ msg: "Server error" });
  }
};

export const deleteActivity = async (req, res) => {
  try {
    const id = parseId(req.params.id);

    if (!id) {
      return res.status(400).json({ msg: "ID tidak valid" });
    }

    const existing = await prisma.activity.findUnique({
      where: { id },
    });

    if (!existing) {
      return res.status(404).json({ msg: "Kegiatan tidak ditemukan" });
    }

    await prisma.activity.delete({
      where: { id },
    });

    return res.json({ msg: "Kegiatan berhasil dihapus" });
  } catch (err) {
    console.error("deleteActivity ERROR:", err);
    return res.status(500).json({ msg: "Server error" });
  }
};