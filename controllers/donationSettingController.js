// server/controllers/donationSettingController.js
import prisma from "../prisma/client.js";

const DEFAULT_DONATION_SETTING = {
  bankJapanName: "",
  bankJapanAccountName: "",
  bankJapanAccountNumber: "",
  bankJapanBranch: "",
  bankIndonesiaName: "",
  bankIndonesiaAccountName: "",
  bankIndonesiaAccountNumber: "",
  bankIndonesiaBranch: "",
  qrisImageUrl: "",
  donationNote: "",
  confirmationText: "",
  confirmationLink: "",
};

function toCleanString(value) {
  if (typeof value !== "string") return "";
  return value.trim();
}

function formatDonationSetting(setting) {
  if (!setting) {
    return {
      ...DEFAULT_DONATION_SETTING,
    };
  }

  return {
    id: setting.id,
    bankJapanName: setting.bankJapanName || "",
    bankJapanAccountName: setting.bankJapanAccountName || "",
    bankJapanAccountNumber: setting.bankJapanAccountNumber || "",
    bankJapanBranch: setting.bankJapanBranch || "",
    bankIndonesiaName: setting.bankIndonesiaName || "",
    bankIndonesiaAccountName: setting.bankIndonesiaAccountName || "",
    bankIndonesiaAccountNumber: setting.bankIndonesiaAccountNumber || "",
    bankIndonesiaBranch: setting.bankIndonesiaBranch || "",
    qrisImageUrl: setting.qrisImageUrl || "",
    donationNote: setting.donationNote || "",
    confirmationText: setting.confirmationText || "",
    confirmationLink: setting.confirmationLink || "",
    updatedBy: setting.updatedBy || null,
    createdAt: setting.createdAt || null,
  };
}

async function getOrCreateDonationSetting(adminId = null) {
  let setting = await prisma.donationsetting.findFirst();

  if (!setting) {
    setting = await prisma.donationsetting.create({
      data: {
        updatedBy: adminId || null,
        ...DEFAULT_DONATION_SETTING,
      },
    });
  }

  return setting;
}

export const getDonationSetting = async (req, res) => {
  try {
    const setting = await getOrCreateDonationSetting();
    return res.json(formatDonationSetting(setting));
  } catch (err) {
    console.error("getDonationSetting ERROR:", err);

    return res.status(500).json({
      msg: "Server error",
      error: err.message,
    });
  }
};

export const updateDonationSetting = async (req, res) => {
  try {
    const current = await getOrCreateDonationSetting(req.admin?.id);

    const allowedFields = [
      "bankJapanName",
      "bankJapanAccountName",
      "bankJapanAccountNumber",
      "bankJapanBranch",
      "bankIndonesiaName",
      "bankIndonesiaAccountName",
      "bankIndonesiaAccountNumber",
      "bankIndonesiaBranch",
      "qrisImageUrl",
      "donationNote",
      "confirmationText",
      "confirmationLink",
    ];

    const updatedData = {};

    for (const field of allowedFields) {
      if (typeof req.body?.[field] === "string") {
        updatedData[field] = toCleanString(req.body[field]);
      }
    }

    updatedData.updatedBy = req.admin?.id || null;

    const updated = await prisma.donationsetting.update({
      where: { id: current.id },
      data: updatedData,
    });

    return res.json({
      msg: "Donation setting updated successfully",
      data: formatDonationSetting(updated),
    });
  } catch (err) {
    console.error("updateDonationSetting ERROR:", err);

    return res.status(500).json({
      msg: "Server error",
      error: err.message,
    });
  }
};