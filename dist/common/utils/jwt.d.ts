import { type JwtPayload } from "jsonwebtoken";
export interface TokenPayload extends JwtPayload {
    userId: string | bigint;
    sessionId: string;
    schoolId: string;
    role: string;
    tokenVersion: number;
    type: "access" | "refresh";
}
export declare const generateAccessToken: (payload: Omit<TokenPayload, "type">) => string;
export declare const generateRefreshToken: (payload: Omit<TokenPayload, "type">) => string;
export declare const verifyAccessToken: (token: string) => TokenPayload;
export declare const verifyRefreshToken: (token: string) => TokenPayload;
export declare const hashToken: (token: string) => string;
//# sourceMappingURL=jwt.d.ts.map