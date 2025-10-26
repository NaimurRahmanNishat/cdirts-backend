"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UploadMultipleImages = exports.UploadImage = void 0;
// utils/UploadImage.ts
const cloudinary_1 = require("cloudinary");
const config_1 = __importDefault(require("../config"));
cloudinary_1.v2.config({
    cloud_name: config_1.default.cloudinary_cloud_name,
    api_key: config_1.default.cloudinary_api_key,
    api_secret: config_1.default.cloudinary_api_secret,
});
const opts = {
    overwrite: true,
    invalidate: true,
    resource_type: "auto",
    timeout: 60000,
    chunk_size: 20 * 1024 * 1024,
};
const UploadImage = async (image) => {
    try {
        // Validate image data
        if (!image || typeof image !== 'string') {
            throw new Error("Invalid image data provided");
        }
        // Check if it's a base64 string
        if (!image.startsWith('data:image/')) {
            throw new Error("Invalid image format. Please provide a valid base64 image string");
        }
        // Upload to Cloudinary with proper options
        const uploadOptions = {
            ...opts,
            folder: "issue-reports",
        };
        const result = await cloudinary_1.v2.uploader.upload(image, uploadOptions);
        return result.secure_url;
    }
    catch (error) {
        console.error("Cloudinary upload failed:", error);
        // Handle specific Cloudinary errors
        if (error.message.includes("File size too large")) {
            throw new Error("Image size is too large. Maximum size is 10MB");
        }
        else if (error.message.includes("Invalid image")) {
            throw new Error("Invalid image format. Please use JPEG, PNG, or WebP");
        }
        else if (error.message.includes("timeout")) {
            throw new Error("Upload timeout. Please try again with a smaller image");
        }
        else {
            throw new Error("Image upload failed: " + error.message);
        }
    }
};
exports.UploadImage = UploadImage;
// Multiple image upload utility
const UploadMultipleImages = async (images) => {
    try {
        const uploadPromises = images.map(image => (0, exports.UploadImage)(image));
        const urls = await Promise.all(uploadPromises);
        return urls.map(url => ({
            public_id: `issue-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            url: url
        }));
    }
    catch (error) {
        console.error("Multiple image upload failed:", error);
        throw new Error("Failed to upload one or more images: " + error.message);
    }
};
exports.UploadMultipleImages = UploadMultipleImages;
//# sourceMappingURL=UploadImage.js.map