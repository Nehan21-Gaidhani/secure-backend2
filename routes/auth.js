const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const User = require('../models/User');

const router = express.Router();
router.get('/home',(req, res) => {
  res.json({ message: 'Successfully accessed' });
})
// Email transporter setup
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  }
});

// ✅ POST /register
router.post('/register', async (req, res) => {
  const { email, password } = req.body;

  try {
    const existing = await User.findOne({ email });

    if (existing && !existing.verified) {
      // Re-send verification email
      const token = jwt.sign({ email }, process.env.JWT_SECRET, { expiresIn: '10m' });
      existing.verificationToken = token;
      await existing.save();

      const url = `http://localhost:5000/api/auth/verify-registration?token=${token}`;
      await transporter.sendMail({
        to: email,
        subject: 'Verify your email again',
        html: `<a href="${url}">Click here to verify your email</a>`
      });

      return res.status(200).json({ message: 'Verification email re-sent' });
    }

    if (existing) {
      return res.status(400).json({ message: 'Already registered and verified' });
    }

    const token = jwt.sign({ email }, process.env.JWT_SECRET, { expiresIn: '10m' });

    const newUser = new User({
      email,
      verificationToken: token,
    });

    await newUser.save();

    const url = `http://localhost:5000/api/auth/verify-registration?token=${token}`;
    await transporter.sendMail({
      to: email,
      subject: 'Verify your email',
      html: `<a href="${url}">Click here to verify your email</a>`
    });

    res.status(200).json({ message: 'Verification email sent' });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error during registration' });
  }
});

// ✅ GET /verify-registration 
router.get('/verify-registration', async (req, res) => {
  const { token } = req.query;

  try {
    const { email } = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findOne({ email });

    if (!user) return res.status(404).json({ message: 'User not found' });

    user.verified = true;
    user.verificationToken = null;
    await user.save();

    res.send('Email verified! You can now login.');

  } catch (err) {
    console.error(err);
    res.status(400).send('Invalid or expired verification token');
  }
});

// ✅ POST /login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });

    if (!user || !user.verified) {
      return res.status(400).json({ message: 'Not verified or user not found' });
    }

    if (!user.passwordHash) {
      // Set password for first-time verified users
      const hash = await bcrypt.hash(password, 10);
      user.passwordHash = hash;
      await user.save();
      return res.json({ message: 'Password set successfully. Please login again.' });
    }

    const match = await bcrypt.compare(password, user.passwordHash);
    if (!match) {
      return res.status(401).json({ message: 'Incorrect password' });
    }

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });
    res.json({ token });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error during login' });
  }
});



module.exports = router;
