import "dotenv/config";

import { Hono } from "hono";
import { serve } from "@hono/node-server";
import { cors } from "hono/cors";

import { startPairing, getSavedAgentToken } from "./connect.js";
import { executeApprovedPlan } from "./index.js";

const app = new Hono();

// 1. Default port so it never becomes NaN
const PORT = Number(process.env.PORT ?? 4545);

const WEB_URL =
  process.env.WEB_URL ?? "https://visual-workflow-agent1.vercel.app";

// 2. Allow both your deployed site and local dev
const ALLOWED_ORIGINS = [WEB_URL, "http://localhost:3000"];

// 3. Chrome Private Network Access header (must come BEFORE cors)
app.use("*", async (c, next) => {
  if (c.req.method === "OPTIONS") {
    c.header("Access-Control-Allow-Private-Network", "true");
  }
  await next();
});

app.use(
  "*",
  cors({
    origin: (origin) => (ALLOWED_ORIGINS.includes(origin) ? origin : null),
    allowMethods: ["GET", "POST", "OPTIONS"],
    allowHeaders: ["Content-Type", "X-Agent-Request"],
    maxAge: 86400,
  }),
);

let pairingInProgress = false;
let executionInProgress = false;

function validateRequest(c: {
  req: { header: (name: string) => string | undefined };
}) {
  const origin = c.req.header("Origin");
  if (!origin || !ALLOWED_ORIGINS.includes(origin)) return false;
  if (c.req.header("X-Agent-Request") !== "connect") return false;
  return true;
}

app.get("/health", (c) =>
  c.json({ success: true, message: "Desktop agent is running" }),
);

app.get("/status", (c) =>
  c.json({
    success: true,
    connected: Boolean(getSavedAgentToken()),
    running: executionInProgress,
  }),
);

app.post("/connect", async (c) => {
  if (!validateRequest(c)) {
    return c.json({ success: false, message: "Request not allowed" }, 403);
  }

  if (pairingInProgress) {
    return c.json(
      { success: false, message: "Pairing already in progress" },
      409,
    );
  }

  pairingInProgress = true;

  try {
    const result = await startPairing();
    return c.json(result);
  } catch (error) {
    console.error("Pairing error:", error);
    return c.json(
      {
        success: false,
        message:
          error instanceof Error ? error.message : "Could not connect device",
      },
      500,
    );
  } finally {
    pairingInProgress = false;
  }
});

app.post("/execute", async (c) => {
  console.log("Frontend requested agent execution.");

  if (!validateRequest(c)) {
    console.log("Execution blocked: invalid browser request.");
    return c.json({ success: false, message: "Request not allowed" }, 403);
  }

  if (executionInProgress) {
    return c.json(
      { success: false, message: "Execution already in progress" },
      409,
    );
  }

  const token = getSavedAgentToken();

  if (!token) {
    console.log("No saved agent token. Connect device first.");
    return c.json({ success: false, message: "Agent is not connected" }, 401);
  }

  executionInProgress = true;

  try {
    const result = await executeApprovedPlan(token);
    return c.json(result);
  } catch (error) {
    console.error("Execution error:", error);
    return c.json(
      {
        success: false,
        message: error instanceof Error ? error.message : "Execution failed",
      },
      500,
    );
  } finally {
    executionInProgress = false;
  }
});

// 4. Bind to localhost only, so nothing else on the network can reach it
serve({
  fetch: app.fetch,
  port: PORT,
  hostname: "127.0.0.1",
});

console.log(`Desktop agent listening on http://127.0.0.1:${PORT}`);
