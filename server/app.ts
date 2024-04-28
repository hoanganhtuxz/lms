import { userRouter } from "./routes/user.route";
import { categoriesRouter } from "./routes/categories.route";
import express, { NextFunction, Request, Response } from "express";
import dotenv from "dotenv";
export const app = express();
import cors from "cors";
import cookieParser from "cookie-parser";
import { ErrorMiddieware } from "./middieware/error";
import warehouseRouter from "./routes/warehouse.route";
import statusRouter from "./routes/status.route";
import classificationRouter from "./routes/classification.route";
import { conditionRouter } from './routes/condition.route';

// Load environment variables from .env file
dotenv.config();

// body parser
app.use(express.json({ limit: "50mb" }));

// cookie  parser
app.use(cookieParser());


// cors => cross origin resource sharing
app.use(
  cors({
    origin:'http://localhost:3000',
      // origin: process.env.ORIGIN,
    credentials:true,
    methods: ["GET", "POST", "PUT", "DELETE"], // Cho phép các phương thức HTTP cụ thể
    allowedHeaders: ["Content-Type"], // Cho phép các header cụ thể
  })
);


// Middleware để thiết lập headers CORS
app.use((req: Request, res: Response, next: NextFunction) => {
  res.header("Access-Control-Allow-Origin", "http://localhost:3000");
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE");
  res.header("Access-Control-Allow-Headers", "Content-Type");
  res.header("Access-Control-Allow-Credentials", "true");
  next();
});

// router
app.use("/api/v1", userRouter);
app.use("/api/v1", categoriesRouter);
app.use("/api/v1", warehouseRouter);
app.use("/api/v1", statusRouter);
app.use("/api/v1", classificationRouter);
app.use("/api/v1", conditionRouter);

// testing  api

app.get("/test", (req: Request, res: Response, next: NextFunction) => {
  res.status(200).json({
    succcess: true,
    message: "API is working",
  });
});

// unknown router
app.all("*", (req: Request, res: Response, next: NextFunction) => {
  const err = new Error(`Route ${req.originalUrl} not found`) as any;
  err.statusCode = 404;
  next(err);
});

app.use(ErrorMiddieware);
