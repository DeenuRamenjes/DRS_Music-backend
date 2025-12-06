import cloudinary from 'cloudinary';
import dotenv from 'dotenv';
import fs from 'fs';
dotenv.config();

cloudinary.v2.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true
});

export const uploadToCloudinary = async (file) => {
    try {
        const options = {
            resource_type: "auto",
            chunk_size: 20 * 1024 * 1024, // 20MB chunks
            timeout: 300000, // 5 minutes timeout
        };

        // For images, add quality optimization
        if (file.mimetype && file.mimetype.startsWith('image/')) {
            options.quality = 'auto';
        }

        const result = await cloudinary.v2.uploader.upload(file.tempFilePath, options);

        // Clean up temp file after successful upload
        try {
            if (file.tempFilePath && fs.existsSync(file.tempFilePath)) {
                fs.unlinkSync(file.tempFilePath);
            }
        } catch (cleanupError) {
            console.error("Error cleaning up temp file:", cleanupError.message);
        }

        return result.secure_url;
    } catch (error) {
        // Clean up temp file even on error
        try {
            if (file.tempFilePath && fs.existsSync(file.tempFilePath)) {
                fs.unlinkSync(file.tempFilePath);
            }
        } catch (cleanupError) {
            console.error("Error cleaning up temp file:", cleanupError.message);
        }

        if (error.http_code === 400 && error.message.includes('File size too large')) {
            throw new Error('File size exceeds Cloudinary limit. Please use a smaller file (max 10MB for free accounts).');
        }
        throw new Error(`Error uploading to Cloudinary: ${error.message}`);
    }
};

export default cloudinary.v2;