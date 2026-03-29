import Image from "../models/imageModel.js";
import { v2 as cloudinary } from "cloudinary";
import dotenv from "dotenv";
import multer from "multer";

dotenv.config();

// Cloudinary config
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

// Multer setup
const storage = multer.memoryStorage();

const upload = multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 }
});

export const uploadMiddleware = upload.single("image");

// Upload controller
export const uploadImage = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ msg: "No file uploaded" });
        }

        const result = await new Promise((resolve, reject) => {
            const stream = cloudinary.uploader.upload_stream(
                (error, result) => {
                    if (error) reject(error);
                    else resolve(result);
                }
            );

            stream.end(req.file.buffer);
        });

        // Save to DB
        const img = await Image.create({
            url: result.secure_url,
            public_id: result.public_id
        });

        return res.status(200).json({
            msg: "Image uploaded successfully",
            data: img
        });

    } catch (err) {
        console.log(err);
        return res.status(500).json({ msg: "Server error" });
    }
};