const fs   = require('fs');
const path = require('path');
const db   = require('../utils/jsonDb');
const { analyzeResume } = require('../utils/resumeAnalyzer');

// Extract text from file
const extractText = async (filePath, fileType) => {
  if (fileType === 'pdf') {
    const pdfParse = require('pdf-parse');
    const buffer   = fs.readFileSync(filePath);
    const data     = await pdfParse(buffer);
    return data.text;
  }
  return fs.readFileSync(filePath, 'utf-8');
};

// POST /api/resume/upload
const uploadResume = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded.' });
    }

    const { originalname, path: filePath, filename } = req.file;
    const ext      = path.extname(originalname).toLowerCase().replace('.', '');
    const fileType = ['pdf', 'txt', 'doc', 'docx'].includes(ext) ? ext : 'txt';

    let rawText = '';
    try {
      rawText = await extractText(filePath, fileType);
    } catch (parseErr) {
      console.warn('Text extraction failed:', parseErr.message);
      rawText = `Resume file: ${originalname}`;
    }

    if (!rawText || rawText.trim().length < 10) {
      return res.status(422).json({ success: false, message: 'Could not extract text. Try a text-based PDF.' });
    }

    // Analyze
    const analysis = analyzeResume(rawText);

    // Save resume
    const resume = db.resumes.create({
      userId:     req.user._id,
      fileName:   originalname,
      fileType,
      filePath:   filename,
      rawText,
      score:      analysis.score,
      suggestions: analysis.suggestions,
      keywords:   analysis.keywords,
      sections:   analysis.sections,
      isAnalyzed: true,
    });

    // Auto-create/update portfolio
    db.portfolios.findOneAndUpdate(
      { userId: req.user._id },
      {
        userId:     req.user._id,
        resumeId:   resume._id,
        name:       analysis.portfolioData.name || req.user.name,
        email:      analysis.portfolioData.email || req.user.email,
        phone:      analysis.portfolioData.phone,
        summary:    analysis.portfolioData.summary,
        skills:     analysis.portfolioData.skills,
        projects:   analysis.portfolioData.projects,
        education:  analysis.portfolioData.education,
        experience: analysis.portfolioData.experience,
      },
      { upsert: true }
    );

    res.status(201).json({
      success:  true,
      message:  'Resume uploaded and analyzed successfully.',
      resumeId: resume._id,
      analysis: {
        score:       analysis.score,
        suggestions: analysis.suggestions,
        keywords:    analysis.keywords,
        sections:    analysis.sections,
      },
      portfolioData: analysis.portfolioData,
    });
  } catch (err) {
    next(err);
  }
};

// GET /api/resume/analyze
const analyzeLatest = async (req, res, next) => {
  try {
    const resumes = db.resumes.findSorted({ userId: req.user._id }, 'createdAt', -1, 1);
    if (resumes.length === 0) {
      return res.status(404).json({ success: false, message: 'No resume found. Upload one first.' });
    }

    const resume = resumes[0];

    res.json({
      success: true,
      data: {
        resumeId:    resume._id,
        fileName:    resume.fileName,
        score:       resume.score,
        suggestions: resume.suggestions,
        keywords:    resume.keywords,
        sections:    resume.sections,
        uploadedAt:  resume.createdAt,
      },
    });
  } catch (err) {
    next(err);
  }
};

// GET /api/resume/history
const getHistory = async (req, res, next) => {
  try {
    const resumes = db.resumes.findSorted({ userId: req.user._id }, 'createdAt', -1, 10)
      .map(({ rawText, ...rest }) => rest); // exclude rawText
    res.json({ success: true, count: resumes.length, data: resumes });
  } catch (err) {
    next(err);
  }
};

// DELETE /api/resume/:id
const deleteResume = async (req, res, next) => {
  try {
    const resume = db.resumes.findOne({ _id: req.params.id, userId: req.user._id });
    if (!resume) {
      return res.status(404).json({ success: false, message: 'Resume not found.' });
    }

    const filePath = path.join(__dirname, '../uploads', resume.filePath);
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);

    db.resumes.findOneAndDelete({ _id: req.params.id });
    res.json({ success: true, message: 'Resume deleted.' });
  } catch (err) {
    next(err);
  }
};

module.exports = { uploadResume, analyzeLatest, getHistory, deleteResume };
