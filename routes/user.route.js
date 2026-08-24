const express = require('express');
const router = require('express').Router();

const User = require('../models/user.model');
const Trade = require('../models/livetradingSchema');
const Widthdraw = require('../models/widthdrawSchema');
const Deposit = require('../models/depositSchema');
const Upgrade = require('../models/upgradeSchema');
const Verify = require('../models/verifySchema');
const CopyTrade = require('../models/CopyTrade');
const Affliate = require('../models/affiliate');
const Wallet = require('../models/walletAddress');

const multer = require('multer');
const path = require('path');
const fs = require('fs');
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Helper: URL from CloudinaryStorage file object
function cloudUrl(file) {
  if (!file) return null;
  return file.path || file.secure_url || file.url || null;
}

// Profiles (account photo, etc.)
const profileStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'pocket/profiles',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
    public_id: (req, file) => `user_${req.params.id}_${Date.now()}`
  }
});
const upload = multer({ storage: profileStorage });

// KYC / verify — two images
const verifyStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'pocket/verifications',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
    public_id: (req, file) =>
      `verify_${req.params.id}_${file.fieldname}_${Date.now()}`
  }
});
const uploadFields = multer({ storage: verifyStorage }).fields([
  { name: 'idcardFront', maxCount: 1 },
  { name: 'idcardBack', maxCount: 1 }
]);

// Deposit payment proof
const depositStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'pocket/deposits/proofs',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
    public_id: (req, file) => `deposit_${req.params.id}_${Date.now()}`
  }
});
const depositUpload = multer({ storage: depositStorage });

// Account upgrade proof
const upgradeStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'pocket/upgrades/proofs',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
    public_id: (req, file) => `upgrade_${req.params.id}_${Date.now()}`
  }
});

// Field name MUST match FormData key: "image"
const upgradeUpload = multer({ storage: upgradeStorage }).single('image');

const frontendUrl = () =>
  (process.env.FRONTEND_URL || '').replace(/\/$/, '');

router.get('/dashboard', async (req, res) => {
  // If Accept prefers HTML client is browsing API → point to static page
  // Data is loaded via GET /user/dashboard/data
  if (req.query.data === '1' || req.headers.accept?.includes('application/json')) {
    // fall through handled by /dashboard/data below
  }
  return res.status(200).json({
    success: true,
    message: 'Use the frontend dashboard page',
    redirect: `${frontendUrl()}/user/dashboard.html`
  });
});
// Real data for dashboard.html JS
router.get('/dashboard/data', async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }
    const user = await User.findById(req.user._id).lean();
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    // strip password
    delete user.password;
    return res.json({
      success: true,
      user
    });
  } catch (err) {
    next(err);
  }
});

router.get('/navbarPage', (req, res) => {
  return res.status(200).json({
    success: true,
    message: 'Use the frontend navbar page',
    redirect: `${frontendUrl()}/user/navbarPage.html`
  });
});

router.get('/account', (req, res) => {
  return res.status(200).json({
    success: true,
    message: 'Use the frontend account page',
    redirect: `${frontendUrl()}/user/account.html`
  });
});

// ===========================Livetrade routes =====================

router.get('/trading-live', (req, res) => {
  return res.status(200).json({
    success: true,
    message: 'Use the frontend live trading page',
    redirect: `${frontendUrl()}/user/live.html`
  });
});

router.get('/trading-live/data', async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }
    const user = await User.findById(req.user._id).select('-password').lean();
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    return res.json({
      success: true,
      user: {
        _id: user._id,
        email: user.email,
        balance: user.balance
      }
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Failed to load live trading data' });
  }
});

router.post('/trading-live/:id', async (req, res) => {
  try {
    if (!req.user || String(req.user._id) !== String(req.params.id)) {
      return res.status(403).json({ error: 'Not authorized for this user' });
    }

    const {
      type,
      currencypair,
      lotsize,
      entryPrice,
      stopLoss,
      takeProfit,
      action
    } = req.body;

    if (!type || !currencypair || !lotsize || !entryPrice || !stopLoss || !takeProfit || !action) {
      return res.status(400).json({ error: 'All trade fields are required' });
    }

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const liveTrade = new Trade({
      type,
      currencypair,
      lotsize,
      entryPrice,
      stopLoss,
      takeProfit,
      action,
      owner: user._id          // ← added
    });

    await liveTrade.save();

    user.livetrades.push(liveTrade._id);
    await user.save();

    return res.status(200).json({
      success: true,
      message: 'Live trade executed successfully',
      trade: liveTrade,
      redirect: `${frontendUrl()}/user/liveHistory.html?id=${user._id}`
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: error.message || 'Server error' });
  }
});

