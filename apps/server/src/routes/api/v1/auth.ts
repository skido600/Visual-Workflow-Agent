import { Hono } from "hono";
import {
  Register,
  VerifyEmail,
  ResendVerification,
  Login,
  ForgotPassword,
  ResetPassword,
  verifyOtp,
  logoutController,
} from "../../../controller/auth.controller";
import { requireAuth } from "../../../middleware/VerifyToken";

const auth = new Hono();

auth.post("/register", Register);
auth.get("/verify-email", VerifyEmail);
auth.post("/resend-verification", ResendVerification);
auth.post("/forgot-password", ForgotPassword);
auth.post("/reset-password", ResetPassword);
auth.post("/login", Login);
auth.post("/verify-otp", verifyOtp);
auth.post("/logout", requireAuth, logoutController);
export default auth;
