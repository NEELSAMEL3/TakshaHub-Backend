export declare class AuthService {
    static register(data: any): Promise<{
        message: string;
    }>;
    static verifyOtp(email: string, otp: string): Promise<{
        message: string;
    }>;
    static resendOtp(email: string): Promise<{
        message: string;
    }>;
    static login(data: any, meta: {
        ip: string;
        userAgent: string;
        deviceId: string;
    }): Promise<any>;
    static refresh(refreshToken: string, meta: {
        ip: string;
        userAgent: string;
        deviceId: string;
    }): Promise<{
        accessToken: string;
        refreshToken: string;
    }>;
    static logout(refreshToken: string): Promise<{
        message: string;
    }>;
    static logoutAll(userId: bigint | string): Promise<{
        message: string;
    }>;
    static logoutSession(sessionId: string, userId?: bigint | string): Promise<{
        message: string;
    }>;
    static requestPasswordReset(email: string): Promise<{
        message: string;
        expirySeconds: number;
    }>;
    static resetPassword(email: string, otp: string, newPassword: string): Promise<{
        message: string;
    }>;
}
//# sourceMappingURL=auth.service.d.ts.map