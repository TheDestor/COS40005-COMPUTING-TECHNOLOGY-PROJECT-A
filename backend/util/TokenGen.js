import jwt from "jsonwebtoken";

const createSecretToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "7d" });
};

export default createSecretToken;