import type { Response } from "express";
import { UAParser } from "ua-parser-js";

export const setRefreshCookie = (res: Response, token: string) => {
  res.cookie("refreshToken", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/auth/refresh",
    maxAge: 7 * 24 * 60 * 60 * 1000,
    priority: "high",
  });
};

export const clearRefreshCookie = (res: Response) => {
  res.clearCookie("refreshToken", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/auth/refresh",
  });
};

export const getDeviceInfo = (userAgent: string) => {
  const parser = new UAParser(userAgent);
  const result = parser.getResult();

  return {
    device:
      result.device.vendor && result.device.model
        ? `${result.device.vendor} ${result.device.model}`
        : result.os.name || "Unknown Device",
    browser: result.browser.name,
  };
};
