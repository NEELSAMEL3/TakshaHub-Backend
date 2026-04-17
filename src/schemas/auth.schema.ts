import { z } from "zod";

/* ============ COMMON SCHEMAS ============ */

/**
 * Email validation
 */
export const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .email("Invalid email format")
  .max(255, "Email is too long");

/**
 * Password validation
 * - Min 8 characters
 * - At least 1 uppercase
 * - At least 1 number
 * - At least 1 special character
 */
export const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
  .regex(/[0-9]/, "Password must contain at least one number")
  .regex(
    /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/,
    "Password must contain at least one special character"
  );

/**
 * OTP validation
 */
export const otpSchema = z
  .string()
  .length(6, "OTP must be exactly 6 digits")
  .regex(/^\d+$/, "OTP must contain only numbers");

/**
 * Phone number validation (optional but when provided)
 */
export const phoneNumberSchema = z
  .string()
  .min(10, "Phone number must be at least 10 digits")
  .max(20, "Phone number is too long")
  .regex(/^\+?[1-9]\d{1,14}$/, "Invalid phone number format")
  .optional();

/**
 * Full name validation
 */
export const fullNameSchema = z
  .string()
  .trim()
  .min(2, "Full name must be at least 2 characters")
  .max(100, "Full name is too long")
  .regex(/^[a-zA-Z\s'-]+$/, "Full name contains invalid characters");

/**
 * School name validation
 */
export const schoolNameSchema = z
  .string()
  .trim()
  .min(2, "School name must be at least 2 characters")
  .max(255, "School name is too long");

/**
 * UDISE number validation
 */
export const udiseNumberSchema = z
  .string()
  .trim()
  .regex(/^\d{11}$/, "UDISE number must be exactly 11 digits");

/**
 * School type enum
 */
export const schoolTypeSchema = z.enum(
  ["PUBLIC", "PRIVATE", "OTHER"]
);

/**
 * Board enum
 */
export const schoolBoardSchema = z.enum(
  ["CBSE", "ICSE", "STATE", "OTHER"]
);

/**
 * City validation
 */
export const citySchema = z
  .string()
  .trim()
  .min(2, "City must be at least 2 characters")
  .max(100, "City is too long");

/**
 * State validation
 */
export const stateSchema = z
  .string()
  .trim()
  .min(2, "State must be at least 2 characters")
  .max(100, "State is too long");

/**
 * Website URL validation (optional)
 */
export const websiteSchema = z
  .string()
  .url("Invalid website URL")
  .optional()
  .or(z.literal(""));

/* ============ REGISTER SCHEMA ============ */

export const registerSchema = z.object({
  fullName: fullNameSchema,
  email: emailSchema,
  password: passwordSchema,
  phoneNumber: phoneNumberSchema,
  school: z.object({
    name: schoolNameSchema,
    type: schoolTypeSchema,
    board: schoolBoardSchema,
    city: citySchema,
    state: stateSchema,
    website: websiteSchema,
    udiseNumber: udiseNumberSchema,
  }),
});

export type RegisterPayload = z.infer<typeof registerSchema>;

/* ============ VERIFY OTP SCHEMA ============ */

export const verifyOtpSchema = z.object({
  email: emailSchema,
  otp: otpSchema,
});

export type VerifyOtpPayload = z.infer<typeof verifyOtpSchema>;

/* ============ RESEND OTP SCHEMA ============ */

export const resendOtpSchema = z.object({
  email: emailSchema,
});

export type ResendOtpPayload = z.infer<typeof resendOtpSchema>;

/* ============ LOGIN SCHEMA ============ */

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Password is required"),
  schoolId: z
    .string()
    .regex(/^\d+$/, "Invalid school ID")
    .optional(),
});

export type LoginPayload = z.infer<typeof loginSchema>;

/* ============ REFRESH TOKEN SCHEMA ============ */

export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, "Refresh token is required"),
});

export type RefreshTokenPayload = z.infer<typeof refreshTokenSchema>;

