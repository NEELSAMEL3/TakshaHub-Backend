import type { Request, Response } from 'express';
import * as authService from './auth.service.js';

export const register = async (req: Request, res: Response) => {
  try {
    const admin = await authService.registerAdmin(req.body);
    res.status(201).json({ message: "Admin registered successfully", adminId: admin.id });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
};

export const login = async (req: Request, res: Response) => {
  const { email, password } = req.body;
  try {
    const result = await authService.loginAdmin(email, password);
    res.json({ message: "Login successful", token: result.token });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
};

export const profile = async (req: any, res: Response) => {
  try {
    const admin = await authService.getAdminProfile(req.user.id);
    res.json(admin);
  } catch (err: any) {
    res.status(500).json({ error: "Server error" });
  }
};