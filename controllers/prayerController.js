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

function hasField(object, field) {
  return Object.prototype.hasOwnProperty.call(object || {}, field);
}

function getZuhurFieldName(iqamah) {
  if (hasField(iqamah, "zuhur")) return "zuhur";
  if (hasField(iqamah, "dzuhur")) return "dzuhur";
  return "zuhur";
}

function getZuhurValue(iqamah) {
  return iqamah?.zuhur ?? iqamah?.dzuhur ?? null;
}

async function getOrCreateIqamahSettingSafe() {
  try {
    let iqamah = await prisma.iqamahSetting.findFirst();

    if (!iqamah) {
      iqamah = await prisma.iqamahSetting.create({
        data: {},
      });
    }

    return iqamah;
  } catch (error) {
    console.error("❌ IQAMAH DB ERROR:", error.message);

    return {
      subuh: null,
      zuhur: null,
      dzuhur: null,
      asar: null,
      maghrib: null,
      isya: null,
    };
  }
}

export async function getPrayerTimes(req, res) {
  try {
    const prayerData = await fetchPrayerTimesFromAladhan();
    const iqamah = await getOrCreateIqamahSettingSafe();
    const zuhurIqamah = getZuhurValue(iqamah);

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
        zuhur: safeTime(zuhurIqamah),
        dzuhur: safeTime(zuhurIqamah),
        asar: safeTime(iqamah.asar),
        maghrib: safeTime(iqamah.maghrib),
        isya: safeTime(iqamah.isya),
      },
    });
  } catch (error) {
    console.error("❌ getPrayerTimes ERROR:", error);

    return res.json({
      date: "",
      location: "Masjid Kagawa",
      timezone: "Asia/Tokyo",
      source: "emergency",
      adzan: {
        subuh: "03:10",
        syuruq: "04:55",
        zuhur: "12:05",
        dzuhur: "12:05",
        asar: "15:58",
        maghrib: "19:15",
        isya: "20:50",
      },
      iqamah: {
        subuh: "-",
        zuhur: "-",
        dzuhur: "-",
        asar: "-",
        maghrib: "-",
        isya: "-",
      },
    });
  }
}

export async function updateIqamah(req, res) {
  try {
    let current = await prisma.iqamahSetting.findFirst();

    if (!current) {
      current = await prisma.iqamahSetting.create({
        data: {},
      });
    }

    const updates = {};

    const subuh = sanitizeTimeInput(req.body?.subuh);
    const zuhur = sanitizeTimeInput(req.body?.zuhur || req.body?.dzuhur);
    const asar = sanitizeTimeInput(req.body?.asar);
    const maghrib = sanitizeTimeInput(req.body?.maghrib);
    const isya = sanitizeTimeInput(req.body?.isya);

    if (subuh) updates.subuh = subuh;
    if (asar) updates.asar = asar;
    if (maghrib) updates.maghrib = maghrib;
    if (isya) updates.isya = isya;

    if (zuhur) {
      const zuhurFieldName = getZuhurFieldName(current);
      updates[zuhurFieldName] = zuhur;
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

    const updatedZuhur = getZuhurValue(updated);

    return res.json({
      message: "Iqamah updated successfully",
      iqamah: {
        subuh: safeTime(updated.subuh),
        zuhur: safeTime(updatedZuhur),
        dzuhur: safeTime(updatedZuhur),
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