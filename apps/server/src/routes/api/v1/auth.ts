import { Hono } from "hono";
import {
  Register,
  VerifyEmail,
  ResendVerification,
  Login,
  ForgotPassword,
  ResetPassword,
  verifyOtp,
} from "../../../controller/auth.controller";

const auth = new Hono();

auth.post("/register", Register);
auth.get("/verify-email", VerifyEmail);
auth.post("/resend-verification", ResendVerification);
auth.post("/forgot-password", ForgotPassword);
auth.post("/reset-password", ResetPassword);
auth.post("/login", Login);
auth.post("/verify-otp", verifyOtp);
export default auth;
