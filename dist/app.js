import express from "express";
import authRoutes from "./modules/auth/auth.routes";
import { errorHandler } from "./common/middleware/error.middleware";
import cookieParser from "cookie-parser";
const app = express();
app.use(express.json());
app.use(cookieParser());
app.get("/", (req, res) => {
    res.send("Welcome To Taskshahub 🚀");
});
// Routes
app.use("/api/auth", authRoutes);
app.use(errorHandler);
export default app;
//# sourceMappingURL=app.js.map