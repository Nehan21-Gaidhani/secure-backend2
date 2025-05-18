const express = require('express');
const mongoose = require('mongoose');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const app = express();

// Body parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rate limiters
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 12,
  message: 'Too many requests from this IP. Try again later.',
});
app.use('/api/auth/login', limiter);
app.use('/api/auth/register', limiter);

// MongoDB connection
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB connection error:', err));

// Routes
app.use('/api/auth', require('./routes/auth'));

app.get('/', (req, res) => {
  res.send('Secure Backend API is running 🚀');
});

// Server start
app.listen(process.env.PORT, () => {
  console.log(`Server running on port ${process.env.PORT}`);
});
