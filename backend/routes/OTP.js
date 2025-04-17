// backend/OTP.js

const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const firebaseAdmin = require('firebase-admin');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(bodyParser.json());

// Initialize Firebase Admin SDK
firebaseAdmin.initializeApp({
  credential: firebaseAdmin.credential.applicationDefault(),
  databaseURL: 'https://fyp-42059.firebaseio.com',
});

// MongoDB connection
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
  .then(() => console.log('✅ Connected to MongoDB'))
  .catch((err) => console.error('❌ MongoDB connection error:', err));

// Define OTP Schema
const OtpSchema = new mongoose.Schema({
  identifier: String,
  otp: String,
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 300, // TTL: 5 minutes
  },
});
const Otp = mongoose.model('Otp', OtpSchema);

// Helper: Generate 6-digit OTP
const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();

// Send OTP Endpoint
app.post('/api/send-otp', async (req, res) => {
  const { identifier } = req.body;

  if (!identifier) {
    return res.status(400).json({ success: false, message: 'Identifier is required.' });
  }

  const otp = generateOTP();

  try {
    // Store OTP in MongoDB (for custom use only)
    await Otp.create({ identifier, otp });

    // Check if identifier is an email
    if (/\S+@\S+\.\S+/.test(identifier)) {
      // Firebase Email OTP handled on frontend, this just simulates success
      const userRecord = await firebaseAdmin.auth().getUserByEmail(identifier);
      if (userRecord) {
        return res.json({ success: true, message: 'OTP sent to email.' });
      } else {
        return res.status(404).json({ success: false, message: 'User not found for this email.' });
      }
    }
    // For phone numbers, let the frontend handle Firebase phone OTP
    else if (/^\+?\d{10,15}$/.test(identifier)) {
      return res.status(400).json({
        success: false,
        message: 'Phone OTP is handled on the client using Firebase SDK.',
      });
    } else {
      return res.status(400).json({ success: false, message: 'Invalid email or phone number format.' });
    }

  } catch (err) {
    console.error('❌ Error sending OTP:', err.message, err.stack);
    res.status(500).json({ success: false, message: 'Something went wrong while sending OTP.' });
  }
});

// Start server
const PORT = process.env.PORT || 5050;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
