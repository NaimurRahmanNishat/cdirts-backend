import express, { Request, Response } from "express";
const app = express();
import cors from "cors";
import cookieParser from 'cookie-parser';
import bodyParser from "body-parser";
import config from "./config";
import globalErrorHandler from "./middleware/globalError";

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors({
  origin: [config.client_url],
  credentials: true,
}));
app.use(cookieParser());
app.use(bodyParser.json({ limit: "50mb" }));
app.use(bodyParser.urlencoded({ limit: "50mb", extended: true }));

// global error handler
app.use(globalErrorHandler);


// Routes
import userRoutes from './routes/user.routes';
app.use("/api/auth", userRoutes);



app.get("/", (_req: Request, res:Response) => {
  res.send("Citizen Driven Issue Reporting & Tracking System Server is Running...")
})

export default app;