router.get('/tradinghistory/:id', (req, res) => {
  return res.status(200).json({
    success: true,
    message: 'Use the frontend trading history page',
    redirect: `${frontendUrl()}/user/liveHistory.html?id=${req.params.id}`
  });
});

router.get('/tradinghistory/:id/data', async (req, res) => {
  try {
    if (!req.user || String(req.user._id) !== String(req.params.id)) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    const user = await User.findById(req.params.id).select('-password').lean();
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Query by owner (most reliable)
    const livetrades = await Trade.find({ owner: req.params.id })
      .sort({ createdAt: -1 })
      .lean();

    return res.json({
      success: true,
      user: {
        _id: user._id,
        email: user.email
      },
      livetrades: livetrades || []
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Failed to load trading history' });
  }
});

// ===================== VERIFY ROUTE (PROFESSIONAL VERSION) =====================

router.get('/verify', async (req, res) => {
  return res.status(200).json({
    success: true,
    message: 'Use the frontend verify page',
    redirect: `${frontendUrl()}/user/verify.html`
  });
});


router.get('/verify', async (req, res) => {
  return res.status(200).json({
    success: true,
    message: 'Use the frontend verify page',
    redirect: `${frontendUrl()}/user/verify.html`
  });
});

router.post('/verify/:id', (req, res, next) => {
  uploadFields(req, res, function (err) {
    if (err) {
      console.error('VERIFY MULTER ERROR:', err);
      return res.status(400).json({ error: err.message || 'Upload failed' });
    }
    next();
  });
}, async (req, res) => {
  try {
    if (!req.user || String(req.user._id) !== String(req.params.id)) {
      return res.status(403).json({ error: 'Not authorized for this user' });
    }

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (user.kycVerified) {
      return res.status(400).json({ error: 'User is already verified' });
    }

    const {
      email, username, fullname, city, gender, dob,
      marital_status, age, address
    } = req.body;

    if (
      !email?.trim() ||
      !username?.trim() ||
      !fullname?.trim() ||
      !city?.trim() ||
      !gender?.trim() ||
      !dob?.trim() ||
      !marital_status?.trim() ||
      !age?.trim() ||
      !address?.trim()
    ) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    const frontFile = req.files?.idcardFront?.[0];
    const backFile = req.files?.idcardBack?.[0];

    if (!frontFile || !backFile) {
      return res.status(400).json({
        error: 'Both front and back ID card images are required'
      });
    }

    const idcardFront = cloudUrl(frontFile);
    const idcardBack = cloudUrl(backFile);

    if (!idcardFront || !idcardBack) {
      return res.status(500).json({
        error: 'Failed to get Cloudinary URLs for ID images'
      });
    }

    const verification = new Verify({
      email,
      username,
      fullname,
      city,
      gender,
      dateofBirth: dob,
      marital: marital_status,
      age,
      address,
      image: idcardFront,
      backImage: idcardBack,
      owner: user._id
    });

    await verification.save();

    user.verified.push(verification._id);
    // Prefer “under review” if your UI uses verifiedStatus text
    if (user.verifiedStatus !== undefined) {
      user.verifiedStatus = 'Under review';
    }
    // Only set kycVerified true if that is your business rule after submit
    // user.kycVerified = true;
    await user.save();

    return res.status(200).json({
      success: true,
      message:
        'Your verification application was submitted successfully. Under review now.'
    });
  } catch (error) {
    console.error('Error in verify post:', error);
    return res.status(500).json({
      error: error.message || 'Server error occurred during verification'
    });
  }
});

// ==============================  account upgrade ================================

// Ensure upgradeUpload accepts the form field "image"
// const upgradeUpload = multer({ storage: upgradeStorage }).single('image');

router.get('/accountUpgrade', (req, res) => {
  return res.status(200).json({
    success: true,
    message: 'Use the frontend account upgrade page',
    redirect: `${frontendUrl()}/user/accountUpgrade.html`
  });
});

router.get('/accountUpgrade/data', async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const user = await User.findById(req.user._id).select('-password').lean();
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const wallet = await Wallet.findOne().lean();

    return res.json({
      success: true,
      user: {
        _id: user._id,
        email: user.email,
        balance: user.balance,
        account: user.account
      },
      wallet: wallet || null
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Failed to load account upgrade data' });
  }
});

router.post(
  '/accountUpgrade/:id',
  (req, res, next) => {
    upgradeUpload(req, res, function (err) {
      if (err) {
        console.error('UPGRADE MULTER ERROR:', err);
        return res.status(400).json({
          error: err.message || 'Upload failed'
        });
      }
      next();
    });
  },
  async (req, res) => {
    try {
      if (!req.user || String(req.user._id) !== String(req.params.id)) {
        return res.status(403).json({ error: 'Not authorized' });
      }

      if (!req.file) {
        return res.status(400).json({
          error: 'Upgrade payment proof image is required'
        });
      }

      const imageUrl = req.file.path || req.file.secure_url || req.file.url;
      if (!imageUrl) {
        return res.status(500).json({ error: 'Failed to get Cloudinary URL' });
      }

      const user = await User.findById(req.params.id);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

        const upgrade = new Upgrade({
         amount: req.body.amount,
         method: req.body.method,
         image: imageUrl,
         owner: user._id          // ← added
       });

      await upgrade.save();
      user.upgrades.push(upgrade._id);
      await user.save();

      return res.status(200).json({
        success: true,
        message: `Upgrade request ${upgrade._id} submitted and is under review`
      });
    } catch (error) {
      console.error('UPGRADE ERROR:', error);
      return res.status(500).json({ error: 'Unable to submit upgrade request' });
    }
  }
);
// ========================================withdrawal routes ==========================

// ======================================== withdrawal routes ==========================

router.get('/withdrawal', (req, res) => {
  return res.status(200).json({
    success: true,
    message: 'Use the frontend withdrawal page',
    redirect: `${frontendUrl()}/user/widthdrawFunds.html`
  });
});

// Optional data for widthdrawFunds.html (balance + user id)
router.get('/withdrawal/data', async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }
    const user = await User.findById(req.user._id).select('-password').lean();
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    return res.json({
      success: true,
      user: {
        _id: user._id,
        email: user.email,
        balance: user.balance
      }
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Failed to load withdrawal data' });
  }
});

router.post('/widthdraw/:id', async (req, res) => {
  try {
    if (!req.user || String(req.user._id) !== String(req.params.id)) {
      return res.status(403).json({ error: 'Not authorized for this user' });
    }

    const {
      amount,
      type,
      narration,
      status,
      bitcoin_address,
      ethereum_address,
      litecoin_address,
      bitcoincash_address,
      skrill_email,
      bank_name,
      account_number,
      country,
      swift_code
    } = req.body;

    const amountNum = parseFloat(amount);
    if (!type || isNaN(amountNum) || amountNum <= 0) {
      return res.status(400).json({ error: 'Valid type and amount are required' });
    }

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const balance = Number(user.balance || 0);
    if (amountNum > balance) {
      return res.status(400).json({ error: 'Insufficient balance' });
    }

    let destination = '';
    if (type === 'Bitcoin') destination = bitcoin_address || '';
    else if (type === 'Ethereum') destination = ethereum_address || '';
    else if (type === 'Litecoin') destination = litecoin_address || '';
    else if (type === 'BitcoinCash') destination = bitcoincash_address || '';
    else if (type === 'Skrill') destination = skrill_email || '';
    else if (type === 'Bank Transfer') {
      destination = [bank_name, account_number, country, swift_code]
        .filter(Boolean)
        .join(' | ');
    }

    if (!destination || !String(destination).trim()) {
      return res.status(400).json({ error: 'Please fill in the withdrawal destination details' });
    }

    const fullNarration = [
      (narration && String(narration).trim()) || 'Withdrawal',
      `To: ${destination}`
    ].join(' — ');

   const widthdraw = new Widthdraw({
  amount: String(amountNum),
  type,
  status: status || 'pending',
  narration: fullNarration,
  owner: user._id          // ← added
});

    await widthdraw.save();

    user.widthdraws.push(widthdraw._id);
    // Optional: deduct balance now, or wait for admin approval
    // user.balance = Number((balance - amountNum).toFixed(2));
    await user.save();

    return res.status(200).json({
      success: true,
      message: 'Withdrawal request submitted successfully',
      redirect: `${frontendUrl()}/user/widthdrawHistory.html?id=${user._id}`
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: error.message || 'Server error' });
  }
});

router.get('/widthdrawHistory/:id', (req, res) => {
  return res.status(200).json({
    success: true,
    message: 'Use the frontend withdraw history page',
    redirect: `${frontendUrl()}/user/widthdrawHistory.html?id=${req.params.id}`
  });
});

    router.get('/widthdrawHistory/:id/data', async (req, res) => {
  try {
    if (!req.user || String(req.user._id) !== String(req.params.id)) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    const user = await User.findById(req.params.id).select('-password').lean();
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Query by owner (most reliable)
    const widthdraws = await Widthdraw.find({ owner: req.params.id })
      .sort({ createdAt: -1 })
      .lean();

    return res.json({
      success: true,
      user: {
        _id: user._id,
        email: user.email
      },
      widthdraws: widthdraws || []
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Failed to load withdrawal history' });
  }
});
// ===================== INTEGRATED FEATURES (Affiliate + Copy Expert + Improved Deposit) =====================


// ===================== IMPROVED DEPOSIT ROUTE (Force Session Save) =====================

// ===================== DEPOSIT + PAYMENT (static frontend) =====================

router.get('/deposit', (req, res) => {
  return res.status(200).json({
    success: true,
    message: 'Use the frontend deposit page',
    redirect: `${frontendUrl()}/user/deposit.html`
  });
});

// Optional: user id for deposit form (dashboard/data also works)
router.get('/deposit/data', async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }
    const user = await User.findById(req.user._id).select('-password').lean();
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    return res.json({
      success: true,
      user: {
        _id: user._id,
        email: user.email,
        balance: user.balance,
        currency: '$'
      }
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Failed to load deposit data' });
  }
});

router.post('/deposit/:id', async (req, res) => {
  try {
    if (!req.user || String(req.user._id) !== String(req.params.id)) {
      return res.status(403).json({ error: 'Not authorized for this user' });
    }

    const { depositmethod, amount } = req.body;

    if (!depositmethod || !amount || parseFloat(amount) < 5) {
      return res.status(400).json({ error: 'Invalid deposit data' });
    }

    req.session.deposit = {
      type: depositmethod,
      amount: parseFloat(amount)
    };

    await new Promise((resolve, reject) => {
      req.session.save((err) => {
        if (err) {
          console.error('Session Save Error:', err);
          reject(err);
        } else {
          resolve();
        }
      });
    });

    console.log('✅ Session saved successfully:', req.session.deposit);

    return res.status(200).json({
      success: true,
      message: 'Deposit initiated successfully',
      redirect: `${frontendUrl()}/user/payment.html`
    });
  } catch (error) {
    console.error('Deposit Route Error:', error);
    return res.status(500).json({ error: 'Server error' });
  }
});

router.get('/payment', (req, res) => {
  return res.status(200).json({
    success: true,
    message: 'Use the frontend payment page',
    redirect: `${frontendUrl()}/user/payment.html`
  });
});

// Used by payment.html — amount, method, wallet QR/address
router.get('/payment/data', async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const sessionData = req.session.deposit || {};
    if (!sessionData.type || sessionData.amount == null) {
      return res.status(400).json({
        error: 'Deposit session expired. Please start deposit again.',
        redirect: `${frontendUrl()}/user/deposit.html`
      });
    }

    const wallet = await Wallet.findOne().lean();

    return res.json({
      success: true,
      user: {
        _id: req.user._id,
        email: req.user.email,
        currency: '$'
      },
      depositType: sessionData.type,
      depositAmount: sessionData.amount,
      wallet: wallet || null
    });
  } catch (err) {
    console.error('PAYMENT DATA ERROR:', err);
    return res.status(500).json({ error: 'Failed to load payment data' });
  }
});


