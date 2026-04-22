import prisma from "../../config/prisma";
import bcrypt from "bcryptjs";
import { MemberRole, Prisma } from "@prisma/client";
import type { User } from "@prisma/client";
import { AppError } from "../../common/errors/AppError";
import {
  generateAccessToken,
  generateRefreshToken,
  hashToken,
  verifyRefreshToken,
} from "../../common/utils/jwt";
import { randomUUID } from "crypto";
import { getDeviceInfo } from "../../common/utils/helpers";
import { serializeBigInt } from "../../common/utils/responseHandler";
import {
  normalizeEmail,
  getFingerprint,
  toSafeUser,
  calculateExpiryDate,
} from "./auth.helpers";
import crypto from "crypto";
import { sendVerificationEmail } from "../../common/utils/sendVerificationEmail";
import { redis } from "../../config/redis";
import logger from "../../config/logger";
import env from "../../config/env";

const SALT_ROUNDS = Number(env.BCRYPT_ROUNDS ?? "10");
const MAX_SESSIONS = Number(env.MAX_SESSIONS ?? "5");


export class AuthService {
  /**
   * Use for registering a new user, creating the school and admin membership,
   * then sending a verification OTP to the provided email.
   */
  /* ---------------- REGISTER ---------------- */

  static async register(data: any) {
    const email = normalizeEmail(data.email);

    // 1️⃣ Check existing user
    let user = await prisma.user.findUnique({
      where: { email },
    });

    if (user?.isVerified) {
      throw new AppError("Email already exists", 409);
    }

    // 2️⃣ Create user if not exists
    if (!user) {
      const passwordHash = await bcrypt.hash(data.password, SALT_ROUNDS);

      user = await prisma.user.create({
        data: {
          fullName: data.fullName,
          email,
          passwordHash,
          phoneNumber: data.phoneNumber ?? null,
          isVerified: false,
        },
      });

      const school = await prisma.school.create({
        data: {
          name: data.school.name,
          type: data.school.type,
          board: data.school.board,
          city: data.school.city,
          state: data.school.state,
          website: data.school.website ?? null,
          udiseNumber: data.school.udiseNumber,
        },
      });

      await prisma.member.create({
        data: {
          userId: user.id,
          schoolId: school.id,
          role: MemberRole.ADMIN,
        },
      });
    }

    // 3️⃣ OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    const otpKey = `verify:otp:${email}`;

    const otpHash = crypto
      .createHmac("sha256", env.OTP_SECRET)
      .update(`${email}:${otp}`)
      .digest("hex");

    // 4️⃣ Store OTP
    const otpData = {
      hash: otpHash,
      attempts: 0,
      createdAt: Date.now(),
    };
    
    await redis.set(otpKey, otpData, { ex: 600 });

    logger.info("Auth: OTP sent", { email, otpExpirySeconds: 600 });

    // 5️⃣ Send email
    await sendVerificationEmail(email, otp);

    return {
      message: "OTP sent successfully. Please verify your email.",
    };
  }

  /**
   * Use for verifying email ownership by comparing an OTP from Redis
   * and marking the user account as verified.
   */
  /* ---------------- VERIFY-OTP ---------------- */

