import prisma from "../prisma/client.js";

function cleanString(value) {
  if (typeof value !== "string") return "";
  return value.trim();
}

function formatConfirmation(item) {
  if (!item) return null;

  return {
    id: item.id,
    donorName: item.isAnonymous ? "Hamba Allah" : item.donorName || "",
    rawDonorName: item.donorName || "",
    isAnonymous: item.isAnonymous,
    email: item.email || "",
    contact: item.contact || "",
    currency: item.currency || "JPY",
    amount: item.amount || "",
    donationPurpose: item.donationPurpose || "",
    otherPurpose: item.otherPurpose || "",
    paymentMethod: item.paymentMethod || "",
    proofImageUrl: item.proofImageUrl || "",
    message: item.message || "",
    status: item.status || "pending",
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
  };
}

export const createDonationConfirmation = async (req, res) => {
  try {
    const isAnonymous =
      req.body?.isAnonymous === "true" || req.body?.isAnonymous === true;

    const donorName = isAnonymous ? "" : cleanString(req.body?.donorName);
    const email = cleanString(req.body?.email);
    const contact = cleanString(req.body?.contact);
    const currency = cleanString(req.body?.currency) || "JPY";
    const amount = cleanString(req.body?.amount);
    const donationPurpose = cleanString(req.body?.donationPurpose);
    const otherPurpose = cleanString(req.body?.otherPurpose);
    const paymentMethod = cleanString(req.body?.paymentMethod);
    const message = cleanString(req.body?.message);

    if (!isAnonymous && !donorName) {
      return res.status(400).json({
        msg: "Nama donatur wajib diisi atau pilih Hamba Allah.",
      });
    }

    if (!donationPurpose) {
      return res.status(400).json({
        msg: "Tujuan donasi wajib dipilih.",
      });
    }

    const proofImageUrl = req.file
      ? `/uploads/donation-confirmations/${req.file.filename}`
      : "";

    const created = await prisma.donationconfirmation.create({
      data: {
        donorName,
        isAnonymous,
        email,
        contact,
        currency,
        amount,
        donationPurpose,
        otherPurpose,
        paymentMethod,
        proofImageUrl,
        message,
        status: "pending",
      },
    });

    return res.status(201).json({
      msg: "Konfirmasi donasi berhasil dikirim. Jazakumullahu khairan.",
      data: formatConfirmation(created),
    });
  } catch (err) {
    console.error("createDonationConfirmation ERROR:", err);

    return res.status(500).json({
      msg: "Server error",
      error: err.message,
    });
  }
};

export const getDonationConfirmations = async (req, res) => {
  try {
    const items = await prisma.donationconfirmation.findMany({
      orderBy: {
        createdAt: "desc",
      },
    });

    return res.json(items.map(formatConfirmation));
  } catch (err) {
    console.error("getDonationConfirmations ERROR:", err);

    return res.status(500).json({
      msg: "Server error",
      error: err.message,
    });
  }
};

export const getPendingDonationConfirmationCount = async (req, res) => {
  try {
    const count = await prisma.donationconfirmation.count({
      where: {
        status: "pending",
      },
    });

    return res.json({ count });
  } catch (err) {
    console.error("getPendingDonationConfirmationCount ERROR:", err);

    return res.status(500).json({
      msg: "Server error",
      error: err.message,
    });
  }
};

export const updateDonationConfirmationStatus = async (req, res) => {
  try {
    const id = Number(req.params.id);
    const status = cleanString(req.body?.status);

    if (!id || Number.isNaN(id)) {
      return res.status(400).json({ msg: "ID tidak valid." });
    }

    if (!["pending", "verified", "rejected"].includes(status)) {
      return res.status(400).json({ msg: "Status tidak valid." });
    }

    const updated = await prisma.donationconfirmation.update({
      where: { id },
      data: { status },
    });

    return res.json({
      msg: "Status konfirmasi donasi berhasil diperbarui.",
      data: formatConfirmation(updated),
    });
  } catch (err) {
    console.error("updateDonationConfirmationStatus ERROR:", err);

    return res.status(500).json({
      msg: "Server error",
      error: err.message,
    });
  }
};

export const deleteDonationConfirmation = async (req, res) => {
  try {
    const id = Number(req.params.id);

    if (!id || Number.isNaN(id)) {
      return res.status(400).json({ msg: "ID tidak valid." });
    }

    await prisma.donationconfirmation.delete({
      where: { id },
    });

    return res.json({
      msg: "Konfirmasi donasi berhasil dihapus.",
    });
  } catch (err) {
    console.error("deleteDonationConfirmation ERROR:", err);

    return res.status(500).json({
      msg: "Server error",
      error: err.message,
    });
  }
};