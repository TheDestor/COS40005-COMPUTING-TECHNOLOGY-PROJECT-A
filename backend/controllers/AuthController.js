import { businessUserModel, userModel } from "../models/UserModel.js";
import jwt from "jsonwebtoken";
import { createRemoteJWKSet, jwtVerify } from 'jose';

// @desc User registration test
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

// @desc Google login
// @route POST /login
// @access Public
export const googleLogin = async (req, res) => {
    try {
        const { credential } = req.body;
        if (!credential) {
            return res.status(400).json({ success: false, message: "Google credential is required." });
        }

        const clientId = process.env.GOOGLE_CLIENT_ID;
        if (!clientId) {
            return res.status(500).json({ success: false, message: "Google client ID not configured." });
        }

        // Verify Google ID token using JWKS
        const JWKS = createRemoteJWKSet(new URL('https://www.googleapis.com/oauth2/v3/certs'));
        let verified;
        try {
            verified = await jwtVerify(credential, JWKS, {
                issuer: ['https://accounts.google.com', 'accounts.google.com'],
                audience: process.env.GOOGLE_CLIENT_ID,
            });
        } catch (err) {
            // Structured logging for validation failures
            const { authError } = await import('../utils/logger.js');
            authError('google_token_verification_failed', { error: err?.message });
            return res.status(401).json({ success: false, message: 'Invalid Google token.' });
        }

        const payload = verified?.payload || {};
        const { email, email_verified, name, picture, sub, iss, aud, exp } = payload;

        // Additional explicit claim checks + logging
        if (!email_verified) {
            const { authWarn } = await import('../utils/logger.js');
            authWarn('email_not_verified', { email, iss, aud });
            return res.status(401).json({ success: false, message: 'Email not verified by Google.' });
        }
        if (!email) {
            const { authWarn } = await import('../utils/logger.js');
            authWarn('email_missing', { iss, aud });
            return res.status(400).json({ success: false, message: 'Google account missing email.' });
        }

        // Find or create user by email
        let user = await userModel.findOne({ email }).select("-createdAt -updatedAt -__v");
        let isNewUser = false;
        if (!user) {
            const firstName = (name || '').split(' ')[0] || 'Google';
            const lastName = (name || '').split(' ').slice(1).join(' ') || '';
            const randomPassword = `google:${sub}:${Math.random().toString(36).slice(2)}`;
            user = await userModel.create({
                firstName,
                lastName,
                email,
                password: randomPassword,
                role: 'tourist',
                avatarUrl: picture || undefined,
            });
            isNewUser = true;
        
            // Send welcome email (non‑blocking)
            try {
                const { default: transporter } = await import('../config/emailConfig.js');
                const { getWelcomeEmailTemplate } = await import('../utils/emailWelcome.js');
                const tmpl = getWelcomeEmailTemplate(email);
                await transporter.sendMail({
                    from: process.env.EMAIL_USER,
                    to: email,
                    subject: tmpl.subject,
                    html: tmpl.html,
                    text: tmpl.text,
                });
            } catch (mailErr) {
                console.error('Welcome email failed:', mailErr);
            }
        }

        // Persist provider on the user record
        if (user.authProvider !== 'google') {
            user.authProvider = 'google';
            await user.save();
        }
        
        // Create access token (include provider)
        const accessToken = jwt.sign(
            {
                "UserInfo": {
                    "_id": user._id,
                    "firstName": user.firstName,
                    "lastName": user.lastName,
                    "email": user.email,
                    "phoneNumber": user.phoneNumber,
                    "role": user.role,
                    "nationality": user.nationality,
                    "avatarUrl": user.avatarUrl,
                    "authProvider": 'google'
                }
            },
            process.env.ACCESS_TOKEN_SECRET,
            { expiresIn: '15m' }
        );

        // Create refresh token (7d)
        const refreshToken = jwt.sign(
            { userId: user._id },
            process.env.REFRESH_TOKEN_SECRET,
            { expiresIn: '7d' }
        );

        // Set httpOnly refresh cookie (align path to root and harden flags)
        res.cookie('jwt', refreshToken, {
            httpOnly: true,
            sameSite: 'lax',
            secure: process.env.NODE_ENV === 'production',
            path: '/',
            maxAge: 7 * 24 * 60 * 60 * 1000,
        });

        return res.json({ success: true, accessToken, newUser: isNewUser, user: { firstName: user.firstName, lastName: user.lastName, email: user.email }, });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: "Internal server error during Google authentication." });
    }
};

// function login()
export const login = async (req, res) => {
    try {
        const { identifier, password, recaptchaToken } = req.body;
        const accessSecret = process.env.ACCESS_TOKEN_SECRET;

        // Verify reCAPTCHA token if secret configured
        const recaptchaSecret = process.env.RECAPTCHA_SECRET;
        if (recaptchaSecret) {
            try {
                const params = new URLSearchParams();
                params.append('secret', recaptchaSecret);
                params.append('response', recaptchaToken || '');

                const verifyResp = await fetch('https://www.google.com/recaptcha/api/siteverify', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                    body: params.toString()
                });
                const verifyJson = await verifyResp.json();
                if (!verifyJson.success) {
                    return res.status(400).json({ success: false, message: 'Failed reCAPTCHA verification.' });
                }
            } catch (e) {
                console.error('reCAPTCHA verification error:', e);
                return res.status(400).json({ success: false, message: 'reCAPTCHA verification failed. Please try again.' });
            }
        } else {
            console.warn('RECAPTCHA_SECRET not set; skipping reCAPTCHA verification.');
        }

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
        const auth = await user.isValidPassword(password);
        if (!auth) {
            return res.status(401).json({ success: false, message: "Incorrect password or email/phone number"});
        }

        // Ensure provider is set to password
        if (user.authProvider !== 'password') {
            user.authProvider = 'password';
            await user.save();
        }

        // Create access token (include full profile + provider)
        const minimalUser = {
            _id: user._id,
            email: user.email,
            role: user.role,
            firstName: user.firstName,
            lastName: user.lastName,
            phoneNumber: user.phoneNumber,
            nationality: user.nationality,
            avatarUrl: user.avatarUrl,
            authProvider: 'password'
        };

        const accessToken = jwt.sign(
            { UserInfo: minimalUser },
            accessSecret,
            { expiresIn: '10m' }
        );

        const refreshSecret = process.env.REFRESH_TOKEN_SECRET;

        const refreshToken = jwt.sign(
            { userId: user._id },
            refreshSecret,
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
                                "nationality": user.nationality,
                                "avatarUrl": user.avatarUrl,
                                "authProvider": user.authProvider || 'password'
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

    // Always clear cookies—refresh cookie isn't sent to /logout when path is /api/auth/refresh
    res.clearCookie('jwt', {
        httpOnly: true,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
        path: '/api/auth/refresh',
    });
    res.clearCookie('jwt', {
        httpOnly: true,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
        path: '/',
    });

    // Overwrite with expired cookies for belt-and-suspenders deletion
    res.cookie('jwt', '', {
        httpOnly: true,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
        path: '/api/auth/refresh',
        maxAge: 0,
    });
    res.cookie('jwt', '', {
        httpOnly: true,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
        path: '/',
        maxAge: 0,
    });

    return res.json({ message: "Logout successful", success: true });
};
