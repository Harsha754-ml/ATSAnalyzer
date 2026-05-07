const express = require('express');
const { body } = require('express-validator');
const { signup, login, getMe, updateProfile } = require('../controllers/auth.controller');
const { protect } = require('../middleware/auth.middleware');

const router = express.Router();

// Validation rules
const signupRules = [
  body('name').trim().isLength({ min: 2 }).withMessage('Name must be at least 2 characters.'),
  body('email').isEmail().withMessage('Enter a valid email.'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters.'),
];

const loginRules = [
  body('email').isEmail().withMessage('Enter a valid email.'),
  body('password').notEmpty().withMessage('Password is required.'),
];

router.post('/signup',         signupRules,  signup);
router.post('/login',          loginRules,   login);
router.get('/me',              protect,      getMe);
router.put('/update-profile',  protect,      updateProfile);

module.exports = router;
