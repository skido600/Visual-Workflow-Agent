import "dotenv/config";
import { createAgentToken } from "../src/lib/agentToken";

const userId = process.argv[2];
if (!userId) {
  console.error("Usage: tsx scripts/createAgentToken.ts <userId>");
  process.exit(1);
}

createAgentToken(userId, "local dev agent").then((token) => {
  console.log("AGENT_TOKEN=" + token);
  process.exit(0);
});
