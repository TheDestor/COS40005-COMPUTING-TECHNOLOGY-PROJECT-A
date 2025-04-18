import jwt from 'jsonwebtoken';

export const verifyJWT = (req, res, next) => {
    console.log(`verifyJWT triggered for: ${req.method} ${req.originalUrl}`); // <-- Add this log

    const authHeader = req.headers.authorization || req.headers.Authorization
    
    if (!authHeader?.startsWith('Bearer ')) {
        return res.status(401).json({ message: "Unauthorized" });
    }

    const token = authHeader.split(' ')[1]

    jwt.verify(
        token,
        process.env.ACCESS_TOKEN_SECRET,
        (err, decoded) => {
            if (err) return res.status(403).json({ message: "Forbidden" });
            req.user = decoded.UserInfo.identifier
            req.role = decoded.UserInfo.role
            next();
        }
    )
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