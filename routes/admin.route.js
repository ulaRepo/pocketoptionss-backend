const mongoose = require('mongoose');
const router = require('express').Router();

const User = require('../models/user.model');
const Deposit = require('../models/depositSchema');
const Widthdraw = require('../models/widthdrawSchema');
const Trade = require('../models/livetradingSchema');
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

function cloudUrl(file) {
  if (!file) return null;
  return file.path || file.secure_url || file.url || null;
}

const copyTraderStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'pocket/copytraders',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
    public_id: (req, file) => `copytrader_${Date.now()}`
  }
});
const uploadCopyTrader = multer({ storage: copyTraderStorage });

const walletStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'pocket/wallets',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
    public_id: (req, file) => `wallet_${file.fieldname}_${Date.now()}`
  }
});
const uploadWallet = multer({ storage: walletStorage });

const frontendUrl = () =>
  (process.env.FRONTEND_URL || '').replace(/\/$/, '');

// ===================== ADMIN DASHBOARD =====================

router.get('/adminRoute', (req, res) => {
  return res.status(200).json({
    success: true,
    message: 'Use the frontend admin dashboard page',
    redirect: `${frontendUrl()}/admin/adminDashboard.html`
  });
});

router.get('/adminRoute/data', async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const users = await User.find()
      .select('-password')
      .sort({ createdAt: -1 })
      .lean();

    return res.json({
      success: true,
      users: users || []
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Failed to load users' });
  }
});

router.get('/viewUser/:id', (req, res) => {
  return res.status(200).json({
    success: true,
    message: 'Use the frontend view user page',
    redirect: `${frontendUrl()}/admin/viewUser.html?id=${req.params.id}`
  });
});

router.get('/viewUser/:id/data', async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid id' });
    }
    const user = await User.findById(id).select('-password').lean();
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    return res.json({ success: true, user });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Failed to load user' });
  }
});

router.get('/editUser/:id', (req, res) => {
  return res.status(200).json({
    success: true,
    message: 'Use the frontend edit user page',
    redirect: `${frontendUrl()}/admin/editUser.html?id=${req.params.id}`
  });
});

router.get('/editUser/:id/data', async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid id' });
    }
    const user = await User.findById(id).select('-password').lean();
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    return res.json({ success: true, user });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Failed to load user' });
  }
});

router.post('/editUser/:id', async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid id' });
    }

    const user = await User.findByIdAndUpdate(
      id,
      {
        role: req.body.role,
        balance: req.body.balance,
        widthdrawBalance: req.body.widthdrawBalance,
        bonus: req.body.bonus,
        email: req.body.email,
        available: req.body.available,
        session: req.body.session,
        profit: req.body.profit,
        totalDeposit: req.body.totalDeposit,
        verifiedStatus: req.body.verifiedStatus,
        totalWidthdraw: req.body.totalWidthdraw,
        account: req.body.account
      },
      { new: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    return res.json({
      success: true,
      message: `Updated details for ${user.email}`,
      user
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Failed to update user' });
  }
});

router.post('/deleteUser/:id', async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ error: 'Invalid id' });
    }
    await User.deleteOne({ _id: req.params.id });
    return res.json({ success: true, message: 'User deleted' });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Failed to delete user' });
  }
});

// ===================== DEPOSITS =====================

router.get('/allFunding', (req, res) => {
  return res.status(200).json({
    success: true,
    message: 'Use the frontend all funding page',
    redirect: `${frontendUrl()}/admin/allFunding.html`
  });
});

router.get('/allFunding/data', async (req, res) => {
  try {
    const deposits = await Deposit.find().sort({ createdAt: -1 }).lean();
    return res.json({ success: true, deposits: deposits || [] });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Failed to load deposits' });
  }
});

router.get('/viewDeposit/:id', (req, res) => {
  return res.status(200).json({
    success: true,
    message: 'Use the frontend view deposit page',
    redirect: `${frontendUrl()}/admin/viewDeposit.html?id=${req.params.id}`
  });
});

