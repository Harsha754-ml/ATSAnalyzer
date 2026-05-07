const db = require('../utils/jsonDb');

// GET /api/portfolio/:userId
const getPortfolio = async (req, res, next) => {
  try {
    const portfolio = db.portfolios.findOne({ userId: req.params.userId });
    if (!portfolio) {
      return res.status(404).json({ success: false, message: 'Portfolio not found.' });
    }

    const isOwner = req.user && req.user._id === req.params.userId;
    if (portfolio.isPublic === false && !isOwner) {
      return res.status(403).json({ success: false, message: 'This portfolio is private.' });
    }

    res.json({ success: true, data: portfolio });
  } catch (err) {
    next(err);
  }
};

// GET /api/portfolio/me
const getMyPortfolio = async (req, res, next) => {
  try {
    const portfolio = db.portfolios.findOne({ userId: req.user._id });
    if (!portfolio) {
      return res.status(404).json({ success: false, message: 'No portfolio yet. Upload a resume first.' });
    }
    res.json({ success: true, data: portfolio });
  } catch (err) {
    next(err);
  }
};

// PUT /api/portfolio/update
const updatePortfolio = async (req, res, next) => {
  try {
    const allowed = [
      'name', 'title', 'email', 'phone', 'location',
      'linkedin', 'github', 'website', 'summary',
      'skills', 'projects', 'education', 'experience', 'isPublic',
    ];

    const updates = {};
    allowed.forEach((field) => {
      if (req.body[field] !== undefined) updates[field] = req.body[field];
    });

    const portfolio = db.portfolios.findOneAndUpdate(
      { userId: req.user._id },
      { userId: req.user._id, ...updates },
      { upsert: true }
    );

    res.json({ success: true, message: 'Portfolio updated.', data: portfolio });
  } catch (err) {
    next(err);
  }
};

// DELETE /api/portfolio
const deletePortfolio = async (req, res, next) => {
  try {
    db.portfolios.findOneAndDelete({ userId: req.user._id });
    res.json({ success: true, message: 'Portfolio deleted.' });
  } catch (err) {
    next(err);
  }
};

// GET /api/portfolio/slug/:slug
const getBySlug = async (req, res, next) => {
  try {
    const portfolio = db.portfolios.findOne({ slug: req.params.slug });
    if (!portfolio || portfolio.isPublic === false) {
      return res.status(404).json({ success: false, message: 'Portfolio not found.' });
    }
    res.json({ success: true, data: portfolio });
  } catch (err) {
    next(err);
  }
};

module.exports = { getPortfolio, getMyPortfolio, updatePortfolio, deletePortfolio, getBySlug };
