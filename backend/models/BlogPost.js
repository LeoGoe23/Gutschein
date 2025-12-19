const mongoose = require("mongoose");

const BlogPostSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  slug: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  content: {
    type: String,
    required: true
  },
  featuredImage: {
    type: String,
    default: null
  },
  metaTitle: {
    type: String,
    trim: true
  },
  metaDescription: {
    type: String,
    trim: true
  },
  status: {
    type: String,
    enum: ['draft', 'published'],
    default: 'draft'
  },
  author: {
    type: String,
    default: 'Gutscheinery Team'
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  publishedAt: {
    type: Date,
    default: null
  },
  views: {
    type: Number,
    default: 0
  }
});

// Automatisches Aktualisieren von updatedAt bei Änderungen
BlogPostSchema.pre('save', function(next) {
  this.updatedAt = Date.now();

  // Wenn Status auf 'published' gesetzt wird und publishedAt noch nicht gesetzt ist
  if (this.status === 'published' && !this.publishedAt) {
    this.publishedAt = Date.now();
  }

  next();
});

// Index für schnellere Suchen
BlogPostSchema.index({ slug: 1 });
BlogPostSchema.index({ status: 1, publishedAt: -1 });

module.exports = mongoose.model("BlogPost", BlogPostSchema);
