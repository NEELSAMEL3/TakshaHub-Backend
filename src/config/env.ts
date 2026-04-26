import "dotenv/config";
import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  PORT: z.string().optional(),
  DATABASE_URL: z.string().url(),
  OTP_SECRET: z.string().min(1),
  JWT_ACCESS_SECRET: z.string().min(1),
  JWT_REFRESH_SECRET: z.string().min(1),
  UPSTASH_REDIS_REST_URL: z.string().url(),
  UPSTASH_REDIS_REST_TOKEN: z.string().min(1),
  BCRYPT_ROUNDS: z.string().optional(),
  REFRESH_DAYS: z.string().optional(),
  LOG_LEVEL: z.string().optional(),
  EMAIL_FROM: z.string().email().optional(),
  MAIL_HOST: z.string().optional(),
  MAIL_PORT: z.string().optional(),
  MAIL_USER: z.string().optional(),
  MAIL_PASSWORD: z.string().optional(),
  MAX_SESSIONS: z.string().optional(),
  CORS_ORIGIN: z.string().optional(),
});

const env = envSchema.parse(process.env);

export default env;
