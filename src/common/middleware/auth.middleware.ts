import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || "your_secret_key";

// Extend Express Request type to include `user`
interface AuthenticatedRequest extends Request {
  user?: any; // You can replace `any` with a proper type if you know the JWT payload
}

export const authMiddleware = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: "Unauthorized" });

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded; // Attach JWT payload to request
    next();
  } catch (err) {
    res.status(401).json({ error: "Invalid token" });
  }
};