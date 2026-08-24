const mongoose = require('mongoose');

const userWalletSchema = new mongoose.Schema({
    btc_address: {
        type: String,
        default: "gj762346yshshshkshkshksd"
    },
    btc_image: {
        type: String,
        default: null
    },

    eth_address: {
        type: String,
        default: "gj762346yshshshkshkshksd"
    },
    eth_image: {
        type: String,
        default: null
    },

    usdt_address: {
        type: String,
        default: "gj762346yshshshkshkshksd"
    },
    usdt_image: {
        type: String,
        default: null
    },

    usdc_address: {
        type: String,
        default: "gj762346yshshshkshkshksdusdc"
    },
    usdc_image: {
        type: String,
        default: null
    },

    cashapp: {
        type: String,
        default: "$Bitcoin"
    },
    cashapp_image: {
        type: String,
        default: null
    },

    paypal: {
        type: String,
        default: "example@gmail.com"
    },
    paypal_image: {
        type: String,
        default: null
    },

    owner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "user",
        required: false
    }

}, { timestamps: true });

const Wallet = mongoose.model("wallet", userWalletSchema);

module.exports = Wallet;