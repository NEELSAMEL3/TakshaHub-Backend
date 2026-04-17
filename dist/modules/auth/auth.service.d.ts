export declare class AuthService {
    static register(data: any): Promise<{
        message: string;
        user: {
            id: bigint;
            fullName: string;
            email: string;
            phoneNumber: string | null;
            createdAt: Date;
            updatedAt: Date;
        };
        member: {
            userId: bigint;
            schoolId: bigint;
            role: import("@prisma/client").$Enums.MemberRole;
            id: bigint;
            createdAt: Date;
            updatedAt: Date;
            deletedAt: Date | null;
            isActive: boolean;
        };
    }>;
    static login(data: any, meta: {
        ip: string;
        userAgent: string;
        deviceId: string;
    }): Promise<{
        message: string;
        accessToken: string;
        refreshToken: string;
        user: {
            id: bigint;
            fullName: string;
            email: string;
            phoneNumber: string | null;
            createdAt: Date;
            updatedAt: Date;
        };
        member: {
            userId: bigint;
            schoolId: bigint;
            role: import("@prisma/client").$Enums.MemberRole;
            id: bigint;
            createdAt: Date;
            updatedAt: Date;
            deletedAt: Date | null;
            isActive: boolean;
        };
    }>;
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
    static logoutSession(sessionId: string): Promise<{
        message: string;
    }>;
}
//# sourceMappingURL=auth.service.d.ts.map