  static async verifyOtp(email: string, otp: string) {
    const emailKey = normalizeEmail(email);

    const OTP_SECRET = env.OTP_SECRET;
    if (!OTP_SECRET) throw new Error("OTP_SECRET missing");

    // 1️⃣ Get user
    const user = await prisma.user.findUnique({
      where: { email: emailKey },
    });

    if (!user) throw new AppError("User not found", 404);

    if (user.isVerified) {
      throw new AppError("Already verified", 400);
    }

    // 2️⃣ Redis key
    const otpKey = `verify:otp:${emailKey}`;

    const raw = await redis.get(otpKey);

    if (!raw) {
      throw new AppError("OTP expired. Please resend OTP", 400);
    }

    let data: { hash: string; attempts: number; createdAt: number };

    try {
      // Handle both string and already-parsed object from Upstash
      data = typeof raw === "string" ? JSON.parse(raw) : raw;
      
      if (!data.hash || data.attempts === undefined || !data.createdAt) {
        throw new Error("Missing required fields");
      }
    } catch (error) {
      logger.warn("Auth: OTP parse failed", { email: emailKey, error: (error as any).message });
      await redis.del(otpKey);
      throw new AppError("Invalid OTP data. Please resend OTP", 400);
    }

    // 3️⃣ Expiry check (server-side safety)
    if (Date.now() - data.createdAt > 10 * 60 * 1000) {
      await redis.del(otpKey);
      throw new AppError("OTP expired. Please resend OTP", 400);
    }

    // 4️⃣ Hash compare
    const incomingHash = crypto
      .createHmac("sha256", OTP_SECRET)
      .update(`${emailKey}:${otp}`)
      .digest("hex");

    if (incomingHash !== data.hash) {
      const attemptsKey = `verify:attempts:${emailKey}`;

      const attempts = await redis.incr(attemptsKey);

      if (attempts === 1) {
        await redis.expire(attemptsKey, 600);
      }

      if (attempts >= 3) {
        await redis.set(`verify:lock:${emailKey}`, "1", { ex: 3600 });
        await redis.del(attemptsKey);
      }

      throw new AppError("Invalid OTP", 400);
    }

    // 5️⃣ Verify user
    await prisma.user.update({
      where: { email: emailKey },
      data: { isVerified: true },
    });

    // 6️⃣ Cleanup
    await redis.del(otpKey);
    await redis.del(`verify:attempts:${emailKey}`);
    await redis.del(`verify:lock:${emailKey}`);

    return { message: "Email verified successfully" };
  }

  /**
   * Use for resending the verification OTP, enforcing cooldown and lock rules.
   */
  /* ---------------- RESEND-OTP ---------------- */
  static async resendOtp(email: string) {
    const normalizedEmail = normalizeEmail(email);

    if (!env.OTP_SECRET) {
      throw new Error("OTP_SECRET is missing in environment variables");
    }

    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (!user) {
      throw new AppError("User not found", 404);
    }

    if (user.isVerified) {
      throw new AppError("Already verified", 400);
    }

    // Verify whether the account is currently locked due to too many OTP attempts.
    const isLocked = await redis.get(`verify:lock:${normalizedEmail}`);
    if (isLocked) {
      throw new AppError("Too many attempts. Try again after 2 hours", 429);
    }

    // Enforce a resend cooldown to prevent repeated OTP requests.
    const resendCooldown = await redis.get(`verify:resend:${normalizedEmail}`);
    if (resendCooldown) {
      throw new AppError("Please wait before requesting another OTP", 429);
    }

    // Clear previous OTP attempt counts before issuing a new OTP.
    await redis.del(`verify:attempts:${normalizedEmail}`);

    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    const hash = crypto
      .createHmac("sha256", env.OTP_SECRET)
      .update(`${normalizedEmail}:${otp}`)
      .digest("hex");

    const otpData = {
      hash,
      attempts: 0,
      createdAt: Date.now(),
    };
    
    await redis.set(
      `verify:otp:${normalizedEmail}`,
      otpData,
      { ex: 600 },
    );

    logger.info("Auth: OTP resent", { email: normalizedEmail, otpExpirySeconds: 600 });

    // Apply a short resend cooldown.
    await redis.set(`verify:resend:${normalizedEmail}`, "1", {
      ex: 60,
    });

    // Send the verification email with the new OTP.
    await sendVerificationEmail(user.email, otp);

    return { message: "OTP resent successfully" };
  }

