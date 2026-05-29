import prisma from "../prisma/client.js";

async function migrateKajian() {
  try {
    console.log("🚀 Start migrate Kajian → Activity...");

    const kajianList = await prisma.kajian.findMany();

    console.log(`📦 Total kajian: ${kajianList.length}`);

    for (const k of kajianList) {
      await prisma.activity.create({
        data: {
          title: k.title,
          type: "kajian",
          category: k.category || "Kajian",
          date: k.date,
          startTime: k.time || null,
          endTime: null,
          ustadz: k.ustadz || null,
          location: k.location || "Masjid Kagawa",
          description: k.description || null,
          imageUrl: k.imageUrl || null,
          isPublished: k.isPublished ?? true,
          isFeatured: k.isFeatured ?? false,
          createdBy: k.createdBy || null,
          updatedBy: k.updatedBy || null,
        },
      });

      console.log(`✅ Migrated: ${k.title}`);
    }

    console.log("🎉 MIGRATION DONE!");
  } catch (err) {
    console.error("❌ ERROR:", err);
  } finally {
    await prisma.$disconnect();
  }
}

migrateKajian();