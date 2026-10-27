import { and, eq, gt, isNull } from "drizzle-orm";
import type { Context } from "hono";
import { randomInt } from "node:crypto";
import {
  emailVerificationTokens,
  passwordCredentials,
  passwordResetTokens,
  users,
} from "../db/schema";
import { db } from "../db/index";
import {
  forgotPasswordSchema,
  loginSchema,
  registerSchema,
  verifyOtpSchema,
} from "../lib/validator";
import { hashPassword, verifyPassword } from "../lib/haspassword";
import {
  sendPasswordResetEmail,
  sendVerificationEmail,
} from "../lib/auth-email";
import {
  createToken,
  hashToken,
  FIFTEEN_MINUTES,
  ONE_HOUR,
} from "../lib/uth-tokens";
import { generateTokens } from "../utils/jwt";
import { setAuthCookies } from "../utils/cookies";

const errorResponse = (c: Context, message: string) =>
  c.json(
    {
      success: false,
      message,
    },
    500,
  );

export const Register = async (c: Context) => {
  try {
    const result = registerSchema.safeParse(await c.req.json());

    if (!result.success) {
      return c.json(
        {
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: result.error.issues[0]?.message ?? "Invalid request body",
          },
        },
        400,
      );
    }

    const body = result.data;
    const username = body.username.trim().toLowerCase();
    const email = body.email.trim().toLowerCase();

    const [existingUsername] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.username, username))
      .limit(1);

    if (existingUsername) {
      const suggestions = [`${username}1`, `${username}_dev`, `the${username}`];

      const availableUsernames: string[] = [];

      for (const suggestion of suggestions) {
        const [existing] = await db
          .select({ id: users.id })
          .from(users)
          .where(eq(users.username, suggestion))
          .limit(1);

        if (!existing) {
          availableUsernames.push(suggestion);
        }

        if (availableUsernames.length === 3) break;
      }

      return c.json(
        {
          success: false,
          error: {
            code: "USERNAME_TAKEN",
            message: "This username is taken. Try one of these alternatives.",
            suggestions: availableUsernames,
          },
        },
        409,
      );
    }

    const [existingEmail] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (existingEmail) {
      return c.json(
        {
          success: false,
          error: {
            code: "EMAIL_ALREADY_EXISTS",
            message:
              "An account with this email already exists. Try logging in instead.",
          },
        },
        409,
      );
    }

    const passwordHash = await hashPassword(body.password);
    const token = createToken();
    const now = new Date();

    const [user] = await db
      .insert(users)
      .values({
        username,
        email,
        emailVerified: false,
        displayName: username,
      })
      .returning({ id: users.id });

    if (!user) {
      throw new Error("Failed to create user");
    }

    await db.insert(passwordCredentials).values({
      userId: user.id,
      passwordHash,
    });

    await db.insert(emailVerificationTokens).values({
      userId: user.id,
      tokenHash: hashToken(token),
      expiresAt: new Date(now.getTime() + FIFTEEN_MINUTES * 1000),
    });

    try {
      await sendVerificationEmail(email, token);
    } catch (error) {
      console.error("Verification email failed:", error);
    }

    return c.json(
      {
        success: true,
        message: "Account created. Check your inbox to verify your email.",
      },
      202,
    );
  } catch (error) {
    console.error("Register error:", error);

    const dbError = error as {
      code?: string;
      constraint?: string;
    };

    if (dbError.code === "23505") {
      if (dbError.constraint?.includes("username")) {
        return c.json(
          {
            success: false,
            error: {
              code: "USERNAME_TAKEN",
              message: "Username is already taken",
            },
          },
          409,
        );
      }

      if (dbError.constraint?.includes("email")) {
        return c.json(
          {
            success: true,
            message:
              "If registration is possible, check your inbox for a verification link.",
          },
          202,
        );
      }
    }

    return errorResponse(c, "Unable to create account");
  }
};