  /**
   * Use for authenticating the user, tracking device/session state,
   * and issuing access and refresh tokens.
   */
  /* ---------------- LOGIN ---------------- */
  static async login(
    data: any,
    meta: { ip: string; userAgent: string; deviceId: string },
  ) {
    if (!meta.deviceId) {
      throw new AppError("Device ID required", 400);
    }

    const email = normalizeEmail(data.email);
    const now = new Date();

    const { device } = getDeviceInfo(meta.userAgent);
    const fingerprint = getFingerprint(meta);

    // Check whether this login source is currently locked.
    const isLocked = await redis.get(`login:lock:${email}`);
    if (isLocked) {
      throw new AppError("Account locked. Try again later", 403);
    }

    const user = await prisma.user.findUnique({
      where: { email },
      include: { members: { where: { isActive: true } } },
    });

    const FAKE_HASH =
      "$2a$10$C9yq6y8eQJ5cV9YzG5e7uO.fake.hash.to.prevent.timing.attack";

    if (!user) {
      await bcrypt.compare(data.password, FAKE_HASH);
      throw new AppError("Invalid credentials", 401);
    }

    if (user.deletedAt) throw new AppError("Account not available", 403);
    if (!user.isVerified) throw new AppError("Please verify your email", 403);

    // Verify password first to protect against timing attacks.
    const valid = await bcrypt.compare(data.password, user.passwordHash);

    if (!valid) {
      const attemptsKey = `login:attempts:${email}`;

      const attempts = await redis.incr(attemptsKey);
      if (attempts === 1) await redis.expire(attemptsKey, 900);

      if (attempts >= 5) {
        await redis.set(`login:lock:${email}`, "1", { ex: 7200 });
        await redis.del(attemptsKey);
      }

      throw new AppError("Invalid credentials", 401);
    }

    // Reset login abuse counters after a successful login.
    await redis.del(`login:attempts:${email}`);
    await redis.del(`login:lock:${email}`);

    // Use the first active membership for this user.
    const member = user.members[0];

    if (!member) {
      throw new AppError("No active school membership", 403);
    }

    const result = await prisma.$transaction(async (tx) => {
      // Create or update the user's tracked device entry.
      await tx.device.upsert({
        where: {
          userId_deviceId: {
            userId: user.id,
            deviceId: meta.deviceId,
          },
        },
        update: {
          userAgent: meta.userAgent,
          ipAddress: meta.ip,
          fingerprint,
          lastSeenAt: now,
        },
        create: {
          userId: user.id,
          deviceId: meta.deviceId,
          userAgent: meta.userAgent,
          ipAddress: meta.ip,
          fingerprint,
          lastSeenAt: now,
        },
      });

      // Enforce maximum active sessions by removing oldest sessions.
      const sessions = await tx.session.findMany({
        where: { userId: user.id },
        orderBy: { lastUsedAt: "asc" },
        select: { id: true },
      });

      const excess = Math.max(0, sessions.length - MAX_SESSIONS);

      if (excess > 0) {
        const toDelete = sessions.slice(0, excess);
        const ids = toDelete.map((s) => s.id);

        await tx.refreshToken.deleteMany({
          where: { sessionId: { in: ids } },
        });

        await tx.session.deleteMany({
          where: { id: { in: ids } },
        });
      }

      // session create
      const session = await tx.session.create({
        data: {
          userId: user.id,
          schoolId: member.schoolId,
          memberId: member.id,
          deviceId: meta.deviceId,
          ipAddress: meta.ip,
          userAgent: meta.userAgent,
          device,
          fingerprint,
          lastUsedAt: now,
        },
      });

      const payload = {
        userId: user.id.toString(),
        role: member.role,
        schoolId: member.schoolId.toString(),
        sessionId: session.id.toString(),
        tokenVersion: user.tokenVersion,
      };

      const accessToken = generateAccessToken(payload);
      const refreshToken = generateRefreshToken(payload);

      await tx.refreshToken.create({
        data: {
          userId: user.id,
          tokenHash: hashToken(refreshToken),
          sessionId: session.id,
          familyId: randomUUID(),
          expiresAt: calculateExpiryDate(),
        },
      });

      return { accessToken, refreshToken };
    });

    return serializeBigInt({
      message: "Login successful",
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
      user: toSafeUser(user),
      member,
    });
  }

