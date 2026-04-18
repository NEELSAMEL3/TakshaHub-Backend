import { UAParser } from "ua-parser-js"; // ✅ FIXED
import crypto from "crypto";
export const setRefreshCookie = (res, token) => {
    res.cookie("refreshToken", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        path: "/auth/refresh",
        maxAge: 7 * 24 * 60 * 60 * 1000,
        priority: "high",
    });
};
export const clearRefreshCookie = (res) => {
    res.clearCookie("refreshToken", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        path: "/auth/refresh",
    });
};
export const getDeviceInfo = (userAgent) => {
    const parser = new UAParser(userAgent); // ✅ works now
    const result = parser.getResult();
    return {
        device: result.device.vendor && result.device.model
            ? `${result.device.vendor} ${result.device.model}`
            : result.os.name || "Unknown Device",
        browser: result.browser.name,
    };
};
export const generateVerificationToken = () => {
    return crypto.randomBytes(32).toString("hex");
};
//# sourceMappingURL=helpers.js.map