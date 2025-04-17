const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const nodemailer = require('nodemailer');
const twilio = require('twilio');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(bodyParser.json());

// Create random 6-digit OTP
const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();

// Configure nodemailer
const transporter = nodemailer.createTransport({
  service: process.env.EMAIL_SERVICE,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// Configure Twilio
const twilioClient = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

app.post('/api/send-otp', async (req, res) => {
  const { identifier } = req.body;

  if (!identifier) {
    return res.status(400).json({ success: false, message: 'Identifier is required.' });
  }

  const otp = generateOTP();

  try {
    if (/\S+@\S+\.\S+/.test(identifier)) {
      // Send via email
      const mailOptions = {
        from: process.env.EMAIL_USER,
        to: identifier,
        subject: 'Your OTP Code',
        text: `Your OTP code is ${otp}`,
      };

      await transporter.sendMail(mailOptions);
      return res.status(200).json({ success: true, message: 'OTP sent to email.' });

    } else if (/^\+?\d{10,15}$/.test(identifier)) {
      // Send via SMS
      await twilioClient.messages.create({
        body: `Your OTP code is ${otp}`,
        from: process.env.TWILIO_PHONE_NUMBER,
        to: identifier,
      });

      return res.status(200).json({ success: true, message: 'OTP sent via SMS.' });

    } else {
      return res.status(400).json({ success: false, message: 'Invalid identifier format.' });
    }

  } catch (error) {
    console.error('OTP send error:', error);
    return res.status(500).json({ success: false, message: 'Failed to send OTP.' });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
