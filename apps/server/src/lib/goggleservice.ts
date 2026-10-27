import { google } from "googleapis";
import { env } from "../env";
import { createHash } from "node:crypto";

import { db } from "../db";
const GOOGLE_CALLBACK_URL = `${env.FRONTEND_URL}/api/v1/oauth/google/callback`;

export const oauth2Client = new google.auth.OAuth2(
  env.GOOGLE_CLIENT_ID,
  env.GOOGLE_CLIENT_SECRET,
  GOOGLE_CALLBACK_URL,
);
export const hashOAuthValue = (value: string) =>
  createHash("sha256").update(value).digest("hex");

export const getGoogleAuthUrl = async (redirectTo?: string) => {
  const url = oauth2Client.generateAuthUrl({
    response_type: "code",
    access_type: "offline",
    scope: ["openid", "email", "profile"],
  });

  return url;
};
