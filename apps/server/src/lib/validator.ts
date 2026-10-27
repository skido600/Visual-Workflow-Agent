import { z } from "zod";

export const registerSchema = z.object({
  username: z.string().min(1, "Username is required"),
  email: z.email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

export const loginSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(1, "Password is required"),
});

export const forgotPasswordSchema = z.object({
  email: z.email(),
});
export const verifyOtpSchema = z.object({
  email: z.string().trim().email("Invalid email address"),

  otp: z.string().regex(/^\d{6}$/, "OTP must be 6 digits"),
});
