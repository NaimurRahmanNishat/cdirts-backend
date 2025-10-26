// utils/UploadImage.ts
import { v2 as cloudinary, UploadApiOptions } from "cloudinary";
import config from "../config";

cloudinary.config({
  cloud_name: config.cloudinary_cloud_name,
  api_key: config.cloudinary_api_key,
  api_secret: config.cloudinary_api_secret,
});

const opts: UploadApiOptions = {
  overwrite: true,
  invalidate: true,
  resource_type: "auto" as "auto", 
  timeout: 60000,
  chunk_size: 20 * 1024 * 1024,
};

export const UploadImage = async (image: string): Promise<string> => {
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
    const uploadOptions: UploadApiOptions = {
      ...opts,
      folder: "issue-reports", 
    };

    const result = await cloudinary.uploader.upload(image, uploadOptions);

    return result.secure_url;

  } catch (error: any) {
    console.error("Cloudinary upload failed:", error);
    
    // Handle specific Cloudinary errors
    if (error.message.includes("File size too large")) {
      throw new Error("Image size is too large. Maximum size is 10MB");
    } else if (error.message.includes("Invalid image")) {
      throw new Error("Invalid image format. Please use JPEG, PNG, or WebP");
    } else if (error.message.includes("timeout")) {
      throw new Error("Upload timeout. Please try again with a smaller image");
    } else {
      throw new Error("Image upload failed: " + error.message);
    }
  }
};

// Multiple image upload utility
export const UploadMultipleImages = async (images: string[]): Promise<{public_id: string; url: string}[]> => {
  try {
    const uploadPromises = images.map(image => UploadImage(image));
    const urls = await Promise.all(uploadPromises);
    
    return urls.map(url => ({
      public_id: `issue-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      url: url
    }));
  } catch (error: any) {
    console.error("Multiple image upload failed:", error);
    throw new Error("Failed to upload one or more images: " + error.message);
  }
};