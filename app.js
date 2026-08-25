const express = require('express');
const createHttpError = require('http-errors');
const morgan = require('morgan');
const mongoose = require('mongoose');
require('dotenv').config();
const session = require('express-session');
const connectFlash = require('connect-flash');
const connectMongo = require('connect-mongo');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const { requireAuth, requireAdmin, checkUser } = require('./utils/authMiddleware');

const app = express();
app.use(morgan('dev'));

function normalizeOrigin(url) {
  if (!url) return null;
  return String(url).trim().replace(/\/$/, '');
}

const allowedOrigins = [normalizeOrigin(process.env.FRONTEND_URL)].filter(Boolean);

app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    const normalized = normalizeOrigin(origin);
    if (allowedOrigins.includes(normalized)) {
      return callback(null, true);
    }
    console.warn('CORS blocked origin:', origin);
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept']
}));

app.use(cookieParser());
app.use(express.static('public'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

const MongoStore = connectMongo(session);
app.set('trust proxy', 1); // required on Render (HTTPS proxy)
app.use(session({
  name: 'connect.sid',
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    sameSite: 'none',   // cross-site: Netlify domain → Render
    secure: true,       // required with SameSite=None (you are on HTTPS)
    maxAge: 24 * 60 * 60 * 1000,
    path: '/'
  },
  store: new MongoStore({ mongooseConnection: mongoose.connection })
}));

app.use(connectFlash());
app.use((req, res, next) => {
  res.locals.messages = req.flash();
  next();
});

app.use(checkUser);

app.use('/', require('./routes/index.route'));
app.use('/auth', require('./routes/auth.route'));
app.use('/user', requireAuth, require('./routes/user.route'));
app.use('/admin', requireAuth, requireAdmin, require('./routes/admin.route'));

app.use((req, res, next) => next(createHttpError.NotFound()));

app.use((error, req, res, next) => {
  if (error.message === 'Not allowed by CORS') {
    return res.status(403).json({ error: error.message, success: false });
  }
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