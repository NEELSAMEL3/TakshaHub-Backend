import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { AppError } from "../errors/AppError.js";
import type { MemberRole } from "@prisma/client";

export interface AuthRequest extends Request {
  user?: {
    userId: string;
    email: string;
    role?: MemberRole;
    schoolId?: string;
    sessionId?: string;
  };
}

type DecodedToken = {
  userId: string;
  email: string;
  role?: MemberRole;
  schoolId?: string;
  sessionId?: string;
  tokenVersion?: number;
  iat?: number;
  exp?: number;
};

const getAccessSecret = (): string => {
  const secret = process.env.JWT_ACCESS_SECRET;
  if (!secret) {
    throw new Error("JWT_ACCESS_SECRET environment variable is not defined");
  }
  return secret;
};

const extractToken = (authHeader?: string): string | null => {
  if (!authHeader) {
    return null;
  }

  const [type, token] = authHeader.split(" ");

  if (type?.toLowerCase() !== "bearer" || !token) {
    return null;
  }

  return token;
};

export const requiredAuth = (
  req: AuthRequest,
  _res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      throw new AppError("Authorization header is missing", 401);
    }

    const token = extractToken(authHeader);

    if (!token) {
      throw new AppError("Invalid token format. Use: Bearer <token>", 401);
    }

    const decoded = jwt.verify(token, getAccessSecret()) as DecodedToken;

    req.user = {
      userId: decoded.userId,
      email: decoded.email,
      ...(decoded.role && { role: decoded.role }),
      ...(decoded.schoolId && { schoolId: decoded.schoolId }),
      ...(decoded.sessionId && { sessionId: decoded.sessionId }),
    };

    next();
  } catch (error) {
    if (error instanceof AppError) {
      return next(error);
    }

    if (error instanceof jwt.TokenExpiredError) {
      return next(new AppError("Token has expired", 401));
    }

    if (error instanceof jwt.JsonWebTokenError) {
      return next(new AppError("Invalid token", 401));
    }

    return next(new AppError("Authentication failed", 401));
  }
};

export const requireSession = (
  req: AuthRequest,
  _res: Response,
  next: NextFunction
) => {
  if (!req.user?.sessionId) {
    return next(new AppError("Session verification failed", 401));
  }

  next();
};
