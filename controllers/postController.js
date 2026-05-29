import prisma from "../prisma/client.js";

/* ======================================
   HELPER
====================================== */
function slugify(text = "") {
  return text
    .toString()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

async function generateUniqueSlug(title, excludeId = null) {
  const baseSlug = slugify(title || "artikel") || "artikel";
  let slug = baseSlug;
  let counter = 2;

  while (true) {
    const existing = await prisma.post.findUnique({
      where: { slug },
    });

    if (!existing || existing.id === excludeId) return slug;

    slug = `${baseSlug}-${counter}`;
    counter++;
  }
}

/* ======================================
   SAFE HTML CLEAN (FIX BARU)
====================================== */
function cleanHtml(html = "") {
  if (!html) return "";

  try {
    return String(html)
      .replace(/\u0000/g, "") // remove null char
      .trim();
  } catch {
    return "";
  }
}

/* ======================================
   PUBLIC
====================================== */
export const getPublishedPosts = async (req, res) => {
  try {
    const items = await prisma.post.findMany({
      where: { isPublished: true },
      orderBy: [
        { isFeatured: "desc" },
        { createdAt: "desc" },
      ],
    });

    return res.json(items);
  } catch (err) {
    console.error("getPublishedPosts ERROR:", err);
    return res.status(500).json({ msg: "Server error" });
  }
};

export const getPostBySlug = async (req, res) => {
  try {
    const item = await prisma.post.findUnique({
      where: { slug: req.params.slug },
    });

    if (!item || !item.isPublished) {
      return res.status(404).json({ msg: "Artikel tidak ditemukan" });
    }

    return res.json(item);
  } catch (err) {
    console.error("getPostBySlug ERROR:", err);
    return res.status(500).json({ msg: "Server error" });
  }
};

/* ======================================
   ADMIN
====================================== */
export const getAllPostsAdmin = async (req, res) => {
  try {
    const items = await prisma.post.findMany({
      orderBy: [{ createdAt: "desc" }],
    });

    return res.json(items);
  } catch (err) {
    console.error("getAllPostsAdmin ERROR:", err);
    return res.status(500).json({ msg: "Server error" });
  }
};

/* ======================================
   CREATE (FIX TOTAL)
====================================== */
export const createPost = async (req, res) => {
  try {
    console.log("REQ BODY:", req.body);

    const {
      title,
      excerpt,
      content,
      imageUrl,
      category,
      author,
      isPublished,
      isFeatured,
    } = req.body;

    if (!title?.trim()) {
      return res.status(400).json({ msg: "Judul artikel wajib diisi" });
    }

    if (!content || content.trim() === "") {
      return res.status(400).json({ msg: "Konten artikel tidak boleh kosong" });
    }

    const slug = await generateUniqueSlug(title);

    const created = await prisma.post.create({
      data: {
        title: title.trim(),
        slug,
        excerpt: excerpt?.trim() || "",
        content: cleanHtml(content), // ✅ FIX AMAN
        imageUrl: imageUrl?.trim() || "",
        category: category?.trim() || "Artikel",
        author: author?.trim() || "Admin Masjid Kagawa",
        isPublished: typeof isPublished === "boolean" ? isPublished : true,
        isFeatured: typeof isFeatured === "boolean" ? isFeatured : false,
      },
    });

    return res.status(201).json(created);
  } catch (err) {
    console.error("createPost ERROR FULL:", err);

    return res.status(500).json({
      msg: "Server error saat membuat artikel",
      error: err.message,
    });
  }
};

/* ======================================
   UPDATE (FIX TOTAL)
====================================== */
export const updatePost = async (req, res) => {
  try {
    console.log("UPDATE BODY:", req.body);

    const id = Number(req.params.id);

    if (isNaN(id)) {
      return res.status(400).json({ msg: "ID tidak valid" });
    }

    const current = await prisma.post.findUnique({
      where: { id },
    });

    if (!current) {
      return res.status(404).json({ msg: "Artikel tidak ditemukan" });
    }

    const nextTitle = req.body?.title?.trim() || current.title;

    const nextSlug =
      nextTitle !== current.title
        ? await generateUniqueSlug(nextTitle, id)
        : current.slug;

    const updated = await prisma.post.update({
      where: { id },
      data: {
        title: nextTitle,
        slug: nextSlug,
        excerpt:
          typeof req.body?.excerpt === "string"
            ? req.body.excerpt.trim()
            : current.excerpt,

        content:
          typeof req.body?.content === "string"
            ? cleanHtml(req.body.content) // ✅ FIX AMAN
            : current.content,

        imageUrl:
          typeof req.body?.imageUrl === "string"
            ? req.body.imageUrl.trim()
            : current.imageUrl,

        category:
          typeof req.body?.category === "string"
            ? req.body.category.trim()
            : current.category,

        author:
          typeof req.body?.author === "string"
            ? req.body.author.trim()
            : current.author,

        isPublished:
          typeof req.body?.isPublished === "boolean"
            ? req.body.isPublished
            : current.isPublished,

        isFeatured:
          typeof req.body?.isFeatured === "boolean"
            ? req.body.isFeatured
            : current.isFeatured,
      },
    });

    return res.json(updated);
  } catch (err) {
    console.error("updatePost ERROR FULL:", err);

    return res.status(500).json({
      msg: "Server error saat update artikel",
      error: err.message,
    });
  }
};

/* ======================================
   DELETE
====================================== */
export const deletePost = async (req, res) => {
  try {
    const id = Number(req.params.id);

    if (isNaN(id)) {
      return res.status(400).json({ msg: "ID tidak valid" });
    }

    await prisma.post.delete({
      where: { id },
    });

    return res.json({ msg: "Artikel berhasil dihapus" });
  } catch (err) {
    console.error("deletePost ERROR:", err);
    return res.status(500).json({ msg: "Server error" });
  }
};