router.get('/viewDeposit/:id/data', async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid id' });
    }
    const deposit = await Deposit.findById(id).lean();
    if (!deposit) {
      return res.status(404).json({ error: 'Deposit not found' });
    }
    return res.json({ success: true, deposit });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Failed to load deposit' });
  }
});

router.get('/editDeposit/:id', (req, res) => {
  return res.status(200).json({
    success: true,
    message: 'Use the frontend edit deposit page',
    redirect: `${frontendUrl()}/admin/editDeposit.html?id=${req.params.id}`
  });
});

router.get('/editDeposit/:id/data', async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid id' });
    }
    const deposit = await Deposit.findById(id).lean();
    if (!deposit) {
      return res.status(404).json({ error: 'Deposit not found' });
    }
    return res.json({ success: true, deposit });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Failed to load deposit' });
  }
});

router.post('/editDeposit/:id', async (req, res) => {
  try {
    const deposit = await Deposit.findByIdAndUpdate(
      req.params.id,
      {
        type: req.body.type,
        amount: req.body.amount,
        status: req.body.status,
        narration: req.body.narration
      },
      { new: true }
    );

    if (!deposit) {
      return res.status(404).json({ error: 'Deposit not found' });
    }

    return res.json({
      success: true,
      message: `Updated deposit ${deposit._id} successfully`,
      deposit
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Failed to update deposit' });
  }
});

router.post('/deleteDeposit/:id', async (req, res) => {
  try {
    await Deposit.deleteOne({ _id: req.params.id });
    return res.json({ success: true, message: 'Deposit deleted' });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Failed to delete deposit' });
  }
});

// ===================== WITHDRAWALS =====================

router.get('/allWidthdrawals', (req, res) => {
  return res.status(200).json({
    success: true,
    message: 'Use the frontend all withdrawals page',
    redirect: `${frontendUrl()}/admin/allWidthdrawals.html`
  });
});

router.get('/allWidthdrawals/data', async (req, res) => {
  try {
    const widthdraws = await Widthdraw.find().sort({ createdAt: -1 }).lean();
    return res.json({ success: true, widthdraws: widthdraws || [] });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Failed to load withdrawals' });
  }
});

router.get('/viewWidthdrawals/:id', (req, res) => {
  return res.status(200).json({
    success: true,
    message: 'Use the frontend view withdrawal page',
    redirect: `${frontendUrl()}/admin/viewWidthdrawals.html?id=${req.params.id}`
  });
});

router.get('/viewWidthdrawals/:id/data', async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid id' });
    }
    const widthdraw = await Widthdraw.findById(id).lean();
    if (!widthdraw) {
      return res.status(404).json({ error: 'Withdrawal not found' });
    }
    return res.json({ success: true, widthdraw });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Failed to load withdrawal' });
  }
});

router.get('/editWidthdrawals/:id', (req, res) => {
  return res.status(200).json({
    success: true,
    message: 'Use the frontend edit withdrawal page',
    redirect: `${frontendUrl()}/admin/editWidthdrawals.html?id=${req.params.id}`
  });
});

router.get('/editWidthdrawals/:id/data', async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid id' });
    }
    const widthdraw = await Widthdraw.findById(id).lean();
    if (!widthdraw) {
      return res.status(404).json({ error: 'Withdrawal not found' });
    }
    return res.json({ success: true, widthdraw });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Failed to load withdrawal' });
  }
});

