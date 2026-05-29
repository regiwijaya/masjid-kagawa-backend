// server/controllers/donationSettingController.js
import prisma from "../prisma/client.js";

// =========================
// HELPER: GET / CREATE SINGLE RECORD
// =========================
async function getOrCreateDonationSetting(adminId = null) {
  let setting = await prisma.donationSetting.findFirst();

  if (!setting) {
    setting = await prisma.donationSetting.create({
      data: {
        updatedBy: adminId || null,
      },
    });
  }

  return setting;
}

// =========================
// PUBLIC
// =========================
export const getDonationSetting = async (req, res) => {
  try {
    const setting = await getOrCreateDonationSetting();
    return res.json(setting);
  } catch (err) {
    console.error("getDonationSetting ERROR:", err);
    return res.status(500).json({ msg: "Server error" });
  }
};

// =========================
// ADMIN
// =========================
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

    let updatedData = {};

    for (const field of allowedFields) {
      if (typeof req.body?.[field] === "string") {
        updatedData[field] = req.body[field].trim();
      }
    }

    updatedData.updatedBy = req.admin?.id || null;

    const updated = await prisma.donationSetting.update({
      where: { id: current.id },
      data: updatedData,
    });

    return res.json({
      msg: "Donation setting updated successfully",
      data: updated,
    });
  } catch (err) {
    console.error("updateDonationSetting ERROR:", err);
    return res.status(500).json({ msg: "Server error" });
  }
};