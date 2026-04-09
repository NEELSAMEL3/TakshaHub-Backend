import { z } from 'zod';

// Registration schema
export const registerSchema = z.object({
  fullName: z.string().min(1, { message: "Full name is required" }),
  email: z.email({ message: "Invalid email" }),
  password: z.string().min(6, { message: "Password must be at least 6 characters" }),
}).loose(); // allows extra fields to pass through


// Login schema
export const loginSchema = z.object({
  email: z.email({ message: "Invalid email" }),
  password: z.string({}).min(1, { message: "Password is required" }),
});

// TypeScript types inferred from schemas
export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;