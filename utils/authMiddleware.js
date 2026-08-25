const jwt = require('jsonwebtoken');
const User = require('../models/user.model');
const { roles } = require('./constants');

const JWT_SECRET = process.env.JWT_SECRET || 'piuscandothis';
const maxAge = 3 * 24 * 60 * 60; // seconds

function createToken(id) {
  return jwt.sign({ id }, JWT_SECRET, { expiresIn: maxAge });
}

function getTokenFromReq(req) {
  let token = req.cookies && req.cookies.jwt;
  if (!token && req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
    token = req.headers.authorization.split(' ')[1];
  }
  return token || null;
}

const requireAuth = (req, res, next) => {
  const token = getTokenFromReq(req);

  if (!token) {
    return res.status(401).json({ error: 'Not authenticated', success: false, message: 'Unauthorized. Please login.' });
  }

  jwt.verify(token, JWT_SECRET, async (err, decodedToken) => {
    if (err) {
      return res.status(401).json({ error: 'Invalid or expired token', success: false, message: 'Invalid or expired token.' });
    }

    try {
      const user = await User.findById(decodedToken.id).select('-password');
      if (!user) {
        return res.status(401).json({ error: 'User not found', success: false, message: 'User not found.' });
      }
      req.user = user;
      res.locals.user = user;
      next();
    } catch (dbErr) {
      console.error('Database error in requireAuth:', dbErr);
      return res.status(500).json({ error: 'Server error', success: false, message: 'Server error' });
    }
  });
};

const requireAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== roles.admin) {
    return res.status(403).json({ error: 'Not authorized', success: false, message: 'Not authorized' });
  }
  next();
};

const checkUser = (req, res, next) => {
  const token = getTokenFromReq(req);
  if (!token) {
    res.locals.user = null;
    return next();
  }

  jwt.verify(token, JWT_SECRET, async (err, decodedToken) => {
    if (err) {
      res.locals.user = null;
      return next();
    }
    try {
      const user = await User.findById(decodedToken.id).select('-password');
      res.locals.user = user || null;
      if (user) req.user = user;
      next();
    } catch (_) {
      res.locals.user = null;
      next();
    }
  });
};

module.exports = {
  requireAuth,
  requireAdmin,
  checkUser,
  createToken,
  maxAge,
  JWT_SECRET
};