  /**
   * Use for refreshing an active session by exchanging a valid refresh token
   * for a new access token and refresh token pair.
   */
  /* ---------------- REFRESH ---------------- */
  static async refresh(
    refreshToken: string,
    meta: { ip: string; userAgent: string; deviceId: string },
  ) {
    if (!meta.deviceId) {
      throw new AppError("Device ID required", 400);
    }

    const now = new Date();
    const fingerprint = getFingerprint(meta);

    let payload: any;

    try {
      payload = verifyRefreshToken(refreshToken);
    } catch {
      throw new AppError("Invalid or expired refresh token", 401);
    }

    const tokenHash = hashToken(refreshToken);

    const stored = await prisma.refreshToken.findUnique({
      where: { tokenHash },
      include: {
        user: {
          include: {
            members: { where: { isActive: true } },
          },
        },
        session: true,
      },
    });

    if (!stored) {
      throw new AppError("Invalid or expired refresh token", 401);
    }

    const user = stored.user;

    if (!user || user.deletedAt) {
      throw new AppError("Account not available", 403);
    }

    // Ensure the refresh token still belongs to an active session.
    if (!stored.session) {
      throw new AppError("Session expired", 401);
    }

    if (payload.sessionId !== stored.sessionId) {
      throw new AppError("Token mismatch", 401);
    }

    // Detect reuse of revoked or expired refresh tokens.
    if (stored.revoked || stored.expiresAt < now) {
      await prisma.$transaction(async (tx) => {
        await tx.refreshToken.updateMany({
          where: {
            userId: user.id,
            familyId: stored.familyId,
          },
          data: { revoked: true },
        });

        await tx.session.deleteMany({
          where: { id: stored.sessionId },
        });
      });

      throw new AppError("Session compromised. Please login again.", 401);
    }

    // Ensure the token version has not been invalidated by password reset or logout-all.
    if (payload.tokenVersion !== user.tokenVersion) {
      throw new AppError("Session expired", 401);
    }

    // Use the first active membership for this user.
    const member = user.members[0];

    if (!member) {
      throw new AppError("Unauthorized access", 401);
    }

    // Confirm the session is still being used from the same device.
    if (stored.session.deviceId !== meta.deviceId) {
      throw new AppError("Unauthorized device", 401);
    }

    if (stored.session.fingerprint !== fingerprint) {
      throw new AppError("Device mismatch", 401);
    }

    const basePayload = {
      userId: user.id,
      role: member.role,
      schoolId: member.schoolId,
      sessionId: stored.session.id,
      tokenVersion: user.tokenVersion,
    };

    const newAccessToken = generateAccessToken(basePayload);
    const newRefreshToken = generateRefreshToken(basePayload);
    const newTokenHash = hashToken(newRefreshToken);

    await prisma.$transaction(async (tx) => {
      const current = await tx.refreshToken.findUnique({
        where: { id: stored.id },
        select: { revoked: true },
      });

      if (!current || current.revoked) {
        throw new AppError("Refresh token already used", 401);
      }

      await tx.refreshToken.update({
        where: { id: stored.id },
        data: { revoked: true },
      });

      await tx.refreshToken.create({
        data: {
          userId: user.id,
          tokenHash: newTokenHash,
          sessionId: stored.session.id,
          familyId: stored.familyId,
          expiresAt: calculateExpiryDate(),
        },
      });

      await tx.session.update({
        where: { id: stored.session.id },
        data: {
          lastUsedAt: now,
          ipAddress: meta.ip,
          userAgent: meta.userAgent,
          fingerprint,
        },
      });

      await tx.device.update({
        where: {
          userId_deviceId: {
            userId: user.id,
            deviceId: meta.deviceId,
          },
        },
        data: {
          lastSeenAt: now,
          ipAddress: meta.ip,
          userAgent: meta.userAgent,
          fingerprint,
        },
      });
    });

    return {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    };
  }

