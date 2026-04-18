var _a;
import { AuthService } from "./auth.service";
import logger from "../../config/logger";
import { asyncHandler } from "../../common/utils/asyncHandler";
import { clearRefreshCookie, setRefreshCookie, } from "../../common/utils/helpers";
import { AppError } from "../../common/errors/AppError";
export class AuthController {
}
_a = AuthController;
/* ============ REGISTER ============ */
AuthController.register = asyncHandler(async (req, res) => {
    const { fullName, email, password, phoneNumber, school } = req.body;
    logger.info("Auth: Register started", { email });
    const result = await AuthService.register({
        fullName,
        email,
        password,
        phoneNumber,
        school,
    });
    logger.info("Auth: Register success", { email });
    return res.status(201).json({
        success: true,
        message: result.message,
        data: result,
    });
});
/* ============ VERIFY OTP ============ */
AuthController.verifyOtp = asyncHandler(async (req, res) => {
    const { email, otp } = req.body;
    logger.info("Auth: Verify OTP started", { email });
    const result = await AuthService.verifyOtp(email, otp);
    logger.info("Auth: Verify OTP success", { email });
    return res.status(200).json({
        success: true,
        message: result.message,
        data: result,
    });
});
/* ============ RESEND OTP ============ */
AuthController.resendOtp = asyncHandler(async (req, res) => {
    const { email } = req.body;
    logger.info("Auth: Resend OTP started", { email });
    const result = await AuthService.resendOtp(email);
    logger.info("Auth: Resend OTP success", { email });
    return res.status(200).json({
        success: true,
        message: result.message,
        data: result,
    });
});
/* ============ LOGIN ============ */
AuthController.login = asyncHandler(async (req, res) => {
    const { email, password, schoolId } = req.body;
    const deviceId = req.get("x-device-id");
    const userAgent = req.get("user-agent");
    if (!deviceId || !userAgent) {
        throw new AppError("Missing required headers (x-device-id, user-agent)", 400);
    }
    logger.info("Auth: Login started", { email });
    const meta = {
        ip: req.ip ?? "0.0.0.0",
        userAgent,
        deviceId,
    };
    const result = await AuthService.login({ email, password, schoolId }, meta);
    setRefreshCookie(res, result.refreshToken);
    logger.info("Auth: Login success", { email });
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
/* ============ REFRESH TOKEN ============ */
AuthController.refresh = asyncHandler(async (req, res) => {
    const refreshToken = req.cookies.refreshToken;
    if (!refreshToken) {
        throw new AppError("Refresh token not found", 401);
    }
    const deviceId = req.get("x-device-id");
    const userAgent = req.get("user-agent");
    if (!deviceId || !userAgent) {
        throw new AppError("Missing required headers", 400);
    }
    logger.info("Auth: Refresh token started");
    const meta = {
        ip: req.ip ?? "0.0.0.0",
        userAgent,
        deviceId,
    };
    const tokens = await AuthService.refresh(refreshToken, meta);
    setRefreshCookie(res, tokens.refreshToken);
    logger.info("Auth: Refresh token success");
    return res.status(200).json({
        success: true,
        message: "Token refreshed successfully",
        data: {
            accessToken: tokens.accessToken,
        },
    });
});
/* ============ LOGOUT ============ */
AuthController.logout = asyncHandler(async (req, res) => {
    const refreshToken = req.cookies.refreshToken;
    logger.info("Auth: Logout started");
    if (refreshToken) {
        await AuthService.logout(refreshToken);
    }
    clearRefreshCookie(res);
    logger.info("Auth: Logout success");
    return res.status(200).json({
        success: true,
        message: "Logged out successfully",
    });
});
/* ============ LOGOUT ALL DEVICES ============ */
AuthController.logoutAll = asyncHandler(async (req, res) => {
    const userId = req.user?.userId;
    if (!userId) {
        throw new AppError("Unauthorized", 401);
    }
    logger.info("Auth: Logout all devices started", { userId });
    await AuthService.logoutAll(userId);
    clearRefreshCookie(res);
    logger.info("Auth: Logout all devices success", { userId });
    return res.status(200).json({
        success: true,
        message: "Logged out from all devices successfully",
    });
});
/* ============ REQUEST PASSWORD RESET ============ */
AuthController.requestPasswordReset = asyncHandler(async (req, res) => {
    const { email } = req.body;
    logger.info("Auth: Request password reset started", { email });
    const result = await AuthService.requestPasswordReset(email);
    logger.info("Auth: Request password reset success", { email });
    return res.status(200).json({
        success: true,
        message: result.message,
        data: {
            expirySeconds: result.expirySeconds,
        },
    });
});
/* ============ RESET PASSWORD ============ */
AuthController.resetPassword = asyncHandler(async (req, res) => {
    const { email, otp, newPassword } = req.body;
    logger.info("Auth: Reset password started", { email });
    const result = await AuthService.resetPassword(email, otp, newPassword);
    logger.info("Auth: Reset password success", { email });
    clearRefreshCookie(res);
    return res.status(200).json({
        success: true,
        message: result.message,
    });
});
//# sourceMappingURL=auth.controller.js.map