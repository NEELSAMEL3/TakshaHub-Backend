import type { Request, Response, NextFunction } from "express";
export declare const rateLimitMiddlewares: {
    login: ((req: Request, res: Response, next: NextFunction) => Promise<void>)[];
    register: (req: Request, res: Response, next: NextFunction) => Promise<void>;
    otpVerify: (req: Request, res: Response, next: NextFunction) => Promise<void>;
    otpResend: (req: Request, res: Response, next: NextFunction) => Promise<void>;
    refresh: (req: Request, res: Response, next: NextFunction) => Promise<void>;
    auth: (req: Request, res: Response, next: NextFunction) => Promise<void>;
    burst: (req: Request, res: Response, next: NextFunction) => Promise<void>;
    global: (req: Request, res: Response, next: NextFunction) => Promise<void>;
};
/**
 * Global rate limiter to apply on all routes
 */
export declare const globalRateLimiter: ((req: Request, res: Response, next: NextFunction) => Promise<void>)[];
/**
 * Auth endpoints protection
 */
export declare const authRateLimiter: ((req: Request, res: Response, next: NextFunction) => Promise<void>)[];
/**
 * Login protection (stronger)
 */
export declare const loginRateLimiter: ((req: Request, res: Response, next: NextFunction) => Promise<void>)[];
/**
 * Register protection
 */
export declare const registerRateLimiter: ((req: Request, res: Response, next: NextFunction) => Promise<void>)[];
/**
 * OTP verification protection
 */
export declare const otpVerifyRateLimiter: ((req: Request, res: Response, next: NextFunction) => Promise<void>)[];
/**
 * OTP resend protection
 */
export declare const otpResendRateLimiter: ((req: Request, res: Response, next: NextFunction) => Promise<void>)[];
/**
 * Token refresh protection
 */
export declare const refreshRateLimiter: ((req: Request, res: Response, next: NextFunction) => Promise<void>)[];
export default rateLimitMiddlewares;
//# sourceMappingURL=Limiter.middleware.d.ts.map