import express from "express";
import type { Application, Request, Response } from "express";
import authRoutes from "./modules/auth/auth.routes";
import { errorHandler } from "./common/middleware/error.middleware";
import cookieParser from "cookie-parser";

const app: Application = express();

app.use(express.json());
app.use(cookieParser());

app.get("/", (req: Request, res: Response) => {
  res.send("Welcome To Taskshahub 🚀");
});

// Routes
app.use("/api/auth", authRoutes);


app.use(errorHandler);

export default app;
