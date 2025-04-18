const express = require("express");
const router = express.Router();
const admin = require("../firebaseAdmin.js");
const User = require("../models/User.js"); // MongoDB user model

router.post("/firebase-login", async (req, res) => {
  const { token } = req.body;

  try {
    const decodedToken = await admin.auth().verifyIdToken(token);
    const phone = decodedToken.phone_number;
    const uid = decodedToken.uid;

    // Find or create user in MongoDB
    let user = await User.findOne({ firebaseUid: uid });
    if (!user) {
      user = new User({ phone, firebaseUid: uid });
      await user.save();
    }

    res.status(200).json({ success: true, user });
  } catch (err) {
    res.status(401).json({ success: false, message: "Invalid token", error: err.message });
  }
});

module.exports = router;
