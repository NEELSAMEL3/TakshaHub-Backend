import express from "express";
import type { Application, Request, Response } from "express";
import routes from "./routes.js";
import { errorHandler } from "./common/middleware/error.middleware.js";
import cookieParser from "cookie-parser";

const app: Application = express();

app.use(express.json());
app.use(cookieParser());

app.get("/", (req: Request, res: Response) => {
  res.send("Welcome to TakshaHub 🚀");
});

app.use("/api", routes);

app.use(errorHandler);

export default app;
