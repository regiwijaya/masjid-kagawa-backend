// server/controllers/prayerController.js
import prisma from "../prisma/client.js";
import { fetchPrayerTimesFromAladhan } from "../services/prayerService.js";

// =========================
// HELPER
// =========================
function sanitizeTimeInput(value) {
  if (typeof value !== "string") return null;

  const trimmed = value.trim();
  if (!trimmed) return null;

  const isValid = /^([01]\d|2[0-3]):([0-5]\d)$/.test(trimmed);
  return isValid ? trimmed : null;
}

// =========================
// GET / CREATE IQAMAH (SINGLE RECORD)
// =========================
async function getOrCreateIqamahSetting() {
  let iqamah = await prisma.iqamahSetting.findFirst();

  if (!iqamah) {
    iqamah = await prisma.iqamahSetting.create({
      data: {},
    });
  }

  return iqamah;
}

// =========================
// GET PRAYER TIMES
// =========================
export async function getPrayerTimes(req, res) {
  try {
    const prayerData = await fetchPrayerTimesFromAladhan();
    const iqamah = await getOrCreateIqamahSetting();

    res.json({
      date: prayerData.date,
      location: prayerData.location,
      timezone: prayerData.timezone,
      coordinates: prayerData.coordinates,
      source: prayerData.source,
      adzan: {
        subuh: prayerData.adzan.subuh,
        syuruq: prayerData.adzan.syuruq,
        zuhur: prayerData.adzan.zuhur,
        asar: prayerData.adzan.asar,
        maghrib: prayerData.adzan.maghrib,
        isya: prayerData.adzan.isya,
      },
      iqamah: {
        subuh: iqamah.subuh,
        zuhur: iqamah.zuhur,
        asar: iqamah.asar,
        maghrib: iqamah.maghrib,
        isya: iqamah.isya,
      },
    });
  } catch (error) {
    console.error("❌ getPrayerTimes ERROR:", error);
    res.status(500).json({
      message: "Failed to load prayer times",
    });
  }
}

// =========================
// UPDATE IQAMAH
// =========================
export async function updateIqamah(req, res) {
  try {
    const current = await getOrCreateIqamahSetting();

    const fields = ["subuh", "zuhur", "asar", "maghrib", "isya"];
    const updates = {};

    for (const field of fields) {
      const parsed = sanitizeTimeInput(req.body?.[field]);
      if (parsed) {
        updates[field] = parsed;
      }
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({
        message: "Tidak ada jam iqamah yang valid untuk diperbarui",
      });
    }

    const updated = await prisma.iqamahSetting.update({
      where: { id: current.id },
      data: updates,
    });

    res.json({
      message: "Iqamah updated successfully",
      iqamah: {
        subuh: updated.subuh,
        zuhur: updated.zuhur,
        asar: updated.asar,
        maghrib: updated.maghrib,
        isya: updated.isya,
      },
    });
  } catch (error) {
    console.error("❌ updateIqamah ERROR:", error);
    res.status(500).json({
      message: "Failed updating iqamah",
    });
  }
}