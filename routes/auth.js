const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const User = require('../models/User');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// Email transporter setup (use App Passwords if 2FA enabled)
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// GET /home (test route)
router.get('/home', (req, res) => {
  res.json({ message: 'Successfully accessed home route' });
});

// ✅ Register
router.post('/register', async (req, res) => {
  const { email, password } = req.body;

  try {
    const existing = await User.findOne({ email });

    if (existing && !existing.verified) {
      const token = jwt.sign({ email }, process.env.JWT_SECRET, { expiresIn: '10m' });
      existing.verificationToken = token;
      await existing.save();

      const url = `${process.env.BASE_URL}/api/auth/verify-registration?token=${token}`;
      await transporter.sendMail({
        to: email,
        subject: 'Verify your email again',
        html: `<a href="${url}">Click to verify your email</a>`,
      });

      return res.status(200).json({ message: 'Verification email re-sent' });
    }

    if (existing) return res.status(400).json({ message: 'Already registered and verified' });

    const token = jwt.sign({ email }, process.env.JWT_SECRET, { expiresIn: '10m' });

    const newUser = new User({
      email,
      verificationToken: token,
    });
    await newUser.save();

    const url = `${process.env.BASE_URL}/api/auth/verify-registration?token=${token}`;
    await transporter.sendMail({
      to: email,
      subject: 'Verify your email',
      html: `<a href="${url}">Click to verify your email</a>`,
    });

    res.status(200).json({ message: 'Verification email sent' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error during registration' });
  }
});

// ✅ Verify Email

router.get('/verify-registration', async (req, res) => {
  const { token } = req.query;

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findOne({
      email: decoded.email,
      verificationToken: token,
    });

    if (!user) {
      return res.status(400).send('Invalid or expired verification link');
    }

    user.verified = true;
    user.verificationToken = null;
    await user.save();

    res.send('✅ Email verified! You can now log in.');
  } catch (err) {
    console.error(err);
    res.status(400).send('❌ Invalid or expired verification token');
  }
});


// ✅ Login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });

    if (!user || !user.verified)
      return res.status(400).json({ message: 'User not verified or not found' });

    // First-time password set
    if (!user.passwordHash) {
      const hash = await bcrypt.hash(password, 10);
      user.passwordHash = hash;
      await user.save();
      return res.json({ message: 'Password set successfully. Please login again.' });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) return res.status(401).json({ message: 'Incorrect password' });

    if (user.activeToken)
      return res.status(403).json({ message: 'User already logged in.' });

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });
    user.activeToken = token;
    await user.save();

    res.json({ token });
  } catch (err) {
    res.status(500).json({ message: 'Server error during login' });
  }
});

// ✅ Logout
router.post('/logout', authMiddleware, async (req, res) => {
  const user = await User.findById(req.user.id);
  if (user) {
    user.activeToken = null;
    await user.save();
  }
  res.json({ message: 'Logged out successfully' });
});

// ✅ Protected route
router.get('/protected', authMiddleware, (req, res) => {
  res.json({ message: 'Access granted to protected route' });
});

// ✅ Request password reset
router.post('/request-password-reset', async (req, res) => {
  const { email } = req.body;
  const user = await User.findOne({ email });

  if (!user || !user.verified)
    return res.status(400).json({ message: 'User not found or not verified' });

  const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '15m' });
  user.resetToken = token;
  await user.save();

  const resetLink = `${process.env.BASE_URL}/api/auth/reset-password?token=${token}`;

  await transporter.sendMail({
    to: email,
    subject: 'Reset your password',
    html: `<a href="${resetLink}">Click here to reset your password</a>`,
  });

  res.json({ message: 'Password reset email sent' });
});

// ✅ Show password reset form
router.get('/reset-password', (req, res) => {
  const { token } = req.query;

  res.send(`
    <form action="/api/auth/reset-password?token=${token}" method="POST">
      <input type="password" name="newPassword" placeholder="New Password" required />
      <button type="submit">Reset Password</button>
    </form>
  `);
});

// ✅ Handle password reset form
router.post('/reset-password', async (req, res) => {
  const { token } = req.query;
  const { newPassword } = req.body;

  try {
    const { id } = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(id);
    if (!user || user.resetToken !== token)
      return res.status(400).json({ message: 'Invalid token' });

    const hash = await bcrypt.hash(newPassword, 10);
    user.passwordHash = hash;
    user.resetToken = null;
    await user.save();

    res.send('Password reset successful! You can now login.');
  } catch (err) {
    res.status(400).send('Token expired or invalid');
  }
});

module.exports = router;