router.post('/editWidthdrawals/:id', async (req, res) => {
  try {
    const widthdraw = await Widthdraw.findByIdAndUpdate(
      req.params.id,
      {
        amount: req.body.amount,
        type: req.body.type,
        status: req.body.status,
        narration: req.body.narration
      },
      { new: true }
    );

    if (!widthdraw) {
      return res.status(404).json({ error: 'Withdrawal not found' });
    }

    return res.json({
      success: true,
      message: `Updated withdrawal ${widthdraw._id} successfully`,
      widthdraw
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Failed to update withdrawal' });
  }
});

router.post('/deleteWidthdrawal/:id', async (req, res) => {
  try {
    await Widthdraw.deleteOne({ _id: req.params.id });
    return res.json({ success: true, message: 'Withdrawal deleted' });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Failed to delete withdrawal' });
  }
});

// ===================== VERIFICATIONS =====================

router.get('/allVerify', (req, res) => {
  return res.status(200).json({
    success: true,
    message: 'Use the frontend all verifications page',
    redirect: `${frontendUrl()}/admin/allVerify.html`
  });
});

router.get('/allVerify/data', async (req, res) => {
  try {
    const verifys = await Verify.find().sort({ createdAt: -1 }).lean();
    return res.json({ success: true, verifys: verifys || [] });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Failed to load verifications' });
  }
});

router.get('/viewVerify/:id', (req, res) => {
  return res.status(200).json({
    success: true,
    message: 'Use the frontend view verification page',
    redirect: `${frontendUrl()}/admin/viewVerification.html?id=${req.params.id}`
  });
});

router.get('/viewVerify/:id/data', async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid id' });
    }
    const verify = await Verify.findById(id).lean();
    if (!verify) {
      return res.status(404).json({ error: 'Verification not found' });
    }
    return res.json({ success: true, verify });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Failed to load verification' });
  }
});

router.get('/editVerification/:id', (req, res) => {
  return res.status(200).json({
    success: true,
    message: 'Use the frontend edit verification page',
    redirect: `${frontendUrl()}/admin/editVerification.html?id=${req.params.id}`
  });
});

router.get('/editVerification/:id/data', async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid id' });
    }
    const verify = await Verify.findById(id).lean();
    if (!verify) {
      return res.status(404).json({ error: 'Verification not found' });
    }
    return res.json({ success: true, verify });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Failed to load verification' });
  }
});

router.post('/editVerification/:id', async (req, res) => {
  try {
    const verify = await Verify.findByIdAndUpdate(
      req.params.id,
      {
        email: req.body.email,
        username: req.body.username,
        fullname: req.body.fullname,
        city: req.body.city,
        gender: req.body.gender,
        dateofBirth: req.body.dateofBirth,
        marital: req.body.marital,
        age: req.body.age,
        address: req.body.address
      },
      { new: true }
    );

    if (!verify) {
      return res.status(404).json({ error: 'Verification not found' });
    }

    return res.json({
      success: true,
      message: `Updated verification ${verify._id} successfully`,
      verify
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Failed to update verification' });
  }
});

router.post('/deleteVerification/:id', async (req, res) => {
  try {
    await Verify.deleteOne({ _id: req.params.id });
    return res.json({ success: true, message: 'Verification deleted' });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Failed to delete verification' });
  }
});

// ===================== LIVE TRADES =====================

router.get('/all-livetrade', (req, res) => {
  return res.status(200).json({
    success: true,
    message: 'Use the frontend all live trades page',
    redirect: `${frontendUrl()}/admin/allliveTrades.html`
  });
});

router.get('/all-livetrade/data', async (req, res) => {
  try {
    const livetrade = await Trade.find().sort({ createdAt: -1 }).lean();
    return res.json({ success: true, livetrade: livetrade || [] });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Failed to load live trades' });
  }
});

router.get('/view-livetrade/:id', (req, res) => {
  return res.status(200).json({
    success: true,
    message: 'Use the frontend view live trade page',
    redirect: `${frontendUrl()}/admin/viewallliveTrades.html?id=${req.params.id}`
  });
});

router.get('/view-livetrade/:id/data', async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid id' });
    }
    const livetrade = await Trade.findById(id).lean();
    if (!livetrade) {
      return res.status(404).json({ error: 'Live trade not found' });
    }
    return res.json({ success: true, livetrade });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Failed to load live trade' });
  }
});

router.get('/edit-livetrade/:id', (req, res) => {
  return res.status(200).json({
    success: true,
    message: 'Use the frontend edit live trade page',
    redirect: `${frontendUrl()}/admin/editallliveTrades.html?id=${req.params.id}`
  });
});

router.get('/edit-livetrade/:id/data', async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid id' });
    }
    const livetrade = await Trade.findById(id).lean();
    if (!livetrade) {
      return res.status(404).json({ error: 'Live trade not found' });
    }
    return res.json({ success: true, livetrade });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Failed to load live trade' });
  }
});

