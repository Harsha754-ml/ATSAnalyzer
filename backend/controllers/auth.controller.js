const bcrypt = require('bcryptjs');
const db     = require('../utils/jsonDb');
const { generateToken } = require('../utils/jwt');
const { validationResult } = require('express-validator');

// POST /api/auth/signup
const signup = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { name, email, password } = req.body;

    // Check duplicate
    const existing = db.users.findOne({ email: email.toLowerCase() });
    if (existing) {
      return res.status(409).json({ success: false, message: 'Email already registered.' });
    }

    // Hash password
    const salt   = await bcrypt.genSalt(12);
    const hashed = await bcrypt.hash(password, salt);

    const user = db.users.create({
      name,
      email: email.toLowerCase(),
      password: hashed,
    });

    const token = generateToken(user._id);

    res.status(201).json({
      success: true,
      message: 'Account created successfully.',
      token,
      user: { id: user._id, name: user.name, email: user.email },
    });
  } catch (err) {
    next(err);
  }
};

// POST /api/auth/login
const login = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { email, password } = req.body;

    const user = db.users.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    const token = generateToken(user._id);

    res.json({
      success: true,
      message: 'Login successful.',
      token,
      user: { id: user._id, name: user.name, email: user.email },
    });
  } catch (err) {
    next(err);
  }
};

// GET /api/auth/me
const getMe = async (req, res, next) => {
  try {
    const { password, ...user } = req.user;
    res.json({ success: true, user });
  } catch (err) {
    next(err);
  }
};

// PUT /api/auth/update-profile
const updateProfile = async (req, res, next) => {
  try {
    const { name, avatar } = req.body;
    const updated = db.users.findByIdAndUpdate(req.user._id, { name, avatar });
    const { password, ...user } = updated;
    res.json({ success: true, message: 'Profile updated.', user });
  } catch (err) {
    next(err);
  }
};

module.exports = { signup, login, getMe, updateProfile };