  /**
   * Use for logging out a single session by revoking the provided refresh token
   * and deleting the associated session.
   */
  /* ---------------- LOGOUT ---------------- */
  static async logout(refreshToken: string) {
    const tokenHash = hashToken(refreshToken);

    let payload: any;

    // Attempt token verification, but continue to revoke session data if the token is malformed.
    try {
      payload = verifyRefreshToken(refreshToken);
    } catch {
      payload = null;
    }

    const stored = await prisma.refreshToken.findUnique({
      where: { tokenHash },
      select: {
        sessionId: true,
        familyId: true,
        userId: true,
      },
    });

    await prisma.$transaction(async (tx) => {
      if (stored) {
        // Revoke the current family of refresh tokens and delete the session.
        await tx.refreshToken.updateMany({
          where: {
            OR: [
              { sessionId: stored.sessionId },
              { familyId: stored.familyId },
            ],
          },
          data: { revoked: true },
        });

        await tx.session.deleteMany({
          where: { id: stored.sessionId },
        });

        // Update device metadata after logout to preserve device audit trails.
        await tx.device.updateMany({
          where: { userId: stored.userId },
          data: {
            lastSeenAt: new Date(),
          },
        });
      }
    });

    return { message: "Logged out successfully" };
  }

  /**
   * Use for logging out all sessions for a user and invalidating existing tokens
   * by incrementing the user's token version.
   */
  /* ---------------- LOGOUT ALL ---------------- */
  static async logoutAll(userId: bigint | string) {
    const id = typeof userId === "bigint" ? userId : BigInt(userId);

    await prisma.$transaction(async (tx) => {
      // Revoke all refresh tokens belonging to the user.
      await tx.refreshToken.updateMany({
        where: { userId: id },
        data: { revoked: true },
      });

      // Delete all active sessions.
      await tx.session.deleteMany({
        where: { userId: id },
      });

      // Remove device entries for the user.
      await tx.device.deleteMany({
        where: { userId: id },
      });

      // Increment token version to invalidate existing access tokens.
      await tx.user.update({
        where: { id },
        data: {
          tokenVersion: { increment: 1 },
        },
      });
    });

    return { message: "Logged out from all devices" };
  }

  /**
   * Use for logging out a specific session by session ID, optionally ensuring
   * the session belongs to the authenticated user.
   */
  /* ---------------- LOGOUT SESSION ---------------- */
  static async logoutSession(sessionId: string, userId?: bigint | string) {
    const uid = userId
      ? typeof userId === "bigint"
        ? userId
        : BigInt(userId)
      : null;

    await prisma.$transaction(async (tx) => {
      // Optional safety check to ensure the requested session belongs to the user.
      if (uid) {
        const session = await tx.session.findFirst({
          where: {
            id: sessionId,
            userId: uid,
          },
        });

        if (!session) {
          throw new AppError("Session not found", 404);
        }
      }

      // Revoke refresh tokens associated with the session.
      await tx.refreshToken.updateMany({
        where: { sessionId },
        data: { revoked: true },
      });

      // Delete the session record.
      await tx.session.deleteMany({
        where: { id: sessionId },
      });

      if (uid) {
        await tx.device.updateMany({
          where: { userId: uid },
          data: {
            lastSeenAt: new Date(),
          },
        });
      }
    });

    return { message: "Session logged out" };
  }