router.post('/edit-livetrade/:id', async (req, res) => {
  try {
    const trade = await Trade.findByIdAndUpdate(
      req.params.id,
      {
        type: req.body.type,
        currencypair: req.body.currencypair,
        lotsize: req.body.lotsize,
        entryPrice: req.body.entryPrice,
        stopLoss: req.body.stopLoss,
        takeProfit: req.body.takeProfit,
        action: req.body.action
      },
      { new: true }
    );

    if (!trade) {
      return res.status(404).json({ error: 'Live trade not found' });
    }

    return res.json({
      success: true,
      message: 'Updated livetrade successfully',
      trade
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Failed to update live trade' });
  }
});

router.post('/deletelivetrade/:id', async (req, res) => {
  try {
    await Trade.deleteOne({ _id: req.params.id });
    return res.json({ success: true, message: 'Live trade deleted' });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Failed to delete live trade' });
  }
});

// ===================== ACCOUNT UPGRADES =====================

router.get('/all-accountUpgrade', (req, res) => {
  return res.status(200).json({
    success: true,
    message: 'Use the frontend all account upgrades page',
    redirect: `${frontendUrl()}/admin/allAccountsUpgrade.html`
  });
});

router.get('/all-accountUpgrade/data', async (req, res) => {
  try {
    const upgrade = await Upgrade.find().sort({ createdAt: -1 }).lean();
    return res.json({ success: true, upgrade: upgrade || [] });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Failed to load upgrades' });
  }
});

router.get('/viewUpgrade/:id', (req, res) => {
  return res.status(200).json({
    success: true,
    message: 'Use the frontend view upgrade page',
    redirect: `${frontendUrl()}/admin/viewallAccountsUpgrade.html?id=${req.params.id}`
  });
});

router.get('/viewUpgrade/:id/data', async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid id' });
    }
    const upgrade = await Upgrade.findById(id).lean();
    if (!upgrade) {
      return res.status(404).json({ error: 'Upgrade not found' });
    }
    return res.json({ success: true, upgrade });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Failed to load upgrade' });
  }
});

router.get('/editUpgrade/:id', (req, res) => {
  return res.status(200).json({
    success: true,
    message: 'Use the frontend edit upgrade page',
    redirect: `${frontendUrl()}/admin/editallAccountsUpgrade.html?id=${req.params.id}`
  });
});

router.get('/editUpgrade/:id/data', async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid id' });
    }
    const upgrade = await Upgrade.findById(id).lean();
    if (!upgrade) {
      return res.status(404).json({ error: 'Upgrade not found' });
    }
    return res.json({ success: true, upgrade });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Failed to load upgrade' });
  }
});

