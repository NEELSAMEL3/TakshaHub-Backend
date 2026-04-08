import type { Request, Response, NextFunction } from 'express';
interface AuthenticatedRequest extends Request {
    user?: any;
}
export declare const authMiddleware: (req: AuthenticatedRequest, res: Response, next: NextFunction) => Response<any, Record<string, any>> | undefined;
export {};
//# sourceMappingURL=auth.middleware.d.ts.map