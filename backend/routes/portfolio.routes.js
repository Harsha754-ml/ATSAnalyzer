const express = require('express');
const { protect } = require('../middleware/auth.middleware');
const {
  getPortfolio,
  getMyPortfolio,
  updatePortfolio,
  deletePortfolio,
  getBySlug,
} = require('../controllers/portfolio.controller');

const router = express.Router();

// Public routes
router.get('/slug/:slug',  getBySlug);

// Protected routes
router.use(protect);
router.get('/me',          getMyPortfolio);
router.put('/update',      updatePortfolio);
router.delete('/',         deletePortfolio);
router.get('/:userId',     getPortfolio);   // must be last (catch-all param)

module.exports = router;
