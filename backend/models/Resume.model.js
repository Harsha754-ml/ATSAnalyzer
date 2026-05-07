const mongoose = require('mongoose');

const suggestionSchema = new mongoose.Schema({
  category: { type: String }, // e.g. "Skills", "Formatting", "Projects"
  message:  { type: String },
  impact:   { type: String, enum: ['high', 'medium', 'low'], default: 'medium' },
});

const resumeSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    fileName: {
      type: String,
      required: true,
    },
    fileType: {
      type: String,
      enum: ['pdf', 'txt', 'doc', 'docx'],
      required: true,
    },
    filePath: {
      type: String, // local path or cloud URL
    },
    rawText: {
      type: String, // extracted text content
      required: true,
    },
    // ── Analysis results ──────────────────────────────────────────────────────
    score: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
    },
    suggestions: [suggestionSchema],
    keywords: {
      found:   [String], // keywords detected in resume
      missing: [String], // recommended keywords not found
    },
    sections: {
      hasContact:    { type: Boolean, default: false },
      hasEducation:  { type: Boolean, default: false },
      hasExperience: { type: Boolean, default: false },
      hasSkills:     { type: Boolean, default: false },
      hasProjects:   { type: Boolean, default: false },
      hasSummary:    { type: Boolean, default: false },
    },
    isAnalyzed: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Resume', resumeSchema);
