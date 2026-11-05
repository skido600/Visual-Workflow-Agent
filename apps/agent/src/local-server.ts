import "dotenv/config";

import { Hono } from "hono";
import { cors } from "hono/cors";
import { serve } from "@hono/node-server";

import { startPairing } from "./connect.js";
import { getSavedAgentToken } from "./connect.js";
import { executeApprovedPlan } from "./index.js";

const app = new Hono();

const WEB_URL = process.env.WEB_URL;
const PORT = Number(process.env.PORT);

let pairingInProgress = false;
let executionInProgress = false;

// CORS configuration
app.use(
  "*",
  cors({
    origin: WEB_URL,
    allowMethods: ["GET", "POST", "OPTIONS"],
    allowHeaders: ["Content-Type", "X-Agent-Request"],
  }),
);

// Basic browser-origin and custom-header validation
function validateRequest(c: {
  req: {
    header: (name: string) => string | undefined;
  };
}) {
  if (c.req.header("Origin") !== WEB_URL) {
    return false;
  }

  if (c.req.header("X-Agent-Request") !== "connect") {
    return false;
  }

  return true;
}

// Health check
app.get("/health", (c) => {
  return c.json({
    success: true,
    message: "Desktop agent is running",
  });
});
app.get("/status", (c) => {
  return c.json({
    success: true,
    connected: Boolean(getSavedAgentToken()),
    running: executionInProgress,
  });
});
// Connect device
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

// Execute approved plan
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

serve({
  fetch: app.fetch,
  port: PORT,
});

console.log(`Desktop agent listening on http://127.0.0.1:${PORT}`);
