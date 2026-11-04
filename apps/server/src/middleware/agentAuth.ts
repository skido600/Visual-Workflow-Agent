import type { Context, Next } from "hono";
import { findAgentByToken } from "../lib/agentToken";

export const requireAgentAuth = async (c: Context, next: Next) => {
  const header = c.req.header("Authorization");
  const token = header?.startsWith("Bearer ") ? header.slice(7) : null;

  if (!token) {
    return c.json({ success: false, message: "Missing agent token" }, 401);
  }

  const agent = await findAgentByToken(token);
  if (!agent) {
    return c.json({ success: false, message: "Invalid agent token" }, 401);
  }

  c.set("userId", { id: agent.userId });
  c.set("agent", agent);

  await next();
};
