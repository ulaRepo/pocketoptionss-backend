const mongoose = require('mongoose');

const copyTradeSchema = new mongoose.Schema({
  traderName: {
    type: String,
    required: true,
  },
  traderImage: {
    type: String
  },
  profitShare: {
    type: Number,
    required: true,
    min: [0, 'Profit share cannot be negative'],
    max: [100, 'Profit share cannot exceed 100']
  },
  winRate: {
    type: Number,
    required: true,
    min: [0, 'Win rate cannot be negative'],
    max: [100, 'Win rate cannot exceed 100']
  },
  amount: {
    type: Number,
    min: [1, 'Amount must be at least 1']
  },
  duration: {
    type: Number,
    min: [1, 'Duration must be at least 1 day']
    // Removed required to make it optional
  },
  startDate: {
    type: Date,
    default: Date.now
  },
  endDate: {
    type: Date
    // Removed required to make it optional
  },
  status: {
    type: String,
    required: true,
    enum: ['ongoing', 'completed'],
    default: 'ongoing'
  },
  currentProfit: {
    type: Number,
    default: 0
  },
  owner: {
  type: mongoose.Schema.Types.ObjectId,
  ref: 'user',
  required: false
}
}, { timestamps: true });

// Calculate endDate before saving, only if duration is provided
copyTradeSchema.pre('save', function (next) {
  if (this.isNew || this.isModified('startDate') || this.isModified('duration')) {
    if (this.duration) { // Only calculate endDate if duration is provided
      if (!this.startDate) {
        return next(new Error('startDate is required when duration is provided'));
      }
      const durationMs = this.duration * 24 * 60 * 60 * 1000; // Convert days to milliseconds
      this.endDate = new Date(this.startDate.getTime() + durationMs);
    } else {
      this.endDate = undefined; // Clear endDate if duration is not provided
    }
  }
  next();
});

const CopyTrade = mongoose.model('copyTrade', copyTradeSchema);
module.exports = CopyTrade;