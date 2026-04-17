import type { Response } from "express";
export declare const setRefreshCookie: (res: Response, token: string) => void;
export declare const clearRefreshCookie: (res: Response) => void;
export declare const getDeviceInfo: (userAgent: string) => {
    device: any;
    browser: any;
};
//# sourceMappingURL=helpers.d.ts.map