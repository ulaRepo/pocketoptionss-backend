const router = require('express').Router();
const User = require('../models/user.model');
const { validationResult } = require('express-validator');
const { registerValidator } = require('../utils/validators');
const { createToken, maxAge, JWT_SECRET } = require('../utils/authMiddleware');
const jwt = require('jsonwebtoken');

const frontendUrl = () =>
  (process.env.FRONTEND_URL || '').replace(/\/$/, '');

function safeUser(user) {
  return {
    _id: user._id,
    email: user.email,
    role: user.role,
    balance: user.balance,
    account: user.account,
    session: user.session,
    profit: user.profit,
    totalDeposit: user.totalDeposit,
    totalWidthdraw: user.totalWidthdraw,
    widthdrawBalance: user.widthdrawBalance,
    verifiedStatus: user.verifiedStatus,
    available: user.available,
    bonus: user.bonus
  };
}

router.get('/login', (req, res) => {
  return res.status(200).json({
    success: true,
    message: 'Use the frontend login page',
    redirect: `${frontendUrl()}/login.html`
  });
});

router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required', success: false });
    }

    const user = await User.findOne({ email: String(email).toLowerCase().trim() });
    if (!user) {
      return res.status(401).json({ error: 'Username/email not registered', success: false });
    }

    const isMatch = await user.isValidPassword(password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Incorrect password', success: false });
    }

    const token = createToken(user._id);

    res.cookie('jwt', token, {
      httpOnly: true,
      maxAge: maxAge * 1000,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/'
    });

    return res.status(200).json({
      success: true,
      message: 'Login successful',
      token,
      user: safeUser(user)
    });
  } catch (error) {
    next(error);
  }
});

router.get('/register', (req, res) => {
  return res.status(200).json({
    success: true,
    message: 'Use the frontend register page',
    redirect: `${frontendUrl()}/register.html`
  });
});

router.post('/register', registerValidator, async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array(), success: false });
    }

    const email = String(req.body.email).toLowerCase().trim();
    const exists = await User.findOne({ email });
    if (exists) {
      return res.status(409).json({ error: 'Email already registered', success: false });
    }

    const user = new User({
      email,
      password: req.body.password
    });
    await user.save();

    return res.status(201).json({
      success: true,
      message: 'Registered successfully. Please login.'
    });
  } catch (error) {
    next(error);
  }
});

router.get('/logout', (req, res) => {
  res.cookie('jwt', '', {
    httpOnly: true,
    maxAge: 1,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/'
  });
  return res.json({ success: true, message: 'Logged out' });
});

router.get('/me', async (req, res) => {
  try {
    let token = req.cookies && req.cookies.jwt;
    if (!token && req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({ error: 'Not authenticated', success: false });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    const u = await User.findById(decoded.id).select('-password');
    if (!u) {
      return res.status(401).json({ error: 'Not authenticated', success: false });
    }

    return res.json(safeUser(u));
  } catch (err) {
    return res.status(401).json({ error: 'Not authenticated', success: false });
  }
});

module.exports = router;