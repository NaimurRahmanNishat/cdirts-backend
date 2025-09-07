import express, { Application } from "express";
import cors from "cors";
import mongoose from "mongoose";
const app: Application = express();
const port: number = Number(process.env.PORT) || 5000;
import dotenv from "dotenv";
import cookieParser from 'cookie-parser';
import bodyParser from "body-parser";
dotenv.config();


// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors({
  origin: "http://localhost:5173",
  credentials: true,
}));
app.use(cookieParser());
app.use(bodyParser.json({ limit: "50mb" }));
app.use(bodyParser.urlencoded({ limit: "50mb", extended: true }));


// Routes
import userRoute from "./src/users/user.route";
app.use("/api/auth", userRoute);


//  database connection
async function bootstrap() {
  try {
    const dbUrl = process.env.DB_URL;
    if (!dbUrl) {
      console.error("❌ No MongoDB URL found in environment variables.");
      process.exit(1);
    }

    await mongoose.connect(dbUrl);
    console.log("✅ MongoDB Connected!");

    app.listen(port, () => {
      console.log(`🚀 Server running on http://localhost:${port}`);
    });
  } catch (error) {
    console.error("❌ MongoDB Connection Failed!", error);
  }
}

// Default route
app.get("/", (req, res) => {
  res.send("Citizen Driven Issue Reporting And Tracking System Server is Running...");
});

bootstrap();