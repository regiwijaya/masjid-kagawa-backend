import prisma from "../prisma/client.js";

// =========================
// HELPER
// =========================
async function getOrCreateAboutSetting(adminId = null) {
  let setting = await prisma.aboutSetting.findFirst();

  if (!setting) {
    setting = await prisma.aboutSetting.create({
      data: {
        updatedBy: adminId || null,
        historyText:
          "Masjid Kagawa berdiri sebagai pusat ibadah, dakwah, dan pembinaan...",
        visionText:
          "Menjadi pusat ibadah, dakwah, dan pendidikan Islam...",
        missionItems: [
          "Menyelenggarakan pembinaan keagamaan",
          "Menyediakan sarana ibadah",
          "Membangun ukhuwah",
        ],
        leaders: [],
        footerDescription: "",
        address: "",
        email: "",
        phone: "",
        mapEmbedUrl: "",
        imamDuty: "",
        muadzinDuty: "",
        social: {
          facebook: "",
          instagram: "",
          youtube: "",
        },
      },
    });
  }

  return setting;
}

// =========================
// NORMALIZER
// =========================
function normalizeMissionItems(items) {
  if (!Array.isArray(items)) return null;

  const result = items
    .map((item) => (typeof item === "string" ? item.trim() : ""))
    .filter(Boolean);

  return result.length ? result : null; // 🔥 FIX
}

function normalizeLeaders(leaders) {
  if (!Array.isArray(leaders)) return null;

  const result = leaders
    .map((item) => ({
      role: item?.role?.trim() || "",
      name: item?.name?.trim() || "",
      imageUrl: item?.imageUrl?.trim() || "",
      note: item?.note?.trim() || "",
    }))
    .filter((l) => l.role || l.name || l.imageUrl || l.note);

  return result.length ? result : null; // 🔥 FIX
}

// =========================
// PUBLIC
// =========================
export const getAboutSetting = async (req, res) => {
  try {
    const setting = await getOrCreateAboutSetting();
    return res.json(setting);
  } catch (err) {
    console.error("getAboutSetting ERROR:", err);
    console.log("DB historyText:", setting.historyText);
    console.log("Length:", setting.historyText?.length);
    return res.status(500).json({ msg: "Server error" });
  }
};

// =========================
// ADMIN
// =========================
export const updateAboutSetting = async (req, res) => {
  try {
    const current = await getOrCreateAboutSetting(req.admin?.id);

    const stringFields = [
      "heroTitle",
      "heroSubtitle",
      "heroImageUrl",
      "historyTitle",
      "historyText",
      "historyImageUrl",
      "visionTitle",
      "visionText",
      "missionTitle",
      "footerDescription",
      "address",
      "email",
      "phone",
      "mapEmbedUrl",
      "imamDuty",
      "muadzinDuty",
    ];

    let updatedData = {};

    // =========================
    // STRING FIELDS
    // =========================
    for (const field of stringFields) {
      if (typeof req.body?.[field] === "string") {
        updatedData[field] = req.body[field].trim();
      }
    }

    // =========================
    // ARRAY SAFE UPDATE
    // =========================
    const missionItems = normalizeMissionItems(req.body?.missionItems);
    if (missionItems !== null) {
      updatedData.missionItems = missionItems;
    }

    const leaders = normalizeLeaders(req.body?.leaders);
    if (leaders !== null) {
      updatedData.leaders = leaders;
    }

    // =========================
    // SOCIAL SAFE MERGE
    // =========================
    if (req.body?.social && typeof req.body.social === "object") {
      updatedData.social = {
        facebook:
          req.body.social.facebook?.trim() ??
          current.social?.facebook ??
          "",
        instagram:
          req.body.social.instagram?.trim() ??
          current.social?.instagram ??
          "",
        youtube:
          req.body.social.youtube?.trim() ??
          current.social?.youtube ??
          "",
      };
    }

    updatedData.updatedBy = req.admin?.id || null;

    const updated = await prisma.aboutSetting.update({
      where: { id: current.id },
      data: updatedData,
    });

    return res.json({
      msg: "About setting updated successfully",
      data: updated,
    });
  } catch (err) {
    console.error("updateAboutSetting ERROR:", err);
    return res.status(500).json({ msg: "Server error" });
  }
};