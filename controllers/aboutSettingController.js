import prisma from "../prisma/client.js";

const DEFAULT_ABOUT_SETTING = {
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
};

function toCleanString(value) {
  if (typeof value !== "string") return "";
  return value.trim();
}

function safeJsonParse(value, fallback) {
  if (!value || typeof value !== "string") return fallback;

  try {
    const parsed = JSON.parse(value);
    return parsed ?? fallback;
  } catch {
    return fallback;
  }
}

function serializeJson(value) {
  return JSON.stringify(value ?? null);
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

function normalizeSocial(social, currentSocial = DEFAULT_ABOUT_SETTING.social) {
  if (!social || typeof social !== "object") {
    return {
      facebook: currentSocial?.facebook || "",
      instagram: currentSocial?.instagram || "",
      youtube: currentSocial?.youtube || "",
    };
  }

  return {
    facebook:
      typeof social.facebook === "string"
        ? social.facebook.trim()
        : currentSocial?.facebook || "",
    instagram:
      typeof social.instagram === "string"
        ? social.instagram.trim()
        : currentSocial?.instagram || "",
    youtube:
      typeof social.youtube === "string"
        ? social.youtube.trim()
        : currentSocial?.youtube || "",
  };
}

function formatAboutSetting(setting) {
  if (!setting) return null;

  return {
    ...setting,
    missionItems: safeJsonParse(setting.missionItems, []),
    leaders: safeJsonParse(setting.leaders, []),
    social: safeJsonParse(setting.social, DEFAULT_ABOUT_SETTING.social),
  };
}

async function getOrCreateAboutSetting(adminId = null) {
  let setting = await prisma.aboutsetting.findFirst();

  if (!setting) {
    setting = await prisma.aboutsetting.create({
      data: {
        updatedBy: adminId || null,
        heroTitle: DEFAULT_ABOUT_SETTING.heroTitle,
        heroSubtitle: DEFAULT_ABOUT_SETTING.heroSubtitle,
        heroImageUrl: DEFAULT_ABOUT_SETTING.heroImageUrl,
        historyTitle: DEFAULT_ABOUT_SETTING.historyTitle,
        historyText: DEFAULT_ABOUT_SETTING.historyText,
        historyImageUrl: DEFAULT_ABOUT_SETTING.historyImageUrl,
        visionTitle: DEFAULT_ABOUT_SETTING.visionTitle,
        visionText: DEFAULT_ABOUT_SETTING.visionText,
        missionTitle: DEFAULT_ABOUT_SETTING.missionTitle,
        missionItems: serializeJson(DEFAULT_ABOUT_SETTING.missionItems),
        leaders: serializeJson(DEFAULT_ABOUT_SETTING.leaders),
        footerDescription: DEFAULT_ABOUT_SETTING.footerDescription,
        address: DEFAULT_ABOUT_SETTING.address,
        email: DEFAULT_ABOUT_SETTING.email,
        phone: DEFAULT_ABOUT_SETTING.phone,
        mapEmbedUrl: DEFAULT_ABOUT_SETTING.mapEmbedUrl,
        imamDuty: DEFAULT_ABOUT_SETTING.imamDuty,
        muadzinDuty: DEFAULT_ABOUT_SETTING.muadzinDuty,
        social: serializeJson(DEFAULT_ABOUT_SETTING.social),
      },
    });
  }

  return setting;
}

export const getAboutSetting = async (req, res) => {
  try {
    const setting = await getOrCreateAboutSetting();
    return res.json(formatAboutSetting(setting));
  } catch (err) {
    console.error("getAboutSetting ERROR:", err);
    return res.status(500).json({
      msg: "Server error",
      error: err.message,
    });
  }
};

export const updateAboutSetting = async (req, res) => {
  try {
    const current = await getOrCreateAboutSetting(req.admin?.id);
    const formattedCurrent = formatAboutSetting(current);

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
      updatedData.missionItems = serializeJson(
        normalizeMissionItems(req.body.missionItems)
      );
    }

    if (Array.isArray(req.body?.leaders)) {
      updatedData.leaders = serializeJson(normalizeLeaders(req.body.leaders));
    }

    if (req.body?.social && typeof req.body.social === "object") {
      updatedData.social = serializeJson(
        normalizeSocial(req.body.social, formattedCurrent.social)
      );
    }

    updatedData.updatedBy = req.admin?.id || null;

    const updated = await prisma.aboutsetting.update({
      where: { id: current.id },
      data: updatedData,
    });

    return res.json({
      msg: "About setting updated successfully",
      data: formatAboutSetting(updated),
    });
  } catch (err) {
    console.error("updateAboutSetting ERROR:", err);
    return res.status(500).json({
      msg: "Server error",
      error: err.message,
    });
  }
};