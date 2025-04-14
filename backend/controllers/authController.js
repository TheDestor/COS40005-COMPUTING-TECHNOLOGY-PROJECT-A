import userModel from "../models/UserModel.js";
import createSecretToken from "../util/TokenGen.js";

export const register = async (req, res) => {
    try {
        const { firstName, lastName, email, phoneNumber, password } = req.body;

        if (!firstName || !lastName || !email || !phoneNumber || !password) {
            return res.json({ success: false, message: "Missing Details" });
        };

        const existingUser = await userModel.findOne({ email });
        if (existingUser) {
            return res.json({ success: false, message: "User already exists" });
        }

        const user = await userModel.create({ firstName, lastName, email, phoneNumber, password });
        const token = createSecretToken(user._id);
        res.cookie("token", token, {
            withCredentials: true,
            httpOnly: false,
        });
        res
            .status(201)
            .json({ message: "User signed in successfully", success: true, user });
    } catch (error) {
        console.error(error);
    }
};

export const login = async (req, res) => {
    try {
        const { phoneNumber, email, password } = req.body;
        if (!(phoneNumber || email) || !password) {
            return res.json({ message: "All field are required" });
        }
        const user = await userModel.findOne({ email });
        if (!user) {
            return res.json({ message: "Incorrect password or email/phone number" });
        }

        const auth = await (password === user.password);
        if (!auth) {
            return res.json({ message: "Incorrect password or email/phone number" });
        }
        const token = createSecretToken(user._id);
        res.cookie("token", token, {
            withCredentials: true,
            httpOnly: false
        });
        res.status(201).json({ message: "User logged in successfully", success: true });
    } catch (error) {
        console.error(error);
    }
};