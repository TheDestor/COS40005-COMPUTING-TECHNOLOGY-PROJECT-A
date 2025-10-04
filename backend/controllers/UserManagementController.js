import { userModel } from "../models/UserModel.js"

export const getAllUsers = async (req, res) => {
    try {
        const users = await userModel.find().select("firstName lastName email role");

        if (users) {
            return res.status(200).json({ message: "Users fetched successfully", success: true, users });
            
        } else {
            return res.status(401).json({ message: "Failed to fetch users", success: false })
        }
    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: "An internal server error has occured while trying to fetch all users", success: false });
    }
}