const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema({
  name:        { type: String, required: true },
  description: { type: String },
  techStack:   [String],
  link:        { type: String, default: '' },
});

const portfolioSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true, // one portfolio per user
    },
    resumeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Resume',
    },
    // ── Personal info ─────────────────────────────────────────────────────────
    name:        { type: String, required: true },
    title:       { type: String, default: '' }, // e.g. "Full Stack Developer"
    email:       { type: String, default: '' },
    phone:       { type: String, default: '' },
    location:    { type: String, default: '' },
    linkedin:    { type: String, default: '' },
    github:      { type: String, default: '' },
    website:     { type: String, default: '' },
    summary:     { type: String, default: '' },
    // ── Skills ────────────────────────────────────────────────────────────────
    skills:      [String],
    // ── Projects ──────────────────────────────────────────────────────────────
    projects:    [projectSchema],
    // ── Education ─────────────────────────────────────────────────────────────
    education: [
      {
        institution: String,
        degree:      String,
        field:       String,
        year:        String,
      },
    ],
    // ── Experience ────────────────────────────────────────────────────────────
    experience: [
      {
        company:   String,
        role:      String,
        duration:  String,
        highlights: [String],
      },
    ],
    isPublic: { type: Boolean, default: true },
    slug:     { type: String, unique: true, sparse: true }, // e.g. "john-doe-123"
  },
  { timestamps: true }
);

// Auto-generate slug before saving
portfolioSchema.pre('save', function (next) {
  if (!this.slug && this.name) {
    this.slug = this.name.toLowerCase().replace(/\s+/g, '-') + '-' + Date.now();
  }
  next();
});

module.exports = mongoose.model('Portfolio', portfolioSchema);
