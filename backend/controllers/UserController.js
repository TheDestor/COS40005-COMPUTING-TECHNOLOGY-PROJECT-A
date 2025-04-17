import { contactUsModel } from "../models/ContactUsModel.js";
import { userModel } from "../models/UserModel.js";

// @desc Update user profile information
// @route POST /updateUserProfile
// @access private
export const updateUserProfile = async (req, res) => {
    try {
        const { _id, firstName, lastName, email, phoneNumber } = req.body;
        
        // Find the user using the id
        const currentUser = await userModel.findById(_id);

        // Dynamically fill in updateData based on what actually needs to be updated
        const updateData = {};
        let emailChanged = false;
        let phoneChanged = false;

        if (firstName !== undefined && firstName !== currentUser.firstName) {
            updateData.firstName = firstName;
        }
        if (lastName !== undefined && lastName !== currentUser.lastName) {
            updateData.lastName = lastName;
        }
        if (email !== undefined && email !== currentUser.email) {
            updateData.email = email;
            emailChanged = true;
        }
        if (phoneNumber !== undefined && phoneNumber !== currentUser.phoneNumber) {
            updateData.phoneNumber = phoneNumber;
            phoneChanged = true;
        }

        // Update the user
        const updatedUser = await userModel.findByIdAndUpdate(
            _id,
            updateData,
            { new: true, runValidators: true } // Run schema validators
        ).select("-createdAt -updatedAt -__v -password"); // Exclude these from the response

        res.status(200).json({
            message: "User profile updated successfully.",
            success: true,
            updatedUser
        });
    } catch (error) {
        // Catch duplicated email or phone number errors cause users cant have the same email or phone number
        if (error.code === 11000 || (error.name === 'MongoServerError' && error.message.includes('E11000'))) {
            let field = 'field';
            if (error.keyPattern?.email) field = 'Email address';
            else if (error.keyPattern?.phoneNumber) field = 'Phone number';
            else {
                 const match = error.message.match(/index: (\w+)_/);
                 field = match && match[1] ? (match[1].charAt(0).toUpperCase() + match[1].slice(1)) : 'Unique field';
             }
            return res.status(400).json({ success: false, message: `${field} is already in use by another account.` });
        }

        if (error.name === 'ValidationError') {
            return res.status(400).json({ success: false, message: "Validation failed.", errors: error.errors });
        }

        res.status(500).json({ success: false, message: "An internal server error occurred." });
    }
}

// @desc Contact us
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
        res.status(500).json({ message: "An internal server error occured during login." });
    }
}