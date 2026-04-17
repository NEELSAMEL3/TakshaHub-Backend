import type { Request, Response, NextFunction } from "express";
import { ZodType } from "zod";
export declare const validate: <T>(schema: ZodType<T>) => (req: Request, res: Response, next: NextFunction) => Response<any, Record<string, any>> | undefined;
//# sourceMappingURL=validate.d.ts.map