  /**
   * Use for requesting a password reset OTP for a verified user.
   * The OTP is stored in Redis and emailed to the user.
   */
  /* ============ REQUEST PASSWORD RESET ============ */
  static async requestPasswordReset(email: string) {
    const emailKey = normalizeEmail(email);

    // 1️⃣ Check if user exists
    const user = await prisma.user.findUnique({
      where: { email: emailKey },
    });

    if (!user) {
      throw new AppError("User not found", 404);
    }

    if (!user.isVerified) {
      throw new AppError("Please verify your email first", 403);
    }

    // 2️⃣ Generate OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // 3️⃣ Create OTP hash
    const OTP_SECRET = env.OTP_SECRET;
    const otpHash = crypto
      .createHmac("sha256", OTP_SECRET)
      .update(`${emailKey}:${otp}`)
      .digest("hex");

    // 4️⃣ Store OTP in Redis (15 minutes expiry for password reset)
    const otpKey = `reset:otp:${emailKey}`;
    const otpData = {
      hash: otpHash,
      attempts: 0,
      createdAt: Date.now(),
    };

    await redis.set(otpKey, otpData, { ex: 900 }); // 15 minutes

    // 5️⃣ Send verification email
    logger.info("Auth: Password reset OTP sent", { email: emailKey });

    try {
      await sendVerificationEmail(emailKey, otp, "password-reset");
    } catch (error) {
      logger.warn("Auth: Failed to send verification email", { 
        email: emailKey, 
        error: (error as any).message 
      });
    }

    return { 
      message: "Password reset OTP sent to your email. Valid for 15 minutes.",
      expirySeconds: 900 
    };
  }

  /**
   * Use for validating a password reset OTP and updating the user's password.
   * This also invalidates all active refresh tokens and sessions.
   */
  /* ============ RESET PASSWORD ============ */
  static async resetPassword(email: string, otp: string, newPassword: string) {
    const emailKey = normalizeEmail(email);

    // 1️⃣ Get user
    const user = await prisma.user.findUnique({
      where: { email: emailKey },
    });

    if (!user) {
      throw new AppError("User not found", 404);
    }

    if (!user.isVerified) {
      throw new AppError("Email not verified", 403);
    }

    // 2️⃣ Get OTP from Redis
    const otpKey = `reset:otp:${emailKey}`;
    const raw = await redis.get(otpKey);

    if (!raw) {
      throw new AppError("OTP expired or not found. Request a new one", 400);
    }

    let data: { hash: string; attempts: number; createdAt: number };

    try {
      data = typeof raw === "string" ? JSON.parse(raw) : raw;
      if (!data.hash || data.attempts === undefined || !data.createdAt) {
        throw new Error("Missing required fields");
      }
    } catch (error) {
      logger.warn("Auth: Password reset OTP parse failed", { email: emailKey });
      await redis.del(otpKey);
      throw new AppError("Invalid OTP data. Request a new one", 400);
    }

    // 3️⃣ Check expiry
    if (Date.now() - data.createdAt > 15 * 60 * 1000) {
      await redis.del(otpKey);
      throw new AppError("OTP expired. Request a new one", 400);
    }

    // 4️⃣ Check attempts
    if (data.attempts >= 3) {
      await redis.del(otpKey);
      throw new AppError("Too many attempts. Request a new OTP", 429);
    }

    // 5️⃣ Verify OTP hash
    const OTP_SECRET = env.OTP_SECRET;
    const incomingHash = crypto
      .createHmac("sha256", OTP_SECRET)
      .update(`${emailKey}:${otp}`)
      .digest("hex");

    if (incomingHash !== data.hash) {
      // Increment attempts
      data.attempts += 1;
      await redis.set(otpKey, data, { ex: 900 });
      
      throw new AppError("Invalid OTP", 400);
    }

    // 6️⃣ Hash new password
    const passwordHash = await bcrypt.hash(newPassword, SALT_ROUNDS);

    // 7️⃣ Update password and revoke all refresh tokens
    await prisma.$transaction(async (tx) => {
      // Update password
      await tx.user.update({
        where: { id: user.id },
        data: {
          passwordHash,
          tokenVersion: user.tokenVersion + 1, // Invalidate all tokens
        },
      });

      // Revoke all refresh tokens
      await tx.refreshToken.updateMany({
        where: { userId: user.id },
        data: { revoked: true },
      });

      // Close all sessions
      await tx.session.deleteMany({
        where: { userId: user.id },
      });
    });

    // 8️⃣ Clear OTP
    await redis.del(otpKey);

    logger.info("Auth: Password reset successful", { email: emailKey });

    return { 
      message: "Password reset successfully. Please login with your new password.",
    };
  }
}
