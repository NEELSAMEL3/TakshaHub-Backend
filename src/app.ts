import express from "express";
import type { Application, Request, Response } from "express";
import authRoutes from "./modules/auth/auth.routes";

const app: Application = express();

app.use(express.json());

app.get("/", (req: Request, res: Response) => {
  res.send("Welcome To Taskshahub 🚀");
});

// Routes
app.use("/api/auth", authRoutes);

export default app;
