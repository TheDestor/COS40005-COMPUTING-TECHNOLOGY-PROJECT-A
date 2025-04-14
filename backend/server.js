import express from "express";
import cors from "cors";
import connectDB from "./config/MongoDB.js";
import router from "./routes/AuthRoute.js";

const app = express();
const PORT = process.env.PORT || 5050
connectDB(); // Establish connection to the database as soon as the backend is run

app.use(cors({
    // origin: ["http://localhost:5050"],
    // credentials: true
}));
app.use(express.json());
app.get('/', (req, res) => res.send("API WORKING"));
app.use("/", router)

app.listen(PORT, () => {
    console.log(`Server is listening on port ${PORT}`);
});