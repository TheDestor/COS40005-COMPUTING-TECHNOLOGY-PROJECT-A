import express from "express";
import cors from "cors";
import connectDB from "./config/mongodb.js";
import cookieParser from "cookie-parser";
import authRouter from "./routes/AuthRoute.js";

const app = express();
const PORT = process.env.PORT || 5050
connectDB(); // Establish connection to the database as soon as the backend is run

app.use(cors({
    origin: ["http://localhost:5173"],
    credentials: true
}));

app.use(express.json());
app.use(cookieParser())
app.use("/auth", authRouter)

app.listen(PORT, () => {
    console.log(`Server is listening on port ${PORT}`);
});