import express, { Request, Response } from "express";
const app = express();
import cors from "cors";
import cookieParser from "cookie-parser";
import bodyParser from "body-parser";
import config from "./config";
import globalErrorHandler from "./middleware/globalError";

// Middleware
app.use(
  cors({
    origin: [config.client_url, "http://localhost:5173"],
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With", "Accept"],
  })
);

// Increase body parser limits for image uploads
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));
app.use(cookieParser());
app.use(bodyParser.json({ limit: "50mb" }));
app.use(bodyParser.urlencoded({ limit: "50mb", extended: true }));

// Routes
import userRoutes from "./routes/user.routes";
import statsRoutes from "./routes/stats.routes";
import reviewRoutes from "./routes/review.routes";
import issuRoutes from "./routes/issue.routes";
import { UploadImage } from "./utils/UploadImage";

app.use("/api/auth", userRoutes);
app.use("/api/issue", issuRoutes);
app.use("/api/review", reviewRoutes);
app.use("/api/stats", statsRoutes);

app.post("/uploadImage", async (req: Request, res: Response) => {
  try {
    const { image } = req.body;
    
    if (!image) {
      return res.status(400).json({ 
        success: false, 
        message: "Image data is required" 
      });
    }

    // Check if base64 string is too large (rough estimate)
    if (image.length > 15 * 1024 * 1024) { // 15MB limit for base64
      return res.status(413).json({
        success: false,
        message: "Image size too large. Maximum size is 10MB"
      });
    }

    // Upload to Cloudinary
    const url = await UploadImage(image);
    
    res.status(200).json({
      success: true,
      url: url,
      message: "Image uploaded successfully"
    });
    
  } catch (error: any) {
    console.error("Image upload error:", error);
    
    // Specific error handling
    if (error.message.includes("File size too large")) {
      return res.status(413).json({
        success: false,
        message: "Image size too large. Maximum size is 10MB"
      });
    }
    
    res.status(500).json({
      success: false,
      message: error.message || "Image upload failed"
    });
  }
});

app.get("/", (_req: Request, res: Response) => {
  res.send(
    "Citizen Driven Issue Reporting & Tracking System Server is Running..."
  );
});

// global error handler
app.use(globalErrorHandler);

export default app;
