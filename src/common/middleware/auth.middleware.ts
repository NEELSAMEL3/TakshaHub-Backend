import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import logger from '../../config/logger'; // adjust path to your logger.ts

const JWT_SECRET = process.env.JWT_SECRET || "your_secret_key";

// Extend Express Request type to include `user`
interface AuthenticatedRequest extends Request {
  user?: any; // replace `any` with your JWT payload type if known
}

export const authMiddleware = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  const token = req.headers.authorization?.split(' ')[1];

  if (!token) {
    logger.warn(`Unauthorized access attempt to ${req.path} from IP: ${req.ip}`);
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded; // Attach JWT payload to request

    logger.info(`JWT verified for user: ${(decoded as any).id || 'unknown'} on ${req.path}`);
    next();
  } catch (err: any) {
    logger.error(`Invalid token attempt on ${req.path} from IP: ${req.ip} - ${err.message}`);
    res.status(401).json({ error: "Invalid token" });
  }
};