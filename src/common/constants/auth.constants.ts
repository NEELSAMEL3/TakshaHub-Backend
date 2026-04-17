/**
 * Authentication Constants
 * Centralized configuration for all auth-related values
 */

/* ============ BCRYPT ============ */
export const BCRYPT_ROUNDS = Number(process.env.BCRYPT_ROUNDS ?? 10);

/* ============ JWT ============ */
export const JWT_ACCESS_SECRET = process.env.JWT_ACCESS_SECRET;
export const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET;
export const JWT_ACCESS_EXPIRES_IN = "15m"; // 15 minutes
export const JWT_REFRESH_EXPIRES_IN = "7d"; // 7 days
export const REFRESH_EXPIRES_DAYS = Number(process.env.REFRESH_DAYS ?? 7);

/* ============ OTP ============ */
export const OTP_SECRET = process.env.OTP_SECRET;
export const OTP_LENGTH = 6;
export const OTP_EXPIRY_SECONDS = 10 * 60; // 10 minutes
export const OTP_MAX_ATTEMPTS = 3;
export const OTP_ATTEMPT_WINDOW_SECONDS = 10 * 60; // 10 minutes
export const OTP_LOCK_DURATION_SECONDS = 60 * 60; // 1 hour
export const OTP_RESEND_COOLDOWN_SECONDS = 60; // 1 minute

/* ============ SESSION ============ */
export const MAX_SESSIONS_PER_USER = Number(process.env.MAX_SESSIONS ?? 5);
export const SESSION_ABSOLUTE_TIMEOUT_DAYS = 30; // 30 days
export const SESSION_IDLE_TIMEOUT_DAYS = 7; // 7 days

/* ============ RATE LIMITS ============ */
export const RATE_LIMITS = {
  login: {
    limit: 5,
    windowSec: 15 * 60, // 15 minutes
  },
  loginEmail: {
    limit: 10,
    windowSec: 15 * 60,
  },
  register: {
    limit: 3,
    windowSec: 60 * 60, // 1 hour
  },
  otpVerify: {
    limit: 5,
    windowSec: 10 * 60, // 10 minutes
  },
  otpResend: {
    limit: 3,
    windowSec: 5 * 60, // 5 minutes
  },
  refresh: {
    limit: 20,
    windowSec: 15 * 60,
  },
  burst: {
    limit: 50,
    windowSec: 10,
  },
  global: {
    limit: 500,
    windowSec: 15 * 60,
  },
};

/* ============ REDIS KEYS ============ */
export const REDIS_KEYS = {
  // OTP
  otp: (email: string) => `verify:otp:${email}`,
  otpAttempts: (email: string) => `verify:attempts:${email}`,
  otpLock: (email: string) => `verify:lock:${email}`,
  otpResendCooldown: (email: string) => `verify:resend:${email}`,

  // Login
  loginAttempts: (email: string) => `login:attempts:${email}`,
  loginLock: (email: string) => `login:lock:${email}`,

  // Rate limiting
  rl: {
    login: (ip: string, email: string) => `rl:login:${ip}:${email}`,
    loginEmail: (email: string) => `rl:login:email:${email}`,
    register: (ip: string) => `rl:register:${ip}`,
    ip: (ip: string) => `rl:ip:${ip}`,
    burst: (ip: string) => `rl:burst:${ip}`,
    otpVerify: (email: string) => `rl:otp:verify:${email}`,
  },
};

/* ============ ERROR MESSAGES ============ */
export const AUTH_ERRORS = {
  // General
  UNAUTHORIZED: "Unauthorized",
  FORBIDDEN: "Forbidden",
  NOT_FOUND: "Not found",

  // Headers
  MISSING_DEVICE_ID: "Device ID header (x-device-id) is required",
  MISSING_USER_AGENT: "User Agent header is required",
  MISSING_AUTH_HEADER: "Authorization header is missing",
  INVALID_AUTH_FORMAT: "Invalid authorization format. Use: Bearer <token>",

  // Token
  TOKEN_EXPIRED: "Token has expired",
  INVALID_TOKEN: "Invalid token",
  TOKEN_MISMATCH: "Token mismatch",

  // User
  USER_NOT_FOUND: "User not found",
  EMAIL_EXISTS: "Email already registered",
  ALREADY_VERIFIED: "Already verified",
  NOT_VERIFIED: "Please verify your email first",
  ACCOUNT_LOCKED: "Account locked. Try again later",
  ACCOUNT_DISABLED: "Account is disabled",

  // Credentials
  INVALID_CREDENTIALS: "Invalid email or password",

  // OTP
  OTP_EXPIRED: "OTP expired. Please resend OTP",
  OTP_INVALID: "Invalid OTP",
  OTP_PARSE_ERROR: "Invalid OTP data. Please resend OTP",
  TOO_MANY_OTP_ATTEMPTS: "Too many incorrect OTP attempts. Please resend OTP",

  // Rate limiting
  RATE_LIMITED: "Too many requests. Please try again later",
  TOO_MANY_LOGIN_ATTEMPTS: "Too many login attempts. Try again in 15 minutes.",
  TOO_MANY_OTP_ATTEMPTS_RATE: "Too many OTP attempts. Please wait before trying again.",

  // Session
  SESSION_EXPIRED: "Session expired",
  SESSION_COMPROMISED: "Session compromised. Please login again.",
  DEVICE_MISMATCH: "Device mismatch",

  // School
  NO_SCHOOL_ACCESS: "You do not have access to this school",
  NO_SCHOOL_MEMBERSHIP: "No active school membership",
  SCHOOL_NOT_FOUND: "School not found",

  // Server
  SERVER_ERROR: "Internal server error",
};

/* ============ SUCCESS MESSAGES ============ */
export const AUTH_SUCCESS = {
  REGISTER: "Registration successful. Please verify your email.",
  OTP_SENT: "OTP sent successfully. Please verify your email.",
  OTP_VERIFIED: "Email verified successfully",
  OTP_RESENT: "OTP resent successfully",
  LOGIN: "Login successful",
  LOGOUT: "Logged out successfully",
  LOGOUT_ALL: "Logged out from all devices successfully",
  TOKEN_REFRESHED: "Token refreshed successfully",
};

/* ============ REGEX PATTERNS ============ */
export const PATTERNS = {
  email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  password: /^(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*])(?=.{8,})/,
  phoneNumber: /^\+?[1-9]\d{1,14}$/,
  fullName: /^[a-zA-Z\s'-]{2,100}$/,
  udiseNumber: /^\d{11}$/,
  otp: /^\d{6}$/,
};

/* ============ ENUM CONSTRAINTS ============ */
export const ROLE_HIERARCHY = {
  ADMIN: 3,
  STAFF: 2,
  TEACHER: 1,
  STUDENT: 0,
};

export const SCHOOL_TYPES = ["PUBLIC", "PRIVATE", "OTHER"] as const;
export const SCHOOL_BOARDS = ["CBSE", "ICSE", "STATE", "OTHER"] as const;

export default {
  BCRYPT_ROUNDS,
  JWT_ACCESS_EXPIRES_IN,
  JWT_REFRESH_EXPIRES_IN,
  OTP_LENGTH,
  OTP_EXPIRY_SECONDS,
  MAX_SESSIONS_PER_USER,
  RATE_LIMITS,
  REDIS_KEYS,
  AUTH_ERRORS,
  AUTH_SUCCESS,
  PATTERNS,
  ROLE_HIERARCHY,
};
