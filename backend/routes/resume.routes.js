const express = require('express');
const { protect }  = require('../middleware/auth.middleware');
const upload       = require('../middleware/upload.middleware');
const {
  uploadResume,
  analyzeLatest,
  getHistory,
  deleteResume,
} = require('../controllers/resume.controller');

const router = express.Router();

// All resume routes require authentication
router.use(protect);

router.post('/upload',      upload.single('resume'), uploadResume);
router.get('/analyze',      analyzeLatest);
router.get('/history',      getHistory);
router.delete('/:id',       deleteResume);

module.exports = router;
