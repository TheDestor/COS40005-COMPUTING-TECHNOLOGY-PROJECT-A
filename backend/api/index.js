import express from "express";
import mongoose from "mongoose";
import cookieParser from "cookie-parser";
import cors from "cors";
import authRouter from "../routes/AuthRoutes.js";
import userRouter from "../routes/UserRoutes.js";
import locationRouter from "../routes/LocationRoutes.js";
import inquiryRouter from "../routes/InquiryRoutes.js";
import eventRouter from "../routes/EventRoutes.js";
import businessRouter from "../routes/BusinessRoutes.js";
import path from 'path';
import { fileURLToPath } from 'url';
import aiRouter from "../routes/AiRoutes.js";
import graphHopperRouter from "../routes/GraphHopperRoutes.js";
// import geoapifyRouter from "../routes/geoapifyRoutes.js";
import newsletterRouter from "../routes/newsletterRoutes.js";
import dashboardRouter from "../routes/DashboardRoutes.js";
import UserManagementRouter from "../routes/UserManagementRoutes.js";

// Get directory name (required for ES modules)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5050

const connectDB = async () => {
    mongoose.connection.on('connected', () => console.log("Database Connected"));
    await mongoose.connect(process.env.MONGO_URI);
};
connectDB(); // Establish connection to the database as soon as the backend is run

app.disable("x-powered-by");

// CORS configuration - more permissive for development
app.use(cors({
  origin: true, // Allow all origins in development
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Cookie', 'X-Requested-With', 'Origin', 'Accept'],
  optionsSuccessStatus: 200
}));

// Additional CORS headers for preflight requests
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, Cookie');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Max-Age', '86400'); // 24 hours
  
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
});

app.use(express.json());
app.use(cookieParser());

// Serve static files from uploads directory
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Backend server is running',
    timestamp: new Date().toISOString()
  });
});

app.use("/api/locations", locationRouter);
app.use("/api/auth", authRouter);
app.use("/api/user", userRouter);
app.use("/api/inquiry", inquiryRouter);
app.use("/api/event", eventRouter);
app.use("/api/businesses", businessRouter);
app.use("/api/ai", aiRouter);
app.use("/api/graphhopper", graphHopperRouter);
app.use("/api/userManagement", UserManagementRouter);
app.use("/api/user/newsletter", newsletterRouter);
app.use("/api/dashboard", dashboardRouter);


// Import and use geoapify routes
import geoapifyRouter from "../routes/geoapifyRoutes.js";
app.use("/api/geoapify", geoapifyRouter);

// In your backend routes
app.get('/api/nominatim/search', async (req, res) => {
  try {
    const { q, limit, countrycodes, bounded, viewbox } = req.query;
    
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(q)}&limit=${limit}&countrycodes=${countrycodes}&bounded=${bounded}&viewbox=${viewbox}`;
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'SarawakTourismApp/1.0'
      }
    });
    
    if (!response.ok) {
      return res.status(response.status).json({ error: 'Nominatim API error' });
    }
    
    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error('Nominatim proxy error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Start the express server on this port
app.listen(PORT, () => {
    console.log(`Server is listening on port ${PORT}`);
});

export default app;