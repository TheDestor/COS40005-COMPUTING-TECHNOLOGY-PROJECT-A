import { businessUserModel, userModel } from "../models/UserModel.js";
import jwt from "jsonwebtoken";

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

        const accessToken = jwt.sign(
            {
                "UserInfo": {
                    "identifier": identifier,
                    "firstName": user.firstName,
                    "role": user.role
                }
            },
            process.env.ACCESS_TOKEN_SECRET,
            { expiresIn: '10s' }
        );

        const refreshToken = jwt.sign(
            {
                "identifier": identifier,
            },
            process.env.REFRESH_TOKEN_SECRET,
            { expiresIn: '7d' }
        );

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

export const refresh = async (req, res) => {
    try {
        const cookies = req.cookies

        if (!cookies?.jwt) {
            return res.status(401).json({ message: "Unauthorized", success: false });
        }

        const refreshToken = cookies.jwt

        jwt.verify(
            refreshToken,
            process.env.REFRESH_TOKEN_SECRET,
            async (err, decoded) => {
                if (err) {
                    return res.status(403).json({ message: "Forbidden", success: false });
                }

                try {
                    const foundUser = await userModel.findOne({
                        $or: [
                            { email: decoded.identifier },
                            { phoneNumber: decoded.identifier }
                        ]
                    });

                    if (!foundUser) {
                        return res.status(401).json({ message: "Unauthorized", success: false });
                    }

                    const accessToken = jwt.sign(
                        {
                            "UserInfo": {
                                "identifier": foundUser.identifier,
                                "firstName": foundUser.firstName,
                                "role": foundUser.role
                            }
                        },
                        process.env.ACCESS_TOKEN_SECRET,
                        { expiresIn: '10s' }
                    );

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

export const logout = (req, res) => {
    const cookies = req.cookies
    if (!cookies?.jwt) {
        return res.sendStatus(204);
    }

    res.clearCookie('jwt', {
        httpOnly: true,
        // sameSite: 'none'
    })

    res.json({ message: "Cookie cleared" });
};