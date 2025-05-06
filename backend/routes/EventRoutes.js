import { Router } from "express";
import { addEvent } from "../controllers/eventController.js";
import multer from "multer";

const eventRouter = Router();
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


eventRouter.post("/addEvent", upload.single('image'), addEvent);

export default eventRouter;