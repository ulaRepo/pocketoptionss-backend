

const mongoose = require("mongoose");


const verifySchema = new mongoose.Schema({
   email: {
    type: String,
    default: "your email"
   },

   username: {
    type: String,
    default: "your username"
   },

   fullname: {
    type: String,
    default: "your fullname"
   },

   city: {
    type: String,
    default: "your city"
   },

   gender: {
    type: String,
    default: "your gender"
   },
   
   dateofBirth: {
    type: String,
    default: "your dateofBirth"
   },

   marital: {
    type: String,
    default: "your marital"
   },

   age: {
    type: String,
    default: "your age"
   },

   address: {
    type: String,
    default: "your address"
   },
   image:{
    type: String,
    // required: true
   },
   backImage:{
    type: String,
    // required: true
   },
   owner: {
  type: mongoose.Schema.Types.ObjectId,
  ref: 'user',
  required: true
}
},{timestamps: true})


const Verify = mongoose.model('verify', verifySchema);

module.exports = Verify;