router.post(
  '/payment/:id',
  (req, res, next) => {
    depositUpload.single('depositProof')(req, res, function (err) {
      if (err) {
        console.error('MULTER ERROR:', err);
        return res.status(400).json({ error: err.message });
      }
      next();
    });
  },
  async (req, res) => {
    try {
      const { id } = req.params;
      const { narration } = req.body;
      const sessionData = req.session.deposit || {};

      console.log('================================');
      console.log('PAYMENT REQUEST RECEIVED');
      console.log('User ID:', id);
      console.log('Session:', sessionData);
      console.log('Body:', req.body);
      console.log('File:', req.file);
      console.log('================================');

      if (!req.user || String(req.user._id) !== String(id)) {
        return res.status(403).json({ error: 'Not authorized for this user' });
      }

      if (!sessionData.type || sessionData.amount == null) {
        return res.status(400).json({
          error: 'Session expired. Please start deposit again.'
        });
      }

      if (!req.file) {
        return res.status(400).json({
          error: 'Payment proof image was not received.'
        });
      }

      const imageUrl = cloudUrl(req.file);
      if (!imageUrl) {
        return res.status(500).json({
          error: 'Failed to get Cloudinary URL for payment proof'
        });
      }

      const user = await User.findById(id);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      const deposit = new Deposit({
        type: sessionData.type,
        amount: String(sessionData.amount),
        status: 'pending',
        image: imageUrl,
        narration: (narration && String(narration).trim()) || 'Payment',
        owner: user._id
      });

      await deposit.save();

      user.deposits.push(deposit._id);
      await user.save();

      delete req.session.deposit;

      await new Promise((resolve, reject) => {
        req.session.save((err) => {
          if (err) reject(err);
          else resolve();
        });
      });

      console.log('===== DEPOSIT SAVED =====', deposit._id);

      return res.status(200).json({
        success: true,
        message: 'Payment submitted successfully. Awaiting admin approval.',
        depositId: deposit._id,
        redirect: `${frontendUrl()}/user/depositHistory.html?id=${user._id}`
      });
    } catch (error) {
      console.error('PAYMENT CRITICAL ERROR:', error);
      return res.status(500).json({
        error: error.message || 'Server error'
      });
    }
  }
);

