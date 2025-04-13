import express from "express";
import cors from "cors";
import connectDB from "./config/mongodb.js";

const app = express();
const port = process.env.PORT || 5050
connectDB(); // Establish connection to the database as soon as the backend is run

app.use(cors());
app.use(express.json());