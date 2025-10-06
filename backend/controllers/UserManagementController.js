import { userModel } from "../models/UserModel.js"

export const getAllUsers = async (req, res) => {
    try {
        const { limit, sort } = req.query;

        let query = userModel.find().select("firstName lastName email role avatarUrl createdAt");

        if (sort) {
            const [sortField, sortOrder] = sort.split('_');
            const order = sortOrder === 'desc' ? -1 : 1;
            query = query.sort({ [sortField]: order });
        } else {
            query = query.sort({ lastName: 1 });
        }

        if (limit) {
            query = query.limit(parseInt(limit, 10));
        }

        const users = await query;

        return res.status(200).json({ message: "Users fetched successfully", success: true, users });

    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: "An internal server error has occured while trying to fetch all users", success: false });
    }
}

export const deleteUser = async (req, res) => {
    try {
        const { id } = req.params;

        const deletedUser = await userModel.findByIdAndDelete(id);

        if (!deletedUser) {
            return res.status(404).json({ message: "User not found", success: false });
        }

        return res.status(200).json({ message: "User deleted successfully", success: true });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: "An internal server error has occured while trying to delete the user", success: false });
    }
}