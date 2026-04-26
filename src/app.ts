import express from "express";
import type { Application, Request, Response } from "express";
import routes from "./routes.js";
import { errorHandler } from "./common/middleware/error.middleware.js";
import cookieParser from "cookie-parser";
import cors from "cors";

const app: Application = express();

app.use(cors({
  origin: process.env.CORS_ORIGIN || "*",
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true
}));

app.use(express.json());
app.use(cookieParser());

app.get("/", (req: Request, res: Response) => {
  res.send("Welcome to TakshaHub 🚀");
});

app.use("/api", routes);

app.use(errorHandler);

export default app;
