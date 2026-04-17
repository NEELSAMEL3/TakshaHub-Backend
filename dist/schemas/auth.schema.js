import { z } from "zod";
/* ---------------- REGISTER ---------------- */
export const registerSchema = z.object({
    fullName: z.string().min(1, "Full name is required"),
    email: z.email("Invalid email"),
    password: z.string().min(6, "Password must be at least 6 characters"),
    phoneNumber: z.string().min(6).max(20).optional(),
    school: z.object({
        name: z.string().min(1, "School name is required"),
        type: z.string().min(1, "School type is required"),
        board: z.string().min(1, "Board is required"),
        city: z.string().min(1, "City is required"),
        state: z.string().min(1, "State is required"),
        website: z.string().url().optional(),
        udiseNumber: z.string().min(1, "UDISE number is required"),
    }),
});
/* ---------------- LOGIN ---------------- */
export const loginSchema = z.object({
    email: z.email("Invalid email"),
    password: z.string().min(1, "Password is required"),
    schoolId: z.string().min(1, "School ID is required"),
    deviceId: z.string().min(1, "Device ID is required"),
});
//# sourceMappingURL=auth.schema.js.map