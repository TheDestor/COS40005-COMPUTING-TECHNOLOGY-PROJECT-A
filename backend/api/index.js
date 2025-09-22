import express from "express";
import mongoose from "mongoose";
import cookieParser from "cookie-parser";
import authRouter from "../routes/AuthRoutes.js";
import userRouter from "../routes/UserRoutes.js";
import locationRouter from "../routes/LocationRoutes.js";
import inquiryRouter from "../routes/InquiryRoutes.js";
import eventRouter from "../routes/EventRoutes.js";
import businessRouter from "../routes/BusinessRoutes.js";
import path from 'path';
import { fileURLToPath } from 'url';
import aiRouter from "../routes/AiRoutes.js";

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
app.use(express.json());
app.use(cookieParser());

// Serve static files from uploads directory
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use("/api/locations", locationRouter);
app.use("/api/auth", authRouter);
app.use("/api/user", userRouter);
app.use("/api/inquiry", inquiryRouter);
app.use("/api/event", eventRouter);
app.use("/api/businesses", businessRouter);
app.use("/api/ai", aiRouter);

// Start the express server on this port
app.listen(PORT, () => {
    console.log(`Server is listening on port ${PORT}`);
});

export default app;