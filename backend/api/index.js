import express from "express";
import mongoose from "mongoose";
import cookieParser from "cookie-parser";
import authRouter from "../routes/AuthRoutes.js";
import userRouter from "../routes/UserRoutes.js";
import locationRouter from "../routes/LocationRoutes.js";
import inquiryRouter from "../routes/InquiryRoutes.js";
import eventRouter from "../routes/EventRoutes.js";
import townRoutes from "../routes/townRoutes.js";

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
app.use("/api/locations", locationRouter);
app.use("/api/auth", authRouter);
app.use("/api/user", userRouter);
app.use("/api/inquiry", inquiryRouter);
app.use("/api/event", eventRouter);
app.use("/api/towns", townRoutes);

// Start the express server on this port
app.listen(PORT, () => {
    console.log(`Server is listening on port ${PORT}`);
});

export default app;