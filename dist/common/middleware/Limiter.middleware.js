import Redis from "ioredis";
import { AppError } from "../errors/AppError";
/* ---------------- CONFIG ---------------- */
const REDIS_HOST = process.env.REDIS_HOST;
const REDIS_PORT = Number(process.env.REDIS_PORT ?? 6379);
const FAIL_OPEN = process.env.RATE_LIMIT_FAIL_OPEN === "true";
/* ---------------- REDIS CLIENT ---------------- */
export const redis = new Redis({
    host: REDIS_HOST,
    port: REDIS_PORT,
    maxRetriesPerRequest: 3,
    enableReadyCheck: true,
    lazyConnect: true,
});
// ✅ ensure connection
redis.connect().catch(() => {
    console.error("❌ Redis initial connection failed");
});
redis.on("connect", () => console.log("🟢 Redis connected"));
redis.on("error", (err) => console.error("🔴 Redis error:", err));
/* ---------------- IP EXTRACTION ---------------- */
const getIp = (req) => {
    const xff = req.headers["x-forwarded-for"];
    if (typeof xff === "string")
        return xff.split(",")[0].trim();
    return req.ip || req.socket.remoteAddress || "unknown-ip";
};
/* ---------------- LUA SCRIPT ---------------- */
const SLIDING_WINDOW_LUA = `
local key = KEYS[1]
local now = tonumber(ARGV[1])
local window = tonumber(ARGV[2])

redis.call("ZREMRANGEBYSCORE", key, 0, now - window)
redis.call("ZADD", key, now, now)

local count = redis.call("ZCARD", key)

if redis.call("TTL", key) == -1 then
  redis.call("EXPIRE", key, math.ceil(window / 1000))
end

return count
`;
/* ---------------- CORE ---------------- */
const evaluateLimit = async (key, limit, windowSec) => {
    try {
        const now = Date.now();
        const count = (await redis.eval(SLIDING_WINDOW_LUA, 1, key, String(now), String(windowSec * 1000)));
        return {
            blocked: count > limit,
            remaining: Math.max(0, limit - count),
        };
    }
    catch (err) {
        console.error("Rate limiter Redis failure:", err);
        return {
            blocked: !FAIL_OPEN,
            remaining: 0,
        };
    }
};
/* ---------------- KEY STRATEGY ---------------- */
const buildKeys = {
    login: (req) => {
        const ip = getIp(req);
        const email = (req.body?.email ?? "no-email").toLowerCase().trim();
        return `rl:login:${ip}:${email}`;
    },
    loginEmail: (req) => {
        const email = (req.body?.email ?? "no-email").toLowerCase().trim();
        return `rl:login:email:${email}`;
    },
    ip: (req) => `rl:ip:${getIp(req)}`,
    burst: (req) => `rl:burst:${getIp(req)}`,
};
const createLimiter = (keyFn, rule) => async (req, res, next) => {
    const { blocked, remaining } = await evaluateLimit(keyFn(req), rule.limit, rule.windowSec);
    // ✅ standard headers
    res.setHeader("X-RateLimit-Limit", rule.limit);
    res.setHeader("X-RateLimit-Remaining", remaining);
    if (blocked) {
        return next(new AppError(rule.message, 429));
    }
    next();
};
/* ---------------- LIMITERS ---------------- */
export const loginLimiter = createLimiter(buildKeys.login, {
    limit: 5,
    windowSec: 15 * 60,
    message: "Too many login attempts. Try again later.",
});
// 🔥 NEW (prevents IP rotation attack)
export const loginEmailLimiter = createLimiter(buildKeys.loginEmail, {
    limit: 10,
    windowSec: 15 * 60,
    message: "Too many login attempts for this account.",
});
export const authLimiter = createLimiter(buildKeys.ip, {
    limit: 10,
    windowSec: 10 * 60,
    message: "Too many auth attempts. Try later.",
});
export const refreshLimiter = createLimiter(buildKeys.ip, {
    limit: 20,
    windowSec: 15 * 60,
    message: "Too many refresh requests.",
});
export const globalLimiter = createLimiter(buildKeys.ip, {
    limit: 120,
    windowSec: 15 * 60,
    message: "Too many requests. Slow down.",
});
export const burstLimiter = createLimiter(buildKeys.burst, {
    limit: 10,
    windowSec: 10,
    message: "Too many rapid requests.",
});
/* ---------------- COMPOSITE (FIXED) ---------------- */
// ✅ correct express chaining
export const rateLimiterMiddleware = [burstLimiter, globalLimiter];
//# sourceMappingURL=Limiter.middleware.js.map