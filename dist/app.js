import express from "express";
import authRoutes from "./modules/auth/auth.routes.js";
const app = express();
app.use(express.json());
app.get("/", (req, res) => {
    res.send("Welcome To Taskshahub 🚀");
});
// Routes
app.use("/api/auth", authRoutes);
export default app;
//# sourceMappingURL=app.js.map