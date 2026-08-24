const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const createHttpError = require('http-errors');
const { roles } = require('../utils/constants');

const UserSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    lowercase: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  tel:{
    type: String,
},

 country:{
    type: String
},
gender:{
    type: String
},
account:{
    type: String,
    default: "basic"
},
session:{
    type: String,
    default:"0/0"
},

image:{
    type: String,
}, 
balance:{
    type: Number,
    default: 0.00
},
available:{
    type: String,
    default: "$0.00"
},
bonus:{
    type: String,
    default: "$0.00"
},
widthdrawBalance:{
    type: String,
    default: "$0.00"
},
profit:{
    type: String,
    default: "$0.00"
},
totalDeposit:{
    type: String,
    default: "0"
},

totalWidthdraw:{
    type: String,
    default: "0"
},
verifiedStatus:{
    type: String,
    default: 'Account not yet Verified!'
},
livetrades: {
    type: [mongoose.Schema.Types.ObjectId],
    ref: 'livetrade'
},
upgrades: {
    type: [mongoose.Schema.Types.ObjectId],
    ref: 'upgrade'
},
verified:{
    type: [mongoose.Schema.Types.ObjectId],
    ref: 'verify'
},

deposits:{
    type: [mongoose.Schema.Types.ObjectId],
    ref: 'deposit'
},
widthdraws:{
    type: [mongoose.Schema.Types.ObjectId],
    ref: 'widthdraw'
},
copyTrades: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'copyTrade',
  }],
  wallets: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'wallet',
  }],
  affliates: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'affliate',
  }],
  role: {
    type: String,
    enum: [roles.admin, roles.moderator, roles.client],
    default: roles.client,
  },
}, {timestamps: true});

UserSchema.pre('save', async function (next) {
  try {
    if (this.isNew) {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(this.password, salt);
      this.password = hashedPassword;
      if (this.email === process.env.ADMIN_EMAIL.toLowerCase()) {
        this.role = roles.admin;
      }
    }
    next();
  } catch (error) {
    next(error);
  }
});

UserSchema.methods.isValidPassword = async function (password) {
  try {
    return await bcrypt.compare(password, this.password);
  } catch (error) {
    throw createHttpError.InternalServerError(error.message);
  }
};

const User = mongoose.model('user', UserSchema);
module.exports = User;
