import prisma from "../prisma/client.js";

async function getOrCreateAboutSetting(adminId = null) {
  let setting = await prisma.aboutSetting.findFirst();

  if (!setting) {
    setting = await prisma.aboutSetting.create({
      data: {
        updatedBy: adminId || null,
        heroTitle: "Tentang Masjid Kagawa",
        heroSubtitle: "Sejarah • Visi Misi • Struktur Pengurus",
        heroImageUrl: "",
        historyTitle: "Sejarah Masjid",
        historyText:
          "Masjid Kagawa berdiri sebagai pusat ibadah, dakwah, dan pembinaan...",
        historyImageUrl: "",
        visionTitle: "Visi",
        visionText: "Menjadi pusat ibadah, dakwah, dan pendidikan Islam...",
        missionTitle: "Misi",
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

function toCleanString(value) {
  if (typeof value !== "string") return "";
  return value.trim();
}

function normalizeMissionItems(items) {
  if (!Array.isArray(items)) return [];
  return items
    .map((item) => toCleanString(item))
    .filter(Boolean);
}

function normalizeLeaders(leaders) {
  if (!Array.isArray(leaders)) return [];

  return leaders
    .map((item) => ({
      role: toCleanString(item?.role),
      name: toCleanString(item?.name),
      imageUrl: toCleanString(item?.imageUrl),
      note: toCleanString(item?.note),
    }))
    .filter((item) => item.role || item.name || item.imageUrl || item.note);
}

export const getAboutSetting = async (req, res) => {
  try {
    const setting = await getOrCreateAboutSetting();
    return res.json(setting);
  } catch (err) {
    console.error("getAboutSetting ERROR:", err);
    return res.status(500).json({ msg: "Server error" });
  }
};

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

    const updatedData = {};

    for (const field of stringFields) {
      if (typeof req.body?.[field] === "string") {
        updatedData[field] = req.body[field].trim();
      }
    }

    if (Array.isArray(req.body?.missionItems)) {
      updatedData.missionItems = normalizeMissionItems(req.body.missionItems);
    }

    if (Array.isArray(req.body?.leaders)) {
      updatedData.leaders = normalizeLeaders(req.body.leaders);
    }

    if (req.body?.social && typeof req.body.social === "object") {
      updatedData.social = {
        facebook:
          typeof req.body.social.facebook === "string"
            ? req.body.social.facebook.trim()
            : current.social?.facebook || "",
        instagram:
          typeof req.body.social.instagram === "string"
            ? req.body.social.instagram.trim()
            : current.social?.instagram || "",
        youtube:
          typeof req.body.social.youtube === "string"
            ? req.body.social.youtube.trim()
            : current.social?.youtube || "",
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