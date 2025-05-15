const express = require('express');
const mongoose = require('mongoose');
require('dotenv').config();

const app = express();
app.use(express.json());

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB connected"));
app.get('/', (req, res) => {
  res.send('Secure Backend API is running 🚀');
});
app.use('/api/auth', require('./routes/auth'));

app.listen(process.env.PORT, () => {
  console.log(`Server running on port ${process.env.PORT}`);
});
//home test
app.get('/home',(req, res) => {
  res.json({ message: 'Successfully accessed' });
})