export const VerifyEmail = async (c: Context) => {
  try {
    const token = c.req.query("token");

    if (!token) {
      return c.json(
        {
          success: false,
          error: {
            code: "INVALID_TOKEN",
            message: "Verification link is invalid or expired.",
          },
        },
        400,
      );
    }

    const now = new Date();

    const [verification] = await db
      .select({
        id: emailVerificationTokens.id,
        userId: emailVerificationTokens.userId,
      })
      .from(emailVerificationTokens)
      .where(
        and(
          eq(emailVerificationTokens.tokenHash, hashToken(token)),
          isNull(emailVerificationTokens.usedAt),
          gt(emailVerificationTokens.expiresAt, now),
        ),
      )
      .limit(1);

    if (!verification) {
      return c.json(
        {
          success: false,
          error: {
            code: "INVALID_TOKEN",
            message: "Verification link is invalid or expired.",
          },
        },
        400,
      );
    }

    const [consumed] = await db
      .update(emailVerificationTokens)
      .set({ usedAt: now })
      .where(
        and(
          eq(emailVerificationTokens.id, verification.id),
          isNull(emailVerificationTokens.usedAt),
          gt(emailVerificationTokens.expiresAt, now),
        ),
      )
      .returning({ id: emailVerificationTokens.id });

    if (!consumed) {
      return c.json(
        {
          success: false,
          error: {
            code: "INVALID_TOKEN",
            message: "Verification link is invalid or expired.",
          },
        },
        400,
      );
    }

    await db
      .update(users)
      .set({
        emailVerified: true,
        emailVerifiedAt: now,
        updatedAt: now,
      })
      .where(eq(users.id, verification.userId));

    return c.json({
      success: true,
      message: "Email verified successfully. You can now log in.",
    });
  } catch (error) {
    console.error("Verify email error:", error);
    return errorResponse(c, "Unable to verify email");
  }
};

