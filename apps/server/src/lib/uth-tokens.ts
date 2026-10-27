import { createHash, randomBytes } from "node:crypto";

export const createToken = () => randomBytes(32).toString("hex");

export const hashToken = (token: string) =>
  createHash("sha256").update(token).digest("hex");

export const FIFTEEN_MINUTES = 15 * 60;
export const ONE_HOUR = 60 * 60;

export const getAppUrl = () => {
  const url = process.env.APP_URL;

  if (!url) throw new Error("APP_URL is not configured");

  return url.replace(/\/$/, "");
};
