export declare const registerAdmin: (data: any) => Promise<{
    schoolName: string;
    schoolType: import("@prisma/client").$Enums.SchoolType;
    board: import("@prisma/client").$Enums.BoardType;
    city: string;
    state: string;
    email: string;
    websiteLink: string | null;
    fullName: string;
    password: string;
    phoneNumber: string;
    verificationDocLink: string;
    createdAt: Date;
    id: number;
}>;
export declare const loginAdmin: (email: string, password: string) => Promise<{
    admin: {
        schoolName: string;
        schoolType: import("@prisma/client").$Enums.SchoolType;
        board: import("@prisma/client").$Enums.BoardType;
        city: string;
        state: string;
        email: string;
        websiteLink: string | null;
        fullName: string;
        password: string;
        phoneNumber: string;
        verificationDocLink: string;
        createdAt: Date;
        id: number;
    };
    token: string;
}>;
export declare const getAdminProfile: (adminId: number) => Promise<{
    schoolName: string;
    schoolType: import("@prisma/client").$Enums.SchoolType;
    board: import("@prisma/client").$Enums.BoardType;
    city: string;
    state: string;
    email: string;
    websiteLink: string | null;
    fullName: string;
    password: string;
    phoneNumber: string;
    verificationDocLink: string;
    createdAt: Date;
    id: number;
} | null>;
//# sourceMappingURL=auth.service.d.ts.map