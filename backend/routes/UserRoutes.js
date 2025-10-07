import { Router } from "express";
import { contactUs, removeAvatar, updateAvatar, updatePassword, updateUserProfile, deleteAccount } from "../controllers/UserController.js";
import { verifyJWT } from "../middleware/AuthMiddleware.js";
import multer from "multer";

const userRouter = Router();
const upload = multer({
    limits: { fileSize: 4.5 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        const allowedTypes = /jpeg|jpg|png/;
        const mimetype = allowedTypes.test(file.mimetype);

        if (mimetype) {
            return cb(null, true);
        }
        cb(new Error('Error: File upload only supports the following filetypes - ' + allowedTypes));
    }
});

userRouter.post("/updateUserProfile", verifyJWT, updateUserProfile);
userRouter.post("/updatePassword", verifyJWT, updatePassword);
userRouter.post("/updateAvatar", verifyJWT, upload.single('avatar'), updateAvatar);
userRouter.post("/removeAvatar", verifyJWT, removeAvatar);
userRouter.post("/contactUs", contactUs);
userRouter.delete("/deleteAccount", verifyJWT, deleteAccount);

export default userRouter;