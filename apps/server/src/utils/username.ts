// utils/username.ts
import { eq } from "drizzle-orm";
import { randomInt } from "node:crypto";
import { db } from "../db";
import { users } from "../db/schema";

export async function generateUsername(email: string) {
  const base =
    email
      .split("@")[0]
      .toLowerCase()
      .replace(/[^a-z0-9_]/g, "")
      .slice(0, 20) || "user";

  let candidate = base;

  for (let i = 0; i < 5; i++) {
    const [existing] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.username, candidate))
      .limit(1);

    if (!existing) return candidate;

    candidate = `${base}${randomInt(100, 10000)}`;
  }

  // Extremely unlikely fallback
  return `${base}${Date.now().toString(36)}`;
}
