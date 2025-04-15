import jwt from "jsonwebtoken";

const createSecretToken = (userID, userRole) => {
    const payload = {
        id: userID,
        role: userRole
    };

    return jwt.sign(
        payload,
        process.env.JWT_SECRET,
        { expiresIn:'7d' }
    );
};

export default createSecretToken;