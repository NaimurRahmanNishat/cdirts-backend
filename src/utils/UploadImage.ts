import { v2 as cloudinary } from "cloudinary";
import config from "../config";

cloudinary.config({
  cloud_name: config.cloudinary_cloud_name,
  api_key: config.cloudinary_api_key,
  api_secret: config.cloudinary_api_secret,
});

const opts = {
  overwrite: true,
  invalidate: true,
  resource_type: "auto",
};

export const UploadImage = async (image: string): Promise<string> => {
  try {
    const result = await cloudinary.uploader.upload(image, opts as any);
    return result.secure_url;
  } catch (error: any) {
    console.error("Cloudinary upload failed:", error.message);
    throw new Error(error.message);
  }
};
