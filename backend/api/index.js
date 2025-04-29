import express from "express";
import connectDB from "../config/mongodb.js";
import cookieParser from "cookie-parser";
import authRouter from "../routes/AuthRoutes.js";
import userRouter from "../routes/UserRoutes.js";
import locationRouter from "../routes/LocationRoutes.js";
import dashboardRouter from "../routes/DashboardRoutes.js";

const app = express();
const PORT = process.env.PORT || 5050
connectDB(); // Establish connection to the database as soon as the backend is run

app.disable("x-powered-by");
app.use(express.json());
app.use(cookieParser());
app.use("/api/locations", locationRouter);
app.use("/api/auth", authRouter);
app.use("/api/user", userRouter);
app.use("/api/dashboard", dashboardRouter);

// Start the express server on this port
app.listen(PORT, () => {
    console.log(`Server is listening on port ${PORT}`);
});

export default app;