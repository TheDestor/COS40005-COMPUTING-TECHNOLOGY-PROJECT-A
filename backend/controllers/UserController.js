import { contactUsModel } from "../models/ContactUsModel.js";
import { userModel } from "../models/UserModel.js";
import { put } from "@vercel/blob"

// @desc Update user profile information
// @route POST /updateUserProfile
// @access private
export const updateUserProfile = async (req, res) => {
    try {
        const { firstName, lastName, nationality } = req.body;
        const _id = req.user;
        
        // Find the user using the id
        const currentUser = await userModel.findById(_id);

        // Dynamically fill in updateData based on what actually needs to be updated
        const updateData = {};
        let needsUpdate = false;

        if (firstName !== undefined && firstName !== currentUser.firstName) {
            updateData.firstName = firstName;
            needsUpdate = true;
        }
        if (lastName !== undefined && lastName !== currentUser.lastName) {
            updateData.lastName = lastName;
            needsUpdate = true;
        }

        if (nationality !== undefined && nationality !== currentUser.nationality) {
            updateData.nationality = nationality;
            needsUpdate = true;
        }

        if (needsUpdate) {
            // Update the user
            const updatedUser = await userModel.findByIdAndUpdate(
                _id,
                updateData,
                { new: true, runValidators: true } // Run schema validators
            ).select("-createdAt -updatedAt -__v -password"); // Exclude these from the response

            return res.status(200).json({
                message: "User profile updated successfully.",
                success: true,
                updatedUser
            });
        } else {
            return res.status(200).json({
                message: "No changes detected in user profile.",
                success: true
            })
        }
    } catch (error) {
        if (error.name === 'ValidationError') {
            return res.status(400).json({ message: "Validation failed.", success: false, errors: error.errors });
        }

        res.status(500).json({ message: "An internal server error occurred.", success: false });
    }
}

// @desc Update user password
// @route POST /updatePassword
// @access private
export const updatePassword = async (req, res) => {
    try {
        const _id = req.user;
        
        const { currentPassword, newPassword } = req.body;

        if ( !currentPassword || !newPassword ) {
            return res.status(400).json({ message: "Please provide current and new password", success: false });
        }

        if (currentPassword == newPassword) {
            return res.status(400).json({ message: "New password cannot be the same as the current password.", success: false });
        }

        const user = await userModel.findById(_id);
        const isMatch = await user.isValidPassword(currentPassword);

        if (!isMatch) {
            console.log("test2");
            return res.status(401).json({ message: "Incorrect password", success: false });
        } else {
            user.password = newPassword;
            await user.save();
            
            console.log("test1");
            res.status(200).json({ message: "Password updated successfully", success: true });
        }
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "An internal server error occurred while updating the password.", success: false });
    }
}

export const updateAvatar = async (req, res) => {
    try {
        const file = req.file;
        res.status(200).json({ message: "Test success", success: true });
        console.log(file);
    } catch (error) {
        res.status(500).json({ message: "Test failed", success: true });
        console.error(error);
    }
}

// @desc Contact form submission
// @route POST /contactUs
// @access public
export const contactUs = async (req, res) => {
    try {
        const { email, category, topic, message } = req.body;

        const contactUs = await contactUsModel.create({
            email: email,
            category: category,
            topic: topic,
            message: message
        })

        res.status(201).json({ message: "Contact form submission successful.", success: true });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "An internal server error occured during login.", success: false });
    }
}