import { Router, type Request, type Response, type NextFunction } from "express";
import { validate } from "../../common/middleware/validate";
import {
  registerSchema,
  loginSchema,
  verifyOtpSchema,
  resendOtpSchema,
  requestPasswordResetSchema,
  resetPasswordSchema,
} from "./auth.schema";
import {
  registerRateLimiter,
  loginRateLimiter,
  otpVerifyRateLimiter,
  otpResendRateLimiter,
  refreshRateLimiter,
} from "../../common/middleware/Limiter.middleware";
import {
  requiredAuth,
  requireSession,
} from "../../common/middleware/requireRole.middleware";
import { AuthController } from "./auth.controller";
import { AppError } from "../../common/errors/AppError";

const router = Router();

/* ============ MIDDLEWARE ============ */

/**
 * Validate device headers
 */
const validateDeviceHeaders = (
  req: Request,
  _res: Response,
  next: NextFunction
) => {
  const deviceId = req.headers["x-device-id"];
  const userAgent = req.headers["user-agent"];

  if (!deviceId || typeof deviceId !== "string") {
    throw new AppError("Device ID header (x-device-id) is required", 400);
  }

  if (!userAgent) {
    throw new AppError("User Agent header is required", 400);
  }

  next();
};

/* ============ REGISTER ============ */
/**
 * POST /auth/register
 * Register a new user with school details
 */
router.post(
  "/register",
  registerRateLimiter,
  validate(registerSchema),
  AuthController.register
);

/* ============ VERIFY OTP ============ */
/**
 * POST /auth/verify-otp
 * Verify OTP for email verification
 */
router.post(
  "/verify-otp",
  otpVerifyRateLimiter,
  validate(verifyOtpSchema),
  AuthController.verifyOtp
);

/* ============ RESEND OTP ============ */
/**
 * POST /auth/resend-otp
 * Resend OTP if not received
 */
router.post(
  "/resend-otp",
  otpResendRateLimiter,
  validate(resendOtpSchema),
  AuthController.resendOtp
);

/* ============ LOGIN ============ */
/**
 * POST /auth/login
 * User login with email and password
 * Required headers: x-device-id, user-agent (added automatically by browser)
 */
router.post(
  "/login",
  loginRateLimiter,
  validateDeviceHeaders,
  validate(loginSchema),
  AuthController.login
);

/* ============ REFRESH TOKEN ============ */
/**
 * POST /auth/refresh
 * Refresh access token using refresh token from cookie
 * Required headers: x-device-id
 */
router.post(
  "/refresh",
  refreshRateLimiter,
  validateDeviceHeaders,
  AuthController.refresh
);

/* ============ LOGOUT ============ */
/**
 * POST /auth/logout
 * Logout current session by revoking refresh token
 */
router.post(
  "/logout",
  validateDeviceHeaders,
  AuthController.logout
);

/* ============ LOGOUT ALL DEVICES ============ */
/**
 * POST /auth/logout-all
 * Logout from all devices by revoking all refresh tokens
 * Requires: valid access token
 */
router.post(
  "/logout-all",
  requiredAuth,
  requireSession,
  AuthController.logoutAll
);

/* ============ REQUEST PASSWORD RESET ============ */
/**
 * POST /auth/forgot-password
 * Request password reset by sending OTP to email
 */
router.post(
  "/forgot-password",
  otpResendRateLimiter,
  validate(requestPasswordResetSchema),
  AuthController.requestPasswordReset
);

/* ============ RESET PASSWORD ============ */
/**
 * POST /auth/reset-password
 * Reset password using OTP from email
 */
router.post(
  "/reset-password",
  otpVerifyRateLimiter,
  validate(resetPasswordSchema),
  AuthController.resetPassword
);

/* ============ HEALTH CHECK ============ */
/**
 * GET /auth/health
 * Check if auth service is running
 */
router.get("/health", (_req, res) => {
  res.status(200).json({ success: true, message: "Auth service is running" });
});

export default router;