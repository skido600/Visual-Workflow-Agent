import { z } from "zod";
import "dotenv/config";

export const envSchema = z.object({
  DATABASE_URL: z.string(),
  COOKIE_SECRET: z.string(),
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),
  JWT_ACCESS_SECRET: z.string(),
  JWT_REFRESH_SECRET: z.string(),
  GOOGLE_CLIENT_ID: z.string(),
  GOOGLE_CLIENT_SECRET: z.string(),
  // GOOGLE_CALLBACK_URL: z.string(),
  APP_URL: z.string(),
  FRONTEND_URL: z.string(),
  SESSION_SECRET: z.string(),
});

export const env = envSchema.parse(process.env);
