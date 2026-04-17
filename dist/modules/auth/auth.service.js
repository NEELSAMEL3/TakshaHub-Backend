import prisma from "../../config/prisma";
import bcrypt from "bcryptjs";
import { MemberRole, Prisma } from "@prisma/client";
import { AppError } from "../../common/errors/AppError";
import { generateAccessToken, generateRefreshToken, hashToken, verifyRefreshToken, } from "../../common/utils/jwt";
import { randomUUID } from "crypto";
import { getDeviceInfo } from "../../common/utils/helpers";
const SALT_ROUNDS = Number(process.env.BCRYPT_ROUNDS ?? 10);
const REFRESH_EXPIRES_DAYS = Number(process.env.REFRESH_DAYS ?? 7);
/* ---------------- HELPERS ---------------- */
const normalizeEmail = (email) => email?.trim().toLowerCase();
const getFingerprint = (meta) => {
    return hashToken(`${meta.userAgent}-${meta.ip}-${meta.deviceId}`);
};
const toSafeUser = (user) => ({
    id: user.id,
    fullName: user.fullName,
    email: user.email,
    phoneNumber: user.phoneNumber,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
});
const calculateExpiryDate = () => {
    const date = new Date();
    date.setDate(date.getDate() + REFRESH_EXPIRES_DAYS);
    return date;
};
/* ---------------- SERVICE ---------------- */
export class AuthService {
    /* ---------------- REGISTER ---------------- */
    static async register(data) {
        return prisma.$transaction(async (tx) => {
            const email = normalizeEmail(data.email);
            const existing = await tx.user.findUnique({
                where: { email },
                select: { id: true },
            });
            if (existing)
                throw new AppError("Email already exists", 409);
            const passwordHash = await bcrypt.hash(data.password, SALT_ROUNDS);
            const user = await tx.user.create({
                data: {
                    fullName: data.fullName,
                    email,
                    passwordHash,
                    phoneNumber: data.phoneNumber ?? null,
                },
            });
            const school = await tx.school
                .create({
                data: {
                    name: data.school.name,
                    type: data.school.type,
                    board: data.school.board,
                    city: data.school.city,
                    state: data.school.state,
                    website: data.school.website ?? null,
                    udiseNumber: data.school.udiseNumber,
                },
            })
                .catch((err) => {
                if (err instanceof Prisma.PrismaClientKnownRequestError &&
                    err.code === "P2002") {
                    throw new AppError("School already exists", 409);
                }
                throw err;
            });
            const member = await tx.member.create({
                data: {
                    userId: user.id,
                    schoolId: school.id,
                    role: MemberRole.ADMIN,
                },
            });
            return {
                message: "Registration successful",
                user: toSafeUser(user),
                member,
            };
        });
    }
    /* ---------------- LOGIN ---------------- */
    static async login(data, meta) {
        if (!meta.deviceId) {
            throw new AppError("Device ID required", 400);
        }
        const email = normalizeEmail(data.email);
        const now = new Date();
        const nowMs = Date.now();
        const MAX_SESSIONS = Number(process.env.MAX_SESSIONS ?? 5);
        const { device } = getDeviceInfo(meta.userAgent);
        const fingerprint = getFingerprint(meta);
        // 🔐 1. Fetch user (minimal include for speed)
        const user = await prisma.user.findUnique({
            where: { email },
            include: { members: true },
        });
        // 🧠 Always run fake hash to prevent timing attacks
        const FAKE_HASH = "$2a$10$C9yq6y8eQJ5cV9YzG5e7uO.fake.hash.to.prevent.timing.attack";
        if (!user) {
            await bcrypt.compare(data.password, FAKE_HASH);
            throw new AppError("Invalid credentials", 401);
        }
        // ❌ account checks
        if (user.deletedAt)
            throw new AppError("Account not available", 403);
        if (!user.isVerified)
            throw new AppError("Please verify your email", 403);
        if (user.lockUntil && user.lockUntil.getTime() > nowMs) {
            throw new AppError("Account temporarily locked. Try later.", 403);
        }
        // 🏫 membership validation (authorization gate)
        const member = user.members.find((m) => m.schoolId === data.schoolId && m.isActive);
        if (!member) {
            await bcrypt.compare(data.password, user.passwordHash);
            throw new AppError("Invalid credentials", 401);
        }
        // 🔐 password validation
        const valid = await bcrypt.compare(data.password, user.passwordHash);
        if (!valid) {
            const failed = user.failedAttempts + 1;
            await prisma.user.update({
                where: { id: user.id },
                data: {
                    failedAttempts: { increment: 1 },
                    ...(failed >= 5 && {
                        failedAttempts: 0,
                        lockUntil: new Date(nowMs + 15 * 60 * 1000),
                    }),
                },
            });
            throw new AppError("Invalid credentials", 401);
        }
        // reset auth state
        await prisma.user.update({
            where: { id: user.id },
            data: {
                failedAttempts: 0,
                lockUntil: null,
            },
        });
        // 🔥 FULL TRANSACTION
        const result = await prisma.$transaction(async (tx) => {
            // 📱 device upsert
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
            // 🧹 SAFE SESSION LIMIT (FIXED)
            const sessions = await tx.session.findMany({
                where: { userId: user.id },
                orderBy: { lastUsedAt: "asc" },
                select: { id: true },
            });
            const excessCount = sessions.length - MAX_SESSIONS;
            if (excessCount > 0) {
                const toDelete = sessions.slice(0, excessCount);
                const ids = toDelete.map((s) => s.id);
                await tx.refreshToken.deleteMany({
                    where: { sessionId: { in: ids } },
                });
                await tx.session.deleteMany({
                    where: { id: { in: ids } },
                });
            }
            // 🆕 session creation
            const session = await tx.session.create({
                data: {
                    userId: user.id,
                    deviceId: meta.deviceId,
                    ipAddress: meta.ip,
                    userAgent: meta.userAgent,
                    device,
                    fingerprint,
                    lastUsedAt: now,
                },
            });
            // 🔐 token payload
            const payload = {
                userId: user.id,
                role: member.role,
                schoolId: member.schoolId,
                sessionId: session.id,
                tokenVersion: user.tokenVersion,
            };
            const accessToken = generateAccessToken(payload);
            const refreshToken = generateRefreshToken(payload);
            // 🔐 refresh token storage (ROTATION SAFE)
            const familyId = randomUUID(); // ✅ FIXED (no deterministic hash)
            await tx.refreshToken.create({
                data: {
                    userId: user.id,
                    tokenHash: hashToken(refreshToken),
                    sessionId: session.id,
                    familyId,
                    expiresAt: calculateExpiryDate(),
                },
            });
            return { accessToken, refreshToken };
        });
        return {
            message: "Login successful",
            accessToken: result.accessToken,
            refreshToken: result.refreshToken,
            user: toSafeUser(user),
            member,
        };
    }
    /* ---------------- REFRESH ---------------- */
    static async refresh(refreshToken, meta) {
        if (!meta.deviceId) {
            throw new AppError("Device ID required", 400);
        }
        const now = new Date();
        // 🔐 Strong fingerprint
        const fingerprint = getFingerprint(meta);
        // 1. Verify JWT
        let payload;
        try {
            payload = verifyRefreshToken(refreshToken);
        }
        catch {
            throw new AppError("Invalid or expired refresh token", 401);
        }
        const tokenHash = hashToken(refreshToken);
        // 2. Fetch token + session + user in ONE go
        const stored = await prisma.refreshToken.findUnique({
            where: { tokenHash },
            include: {
                user: {
                    include: { members: true },
                },
                session: true,
            },
        });
        if (!stored) {
            throw new AppError("Invalid or expired refresh token", 401);
        }
        const user = stored.user;
        if (user.deletedAt) {
            throw new AppError("Account not available", 403);
        }
        if (payload.sessionId !== stored.sessionId) {
            throw new AppError("Token mismatch", 401);
        }
        // 🔥 3. REUSE DETECTION (FAMILY-LEVEL, NOT GLOBAL)
        if (stored.revoked || stored.expiresAt < now) {
            await prisma.$transaction(async (tx) => {
                // revoke only this family (FAANG style)
                await tx.refreshToken.updateMany({
                    where: {
                        userId: user.id,
                        familyId: stored.familyId,
                    },
                    data: { revoked: true },
                });
                // delete only related session
                await tx.session.deleteMany({
                    where: { id: stored.sessionId },
                });
            });
            throw new AppError("Session compromised. Please login again.", 401);
        }
        // 4. Token version check
        if (payload.tokenVersion !== user.tokenVersion) {
            throw new AppError("Session expired", 401);
        }
        // 5. Member validation
        const member = user.members.find((m) => m.schoolId === payload.schoolId && m.isActive);
        if (!member) {
            throw new AppError("Unauthorized access", 401);
        }
        // 6. Session validation
        const session = stored.session;
        if (!session) {
            throw new AppError("Session expired", 401);
        }
        if (session.userId !== user.id) {
            throw new AppError("Session invalid", 401);
        }
        // 🔐 7. STRICT DEVICE CHECKS
        if (session.deviceId !== meta.deviceId) {
            throw new AppError("Unauthorized device", 401);
        }
        if (session.fingerprint !== fingerprint) {
            throw new AppError("Device mismatch", 401);
        }
        // 🎟️ 9. Prepare new tokens
        const basePayload = {
            userId: user.id,
            role: member.role,
            schoolId: member.schoolId,
            sessionId: session.id,
            tokenVersion: user.tokenVersion,
        };
        const newAccessToken = generateAccessToken(basePayload);
        const newRefreshToken = generateRefreshToken(basePayload);
        const newTokenHash = hashToken(newRefreshToken);
        // 🔥 10. ATOMIC ROTATION (STRICT)
        await prisma.$transaction(async (tx) => {
            // lock token row
            const current = await tx.refreshToken.findUnique({
                where: { id: stored.id },
                select: { revoked: true },
            });
            if (!current || current.revoked) {
                throw new AppError("Refresh token already used", 401);
            }
            // revoke old
            await tx.refreshToken.update({
                where: { id: stored.id },
                data: { revoked: true },
            });
            // create new
            await tx.refreshToken.create({
                data: {
                    userId: user.id,
                    tokenHash: newTokenHash,
                    sessionId: session.id,
                    familyId: stored.familyId,
                    expiresAt: calculateExpiryDate(),
                },
            });
            // update session
            await tx.session.update({
                where: { id: session.id },
                data: {
                    lastUsedAt: now,
                    ipAddress: meta.ip,
                    userAgent: meta.userAgent,
                    fingerprint,
                },
            });
            // update device
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
    /* ---------------- LOGOUT ---------------- */
    static async logout(refreshToken) {
        const tokenHash = hashToken(refreshToken);
        // 🔐 Optional verification (don’t block logout if expired)
        try {
            verifyRefreshToken(refreshToken);
        }
        catch {
            // ignore — still allow logout
        }
        const stored = await prisma.refreshToken.findUnique({
            where: { tokenHash },
            select: { sessionId: true },
        });
        await prisma.$transaction(async (tx) => {
            if (stored) {
                // 🔐 revoke all tokens for this session
                await tx.refreshToken.updateMany({
                    where: { sessionId: stored.sessionId },
                    data: { revoked: true },
                });
                // 🧹 delete session using correct field
                await tx.session.deleteMany({
                    where: { id: stored.sessionId },
                });
            }
        });
        return { message: "Logged out successfully" };
    }
    /* ---------------- LOGOUT ALL ---------------- */
    static async logoutAll(userId) {
        const id = typeof userId === "bigint" ? userId : BigInt(userId);
        await prisma.$transaction(async (tx) => {
            await tx.refreshToken.updateMany({
                where: { userId: id },
                data: { revoked: true },
            });
            await tx.session.deleteMany({
                where: { userId: id },
            });
            await tx.user.update({
                where: { id },
                data: {
                    tokenVersion: { increment: 1 },
                },
            });
        });
        return { message: "Logged out from all devices" };
    }
    static async logoutSession(sessionId) {
        await prisma.$transaction(async (tx) => {
            // 🔐 revoke all tokens linked to this session
            await tx.refreshToken.updateMany({
                where: { sessionId },
                data: { revoked: true },
            });
            // 🧹 delete session
            await tx.session.delete({
                where: { id: sessionId },
            });
        });
        return { message: "Session logged out" };
    }
}
//# sourceMappingURL=auth.service.js.map