export const Login = async (c: Context) => {
  try {
    const result = loginSchema.safeParse(await c.req.json());

    if (!result.success) {
      return c.json(
        {
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: result.error.issues[0]?.message ?? "Invalid request body",
          },
        },
        400,
      );
    }

    const email = result.data.email.trim().toLowerCase();

    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (!user) {
      return c.json(
        {
          success: false,
          error: {
            code: "INVALID_CREDENTIALS",
            message: "Invalid email or password",
          },
        },
        401,
      );
    }

    const [credentials] = await db
      .select()
      .from(passwordCredentials)
      .where(eq(passwordCredentials.userId, user.id))
      .limit(1);

    if (
      !credentials ||
      !(await verifyPassword(result.data.password, credentials.passwordHash))
    ) {
      return c.json(
        {
          success: false,
          error: {
            code: "INVALID_CREDENTIALS",
            message: "Invalid email or password",
          },
        },
        401,
      );
    }

    if (!user.emailVerified) {
      return c.json(
        {
          success: false,
          error: {
            code: "EMAIL_NOT_VERIFIED",
            message: "Please verify your email before logging in.",
          },
        },
        403,
      );
    }

    const { accessToken, refreshToken } = await generateTokens(
      user.id,
      user.email,
    );

    await setAuthCookies(c, accessToken, refreshToken);

    return c.json({
      success: true,
      message: "Login successful",
      data: {
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          displayName: user.displayName,
          avatarUrl: user.avatarUrl,
        },
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    return errorResponse(c, "Unable to log in");
  }
};
export const ResendVerification = async (c: Context) => {
  try {
    const body = await c.req.json<{ email: string }>();
    const email = body.email?.trim().toLowerCase();

    if (!email) {
      return c.json(
        {
          success: false,
          message: "Email is required.",
        },
        400,
      );
    }

    const [user] = await db
      .select({
        id: users.id,
        email: users.email,
        emailVerified: users.emailVerified,
      })
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    // Avoid revealing account status through this endpoint.
    if (!user || user.emailVerified) {
      return c.json({
        success: true,
        message:
          "If your account requires verification, a new link will be sent.",
      });
    }

    const now = new Date();
    const token = createToken();

    // Invalidate older unused verification tokens.
    await db
      .update(emailVerificationTokens)
      .set({ usedAt: now })
      .where(
        and(
          eq(emailVerificationTokens.userId, user.id),
          isNull(emailVerificationTokens.usedAt),
        ),
      );

    await db.insert(emailVerificationTokens).values({
      userId: user.id,
      tokenHash: hashToken(token),
      expiresAt: new Date(now.getTime() + FIFTEEN_MINUTES * 1000),
    });

    await sendVerificationEmail(user.email, token);

    return c.json({
      success: true,
      message: "A new verification link has been sent to your email.",
    });
  } catch (error) {
    console.error("Resend verification error:", error);

    return errorResponse(c, "Unable to resend verification email");
  }
};

export const ForgotPassword = async (c: Context) => {
  try {
    const result = forgotPasswordSchema.safeParse(await c.req.json());

    if (!result.success) {
      return c.json(
        {
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: result.error.issues[0]?.message ?? "Invalid request body",
          },
        },
        400,
      );
    }

    const email = result.data.email.trim().toLowerCase();

    const message =
      "If an account with that email exists, a password reset code will be sent.";

    const [user] = await db
      .select({
        id: users.id,
        email: users.email,
      })
      .from(users)
      .innerJoin(passwordCredentials, eq(passwordCredentials.userId, users.id))
      .where(eq(users.email, email))
      .limit(1);

    if (!user) {
      return c.json(
        {
          success: false,
          error: {
            code: "USER_NOT_FOUND",
            message: "No account exists with this email address.",
          },
        },
        404,
      );
    }

    const otp = randomInt(100000, 1000000).toString();
    const now = new Date();

    // Invalidate previous unused reset codes.
    await db
      .update(passwordResetTokens)
      .set({ usedAt: now })
      .where(
        and(
          eq(passwordResetTokens.userId, user.id),
          isNull(passwordResetTokens.usedAt),
        ),
      );

    await db.insert(passwordResetTokens).values({
      userId: user.id,
      tokenHash: hashToken(otp),
      expiresAt: new Date(now.getTime() + 10 * 60 * 1000),
    });

    try {
      await sendPasswordResetEmail(user.email, otp);
    } catch (error) {
      console.error("Password reset OTP email failed:", error);
    }

    return c.json({ success: true, message }, 202);
  } catch (error) {
    console.error("Forgot password error:", error);
    return errorResponse(c, "Unable to process password reset request");
  }
};

