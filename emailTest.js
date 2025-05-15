require('dotenv').config();
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

//email content
transporter.sendMail({
  to: process.env.EMAIL_USER,
  subject: "Test Email for verification",
  html: "<h1>Hello from Nodemailer!!</h1>"
}, (err, info) => {
  if (err) return console.log(err);
  console.log("Email sent:", info.response);
});
