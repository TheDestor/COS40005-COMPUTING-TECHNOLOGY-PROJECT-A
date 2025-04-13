import userModel from "../models/userModel";

export const register = async (req, res) => {
    const { firstName, lastName, email, phoneNumber, password } = req.body;

    if (!firstName || !lastName || !email || !phoneNumber || !password) {
        return res.json({ success: false, message: 'Missing Details' });
    }

    try {
        const existingUser = await userModel.findOne({ email })
        
        if (existingUser) {
            return res.json({ success: false, message: 'User already exists' });
        }

        const user = new userModel({ firstName, lastName, email, phoneNumber, password });
        await user.save();

        // Work in progress
    } catch (error) {
        res.json({ success: false, message: error.message });
    }
}