router.get('/depositHistory/:id', (req, res) => {
  return res.status(200).json({
    success: true,
    message: 'Use the frontend deposit history page',
    redirect: `${frontendUrl()}/user/depositHistory.html?id=${req.params.id}`
  });
});

router.get('/depositHistory/:id/data', async (req, res) => {
  try {
    if (!req.user || String(req.user._id) !== String(req.params.id)) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    const user = await User.findById(req.params.id).select('-password').lean();
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Query by owner (most reliable)
    const deposits = await Deposit.find({ owner: req.params.id })
      .sort({ createdAt: -1 })
      .lean();

    return res.json({
      success: true,
      user: {
        _id: user._id,
        email: user.email
      },
      deposits: deposits || []
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Failed to load deposit history' });
  }
});

// ===================== Affiliate Routes =====================
router.get('/page/:id', (req, res) => {
  return res.status(200).json({
    success: true,
    message: 'Use the frontend affiliate page',
    redirect: `${frontendUrl()}/user/affiliate.html?id=${req.params.id}`
  });
});

// Data for affiliate.html
router.get('/page/:id/data', async (req, res) => {
  try {
    if (!req.user || String(req.user._id) !== String(req.params.id)) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    const user = await User.findById(req.params.id)
      .populate({
        path: 'affliates',
        options: { sort: { createdAt: -1 } }
      })
      .select('-password')
      .lean();

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    return res.json({
      success: true,
      user: {
        _id: user._id,
        email: user.email,
        balance: user.balance,
        fullname: user.fullname || user.username || ''
      },
      affiliates: user.affliates || []
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Failed to load affiliate data' });
  }
});

router.post('/page/:id', async (req, res) => {
  try {
    if (!req.user || String(req.user._id) !== String(req.params.id)) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    const { aff_plan_id, amount } = req.body;
    const userId = req.params.id;
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const plans = [
      {
        id: '3',
        type: 'affiliate tier bot',
        min: 100,
        max: 1000,
        roi: '10550%',
        duration: '3 days'
      },
      {
        id: '4',
        type: 'affiliate tier bot niche',
        min: 2000,
        max: 10000,
        roi: '50000%',
        duration: '10 days'
      },
      {
        id: '5',
        type: 'affiliate tier bot ecommerce',
        min: 5000,
        max: 100000,
        roi: '5500%',
        duration: '31 days'
      }
    ];

    const plan = plans.find((p) => p.id === String(aff_plan_id));

    if (!plan) {
      return res.status(400).json({ error: 'Invalid affiliate plan' });
    }

    const amountNum = parseFloat(amount);

    if (isNaN(amountNum) || amountNum < plan.min || amountNum > plan.max) {
      return res.status(400).json({
        error: `Amount must be between $${plan.min} and $${plan.max}`
      });
    }

    const currentBalance = Number(user.balance || 0);

    if (currentBalance < amountNum) {
      return res.status(400).json({ error: 'Insufficient balance' });
    }

    user.balance = Number((currentBalance - amountNum).toFixed(2));
    await user.save();

    const affiliate = new Affliate({
      amount: amountNum.toFixed(2),
      type: plan.type,
      roi: plan.roi,
      duration: plan.duration,
      owner: [userId]
    });

    await affiliate.save();

    user.affliates.push(affiliate._id);
    await user.save();

    return res.status(200).json({
      success: true,
      message: 'Affiliate plan purchased successfully.',
      balance: user.balance,
      affiliate
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Failed to purchase affiliate plan' });
  }
});

router.get('/page/:id/affiliates', async (req, res) => {
  try {
    if (!req.user || String(req.user._id) !== String(req.params.id)) {
      return res.status(403).json({ error: 'Not authorized' });
    }
    const user = await User.findById(req.params.id).populate('affliates').lean();
    return res.json(user ? user.affliates : []);
  } catch (error) {
    return res.status(500).json({ error: 'Failed to fetch affiliates' });
  }
});

// ===================== Copy Expert Routes =====================
router.get('/copy-expert', (req, res) => {
  return res.status(200).json({
    success: true,
    message: 'Use the frontend copy expert page',
    redirect: `${frontendUrl()}/user/copy-expert.html`
  });
});

router.post("/copy-expert", async (req, res) => {
    try {

        const {
            traderName,
            amount,
            duration,
            user_id
        } = req.body;

        const user = await User.findById(user_id);

        if (
            !user ||
            parseFloat(amount) > parseFloat(user.balance)
        ) {
            return res.status(400).json({
                error: 'Insufficient balance or invalid request'
            });
        }

        const originalTrade = await CopyTrade.findOne({
            traderName,
            owner: null
        });

        if (!originalTrade) {
            return res.status(404).json({
                error: 'Trader not found'
            });
        }

        const copyTrade = new CopyTrade({
            traderName,
            amount: parseFloat(amount),
            duration: parseInt(duration),
            startDate: new Date(),
            endDate: new Date(
                Date.now() +
                parseInt(duration) *
                24 *
                60 *
                60 *
                1000
            ),
            winRate: originalTrade.winRate,
            profitShare: originalTrade.profitShare,
            status: 'ongoing',
            owner: user_id
        });

        await copyTrade.save();

        user.copyTrades.push(copyTrade._id);

        user.balance = (
            parseFloat(user.balance) -
            parseFloat(amount)
        ).toFixed(2);

        await user.save();

        res.status(200).json({
            message: 'Copy trade started successfully'
        });

    } catch (error) {

        console.error(error);

        res.status(500).json({
            error: 'Server error'
        });

    }
});

// List template traders (owner: null) for copy-expert.html
router.get('/copy-expert/data', async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const user = await User.findById(req.user._id).select('-password').lean();
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const copyTrades = await CopyTrade.find({ owner: null })
      .sort({ createdAt: -1 })
      .lean();

    return res.json({
      success: true,
      user: {
        _id: user._id,
        email: user.email,
        balance: user.balance
      },
      copyTrades: copyTrades || []
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Failed to load copy experts' });
  }
});

router.get('/ongoing-copy-trades/:id', (req, res) => {
  return res.status(200).json({
    success: true,
    message: 'Use the frontend ongoing copy trades page',
    redirect: `${frontendUrl()}/user/ongoing-copy-trades.html?id=${req.params.id}`
  });
});

// Data for ongoing-copy-trades.html
router.get('/ongoing-copy-trades/:id/data', async (req, res) => {
  try {
    if (!req.user || String(req.user._id) !== String(req.params.id)) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    const user = await User.findById(req.params.id)
      .populate({
        path: 'copyTrades',
        options: { sort: { startDate: -1, createdAt: -1 } }
      })
      .select('-password')
      .lean();

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const copyTrades = (user.copyTrades || []).filter(Boolean);

    return res.json({
      success: true,
      user: {
        _id: user._id,
        email: user.email,
        fullname: user.fullname || user.username || ''
      },
      copyTrades
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Failed to load ongoing copy trades' });
  }
});

module.exports = router;