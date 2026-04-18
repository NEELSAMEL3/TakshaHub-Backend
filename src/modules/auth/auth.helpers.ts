/**
 * Auth helper utilities used by AuthService.
 *
 * These helpers are intentionally specific to authentication logic and
 * are separated from shared application utilities.
 */
import { hashToken } from "../../common/utils/jwt";
import type { User } from "@prisma/client";

const REFRESH_EXPIRES_DAYS = Number(process.env.REFRESH_DAYS ?? "7");

export const normalizeEmail = (email: string) => email?.trim().toLowerCase();

export const getFingerprint = (meta: {
  userAgent: string;
  ip: string;
  deviceId: string;
}) => {
  return hashToken(`${meta.userAgent}-${meta.ip}-${meta.deviceId}`);
};

export const toSafeUser = (
  user: Pick<
    User,
    "id" | "fullName" | "email" | "phoneNumber" | "createdAt" | "updatedAt"
  >,
) => ({
  id: user.id,
  fullName: user.fullName,
  email: user.email,
  phoneNumber: user.phoneNumber,
  createdAt: user.createdAt,
  updatedAt: user.updatedAt,
});

export const calculateExpiryDate = () => {
  const date = new Date();
  date.setDate(date.getDate() + REFRESH_EXPIRES_DAYS);
  return date;
};
