const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  passwordHash: { type: String },
  verified: { type: Boolean, default: false },
  verificationToken: { type: String },
});

module.exports = mongoose.model('User', userSchema);
