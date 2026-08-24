// models/Affliate.js
const mongoose = require('mongoose');

const affiliateSchema = new mongoose.Schema({
  amount: { type: String, lowercase: true },
  type: { type: String, lowercase: true },
  roi: { type: String, lowercase: true },
  duration: { type: String, lowercase: true },
  owner: [{ type: mongoose.Schema.Types.ObjectId, ref: 'user', required: true }]
}, { timestamps: true });

const Affliate = mongoose.model('affliate', affiliateSchema);
module.exports = Affliate;