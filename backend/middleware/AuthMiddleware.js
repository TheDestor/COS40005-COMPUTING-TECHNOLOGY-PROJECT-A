import jwt from 'jsonwebtoken';

export const verifyJWT = (req, res, next) => {
    console.log(`verifyJWT triggered for: ${req.method} ${req.originalUrl}`);
    console.log('Authorization header:', req.headers.authorization);

    const authHeader = req.headers.authorization || req.headers.Authorization;
    
    if (!authHeader?.startsWith('Bearer ')) {
        console.log('No Bearer token found in Authorization header');
        return res.status(401).json({ message: "Unauthorized" });
    }

    const token = authHeader.split(' ')[1];
    
    jwt.verify(
        token,
        process.env.ACCESS_TOKEN_SECRET,
        (error, decoded) => {
            if (error) {
                console.log('JWT verification error:', error);
                return res.status(403).json({ message: "Forbidden" });
            }
            console.log('Decoded JWT:', decoded);
            // Support both { UserInfo: { _id, role, email } } and { _id, role, email }
            req.user = decoded.UserInfo?._id || decoded._id;
            req.role = decoded.UserInfo?.role || decoded.role;
            req.userEmail = decoded.UserInfo?.email || decoded.email;
            next();
        }
    );
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

export const attachUserIfPresent = (req, _res, next) => {
  const h = req.headers?.authorization || '';
  const token = h.startsWith('Bearer ') ? h.slice(7) : null;
  if (!token) return next();
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded?.user || decoded;
    req.role = decoded?.role || decoded?.user?.role;
  } catch {}
  next();
};
