import express from "express";
import type { Application, Request, Response } from "express";
import routes from "./routes.js";
import { errorHandler } from "./common/middleware/error.middleware.js";
import cookieParser from "cookie-parser";
import cors, { type CorsOptions } from "cors";

const app: Application = express();

const allowedOrigins = (process.env.CORS_ORIGIN ??
  "http://localhost:3000,http://127.0.0.1:3000")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

const corsOptions: CorsOptions = {
  origin(origin, callback) {
    // Allow tools like curl/Postman that may not send an Origin header.
    if (!origin) {
      callback(null, true);
      return;
    }

    if (allowedOrigins.includes(origin)) {
      callback(null, true);
      return;
    }

    callback(new Error(`CORS blocked for origin: ${origin}`));
  },
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "x-device-id"],
  credentials: true,
};

app.use(cors(corsOptions));

app.use(express.json());
app.use(cookieParser());

app.get("/", (req: Request, res: Response) => {
  res.send("Welcome to TakshaHub 🚀");
});

app.use("/api", routes);

app.use(errorHandler);

export default app;
