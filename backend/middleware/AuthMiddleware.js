import jwt from 'jsonwebtoken';

export const isAuthenticated = (req, res, next) => {
    const token = req.cookies.token;

    if (!token) {
        return res.status(401).json({ message: "Unauthorized", success: false });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        req.userID = decoded.id;
        req.userRole = decoded.role;
        next();
    } catch (error) {
        console.error("JWT Verification Error:", error.message);
        if (error.name === 'TokenExpiredError') {
             return res.status(401).json({ message: 'Unauthorized: Token expired' });
        }
        return res.status(401).json({ message: 'Unauthorized: Invalid token' });
    }
}

export const checkRole = (allowedRoles) => {
    return (req, res, next) => {
        const userRole = req.role;

        if (allowedRoles.includes(userRole)) {
            next();
        } else {
            res.status(403).json({ message: "Forbidden: Access denied", success: false });
        }
    }
}