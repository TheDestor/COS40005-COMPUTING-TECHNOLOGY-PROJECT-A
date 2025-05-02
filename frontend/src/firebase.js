// src/firebase.js
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
    apiKey: "AIzaSyBL0GRlf__rQxNvj0L487qtP0Y6HuCjIkU",
    authDomain: "fyp-42059.firebaseapp.com",
    databaseURL: "https://fyp-42059-default-rtdb.firebaseio.com",
    projectId: "fyp-42059",
    storageBucket: "fyp-42059.appspot.com",
    messagingSenderId: "630536636805",
    appId: "1:630536636805:web:e5ef16ba4bd06d08469cec",
    measurementId: "G-QHBHZ8NNV2"
  };

// Initialize with explicit settings
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

export { app, auth };