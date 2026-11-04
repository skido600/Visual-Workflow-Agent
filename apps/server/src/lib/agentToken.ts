import { createHash, randomBytes } from "node:crypto";
import { and, eq, isNull } from "drizzle-orm";
import { db } from "../db"; // your drizzle instance
import { agentTokens } from "../db/schema";

export function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

// Call once when creating a token. Returns the raw token ONCE.
export async function createAgentToken(userId: string, name?: string) {
  const token = `agt_${randomBytes(32).toString("hex")}`;

  await db.insert(agentTokens).values({
    userId,
    name,
    tokenHash: hashToken(token),
  });

  return token;
}

export async function findAgentByToken(token: string) {
  const [agent] = await db
    .select()
    .from(agentTokens)
    .where(
      and(
        eq(agentTokens.tokenHash, hashToken(token)),
        isNull(agentTokens.revokedAt),
      ),
    )
    .limit(1);

  if (!agent) return null;

  // Optional usage tracking, fire and forget
  db.update(agentTokens)
    .set({ lastUsedAt: new Date() })
    .where(eq(agentTokens.id, agent.id))
    .catch(() => {});

  return agent;
}
