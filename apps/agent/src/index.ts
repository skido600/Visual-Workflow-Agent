import "dotenv/config";

import { executeAction } from "./files.js";
import type { Plan } from "./lib/ai_schema.js";
import path from "node:path";

const API_URL = process.env.API_URL?.replace(/\/+$/, "");

if (!API_URL) {
  throw new Error("API_URL is required.");
}

function getHeaders(token: string) {
  return {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };
}

type ClaimedPlan = {
  success: boolean;
  data: {
    id: string;
    plan: Plan;
  };
};

type ActionResult = {
  action: string;
  success: boolean;
  result?: unknown;
  error?: string;
};

async function claimPlan(token: string): Promise<ClaimedPlan | null> {
  const response = await fetch(`${API_URL}/v1/agent/claim`, {
    method: "POST",
    headers: getHeaders(token),
  });

  console.log("Claim status:", response.status);

  if (response.status === 204) {
    console.log("No approved plan available.");
    return null;
  }

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Claim failed: ${response.status} - ${error}`);
  }

  const data = (await response.json()) as ClaimedPlan;

  console.log("Plan received:", JSON.stringify(data, null, 2));

  return data;
}

async function reportResult(
  token: string,
  planId: string,
  status: "completed" | "failed",
  results: ActionResult[],
) {
  const response = await fetch(`${API_URL}/v1/agent/plans/${planId}/result`, {
    method: "POST",
    headers: getHeaders(token),
    body: JSON.stringify({ status, results }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Could not report result: ${response.status} - ${error}`);
  }

  console.log(`Backend updated plan status: ${status}`);
}

async function processPlan(token: string, planId: string, plan: Plan) {
  console.log("Executing plan:", planId);
  console.log("Actions:", JSON.stringify(plan.actions, null, 2));

  const results: ActionResult[] = [];

  let lastFoundFile: string | null = null;
  let lastCreatedFolder: string | null = null;
  let failed = false;

  for (const action of plan.actions) {
    console.log("Executing action:", action.type);

    try {
      let result: unknown;

      if (action.type === "find_file") {
        const findResult = (await executeAction(action)) as {
          count: number;
          results: Array<{
            name: string;
            path: string;
            type: string;
          }>;
        };

        console.log("Find result:", findResult);

        if (findResult.count === 0) {
          throw new Error("No matching file was found.");
        }

        if (findResult.count > 1) {
          throw new Error(
            "Multiple matching files found. Please specify which file to use.",
          );
        }

        const foundPath = findResult.results[0]?.path;

        if (!foundPath || !path.isAbsolute(foundPath)) {
          throw new Error(
            "The found file does not have a valid absolute path.",
          );
        }

        lastFoundFile = foundPath;
        result = findResult;
      } else if (action.type === "create_folder") {
        const folderResult = (await executeAction(action)) as {
          path: string;
          created: boolean;
        };

        if (!folderResult.path || !path.isAbsolute(folderResult.path)) {
          throw new Error(
            "Folder creation did not return a valid absolute path.",
          );
        }

        lastCreatedFolder = folderResult.path;
        result = folderResult;
      } else if (action.type === "move_file") {
        const source =
          action.source === "$LAST_FOUND_FILE" ? lastFoundFile : action.source;

        const destination =
          action.destination === "$LAST_CREATED_FOLDER"
            ? lastCreatedFolder
            : action.destination;

        if (!source || !path.isAbsolute(source)) {
          throw new Error(
            `Invalid move source path: ${source ?? "not resolved"}`,
          );
        }

        if (!destination || !path.isAbsolute(destination)) {
          throw new Error(
            `Invalid move destination path: ${destination ?? "not resolved"}`,
          );
        }

        // A folder placeholder means move the file into that folder.
        // A normal destination is treated as a full destination file path.
        const destinationFilePath =
          action.destination === "$LAST_CREATED_FOLDER"
            ? path.join(destination, path.basename(source))
            : destination;

        console.log("Resolved move:", {
          source,
          destination: destinationFilePath,
        });

        result = await executeAction({
          ...action,
          source,
          destination: destinationFilePath,
        });
      } else {
        result = await executeAction(action);
      }

      console.log("Action result:", result);

      results.push({
        action: action.type,
        success: true,
        result,
      });
    } catch (error) {
      failed = true;

      const message = error instanceof Error ? error.message : "Action failed";

      console.error("Action failed:", message);

      results.push({
        action: action.type,
        success: false,
        error: message,
      });

      // Stop immediately if an action fails.
      break;
    }
  }

  const status = failed ? "failed" : "completed";

  await reportResult(token, planId, status, results);

  console.log(failed ? `Plan failed: ${planId}` : `Plan completed: ${planId}`);

  return {
    success: !failed,
    status,
    results,
  };
}

/**
 * Called by local-server.ts when the user triggers execution.
 */
export async function executeApprovedPlan(token: string) {
  if (!token) {
    throw new Error("Agent token is required.");
  }

  console.log("Local file agent executing approved plan.");

  const claimed = await claimPlan(token);

  if (!claimed) {
    return {
      success: true,
      message: "No approved plan available.",
    };
  }

  if (!claimed.success || !claimed.data?.id || !claimed.data?.plan) {
    throw new Error("Invalid claim response from backend.");
  }

  // This was missing from your previous implementation.
  // Actually execute the claimed plan.
  return await processPlan(token, claimed.data.id, claimed.data.plan);
}
