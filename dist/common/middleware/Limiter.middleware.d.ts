import Redis from "ioredis";
import type { Request, Response, NextFunction } from "express";
export declare const redis: Redis;
export declare const loginLimiter: (req: Request, res: Response, next: NextFunction) => Promise<void>;
export declare const loginEmailLimiter: (req: Request, res: Response, next: NextFunction) => Promise<void>;
export declare const authLimiter: (req: Request, res: Response, next: NextFunction) => Promise<void>;
export declare const refreshLimiter: (req: Request, res: Response, next: NextFunction) => Promise<void>;
export declare const globalLimiter: (req: Request, res: Response, next: NextFunction) => Promise<void>;
export declare const burstLimiter: (req: Request, res: Response, next: NextFunction) => Promise<void>;
export declare const rateLimiterMiddleware: ((req: Request, res: Response, next: NextFunction) => Promise<void>)[];
//# sourceMappingURL=Limiter.middleware.d.ts.map