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
  META_MODEL_NAME: z.string(),
  META_MODEL_API_URL: z.string(),
  META_MODEL_API_KEY: z.string(),
  AGENT_TOKEN: z.string().min(1),
  WEB_URL: z.string(),
});

export const env = envSchema.parse(process.env);
