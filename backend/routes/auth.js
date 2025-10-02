// // backend/routes/auth.js
// import express from 'express';
// import admin from '../config/firebaseAdmin.js';
// import User from '../models/User.js';
// import jwt from 'jsonwebtoken';
// import { body, validationResult } from 'express-validator';

// const router = express.Router();

// // OTP Verification Route
// router.post(
//   '/verify-firebase',
//   [
//     body('token')
//       .notEmpty()
//       .withMessage('Firebase token is required')
//       .isJWT()
//       .withMessage('Invalid token format')
//   ],
//   async (req, res) => {
//     try {
//       // Validate request body
//       const errors = validationResult(req);
//       if (!errors.isEmpty()) {
//         return res.status(400).json({
//           success: false,
//           errors: errors.array()
//         });
//       }

//       const { token } = req.body;
      
//       // Verify Firebase token
//       const decodedToken = await admin.auth().verifyIdToken(token);
      
//       // Get complete user data from Firebase
//       const firebaseUser = await admin.auth().getUser(decodedToken.uid);

//       // Find or create user in database
//       let user = await User.findOne({
//         $or: [
//           { firebaseUid: decodedToken.uid },
//           { phoneNumber: firebaseUser.phoneNumber }
//         ]
//       });

//       if (!user) {
//         user = new User({
//           firebaseUid: decodedToken.uid,
//           phoneNumber: firebaseUser.phoneNumber,
//           registrationStatus: 'pending',
//           role: 'user',
//           createdAt: new Date()
//         });
//         await user.save();
//       }

//       // Create JWT for session management
//       const appToken = jwt.sign(
//         {
//           userId: user._id,
//           role: user.role,
//           phone: user.phoneNumber
//         },
//         process.env.JWT_SECRET,
//         { expiresIn: '7d' }
//       );

//       res.json({
//         success: true,
//         token: appToken,
//         user: {
//           id: user._id,
//           phone: user.phoneNumber,
//           role: user.role,
//           registrationStatus: user.registrationStatus
//         }
//       });
      
//     } catch (error) {
//       console.error('Authentication Error:', error);

//       // Handle specific Firebase errors
//       let errorMessage = 'Authentication failed';
//       if (error.code === 'auth/id-token-expired') {
//         errorMessage = 'Token expired - please refresh';
//       } else if (error.code === 'auth/argument-error') {
//         errorMessage = 'Invalid authentication token';
//       }

//       res.status(401).json({
//         success: false,
//         message: errorMessage,
//         systemError: process.env.NODE_ENV === 'development' ? error.message : undefined
//       });
//     }
//   }
// );

// // Password Login Route (if needed)
// router.post(
//   '/login',
//   [
//     body('identifier')
//       .notEmpty().withMessage('Email/Phone is required'),
//     body('password')
//       .notEmpty().withMessage('Password is required')
//   ],
//   async (req, res) => {
//     try {
//       const errors = validationResult(req);
//       if (!errors.isEmpty()) {
//         return res.status(400).json({
//           success: false,
//           errors: errors.array()
//         });
//       }

//       const { identifier, password } = req.body;

//       // Find user by email or phone
//       const user = await User.findOne({
//         $or: [
//           { email: identifier },
//           { phoneNumber: identifier }
//         ]
//       }).select('+password');

//       if (!user || !(await user.comparePassword(password))) {
//         return res.status(401).json({
//           success: false,
//           message: 'Invalid credentials'
//         });
//       }

//       // Generate JWT
//       const token = jwt.sign(
//         { userId: user._id, role: user.role },
//         process.env.JWT_SECRET,
//         { expiresIn: '7d' }
//       );

//       res.json({
//         success: true,
//         token,
//         user: {
//           id: user._id,
//           phone: user.phoneNumber,
//           email: user.email,
//           role: user.role
//         }
//       });

//     } catch (error) {
//       console.error('Login Error:', error);
//       res.status(500).json({
//         success: false,
//         message: 'Server error during authentication'
//       });
//     }
//   }
// );

// export default router;
// Test