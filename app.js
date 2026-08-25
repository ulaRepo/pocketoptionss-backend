 const express = require('express');
const createHttpError = require('http-errors');
const morgan = require('morgan');
const mongoose = require('mongoose');
require('dotenv').config();
const session = require('express-session');
const connectFlash = require('connect-flash');
const passport = require('passport');
const connectMongo = require('connect-mongo');
const { roles } = require('./utils/constants');
const cors = require('cors');

const app = express();
app.use(morgan('dev'));

// 1) CORS first — origin must match address bar exactly
app.use(cors({
  origin: process.env.FRONTEND_URL,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.static('public'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

const MongoStore = connectMongo(session);

app.use(session({
  name: 'connect.sid',
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    sameSite: 'none',
    secure: true,
    maxAge: 24 * 60 * 60 * 1000,
    path: '/'
  },
  store: new MongoStore({ mongooseConnection: mongoose.connection })
}));

app.use(passport.initialize());
app.use(passport.session());
require('./utils/passport.auth');

app.use((req, res, next) => {
  res.locals.user = req.user;
  next();
});

app.use(connectFlash());
app.use((req, res, next) => {
  res.locals.messages = req.flash();
  next();
});

function ensureAuthJSON(req, res, next) {
  if (req.isAuthenticated && req.isAuthenticated()) return next();
  return res.status(401).json({ error: 'Not authenticated' });
}

function ensureAdmin(req, res, next) {
  if (req.user && req.user.role === roles.admin) return next();
  return res.status(403).json({ error: 'Not authorized' });
}

app.use('/', require('./routes/index.route'));
app.use('/auth', require('./routes/auth.route'));
app.use('/user', ensureAuthJSON, require('./routes/user.route'));
app.use('/admin', ensureAuthJSON, ensureAdmin, require('./routes/admin.route'));

app.use((req, res, next) => next(createHttpError.NotFound()));

app.use((error, req, res, next) => {
  error.status = error.status || 500;
  res.status(error.status).json({
    error: error.message || 'Internal Server Error',
    status: error.status
  });
});

const PORT = process.env.PORT || 3000;
mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('💾 connected...');
    app.listen(PORT, () => console.log(`🚀 Backend @ http://127.0.0.1:${PORT}`));
  })
  .catch(err => console.log(err.message));



