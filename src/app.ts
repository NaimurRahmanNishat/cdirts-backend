import express, { Request, Response } from "express";
const app = express();
import cors from "cors";
import cookieParser from "cookie-parser";
import bodyParser from "body-parser";
import config from "./config";
import globalErrorHandler from "./middleware/globalError";

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(
  cors({
    origin: [config.client_url],
    credentials: true,
  })
);
app.use(cookieParser());
app.use(bodyParser.json({ limit: "50mb" }));
app.use(bodyParser.urlencoded({ limit: "50mb", extended: true }));

// Routes
import userRoutes from "./routes/user.routes";
app.use("/api/auth", userRoutes);

import issuRoutes from "./routes/issue.routes";
app.use("/api/issue", issuRoutes);

import reviewRoutes from "./routes/review.routes";
import { UploadImage } from "./utils/UploadImage";
app.use("/api/review", reviewRoutes);

app.post("/uploadImage", (req, res) => {
  UploadImage(req.body.image)
    .then((url) => res.send(url))
    .catch((error) => res.status(500).send(error));
});

app.get("/", (_req: Request, res: Response) => {
  res.send(
    "Citizen Driven Issue Reporting & Tracking System Server is Running..."
  );
});

// global error handler
app.use(globalErrorHandler);

export default app;
