const router = require('express').Router();
const User = require('../models/user.model');
const { validationResult } = require('express-validator');
const passport = require('passport');
const { ensureLoggedOut } = require('connect-ensure-login');
const { registerValidator } = require('../utils/validators');

const frontendUrl = () =>
  (process.env.FRONTEND_URL || '').replace(/\/$/, '');

// GET /auth/login
router.get(
  '/login',
  ensureLoggedOut({ redirectTo: null }),
  (req, res) => {
    return res.status(200).json({
      success: true,
      message: 'Use the frontend login page',
      redirect: `${frontendUrl()}/login.html`
    });
  }
);

// POST /auth/login
router.post(
  '/login',
  ensureLoggedOut({ redirectTo: null }),
  (req, res, next) => {
    passport.authenticate('local', (err, user, info) => {
      if (err) return next(err);
      if (!user) {
        return res.status(401).json({ error: info?.message || 'Invalid credentials' });
      }
      req.logIn(user, (err) => {
        if (err) return next(err);
        req.session.save((err) => {
          if (err) return next(err);
          const safeUser = {
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
            verifiedStatus: user.verifiedStatus
          };
          return res.json({ success: true, user: safeUser });
        });
      });
    })(req, res, next);
  }
);

// GET /auth/register
router.get(
  '/register',
  ensureLoggedOut({ redirectTo: null }),
  (req, res) => {
    return res.status(200).json({
      success: true,
      message: 'Use the frontend register page',
      redirect: `${frontendUrl()}/register.html`
    });
  }
);

// POST /auth/register
router.post(
  '/register',
  ensureLoggedOut({ redirectTo: null }),
  registerValidator,
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }
      const { email } = req.body;
      const exists = await User.findOne({ email });
      if (exists) {
        return res.status(409).json({ error: 'Email already registered' });
      }
      // Only pass fields the model needs (ignore password2)
      const user = new User({
        email: req.body.email,
        password: req.body.password
      });
      await user.save();
      res.status(201).json({
        success: true,
        message: 'Registered successfully. Please login.'
      });
    } catch (error) {
      next(error);
    }
  }
);

// GET /auth/logout
router.get('/logout', (req, res, next) => {
  req.logout((err) => {
    if (err) return next(err);
    req.session.destroy(() => {
      res.clearCookie('connect.sid');
      res.json({ success: true });
    });
  });
});

// GET /auth/me
router.get('/me', (req, res) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ error: 'Not authenticated' });
  }
  const u = req.user;
  res.json({
    _id: u._id,
    email: u.email,
    role: u.role,
    balance: u.balance,
    account: u.account,
    session: u.session,
    profit: u.profit,
    totalDeposit: u.totalDeposit,
    totalWidthdraw: u.totalWidthdraw,
    widthdrawBalance: u.widthdrawBalance,
    verifiedStatus: u.verifiedStatus,
    available: u.available,
    bonus: u.bonus
  });
});

module.exports = router;