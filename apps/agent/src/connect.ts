import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { exec } from "node:child_process";

import "dotenv/config";
import { sleep } from "./sleep.js";

const API_URL = process.env.API_URL?.replace(/\/+$/, "");

if (!API_URL) {
  throw new Error("API_URL is required.");
}

const CONFIG_DIR = path.join(os.homedir(), ".meta-agent");
const CONFIG_FILE = path.join(CONFIG_DIR, "config.json");

type PairingResponse = {
  data: {
    deviceCode: string;
    userCode: string;
    verificationUrl: string;
    expiresIn: number;
  };
};

function loadSavedToken(): string | null {
  try {
    const config = JSON.parse(fs.readFileSync(CONFIG_FILE, "utf8"));

    return typeof config.token === "string" && config.token.length > 0
      ? config.token
      : null;
  } catch {
    return null;
  }
}

function saveToken(token: string): void {
  fs.mkdirSync(CONFIG_DIR, { recursive: true });

  fs.writeFileSync(CONFIG_FILE, JSON.stringify({ token }, null, 2), {
    mode: 0o600,
  });
}

async function pairAgent(): Promise<string> {
  const startRes = await fetch(`${API_URL}/v1/agent/start`, {
    method: "POST",
  });

  if (!startRes.ok) {
    throw new Error(
      `Could not start pairing: ${startRes.status} ${await startRes.text()}`,
    );
  }

  const result = (await startRes.json()) as PairingResponse;
  const data = result.data;

  if (
    !data?.deviceCode ||
    !data?.userCode ||
    !data?.verificationUrl ||
    !data?.expiresIn
  ) {
    throw new Error("Invalid pairing response from server.");
  }

  console.log("\nConnect this agent to your account:");
  console.log(`1. Open: ${data.verificationUrl}`);
  console.log(`2. Confirm the code: ${data.userCode}\n`);

  // Open the verification page on Windows.
  exec(`start "" "${data.verificationUrl}"`, (error) => {
    if (error) {
      console.error("Browser failed to open:", error);
      console.log("Open the verification URL manually.");
    }
  });

  const deadline = Date.now() + data.expiresIn * 1000;

  while (Date.now() < deadline) {
    await sleep(3000);

    let res: Response;

    try {
      res = await fetch(`${API_URL}/v1/agent/poll`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          deviceCode: data.deviceCode,
        }),
      });
    } catch (error) {
      console.error("Pairing poll network error:", error);
      continue;
    }

    if (res.status === 202) {
      continue;
    }

    if (!res.ok) {
      throw new Error(`Pairing failed: ${res.status} ${await res.text()}`);
    }

    const body = await res.json();

    if (!body?.data?.token) {
      throw new Error("Server did not return an agent token.");
    }

    return body.data.token;
  }

  throw new Error("Pairing timed out. Restart the pairing process.");
}

export function getSavedAgentToken(): string | null {
  return loadSavedToken();
}

export async function startPairing() {
  const savedToken = loadSavedToken();

  if (savedToken) {
    return {
      success: true,
      alreadyConnected: true,
    };
  }

  const token = await pairAgent();

  saveToken(token);

  return {
    success: true,
    alreadyConnected: false,
  };
}
