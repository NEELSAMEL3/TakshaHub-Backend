import { Router, } from "express";
import { validate } from "../../common/middleware/validate";
import { AuthController } from "./auth.controller";
import { registerSchema, loginSchema } from "../../schemas/auth.schema";
import { authLimiter, loginLimiter, loginEmailLimiter, // 🔥 NEW
refreshLimiter, rateLimiterMiddleware, // 🔥 NEW
 } from "../../common/middleware/Limiter.middleware";
import { AppError } from "../../common/errors/AppError";
const router = Router();
/* ---------------- GLOBAL RATE LIMIT ---------------- */
// 🔥 applies burst + global protection to all auth routes
router.use(rateLimiterMiddleware);
/* ---------------- MIDDLEWARE ---------------- */
const requireDeviceId = (req, _res, next) => {
    const deviceId = req.headers["x-device-id"];
    if (!deviceId || typeof deviceId !== "string") {
        throw new AppError("Device ID is required", 400);
    }
    next();
};
/* ---------------- LOGIN ---------------- */
router.post("/login", loginLimiter, loginEmailLimiter, // 🔥 protects against IP rotation attacks
requireDeviceId, validate(loginSchema), // must include schoolId
AuthController.login);
/* ---------------- REGISTER ---------------- */
router.post("/register", authLimiter, validate(registerSchema), AuthController.register);
/* ---------------- REFRESH ---------------- */
router.post("/refresh", refreshLimiter, requireDeviceId, AuthController.refresh);
/* ---------------- LOGOUT ---------------- */
router.post("/logout", requireDeviceId, AuthController.logout);
export default router;
//# sourceMappingURL=auth.routes.js.map