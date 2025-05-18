const express = require('express');
const mongoose = require('mongoose');
require('dotenv').config();

const app = express();
app.use(express.json());

 app.use(express.urlencoded({ extended: true }));

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB connected"));
app.get('/', (req, res) => {
  res.send('Secure Backend API is running successfuly🚀');
});

app.use('/api/auth', require('./routes/auth'));
// In app.js

app.listen(process.env.PORT, () => {
  console.log(`Server running on port ${process.env.PORT}`);
});
//home test
app.get('/home',(req, res) => {
  res.json({ message: 'Successfully accessed , test done' });
})

const rateLimit = require("express-rate-limit");

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  message: 'Too many requests from this IP. Try again later.'
});

app.use('/api/auth/login', limiter);
app.use('/api/auth/register', limiter);
