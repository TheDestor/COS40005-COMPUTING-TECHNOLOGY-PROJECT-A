// src/firebase.js
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyBnVOG3aa4qcZUID6giAr1U_3Qtg4WSEUs",
  authDomain: "fyp-firebase-7f53f.firebaseapp.com",
  projectId: "fyp-firebase-7f53f",
  storageBucket: "fyp-firebase-7f53f.firebasestorage.app",
  messagingSenderId: "731449111938",
  appId: "1:731449111938:web:acddafc9b8314df6e74b9b",
  measurementId: "G-H2PYF83NCY"
};

// Initialize with explicit settings
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

export {auth,app};