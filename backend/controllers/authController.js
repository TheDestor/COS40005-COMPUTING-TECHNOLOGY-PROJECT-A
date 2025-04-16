import { businessUserModel, userModel } from "../models/userModel.js";
import createSecretToken from "../util/TokenGen.js";

const cookieOptions = {
    httpOnly: true
}

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

        const user = await userModel.create({ firstName, lastName, email, phoneNumber, password, role: 'tourist' });
        // const token = createSecretToken(user._id, user.role);
        // res.cookie("token", token, {
        //     withCredentials: true,
        //     httpOnly: true
        // });
        res.status(201).json({
            success: true,
            message: "Account registered successfully."
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "An internal server error occured during registration." });
    }
};

export const businessRegister = async (req, res) => {
    try {
        const { firstName, lastName, companyName, companyRegistrationNo, email, phoneNumber, companyAddress, password } = req.body;

        if (!firstName || !lastName || !companyName || !companyRegistrationNo || !email || !phoneNumber || !companyAddress || !password) {
            return res.status(400).json({ success: false, message: "All fields must be filled in." });
        };

        const existingBusinessUser = await userModel.findOne({ email });
        if (existingBusinessUser) {
            return res.status(400).json({ success: false, message: "This user already exists." });
        }

        const businessUser = await businessUserModel.create({
            firstName: firstName,
            lastName: lastName,
            email: email,
            phoneNumber: phoneNumber,
            password: password,
            companyName: companyName,
            companyRegistrationNo: companyRegistrationNo,
            companyAddress: companyAddress,
        })

        // const token = createSecretToken(businessUser._id, businessUser.role);

        // res.cookie("token", token, {
        //     withCredentials: true,
        //     httpOnly: true
        // });

        res.status(201).json({ message: "Business account registered successfully.", success: true });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "An internal server error occured during login." });
    }
}

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

        const token = createSecretToken(user._id, user.role);
        res.cookie("token", token, cookieOptions);
        res.status(200).json({
            success: true,
            message: "User logged in successfully",
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "An internal server error occured during login." });
    }
};

export const logout = (req, res) => {
    res.clearCookie('token', cookieOptions);
    res.status(200).json({ message: "Logged out successfully", success: true });
};

export const getAuthStatus = async (req, res) => {
    try {
        const user = await userModel.findById(req.userID)

        if (!user) {
            res.clearCookie('token');
            return res.status(404).json({ message: "User not found.", success: false });
        }

        res.status(200).json({
            message: "User is authenticated.",
            success: true,
            user: {
                id: user._id,
                firstName: user.firstName,
                lastName: user.lastName,
                email: user.email,
                role: user.role,
            }
        });
    } catch (error) {
        console.error("Get Auth Status Error:", error);
        res.status(500).json({ message: "An internal server error occurred.", success: false });
    }
}