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
import path from "path";
import { fileURLToPath } from "url";
import aiRouter from "../routes/AiRoutes.js";
import graphHopperRouter from "../routes/GraphHopperRoutes.js";
import geoapifyRouter from "../routes/geoapifyRoutes.js";
import newsletterRouter from "../routes/newsletterRoutes.js";
import dashboardRouter from "../routes/DashboardRoutes.js";
import metricsRouter from "../routes/MetricsRoutes.js";
import adminMetricsRouter from "../routes/AdminMetricsRoutes.js";
import backupRouter from "../routes/BackupRoutes.js";
import UserManagementRouter from "../routes/UserManagementRoutes.js";
import { nominatimLimiter } from "../middleware/rateLimiter.js";

// Get directory name (required for ES modules)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// In your Express app bootstrap, after creating `app`
const app = express();
const PORT = process.env.PORT || 5050;

const connectDB = async () => {
  mongoose.connection.on("connected", () => console.log("Database Connected"));
  await mongoose.connect(process.env.MONGO_URI);
};
connectDB(); // Establish connection to the database as soon as the backend is run

app.disable("x-powered-by");

// Respect X-Forwarded-For when behind proxies/CDNs
app.set("trust proxy", 1);

// CORS configuration - more permissive for development
app.use(
  cors({
    origin: true, // Allow all origins in development
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "Cookie",
      "X-Requested-With",
      "Origin",
      "Accept",
    ],
    optionsSuccessStatus: 200,
  })
);

// Additional CORS headers for preflight requests
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", req.headers.origin || "*");
  res.header(
    "Access-Control-Allow-Methods",
    "GET, POST, PUT, PATCH, DELETE, OPTIONS"
  );
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept, Authorization, Cookie"
  );
  res.header("Access-Control-Allow-Credentials", "true");
  res.header("Access-Control-Max-Age", "86400"); // 24 hours

  if (req.method === "OPTIONS") {
    res.sendStatus(200);
  } else {
    next();
  }
});

app.use(express.json());
app.use(cookieParser());

// Serve static files from uploads directory
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({
    status: "OK",
    message: "Backend server is running",
    timestamp: new Date().toISOString(),
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
app.use("/api/metrics", metricsRouter);
app.use("/api/admin/metrics", adminMetricsRouter);
app.use("/api/admin/backup", backupRouter);
app.use("/api/geoapify", geoapifyRouter);

// In your backend routes
app.get("/api/nominatim/search", nominatimLimiter, async (req, res) => {
  try {
    const { q, limit, countrycodes, bounded, viewbox } = req.query;

    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
      q
    )}&limit=${limit}&countrycodes=${countrycodes}&bounded=${bounded}&viewbox=${viewbox}`;

    const response = await fetch(url, {
      headers: {
        "User-Agent": "SarawakTourismApp/1.0",
      },
    });

    if (!response.ok) {
      return res.status(response.status).json({ error: "Nominatim API error" });
    }

    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error("Nominatim proxy error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.get("/api/nominatim/reverse", nominatimLimiter, async (req, res) => {
  try {
    const { lat, lon, addressdetails = "1" } = req.query;

    if (!lat || !lon) {
      return res.status(400).json({ error: "lat and lon are required" });
    }

    const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${encodeURIComponent(
      lat
    )}&lon=${encodeURIComponent(lon)}&addressdetails=${addressdetails}`;

    const response = await fetch(url, {
      headers: {
        "User-Agent": "SarawakTourismApp/1.0",
      },
    });

    if (!response.ok) {
      return res.status(response.status).json({ error: "Nominatim API error" });
    }

    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error("Nominatim reverse proxy error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Start the express server on this port
app.listen(PORT, () => {
  console.log(`Server is listening on port ${PORT}`);
});

export default app;
