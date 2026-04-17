import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { AppError } from "../errors/AppError";
import { MemberRole } from "@prisma/client";

/* ============ TYPES ============ */

export interface AuthRequest extends Request {
  user?: {
    userId: string;
    email: string;
    role?: MemberRole;
    schoolId?: string;
    sessionId?: string;
  };
}

export type DecodedToken = {
  userId: string;
  email: string;
  role?: MemberRole;
  schoolId?: string;
  sessionId?: string;
  tokenVersion?: number;
  iat?: number;
  exp?: number;
};

/* ============ HELPERS ============ */

/**
 * Get JWT access secret
 */
const getAccessSecret = (): string => {
  const secret = process.env.JWT_ACCESS_SECRET;
  if (!secret) {
    throw new Error("JWT_ACCESS_SECRET environment variable is not defined");
  }
  return secret;
};

/**
 * Extract token from Authorization header
 */
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

/* ============ OPTIONAL AUTH MIDDLEWARE ============ */

/**
 * Optional authentication - attaches user if valid token, otherwise allows pass-through
 */
export const optionalAuth = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;
    const token = extractToken(authHeader);

    if (!token) {
      return next();
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
    // Fail-open: continue even if token is invalid
    console.warn("🔐 Optional auth failed silently:", (error as any).message);
    next();
  }
};

/* ============ REQUIRED AUTH MIDDLEWARE ============ */

/**
 * Required authentication - throws error if no valid token
 */
export const requiredAuth = (
  req: AuthRequest,
  res: Response,
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

/* ============ ROLE-BASED AUTHORIZATION MIDDLEWARE ============ */

/**
 * Require specific role(s)
 */
export const requireRole = (...allowedRoles: MemberRole[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user?.userId) {
      return next(new AppError("User not authenticated", 401));
    }

    const userRole = req.user.role;

    if (!userRole) {
      return next(new AppError("User role not found", 403));
    }

    if (!allowedRoles.includes(userRole)) {
      return next(
        new AppError(
          `This action requires one of these roles: ${allowedRoles.join(", ")}`,
          403
        )
      );
    }

    next();
  };
};

/* ============ SCHOOL CONTEXT MIDDLEWARE ============ */

/**
 * Require valid schoolId in JWT
 */
export const requireSchoolContext = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  if (!req.user?.schoolId) {
    return next(new AppError("School context is required", 403));
  }

  next();
};

/**
 * Ensure user has access to the requested school
 * Compares schoolId from params with schoolId from JWT
 */
export const validateSchoolAccess = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  const userSchoolId = req.user?.schoolId;
  const requestedSchoolId = req.params.schoolId || req.body?.schoolId;

  if (!userSchoolId) {
    return next(new AppError("School context not found in token", 403));
  }

  if (requestedSchoolId && userSchoolId !== requestedSchoolId) {
    return next(
      new AppError(
        "You do not have access to this school",
        403
      )
    );
  }

  next();
};

/* ============ DEVICE/SESSION VALIDATION ============ */

/**
 * Require session ID in JWT
 */
export const requireSession = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  if (!req.user?.sessionId) {
    return next(new AppError("Session verification failed", 401));
  }

  next();
};

/**
 * Match device headers with JWT (optional but recommended)
 */
export const validateDeviceConsistency = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  const deviceId = req.get("x-device-id");

  if (!deviceId) {
    console.warn("⚠️ Device ID header missing");
  }

  // Don't fail, just log warning
  next();
};

/* ============ COMPOSITE MIDDLEWARE BUILDERS ============ */

/**
 * Build middleware stack for protected endpoints
 * Usage: router.get('/protected', protectedRoute, controller)
 */
export const protectedRoute = [
  requiredAuth,
  requireSchoolContext,
  requireSession,
];

/**
 * Build middleware stack for admin-only endpoints
 * Usage: router.post('/admin-action', adminRoute, controller)
 */
export const adminRoute = [
  requiredAuth,
  requireRole(MemberRole.ADMIN),
  requireSchoolContext,
  requireSession,
];

/**
 * Build middleware stack for staff endpoints (admin + staff)
 * Usage: router.post('/staff-action', staffRoute, controller)
 */
export const staffRoute = [
  requiredAuth,
  requireRole(MemberRole.ADMIN, MemberRole.STAFF),
  requireSchoolContext,
  requireSession,
];

/**
 * Build middleware stack for teacher endpoints
 * Usage: router.post('/teacher-action', teacherRoute, controller)
 */
export const teacherRoute = [
  requiredAuth,
  requireRole(MemberRole.TEACHER, MemberRole.ADMIN),
  requireSchoolContext,
  requireSession,
];

export default {
  optionalAuth,
  requiredAuth,
  requireRole,
  requireSchoolContext,
  validateSchoolAccess,
  requireSession,
  validateDeviceConsistency,
  protectedRoute,
  adminRoute,
  staffRoute,
  teacherRoute,
};
