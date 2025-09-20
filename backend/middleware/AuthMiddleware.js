import jwt from 'jsonwebtoken';

export const verifyJWT = (req, res, next) => {
    console.log(`verifyJWT triggered for: ${req.method} ${req.originalUrl}`);

    const authHeader = req.headers.authorization || req.headers.Authorization
    
    if (!authHeader?.startsWith('Bearer ')) {
        return res.status(401).json({ message: "Unauthorized" });
    }

    const token = authHeader.split(' ')[1]
    
    jwt.verify(
        token,
        process.env.ACCESS_TOKEN_SECRET,
        (error, decoded) => {
            if (error) {
                console.log(error)
                return res.status(403).json({ message: "Forbidden" });
            }
            req.user = decoded.UserInfo._id
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
