// routes/v1/agent/pair.ts
import { Hono } from "hono";
import { and, eq, gt } from "drizzle-orm";
import { randomBytes } from "node:crypto";
import { db } from "../../../db";
import { requireAuth } from "../../../middleware/VerifyToken";
import { createAgentToken, hashToken } from "../../../lib/agentToken";
import { getAuthenticatedUser } from "../../../controller/agent.controller";
import { agentPairings } from "../../../db/schema";
import { env } from "../../../env";

const pair = new Hono();

const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
function makeUserCode() {
  const bytes = randomBytes(8);
  const chars = Array.from(bytes, (b) => ALPHABET[b % ALPHABET.length]).join(
    "",
  );
  return `${chars.slice(0, 4)}-${chars.slice(4)}`;
}

pair.post("/start", async (c) => {
  const deviceCode = randomBytes(32).toString("hex");
  const userCode = makeUserCode();

  await db.insert(agentPairings).values({
    deviceCodeHash: hashToken(deviceCode),
    userCode,
    expiresAt: new Date(Date.now() + 10 * 60 * 1000),
  });

  return c.json({
    success: true,
    data: {
      deviceCode,
      userCode,
      verificationUrl: `${env.WEB_URL}/connect-agent?code=${userCode}`,
      expiresIn: 600,
    },
  });
});

pair.post("/approve", requireAuth, async (c) => {
  const user = getAuthenticatedUser(c);
  if (!user) return c.json({ success: false, message: "Unauthorized" }, 401);

  const { userCode } = await c.req.json();

  const updated = await db
    .update(agentPairings)
    .set({ userId: user.id, status: "approved" })
    .where(
      and(
        eq(agentPairings.userCode, String(userCode).toUpperCase()),
        eq(agentPairings.status, "pending"),
        gt(agentPairings.expiresAt, new Date()),
      ),
    )
    .returning({ id: agentPairings.id });

  if (updated.length === 0) {
    return c.json({ success: false, message: "Invalid or expired code" }, 400);
  }
  return c.json({ success: true });
});

pair.post("/poll", async (c) => {
  const { deviceCode } = await c.req.json();
  const hash = hashToken(String(deviceCode));

  const [row] = await db
    .select()
    .from(agentPairings)
    .where(eq(agentPairings.deviceCodeHash, hash))
    .limit(1);

  if (!row || row.expiresAt < new Date() || row.status === "consumed") {
    return c.json({ success: false, message: "Pairing expired" }, 400);
  }
  if (row.status === "pending") {
    return c.json({ success: true, status: "pending" }, 202);
  }

  const claimed = await db
    .update(agentPairings)
    .set({ status: "consumed" })
    .where(
      and(eq(agentPairings.id, row.id), eq(agentPairings.status, "approved")),
    )
    .returning({ userId: agentPairings.userId });

  if (claimed.length === 0 || !claimed[0].userId) {
    return c.json({ success: false, message: "Already used" }, 400);
  }

  const token = await createAgentToken(claimed[0].userId, "Desktop agent");
  return c.json({ success: true, data: { token } });
});

export default pair;
