import type { Request, Response, NextFunction } from "express";
export declare class AuthController {
    static register: (req: Request, res: Response, next: NextFunction) => void;
    static verifyOtp: (req: Request, res: Response, next: NextFunction) => void;
    static resendOtp: (req: Request, res: Response, next: NextFunction) => void;
    static login: (req: Request, res: Response, next: NextFunction) => void;
    static refresh: (req: Request, res: Response, next: NextFunction) => void;
    static logout: (req: Request, res: Response, next: NextFunction) => void;
    static logoutAll: (req: Request, res: Response, next: NextFunction) => void;
    static requestPasswordReset: (req: Request, res: Response, next: NextFunction) => void;
    static resetPassword: (req: Request, res: Response, next: NextFunction) => void;
}
//# sourceMappingURL=auth.controller.d.ts.map