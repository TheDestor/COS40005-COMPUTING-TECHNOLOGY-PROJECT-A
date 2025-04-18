import { businessUserModel, userModel } from "../models/UserModel.js";
import jwt from "jsonwebtoken";

// @desc User registration
// @route POST /register
// @access Public
export const register = async (req, res) => {
    try {
        const { firstName, lastName, email, phoneNumber, password } = req.body;

        // Validation
        if (!firstName || !lastName || !email || !phoneNumber || !password) {
            return res.status(400).json({ success: false, message: "All fields must be filled in." });
        };
        const existingUser = await userModel.findOne({ 
            $or: [
                { email: email },
                { phoneNumber: phoneNumber}
            ]
        }).select("-createdAt -updatedAt -__v -password"); // Exclude these from the response

        if (existingUser) {
            return res.status(400).json({ success: false, message: "This user already exists." });
        }

        // Create the user if validations pass
        const user = await userModel.create({ firstName, lastName, email, phoneNumber, password, role: 'tourist' });

        // Return success
        res.status(201).json({
            success: true,
            message: "Account registered successfully."
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "An internal server error occured during registration." });
    }
};

// @desc Business registration
// @route POST /businessRegister
// @access Public
export const businessRegister = async (req, res) => {
    try {
        const { firstName, lastName, companyName, companyRegistrationNo, email, phoneNumber, companyAddress, password } = req.body;

        // Validation
        if (!firstName || !lastName || !companyName || !companyRegistrationNo || !email || !phoneNumber || !companyAddress || !password) {
            return res.status(400).json({ success: false, message: "All fields must be filled in." });
        };
        const existingBusinessUser = await userModel.findOne({ 
            $or: [
                { email: email },
                { phoneNumber: phoneNumber}
            ]
        }).select("-createdAt -updatedAt -__v -password"); // Exclude these from the response
        if (existingBusinessUser) {
            return res.status(400).json({ success: false, message: "This user already exists." });
        }

        // Create businessUser if validation passes
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

        res.status(201).json({ message: "Business account registered successfully.", success: true });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "An internal server error occured during login." });
    }
}

// @desc Password login
// @route POST /login
// @access Public
export const login = async (req, res) => {
    try {
        const { identifier, password } = req.body;

        // Validation
        if (!identifier || !password) {
            return res.status(400).json({ success: false, message: "Identifier (email/phone) and password are required."});
        }
        const user = await userModel.findOne({
            $or: [
                { email: identifier },
                { phoneNumber: identifier }
            ]
        }).select("-createdAt -updatedAt -__v"); // Exclude these from the response
        if (!user) {
            return res.status(401).json({ success: false, message: "Incorrect password or email/phone number" });
        }

        // Check if password is correct
        const auth = await (password === user.password);
        if (!auth) {
            return res.status(401).json({ success: false, message: "Incorrect password or email/phone number"});
        }

        // Create access token
        const accessToken = jwt.sign(
            {
                "UserInfo": {
                    "_id": user._id,
                    "firstName": user.firstName,
                    "lastName": user.lastName,
                    "email": user.email,
                    "phoneNumber": user.phoneNumber,
                    "role": user.role,
                    "nationality": user.nationality
                }
            },
            process.env.ACCESS_TOKEN_SECRET,
            { expiresIn: '15m' }
        );

        // Create refresh token
        const refreshToken = jwt.sign(
            { "userId": user._id },
            process.env.REFRESH_TOKEN_SECRET,
            { expiresIn: '7d' }
        );

        // Save the cookie
        res.cookie('jwt', refreshToken, {
            httpOnly: true,
            maxAge: 7 * 24 * 60 * 60 * 1000
        });

        res.json({ accessToken, message: "Login successful", success: true });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "An internal server error occured during login." });
    }
};

// @desc Refresh access token
// @route GET /refresh
// @access Private
export const refresh = async (req, res) => {
    try {
        const cookies = req.cookies

        // Check if the cookie exists
        if (!cookies?.jwt) {
            return res.status(401).json({ message: "Unauthorized", success: false });
        }

        const refreshToken = cookies.jwt

        // Verify the cookie
        jwt.verify(
            refreshToken,
            process.env.REFRESH_TOKEN_SECRET,
            async (err, decoded) => {
                if (err) {
                    return res.status(403).json({ message: "Forbidden", success: false });
                }

                try {
                    // Verify the user using the userId
                    const user = await userModel.findById(decoded.userId).select("-createdAt -updatedAt -__v -password");
                    if (!user) {
                        return res.status(401).json({ message: "Unauthorized", success: false });
                    }

                    // Reissue new access token
                    const accessToken = jwt.sign(
                        {
                            "UserInfo": {
                                "_id": user._id,
                                "firstName": user.firstName,
                                "lastName": user.lastName,
                                "email": user.email,
                                "phoneNumber": user.phoneNumber,
                                "role": user.role,
                                "nationality": user.nationality
                            }
                        },
                        process.env.ACCESS_TOKEN_SECRET,
                        { expiresIn: '15m' }
                    );
                    
                    // Do not cache access token
                    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
                    res.setHeader('Pragma', 'no-cache');
                    res.setHeader('Expires', '0');
                    res.setHeader('Surrogate-Control', 'no-store');
                    res.json({ accessToken, success: true });
                } catch (error) {
                    console.error(error);
                    res.status(500).json({ message: 'Internal Server Error' });
                }
            }
        )
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
}

// @desc Logout
// @route POST /logout
// @access public
export const logout = (req, res) => {
    // Check if the cookie exists
    const cookies = req.cookies
    if (!cookies?.jwt) {
        return res.sendStatus(204);
    }

    // Clear the cookie
    res.clearCookie('jwt', {
        httpOnly: true,
        // sameSite: 'none'
    })

    res.json({ message: "Cookie cleared" });
};