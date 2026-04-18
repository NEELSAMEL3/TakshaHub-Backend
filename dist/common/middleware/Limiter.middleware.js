import { AppError } from "../errors/AppError";
import { redis } from "../../config/redis";
/* ============ HELPERS ============ */
/**
 * Extract IP address from request
 * Supports X-Forwarded-For headers for reverse proxies
 */
const getClientIp = (req) => {
    const xForwardedFor = req.headers["x-forwarded-for"];
    if (typeof xForwardedFor === "string") {
        const ip = xForwardedFor.split(",")[0]?.trim();
        return ip || "unknown";
    }
    if (Array.isArray(xForwardedFor) && xForwardedFor.length > 0) {
        return xForwardedFor[0] || "unknown";
    }
    return req.ip || req.socket?.remoteAddress || "unknown";
};
/**
 * Normalize email for rate limiting
 */
const normalizeEmail = (email) => {
    return email?.trim().toLowerCase() || "no-email";
};
/**
 * Evaluate rate limit against Redis
 * Returns blocked status and remaining requests
 */
const evaluateLimit = async (key, limit, windowSec) => {
    try {
        const count = await redis.incr(key);
        // Set expiry only on first hit (efficiency)
        if (count === 1) {
            await redis.expire(key, windowSec);
        }
        return {
            blocked: count > limit,
            remaining: Math.max(0, limit - count),
        };
    }
    catch (error) {
        // Fail-open: don't block users if Redis fails
        console.error("🔴 Rate limiter error:", error);
        return {
            blocked: false,
            remaining: limit,
        };
    }
};
/* ============ KEY STRATEGIES ============ */
const keyStrategies = {
    // Email-based login limiter (per account)
    login: (req) => {
        const ip = getClientIp(req);
        const email = normalizeEmail(req.body?.email || "");
        return `rl:login:${ip}:${email}`;
    },
    // Email-only limiter (cross-IP)
    loginEmail: (req) => {
        const email = normalizeEmail(req.body?.email || "");
        return `rl:login:email:${email}`;
    },
    // IP-based limiter
    ip: (req) => {
        const ip = getClientIp(req);
        return `rl:ip:${ip}`;
    },
    // Burst limiter (rapid requests)
    burst: (req) => {
        const ip = getClientIp(req);
        return `rl:burst:${ip}`;
    },
    // OTP verification limiter
    otpVerify: (req) => {
        const email = normalizeEmail(req.body?.email || "");
        return `rl:otp:verify:${email}`;
    },
    // Register limiter
    register: (req) => {
        const ip = getClientIp(req);
        return `rl:register:${ip}`;
    },
};
/* ============ RATE LIMIT RULES ============ */
const limitRules = {
    // Login: 5 attempts per 15 minutes
    login: {
        limit: 5,
        windowSec: 15 * 60,
        message: "Too many login attempts. Please try again in 15 minutes.",
    },
    // Login per email: 10 attempts per 15 minutes (prevent targeted attacks)
    loginEmail: {
        limit: 10,
        windowSec: 15 * 60,
        message: "Too many login attempts for this account. Try again later.",
    },
    // Register: 3 attempts per hour
    register: {
        limit: 3,
        windowSec: 60 * 60,
        message: "Too many registration attempts. Try again after 1 hour.",
    },
    // OTP verification: 5 attempts per 10 minutes
    otpVerify: {
        limit: 5,
        windowSec: 10 * 60,
        message: "Too many OTP verification attempts. Please resend OTP.",
    },
    // OTP resend: 3 attempts per 5 minutes
    otpResend: {
        limit: 3,
        windowSec: 5 * 60,
        message: "Too many OTP resend requests. Please wait before trying again.",
    },
    // Refresh token: 20 attempts per 15 minutes
    refresh: {
        limit: 20,
        windowSec: 15 * 60,
        message: "Too many refresh requests. Please try again later.",
    },
    // General auth endpoint: 30 per 10 minutes
    auth: {
        limit: 30,
        windowSec: 10 * 60,
        message: "Too many authentication requests. Slow down.",
    },
    // Burst protection: 50 per 10 seconds (across all routes)
    burst: {
        limit: 50,
        windowSec: 10,
        message: "Too many rapid requests. Please slow down.",
    },
    // Global API: 500 per 15 minutes
    global: {
        limit: 500,
        windowSec: 15 * 60,
        message: "Too many requests. Please slow down.",
    },
};
/* ============ FACTORY FUNCTION ============ */
/**
 * Create a rate limit middleware
 */
const createLimiter = (keyFn, rule, options = {}) => async (req, res, next) => {
    // Allow skipping rate limit
    if (options.skip?.(req)) {
        return next();
    }
    const key = keyFn(req);
    const { blocked, remaining } = await evaluateLimit(key, rule.limit, rule.windowSec);
    // Set standard rate limit headers
    res.setHeader("X-RateLimit-Limit", rule.limit);
    res.setHeader("X-RateLimit-Remaining", remaining);
    res.setHeader("X-RateLimit-Reset", Math.ceil(rule.windowSec));
    if (blocked) {
        options.onRateLimited?.(req, res);
        return next(new AppError(rule.message, 429));
    }
    next();
};
/* ============ MIDDLEWARE INSTANCES ============ */
export const rateLimitMiddlewares = {
    // 🔐 Login protection (2 layers)
    login: [
        createLimiter(keyStrategies.login, limitRules['login']),
        createLimiter(keyStrategies.loginEmail, limitRules['loginEmail']),
    ],
    // 📝 Register protection
    register: createLimiter(keyStrategies.register, limitRules['register']),
    // 🔐 OTP verification protection
    otpVerify: createLimiter(keyStrategies.otpVerify, limitRules['otpVerify']),
    // 🔄 OTP resend protection
    otpResend: createLimiter(keyStrategies.otpVerify, limitRules['otpResend']),
    // 🔄 Refresh token protection
    refresh: createLimiter(keyStrategies.ip, limitRules['refresh']),
    // 🌐 General auth endpoints
    auth: createLimiter(keyStrategies.ip, limitRules['auth']),
    // ⚡ Burst protection (global)
    burst: createLimiter(keyStrategies.burst, limitRules['burst']),
    // 🌍 Global API protection
    global: createLimiter(keyStrategies.ip, limitRules['global']),
};
/* ============ COMPOSITE MIDDLEWARES ============ */
/**
 * Global rate limiter to apply on all routes
 */
export const globalRateLimiter = [
    rateLimitMiddlewares.burst,
    rateLimitMiddlewares.global,
];
/**
 * Auth endpoints protection
 */
export const authRateLimiter = [
    rateLimitMiddlewares.burst,
    rateLimitMiddlewares.auth,
];
/**
 * Login protection (stronger)
 */
export const loginRateLimiter = [
    rateLimitMiddlewares.burst,
    ...rateLimitMiddlewares.login,
];
/**
 * Register protection
 */
export const registerRateLimiter = [
    rateLimitMiddlewares.burst,
    rateLimitMiddlewares.register,
];
/**
 * OTP verification protection
 */
export const otpVerifyRateLimiter = [
    rateLimitMiddlewares.burst,
    rateLimitMiddlewares.otpVerify,
];
/**
 * OTP resend protection
 */
export const otpResendRateLimiter = [
    rateLimitMiddlewares.burst,
    rateLimitMiddlewares.otpResend,
];
/**
 * Token refresh protection
 */
export const refreshRateLimiter = [
    rateLimitMiddlewares.burst,
    rateLimitMiddlewares.refresh,
];
export default rateLimitMiddlewares;
//# sourceMappingURL=Limiter.middleware.js.map