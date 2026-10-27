import { and, eq, gt, isNull } from "drizzle-orm";
import type { Context } from "hono";
import { deleteCookie, getCookie, setCookie } from "hono/cookie";
import { google } from "googleapis";

import { db } from "../db";
import { oauthIdentities, sessions, users } from "../db/schema";
import { env } from "../env";
import { getGoogleAuthUrl, hashOAuthValue } from "../lib/goggleservice";
import { hashToken } from "../lib/uth-tokens";
import { generateTokens } from "../utils/jwt";
import { setAuthCookies } from "../utils/cookies";

const STATE_COOKIE = "google_oauth_state";
const REFRESH_TOKEN_SECONDS = 7 * 24 * 60 * 60;
const clearStateCookie = (c: Context) =>
  deleteCookie(c, STATE_COOKIE, {
    path: "/",
    secure: isProd,
    sameSite: "Lax",
  });
const isProd = env.NODE_ENV === "production";

export async function googleUrl(c: Context) {
  try {
    const url = await getGoogleAuthUrl();

    return c.json({
      success: true,
      url,
    });
  } catch (error) {
    console.error("Google auth URL error:", error);

    return c.json(
      {
        success: false,
        message: "Unable to start Google authentication",
        data: null,
      },
      500,
    );
  }
}

export async function GoogleCallback(c: Context) {
  try {
    const code = c.req.query("code");

    if (!code) {
      clearStateCookie(c);

      return c.json(
        {
          success: false,
          message: "Missing Google authorization code or state",
          data: null,
        },
        400,
      );
    }

    const now = new Date();

    const client = new google.auth.OAuth2(
      env.GOOGLE_CLIENT_ID,
      env.GOOGLE_CLIENT_SECRET,
      `${env.FRONTEND_URL}/api/v1/oauth/google/callback`,
    );

    const { tokens } = await client.getToken(code);

    if (!tokens.id_token) {
      return c.json(
        {
          success: false,
          message: "Google did not return an ID token",
          data: null,
        },
        400,
      );
    }

    // Verify Google's signed ID token and the original nonce.
    const ticket = await client.verifyIdToken({
      idToken: tokens.id_token,
      audience: env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();

    if (!payload?.sub || !payload.email || payload.email_verified !== true) {
      return c.json(
        {
          success: false,
          message: "Google identity verification failed",
          data: null,
        },
        401,
      );
    }

    // Fetch the profile using the verified access token.
    client.setCredentials(tokens);

    const oauth2 = google.oauth2({
      version: "v2",
      auth: client,
    });

    const { data: profile } = await oauth2.userinfo.get();

    if (
      !profile.id ||
      profile.id !== payload.sub ||
      !profile.email ||
      profile.email.toLowerCase() !== payload.email.toLowerCase() ||
      profile.verified_email !== true
    ) {
      return c.json(
        {
          success: false,
          message: "Invalid or unverified Google profile",
          data: null,
        },
        401,
      );
    }

    const email = payload.email.toLowerCase();

    // First, look for an existing Google identity.
    const [identity] = await db
      .select()
      .from(oauthIdentities)
      .where(
        and(
          eq(oauthIdentities.provider, "google"),
          eq(oauthIdentities.providerSubject, payload.sub),
        ),
      )
      .limit(1);

    let user: typeof users.$inferSelect;

    if (identity) {
      const [existingUser] = await db
        .select()
        .from(users)
        .where(eq(users.id, identity.userId))
        .limit(1);

      if (!existingUser) {
        return c.json(
          {
            success: false,
            message: "The account associated with Google was not found",
            data: null,
          },
          404,
        );
      }

      user = existingUser;

      await db
        .update(oauthIdentities)
        .set({
          providerEmail: email,
          providerEmailVerified: true,
          updatedAt: now,
        })
        .where(eq(oauthIdentities.id, identity.id));
    } else {
      // Only associate an existing account when Google verifies the email.
      const [existingUser] = await db
        .select()
        .from(users)
        .where(eq(users.email, email))
        .limit(1);

      if (existingUser) {
        user = existingUser;
      } else {
        const [createdUser] = await db
          .insert(users)
          .values({
            email,
            emailVerified: true,
            emailVerifiedAt: now,
            displayName: profile.name ?? payload.name ?? null,
            avatarUrl: profile.picture ?? payload.picture ?? null,
          })
          .returning();

        if (!createdUser) {
          throw new Error("Failed to create user");
        }

        user = createdUser;
      }

      await db
        .insert(oauthIdentities)
        .values({
          userId: user.id,
          provider: "google",
          providerSubject: payload.sub,
          providerEmail: email,
          providerEmailVerified: true,
        })
        .onConflictDoNothing();
    }

    const { accessToken, refreshToken, refreshExpDate } = await generateTokens(
      user.id,
      user.email,
    );
    await db.insert(sessions).values({
      userId: user.id,
      tokenHash: hashToken(refreshToken),
      expiresAt: new Date(Date.now() + REFRESH_TOKEN_SECONDS * 1000),
    });
    await setAuthCookies(c, accessToken, refreshToken);

    return c.json({
      success: true,
      message: "Google authentication successful",
      data: {
        id: user.id,
        email: user.email,
        username: user.username,
        displayName: user.displayName,
        avatarUrl: user.avatarUrl,
        emailVerified: user.emailVerified,
      },
    });
  } catch (error) {
    console.error("Google callback error:", error);

    return c.json(
      {
        success: false,
        message: "Google authentication failed",
        data: null,
      },
      500,
    );
  }
}
