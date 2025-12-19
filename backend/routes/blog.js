const express = require("express");
const router = express.Router();
const BlogPost = require("../models/BlogPost");

// Helper-Funktion: Slug aus Titel generieren
function generateSlug(title) {
  return title
    .toLowerCase()
    .replace(/ä/g, 'ae')
    .replace(/ö/g, 'oe')
    .replace(/ü/g, 'ue')
    .replace(/ß/g, 'ss')
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
}

// GET /api/blog - Alle veröffentlichten Blog-Posts abrufen (für öffentliche Seite)
router.get("/", async (req, res) => {
  try {
    const posts = await BlogPost.find({ status: 'published' })
      .sort({ publishedAt: -1 })
      .select('-__v');

    res.json(posts);
  } catch (error) {
    console.error("Fehler beim Abrufen der Blog-Posts:", error);
    res.status(500).json({ error: "Fehler beim Abrufen der Blog-Posts" });
  }
});

// GET /api/blog/admin/all - Alle Blog-Posts abrufen (für Admin-Panel, inkl. Drafts)
router.get("/admin/all", async (req, res) => {
  try {
    const posts = await BlogPost.find()
      .sort({ updatedAt: -1 })
      .select('-__v');

    res.json(posts);
  } catch (error) {
    console.error("Fehler beim Abrufen der Blog-Posts:", error);
    res.status(500).json({ error: "Fehler beim Abrufen der Blog-Posts" });
  }
});

// GET /api/blog/:slug - Einzelnen Blog-Post nach Slug abrufen
router.get("/:slug", async (req, res) => {
  try {
    const post = await BlogPost.findOne({ slug: req.params.slug });

    if (!post) {
      return res.status(404).json({ error: "Blog-Post nicht gefunden" });
    }

    // Views erhöhen (nur für veröffentlichte Posts)
    if (post.status === 'published') {
      post.views += 1;
      await post.save();
    }

    res.json(post);
  } catch (error) {
    console.error("Fehler beim Abrufen des Blog-Posts:", error);
    res.status(500).json({ error: "Fehler beim Abrufen des Blog-Posts" });
  }
});

// POST /api/blog - Neuen Blog-Post erstellen
router.post("/", async (req, res) => {
  try {
    const { title, slug, content, featuredImage, metaTitle, metaDescription, status } = req.body;

    if (!title || !content) {
      return res.status(400).json({ error: "Titel und Inhalt sind erforderlich" });
    }

    // Slug generieren oder verwenden
    let finalSlug = slug || generateSlug(title);

    // Prüfen ob Slug bereits existiert
    const existingPost = await BlogPost.findOne({ slug: finalSlug });
    if (existingPost) {
      // Eindeutigen Slug mit Timestamp generieren
      finalSlug = `${finalSlug}-${Date.now()}`;
    }

    const blogPost = new BlogPost({
      title,
      slug: finalSlug,
      content,
      featuredImage,
      metaTitle: metaTitle || title,
      metaDescription: metaDescription || content.substring(0, 160),
      status: status || 'draft'
    });

    const savedPost = await blogPost.save();
    res.status(201).json(savedPost);
  } catch (error) {
    console.error("Fehler beim Erstellen des Blog-Posts:", error);
    res.status(500).json({ error: "Fehler beim Erstellen des Blog-Posts" });
  }
});

// PUT /api/blog/:id - Blog-Post aktualisieren
router.put("/:id", async (req, res) => {
  try {
    const { title, slug, content, featuredImage, metaTitle, metaDescription, status } = req.body;

    const post = await BlogPost.findById(req.params.id);

    if (!post) {
      return res.status(404).json({ error: "Blog-Post nicht gefunden" });
    }

    // Wenn Slug geändert wurde, prüfen ob er eindeutig ist
    if (slug && slug !== post.slug) {
      const existingPost = await BlogPost.findOne({ slug, _id: { $ne: req.params.id } });
      if (existingPost) {
        return res.status(400).json({ error: "Dieser Slug existiert bereits" });
      }
      post.slug = slug;
    }

    // Felder aktualisieren
    if (title) post.title = title;
    if (content) post.content = content;
    if (featuredImage !== undefined) post.featuredImage = featuredImage;
    if (metaTitle !== undefined) post.metaTitle = metaTitle;
    if (metaDescription !== undefined) post.metaDescription = metaDescription;
    if (status) post.status = status;

    const updatedPost = await post.save();
    res.json(updatedPost);
  } catch (error) {
    console.error("Fehler beim Aktualisieren des Blog-Posts:", error);
    res.status(500).json({ error: "Fehler beim Aktualisieren des Blog-Posts" });
  }
});

// DELETE /api/blog/:id - Blog-Post löschen
router.delete("/:id", async (req, res) => {
  try {
    const post = await BlogPost.findByIdAndDelete(req.params.id);

    if (!post) {
      return res.status(404).json({ error: "Blog-Post nicht gefunden" });
    }

    res.json({ message: "Blog-Post erfolgreich gelöscht", post });
  } catch (error) {
    console.error("Fehler beim Löschen des Blog-Posts:", error);
    res.status(500).json({ error: "Fehler beim Löschen des Blog-Posts" });
  }
});

// POST /api/blog/generate-slug - Slug aus Titel generieren
router.post("/generate-slug", async (req, res) => {
  try {
    const { title } = req.body;

    if (!title) {
      return res.status(400).json({ error: "Titel ist erforderlich" });
    }

    let slug = generateSlug(title);

    // Prüfen ob Slug bereits existiert
    const existingPost = await BlogPost.findOne({ slug });
    if (existingPost) {
      slug = `${slug}-${Date.now()}`;
    }

    res.json({ slug });
  } catch (error) {
    console.error("Fehler beim Generieren des Slugs:", error);
    res.status(500).json({ error: "Fehler beim Generieren des Slugs" });
  }
});

module.exports = router;