export const ResetPassword = async (c: Context) => {
  try {
    const body = await c.req.json<{
      email: string;
      otp: string;
      newPassword: string;
    }>();

    const email = body.email?.trim().toLowerCase();
    const otp = body.otp?.trim();
    const newPassword = body.newPassword;

    if (
      !email ||
      !/^\d{6}$/.test(otp ?? "") ||
      typeof newPassword !== "string" ||
      newPassword.length < 8 ||
      newPassword.length > 128
    ) {
      return c.json(
        {
          success: false,
          error: {
            code: "INVALID_RESET_REQUEST",
            message:
              "Provide a valid email, six-digit code, and password between 8 and 128 characters.",
          },
        },
        400,
      );
    }

    const [user] = await db
      .select({ id: users.id })
      .from(users)
      .innerJoin(passwordCredentials, eq(passwordCredentials.userId, users.id))
      .where(eq(users.email, email))
      .limit(1);

    if (!user) {
      return c.json(
        {
          success: false,
          error: {
            code: "INVALID_RESET_CODE",
            message: "The code is invalid or expired. Request a new one.",
          },
        },
        400,
      );
    }

    const now = new Date();

    const [resetToken] = await db
      .select({
        id: passwordResetTokens.id,
      })
      .from(passwordResetTokens)
      .where(
        and(
          eq(passwordResetTokens.userId, user.id),
          eq(passwordResetTokens.tokenHash, hashToken(otp)),
          isNull(passwordResetTokens.usedAt),
          gt(passwordResetTokens.expiresAt, now),
        ),
      )
      .limit(1);

    if (!resetToken) {
      return c.json(
        {
          success: false,
          error: {
            code: "INVALID_RESET_CODE",
            message: "The code is invalid or expired. Request a new one.",
          },
        },
        400,
      );
    }

    // Consume the OTP only if it remains unused and unexpired.
    const [consumed] = await db
      .update(passwordResetTokens)
      .set({ usedAt: now })
      .where(
        and(
          eq(passwordResetTokens.id, resetToken.id),
          isNull(passwordResetTokens.usedAt),
          gt(passwordResetTokens.expiresAt, now),
        ),
      )
      .returning({ id: passwordResetTokens.id });

    if (!consumed) {
      return c.json(
        {
          success: false,
          error: {
            code: "INVALID_RESET_CODE",
            message: "The code is invalid or expired. Request a new one.",
          },
        },
        400,
      );
    }

    const passwordHash = await hashPassword(newPassword);

    await db
      .update(passwordCredentials)
      .set({ passwordHash })
      .where(eq(passwordCredentials.userId, user.id));

    // Invalidate any other outstanding reset codes for this user.
    await db
      .update(passwordResetTokens)
      .set({ usedAt: new Date() })
      .where(
        and(
          eq(passwordResetTokens.userId, user.id),
          isNull(passwordResetTokens.usedAt),
        ),
      );

    return c.json({
      success: true,
      message: "Password reset successfully. You can now log in.",
    });
  } catch (error) {
    console.error("Reset password error:", error);
    return errorResponse(c, "Unable to reset password");
  }
};

// VERIFY OTP
export const verifyOtp = async (c: Context) => {
  try {
    const body = await c.req.json();

    const result = verifyOtpSchema.safeParse(body);

    if (!result.success) {
      return c.json(
        {
          success: false,
          message: "Validation failed",
          errors: result.error.flatten().fieldErrors,
        },
        422,
      );
    }

    const { email, otp } = result.data;
    const [user] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (!user) {
      return c.json(
        {
          success: false,
          error: {
            code: "INVALID_OTP",
            message: "Invalid or expired reset code.",
          },
        },
        400,
      );
    }

    const [token] = await db
      .select({ id: passwordResetTokens.id })
      .from(passwordResetTokens)
      .where(
        and(
          eq(passwordResetTokens.userId, user.id),
          eq(passwordResetTokens.tokenHash, hashToken(otp)),
          isNull(passwordResetTokens.usedAt),
          gt(passwordResetTokens.expiresAt, new Date()),
        ),
      )
      .limit(1);

    if (!token) {
      return c.json(
        {
          success: false,
          error: {
            code: "INVALID_OTP",
            message: "Invalid or expired reset code.",
          },
        },
        400,
      );
    }

    return c.json({
      success: true,
      message: "Reset code verified.",
    });
  } catch (error) {
    console.error(error);

    if (error instanceof Error && error.message === "INVALID_OTP") {
      return c.json(
        {
          success: false,
          message: "Invalid OTP",
          error: "INVALID_OTP",
        },
        400,
      );
    }

    if (error instanceof Error && error.message === "OTP_EXPIRED") {
      return c.json(
        {
          success: false,
          message: "OTP has expired",
          error: "OTP_EXPIRED",
        },
        400,
      );
    }

    if (error instanceof Error && error.message === "OTP_ATTEMPTS_EXCEEDED") {
      return c.json(
        {
          success: false,
          message: "Too many OTP attempts",
          error: "OTP_ATTEMPTS_EXCEEDED",
        },
        429,
      );
    }

    return c.json(
      {
        success: false,
        message: "Unable to verify OTP",
        error: "OTP_VERIFICATION_FAILED",
      },
      500,
    );
  }
};
