import prisma from "../prisma/client.js";
import { fetchPrayerTimesFromAladhan } from "../services/prayerService.js";

function sanitizeTimeInput(value) {
  if (typeof value !== "string") return null;

  const trimmed = value.trim();
  if (!trimmed) return null;

  const isValid = /^([01]\d|2[0-3]):([0-5]\d)$/.test(trimmed);
  return isValid ? trimmed : null;
}

function safeTime(value) {
  if (!value || typeof value !== "string") return "-";
  return value;
}

async function getOrCreateIqamahSetting() {
  let iqamah = await prisma.iqamahSetting.findFirst();

  if (!iqamah) {
    iqamah = await prisma.iqamahSetting.create({
      data: {},
    });
  }

  return iqamah;
}

export async function getPrayerTimes(req, res) {
  try {
    const prayerData = await fetchPrayerTimesFromAladhan();
    const iqamah = await getOrCreateIqamahSetting();

    return res.json({
      date: prayerData.date,
      location: prayerData.location,
      timezone: prayerData.timezone,
      coordinates: prayerData.coordinates,
      source: prayerData.source,
      adzan: {
        subuh: safeTime(prayerData?.adzan?.subuh),
        syuruq: safeTime(prayerData?.adzan?.syuruq),
        zuhur: safeTime(prayerData?.adzan?.zuhur),
        dzuhur: safeTime(prayerData?.adzan?.zuhur),
        asar: safeTime(prayerData?.adzan?.asar),
        maghrib: safeTime(prayerData?.adzan?.maghrib),
        isya: safeTime(prayerData?.adzan?.isya),
      },
      iqamah: {
        subuh: safeTime(iqamah.subuh),
        zuhur: safeTime(iqamah.zuhur),
        dzuhur: safeTime(iqamah.zuhur),
        asar: safeTime(iqamah.asar),
        maghrib: safeTime(iqamah.maghrib),
        isya: safeTime(iqamah.isya),
      },
    });
  } catch (error) {
    console.error("❌ getPrayerTimes ERROR:", error);

    return res.status(500).json({
      message: "Failed to load prayer times",
      error: error.message,
    });
  }
}

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

    const dzuhurParsed = sanitizeTimeInput(req.body?.dzuhur);
    if (dzuhurParsed) {
      updates.zuhur = dzuhurParsed;
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

    return res.json({
      message: "Iqamah updated successfully",
      iqamah: {
        subuh: safeTime(updated.subuh),
        zuhur: safeTime(updated.zuhur),
        dzuhur: safeTime(updated.zuhur),
        asar: safeTime(updated.asar),
        maghrib: safeTime(updated.maghrib),
        isya: safeTime(updated.isya),
      },
    });
  } catch (error) {
    console.error("❌ updateIqamah ERROR:", error);

    return res.status(500).json({
      message: "Failed updating iqamah",
      error: error.message,
    });
  }
}