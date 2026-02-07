import "dotenv/config";
import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "production"]).default("development"),
  PORT: z.coerce.number().default(8000),
  DATABASE_URL: z.string().min(1),

  RATE_LIMIT_WINDOW_MS: z.coerce.number().default(60000),
  RATE_LIMIT_MAX: z.coerce.number().default(100),

  SENTRY_DSN: z.string().optional(),

  // Auth
  JWT_SECRET: z.string().min(32),
  BCRYPT_ROUNDS: z.coerce.number().default(12),
});

export const env = envSchema.parse(process.env);
