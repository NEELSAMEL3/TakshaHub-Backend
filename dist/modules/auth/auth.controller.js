var _a;
import { AuthService } from "./auth.service";
import logger from "../../config/logger";
import { asyncHandler } from "../../common/utils/asyncHandler";
import { clearRefreshCookie, setRefreshCookie, } from "../../common/utils/helpers";
import { AppError } from "../../common/errors/AppError";
export class AuthController {
}
_a = AuthController;
/* ---------------- REGISTER ---------------- */
AuthController.register = asyncHandler(async (req, res) => {
    const { fullName, email, password, phoneNumber, school } = req.body;
    logger.info("AuthController.register started", { email });
    const result = await AuthService.register({
        fullName,
        email,
        password,
        phoneNumber,
        school,
    });
    logger.info("AuthController.register success", {
        userId: result.user.id,
    });
    return res.status(201).json({
        success: true,
        message: "User registered successfully",
        data: result,
    });
});
/* ---------------- LOGIN ---------------- */
AuthController.login = asyncHandler(async (req, res) => {
    const { email, password, schoolId } = req.body;
    logger.info("AuthController.login started", { email });
    // ✅ REQUIRED META
    const meta = {
        ip: req.ip,
        userAgent: req.headers["user-agent"] || "unknown",
        deviceId: req.headers["x-device-id"], // 🔥 IMPORTANT
    };
    const result = await AuthService.login({ email, password, schoolId }, meta);
    // ✅ set refresh cookie
    setRefreshCookie(res, result.refreshToken);
    logger.info("AuthController.login success", { email });
    return res.status(200).json({
        success: true,
        message: "Login successful",
        data: {
            accessToken: result.accessToken,
            user: result.user,
            member: result.member,
        },
    });
});
/* ---------------- REFRESH ---------------- */
AuthController.refresh = asyncHandler(async (req, res) => {
    logger.info("AuthController.refresh started");
    const refreshToken = req.cookies.refreshToken;
    if (!refreshToken) {
        throw new AppError("Unauthorized", 401);
    }
    const meta = {
        ip: req.ip,
        userAgent: req.headers["user-agent"] || "unknown",
        deviceId: req.headers["x-device-id"], // 🔥 REQUIRED
    };
    const tokens = await AuthService.refresh(refreshToken, meta);
    // ✅ rotate cookie
    setRefreshCookie(res, tokens.refreshToken);
    logger.info("AuthController.refresh success");
    return res.status(200).json({
        success: true,
        message: "Token refreshed",
        data: {
            accessToken: tokens.accessToken,
        },
    });
});
/* ---------------- LOGOUT ---------------- */
AuthController.logout = asyncHandler(async (req, res) => {
    logger.info("AuthController.logout started");
    const refreshToken = req.cookies.refreshToken;
    if (refreshToken) {
        await AuthService.logout(refreshToken);
    }
    clearRefreshCookie(res);
    logger.info("AuthController.logout success");
    return res.status(200).json({
        success: true,
        message: "Logged out successfully",
    });
});
//# sourceMappingURL=auth.controller.js.map