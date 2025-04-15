import userModel from "../models/UserModel.js";
import createSecretToken from "../util/TokenGen.js";

export const register = async (req, res) => {
    try {
        const { firstName, lastName, email, phoneNumber, password } = req.body;

        if (!firstName || !lastName || !email || !phoneNumber || !password) {
            return res.status(400).json({ success: false, message: "All fields must be filled in." });
        };

        const existingUser = await userModel.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ success: false, message: "This user already exists." });
        }

        const user = await userModel.create({ firstName, lastName, email, phoneNumber, password });
        const token = createSecretToken(user._id);
        res.cookie("token", token, {
            withCredentials: true,
            httpOnly: false,
        });
        res
            .status(201)
            .json({ success: true, message: "Account registered successfully.", user });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "An internal server error occured during registration." });
    }
};

export const login = async (req, res) => {
    try {
        const { identifier, password } = req.body;
        if (!identifier || !password) {
            return res.status(400).json({ success: false, message: "Identifier (email/phone) and password are required."});
        }
        const user = await userModel.findOne({
            $or: [
                { email: identifier },
                { phoneNumber: identifier }
            ]
        });
        if (!user) {
            return res.status(401).json({ success: false, message: "Incorrect password or email/phone number" });
        }

        const auth = await (password === user.password);
        if (!auth) {
            return res.status(401).json({ success: false, message: "Incorrect password or email/phone number"});
        }

        const token = createSecretToken(user._id);
        res.cookie("token", token, {
            withCredentials: true,
            httpOnly: false
        });
        res.status(200).json({ success: true, message: "User logged in successfully" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "An internal server error occured during login." });
    }
};