router.post('/editUpgrade/:id', async (req, res) => {
  try {
    const upgrade = await Upgrade.findByIdAndUpdate(
      req.params.id,
      {
        amount: req.body.amount,
        method: req.body.method,
        status: req.body.status
      },
      { new: true }
    );

    if (!upgrade) {
      return res.status(404).json({ error: 'Upgrade not found' });
    }

    return res.json({
      success: true,
      message: `Updated account-upgrade ${upgrade._id} successfully`,
      upgrade
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Failed to update upgrade' });
  }
});

router.post('/deleteUpgrade/:id', async (req, res) => {
  try {
    await Upgrade.deleteOne({ _id: req.params.id });
    return res.json({ success: true, message: 'Upgrade deleted' });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Failed to delete upgrade' });
  }
});

// ===================== AFFILIATES =====================

router.get('/all-affiliates', (req, res) => {
  return res.status(200).json({
    success: true,
    message: 'Use the frontend all affiliates page',
    redirect: `${frontendUrl()}/admin/allAffiliates.html`
  });
});

router.get('/all-affiliates/data', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const perPage = 10;
    const sort = req.query.sort || 'createdAt';
    const order = req.query.order === 'asc' ? 1 : -1;
    const sortOptions = {};
    sortOptions[sort] = order;

    const totalAffiliates = await Affliate.countDocuments();
    const affiliates = await Affliate.find()
      .populate('owner')
      .sort(sortOptions)
      .skip((page - 1) * perPage)
      .limit(perPage)
      .lean();

    const totalPages = Math.ceil(totalAffiliates / perPage) || 1;

    return res.json({
      success: true,
      affiliates: affiliates || [],
      page,
      totalPages,
      sort,
      order: req.query.order || 'desc'
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Failed to load affiliates' });
  }
});

router.post('/deleteAffiliate/:id', async (req, res) => {
  try {
    const affiliate = await Affliate.findById(req.params.id);

    if (!affiliate) {
      return res.status(404).json({ error: 'Affiliate not found' });
    }

    await User.updateMany(
      { affliates: affiliate._id },
      { $pull: { affliates: affiliate._id } }
    );

    await Affliate.findByIdAndDelete(req.params.id);

    return res.json({ success: true, message: 'Affiliate deleted successfully' });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Failed to delete affiliate' });
  }
});

// ===================== COPY TRADES (TEMPLATES) =====================

router.get('/all-copytrades', (req, res) => {
  return res.status(200).json({
    success: true,
    message: 'Use the frontend all copy trades page',
    redirect: `${frontendUrl()}/admin/allCopyTrades.html`
  });
});

router.get('/all-copytrades/data', async (req, res) => {
  try {
    const copyTrades = await CopyTrade.find({ owner: null })
      .sort({ createdAt: -1 })
      .lean();
    return res.json({ success: true, copyTrades: copyTrades || [] });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Failed to load copy trades' });
  }
});

router.get('/add-copytrader', (req, res) => {
  return res.status(200).json({
    success: true,
    message: 'Use the frontend add copy trader page',
    redirect: `${frontendUrl()}/admin/addCopytrader.html`
  });
});

router.post('/add-copytrader', uploadCopyTrader.single('traderImage'), async (req, res) => {
  try {
    const traderImage = cloudUrl(req.file) || '';
    const { traderName, profitShare, winRate } = req.body;

    const copyTrade = new CopyTrade({
      traderName,
      traderImage: traderImage || '',
      profitShare: parseFloat(profitShare),
      winRate: parseFloat(winRate)
    });

    await copyTrade.save();

    return res.status(200).json({
      success: true,
      message: 'Copy Trader created successfully!',
      copyTrade
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Failed to create Copy Trader.' });
  }
});

router.get('/edit-copytrade/:id', (req, res) => {
  return res.status(200).json({
    success: true,
    message: 'Use the frontend edit copy trader page',
    redirect: `${frontendUrl()}/admin/editCopytrader.html?id=${req.params.id}`
  });
});

router.get('/edit-copytrade/:id/data', async (req, res) => {
  try {
    const copyTrade = await CopyTrade.findById(req.params.id).lean();
    if (!copyTrade) {
      return res.status(404).json({ error: 'Copy trader not found' });
    }
    return res.json({ success: true, copyTrade });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Failed to load copy trader' });
  }
});

router.post('/edit-copytrader/:id', uploadCopyTrader.single('traderImage'), async (req, res) => {
  try {
    const copyTrade = await CopyTrade.findById(req.params.id);

    if (!copyTrade) {
      return res.status(404).json({ error: 'Copy trader not found' });
    }

    if (req.file) {
      const imageUrl = cloudUrl(req.file);
      if (imageUrl) {
        copyTrade.traderImage = imageUrl;
      }
    }

    copyTrade.traderName = req.body.traderName;
    copyTrade.profitShare = parseFloat(req.body.profitShare);
    copyTrade.winRate = parseFloat(req.body.winRate);

    await copyTrade.save();

    return res.json({
      success: true,
      message: 'Copy trader updated successfully',
      copyTrade
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Failed to update copy trader' });
  }
});

router.post('/delete-copytrade/:id', async (req, res) => {
  try {
    await CopyTrade.findByIdAndDelete(req.params.id);
    return res.json({ success: true, message: 'Copy trade deleted' });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Failed to delete copy trade' });
  }
});

// ===================== USER COPY TRADES =====================

router.get('/user-copytrades', (req, res) => {
  return res.status(200).json({
    success: true,
    message: 'Use the frontend user copy trades page',
    redirect: `${frontendUrl()}/admin/allUserCopyTrades.html`
  });
});

router.get('/user-copytrades/data', async (req, res) => {
  try {
    const users = await User.find({
      copyTrades: { $exists: true, $ne: [] }
    })
      .populate('copyTrades')
      .select('-password')
      .lean();

    return res.json({
      success: true,
      userCopyTrades: users || []
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Unable to fetch user copy trades' });
  }
});

router.get('/edit-user-copytrade/:id', (req, res) => {
  return res.status(200).json({
    success: true,
    message: 'Use the frontend edit user copy trade page',
    redirect: `${frontendUrl()}/admin/editUserCopyTrade.html?id=${req.params.id}`
  });
});

router.get('/edit-user-copytrade/:id/data', async (req, res) => {
  try {
    const copyTrade = await CopyTrade.findById(req.params.id)
      .populate('owner')
      .lean();
    if (!copyTrade) {
      return res.status(404).json({ error: 'Copy trade not found' });
    }
    return res.json({ success: true, copyTrade });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Failed to load user copy trade' });
  }
});

router.post('/edit-user-copytrade/:id', async (req, res) => {
  try {
    const copyTrade = await CopyTrade.findById(req.params.id);

    if (!copyTrade) {
      return res.status(404).json({ error: 'Copy trade not found' });
    }

    copyTrade.amount = req.body.amount;
    copyTrade.duration = req.body.duration;
    copyTrade.status = req.body.status;

    await copyTrade.save();

    return res.json({
      success: true,
      message: 'Copy trade updated successfully',
      copyTrade
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Failed to update copy trade' });
  }
});

router.post('/delete-user-copytrade/:id', async (req, res) => {
  try {
    await CopyTrade.findByIdAndDelete(req.params.id);
    return res.json({ success: true, message: 'User copy trade deleted' });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Failed to delete user copy trade' });
  }
});

// ===================== WALLETS =====================

router.get('/all-wallets', (req, res) => {
  return res.status(200).json({
    success: true,
    message: 'Use the frontend all wallets page',
    redirect: `${frontendUrl()}/admin/wallets.html`
  });
});

router.get('/all-wallets/data', async (req, res) => {
  try {
    const wallets = await Wallet.find().sort({ createdAt: -1 }).lean();
    return res.json({ success: true, wallets: wallets || [] });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Failed to load wallets' });
  }
});

router.get('/add-wallet', (req, res) => {
  return res.status(200).json({
    success: true,
    message: 'Use the frontend add wallet page',
    redirect: `${frontendUrl()}/admin/add-wallet.html`
  });
});

router.post(
  '/add-wallet',
  uploadWallet.fields([
    { name: 'btc_image', maxCount: 1 },
    { name: 'eth_image', maxCount: 1 },
    { name: 'usdt_image', maxCount: 1 },
    { name: 'usdc_image', maxCount: 1 },
    { name: 'cashapp_image', maxCount: 1 },
    { name: 'paypal_image', maxCount: 1 }
  ]),
  async (req, res) => {
    try {
      const {
        btc_address,
        eth_address,
        usdt_address,
        usdc_address,
        cashapp,
        paypal
      } = req.body;

      const walletData = {
        btc_address,
        eth_address,
        usdt_address,
        usdc_address,
        cashapp,
        paypal
      };

      if (req.files) {
        if (req.files.btc_image && req.files.btc_image[0]) {
          walletData.btc_image = cloudUrl(req.files.btc_image[0]);
        }
        if (req.files.eth_image && req.files.eth_image[0]) {
          walletData.eth_image = cloudUrl(req.files.eth_image[0]);
        }
        if (req.files.usdt_image && req.files.usdt_image[0]) {
          walletData.usdt_image = cloudUrl(req.files.usdt_image[0]);
        }
        if (req.files.usdc_image && req.files.usdc_image[0]) {
          walletData.usdc_image = cloudUrl(req.files.usdc_image[0]);
        }
        if (req.files.cashapp_image && req.files.cashapp_image[0]) {
          walletData.cashapp_image = cloudUrl(req.files.cashapp_image[0]);
        }
        if (req.files.paypal_image && req.files.paypal_image[0]) {
          walletData.paypal_image = cloudUrl(req.files.paypal_image[0]);
        }
      }

      const wallet = new Wallet(walletData);
      await wallet.save();

      return res.json({
        success: true,
        message: 'Wallet added successfully',
        wallet
      });
    } catch (error) {
      console.error('ADD WALLET ERROR:', error);
      return res.status(500).json({ error: 'Failed to add wallet' });
    }
  }
);

router.get('/edit-wallet/:id', (req, res) => {
  return res.status(200).json({
    success: true,
    message: 'Use the frontend edit wallet page',
    redirect: `${frontendUrl()}/admin/edit-wallet.html?id=${req.params.id}`
  });
});

router.get('/edit-wallet/:id/data', async (req, res) => {
  try {
    const wallet = await Wallet.findById(req.params.id).lean();
    if (!wallet) {
      return res.status(404).json({ error: 'Wallet not found' });
    }
    return res.json({ success: true, wallet });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Failed to load wallet' });
  }
});

router.post(
  '/edit-wallet/:id',
  uploadWallet.fields([
    { name: 'btc_image', maxCount: 1 },
    { name: 'eth_image', maxCount: 1 },
    { name: 'usdt_image', maxCount: 1 },
    { name: 'usdc_image', maxCount: 1 },
    { name: 'cashapp_image', maxCount: 1 },
    { name: 'paypal_image', maxCount: 1 }
  ]),
  async (req, res) => {
    try {
      const wallet = await Wallet.findById(req.params.id);

      if (!wallet) {
        return res.status(404).json({ error: 'Wallet not found' });
      }

      const {
        btc_address,
        eth_address,
        usdt_address,
        usdc_address,
        cashapp,
        paypal
      } = req.body;

      wallet.btc_address = btc_address || wallet.btc_address;
      wallet.eth_address = eth_address || wallet.eth_address;
      wallet.usdt_address = usdt_address || wallet.usdt_address;
      wallet.usdc_address = usdc_address || wallet.usdc_address;
      wallet.cashapp = cashapp || wallet.cashapp;
      wallet.paypal = paypal || wallet.paypal;

      if (req.files) {
        if (req.files.btc_image && req.files.btc_image[0]) {
          const url = cloudUrl(req.files.btc_image[0]);
          if (url) wallet.btc_image = url;
        }
        if (req.files.eth_image && req.files.eth_image[0]) {
          const url = cloudUrl(req.files.eth_image[0]);
          if (url) wallet.eth_image = url;
        }
        if (req.files.usdt_image && req.files.usdt_image[0]) {
          const url = cloudUrl(req.files.usdt_image[0]);
          if (url) wallet.usdt_image = url;
        }
        if (req.files.usdc_image && req.files.usdc_image[0]) {
          const url = cloudUrl(req.files.usdc_image[0]);
          if (url) wallet.usdc_image = url;
        }
        if (req.files.cashapp_image && req.files.cashapp_image[0]) {
          const url = cloudUrl(req.files.cashapp_image[0]);
          if (url) wallet.cashapp_image = url;
        }
        if (req.files.paypal_image && req.files.paypal_image[0]) {
          const url = cloudUrl(req.files.paypal_image[0]);
          if (url) wallet.paypal_image = url;
        }
      }

      await wallet.save();

      return res.json({
        success: true,
        message: 'Wallet updated successfully',
        wallet
      });
    } catch (error) {
      console.error('Error updating wallet:', error);
      return res.status(500).json({ error: 'Error updating wallet' });
    }
  }
);

router.post('/delete-wallet/:id', async (req, res) => {
  try {
    await Wallet.findByIdAndDelete(req.params.id);
    return res.json({ success: true, message: 'Wallet deleted' });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Failed to delete wallet' });
  }
});

module.exports = router;