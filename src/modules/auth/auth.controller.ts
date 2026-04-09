import type { Request, Response } from 'express';
import * as authService from './auth.service';
import { registerSchema, loginSchema } from '../../schemas/auth.schema';
import type { RegisterInput, LoginInput } from '../../schemas/auth.schema';
import logger from '../../config/logger';

export const register = async (req: Request, res: Response) => {
  try {
    const validatedData: RegisterInput = registerSchema.parse(req.body);

    const admin = await authService.registerAdmin(validatedData);
    logger.info(`Admin registered successfully: ${admin.id}`); // ✅ Log success

    res.status(201).json({ message: "Admin registered successfully", adminId: admin.id });
  } catch (err: any) {
    if (err.name === "ZodError") {
      logger.warn(`Validation error on register: ${JSON.stringify(err.errors)}`); // ✅ Log validation errors
      return res.status(400).json({ errors: err.errors });
    }

    logger.error(`Register failed: ${err.message}`); // ✅ Log server errors
    res.status(400).json({ error: err.message });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const validatedData: LoginInput = loginSchema.parse(req.body);

    const { admin, token } = await authService.loginAdmin(validatedData.email, validatedData.password);
    logger.info(`Admin login successful: ${admin.id}`); // ✅ Log login success

    res.status(200).json({ message: "Login successful", admin, token });
  } catch (err: any) {
    if (err.name === "ZodError") {
      logger.warn(`Validation error on login: ${JSON.stringify(err.errors)}`); // ✅ Log validation errors
      return res.status(400).json({ errors: err.errors });
    }

    logger.error(`Login failed: ${err.message}`); // ✅ Log server errors
    res.status(400).json({ error: err.message });
  }
};

export const profile = async (req: any, res: Response) => {
  try {
    const admin = await authService.getAdminProfile(req.user.id);
    logger.info(`Profile fetched for admin: ${req.user.id}`); // ✅ Log profile access
    res.json(admin);
  } catch (err: any) {
    logger.error(`Failed to fetch profile for admin ${req.user.id}: ${err.message}`); // ✅ Log errors
    res.status(500).json({ error: "Server error" });
  }
};