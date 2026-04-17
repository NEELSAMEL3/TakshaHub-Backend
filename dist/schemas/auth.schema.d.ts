import { z } from "zod";
export declare const registerSchema: z.ZodObject<{
    fullName: z.ZodString;
    email: z.ZodEmail;
    password: z.ZodString;
    phoneNumber: z.ZodOptional<z.ZodString>;
    school: z.ZodObject<{
        name: z.ZodString;
        type: z.ZodString;
        board: z.ZodString;
        city: z.ZodString;
        state: z.ZodString;
        website: z.ZodOptional<z.ZodString>;
        udiseNumber: z.ZodString;
    }, z.core.$strip>;
}, z.core.$strip>;
export declare const loginSchema: z.ZodObject<{
    email: z.ZodEmail;
    password: z.ZodString;
    schoolId: z.ZodString;
    deviceId: z.ZodString;
}, z.core.$strip>;
//# sourceMappingURL=auth.schema.d.ts.map