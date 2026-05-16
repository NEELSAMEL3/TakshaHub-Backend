import jwt, { type SignOptions, type JwtPayload } from "jsonwebtoken";
import crypto from "crypto";

const ACCESS_SECRET = process.env.JWT_ACCESS_SECRET!;
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET!;

if (!ACCESS_SECRET || !REFRESH_SECRET) {
  throw new Error("JWT secrets are not defined");
}

const ACCESS_EXPIRES: SignOptions["expiresIn"] = "15m";
const REFRESH_EXPIRES: SignOptions["expiresIn"] = "7d";

const ISSUER = "your-app";
const AUDIENCE = "your-app-users";

export interface TokenPayload extends JwtPayload {
  userId: string | bigint;
  sessionId: string;
  schoolId: string;
  role: string;
  tokenVersion: number;
  type: "access" | "refresh";
}

export const generateAccessToken = (payload: Omit<TokenPayload, "type">) => {
  return jwt.sign({ ...payload, type: "access" }, ACCESS_SECRET, {
    expiresIn: ACCESS_EXPIRES,
    issuer: ISSUER,
    audience: AUDIENCE,
    subject: String(payload.userId),
  });
};

export const generateRefreshToken = (payload: Omit<TokenPayload, "type">) => {
  return jwt.sign({ ...payload, type: "refresh" }, REFRESH_SECRET, {
    expiresIn: REFRESH_EXPIRES,
    issuer: ISSUER,
    audience: AUDIENCE,
    subject: String(payload.userId),
  });
};

export const verifyRefreshToken = (token: string): TokenPayload => {
  const decoded = jwt.verify(token, REFRESH_SECRET, {
    issuer: ISSUER,
    audience: AUDIENCE,
  }) as TokenPayload;

  if (decoded.type !== "refresh") {
    throw new Error("Invalid refresh token type");
  }

  return decoded;
};

export const hashToken = (token: string) => {
  return crypto.createHash("sha256").update(token).digest("hex");
};
