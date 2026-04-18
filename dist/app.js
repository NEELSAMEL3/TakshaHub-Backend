import express from "express";
import routes from "./routes";
import { errorHandler } from "./common/middleware/error.middleware";
import cookieParser from "cookie-parser";
const app = express();
app.use(express.json());
app.use(cookieParser());
app.get("/", (req, res) => {
    res.send("Welcome to TakshaHub 🚀");
});
app.use("/api", routes);
app.use(errorHandler);
export default app;
//# sourceMappingURL=app.js.map