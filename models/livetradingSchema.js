
const mongoose = require("mongoose");

const livetradeSchema = new mongoose.Schema({
    type: {
        type: String
    },
    currencypair:{
        type: String
    },
    lotsize:{
        type: String
    },
    entryPrice: {
        type: String
    },

    stopLoss: {
        type: String
    },

    takeProfit: {
        type: String
    },

    action: {
        type: String
    },

 owner: {
  type: mongoose.Schema.Types.ObjectId,
  ref: 'user',
  required: true
}

},{timestamps: true})

const Livetrading = mongoose.model("livetrade", livetradeSchema)
module.exports = Livetrading;
