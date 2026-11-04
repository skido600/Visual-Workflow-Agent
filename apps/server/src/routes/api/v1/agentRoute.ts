import { Hono } from "hono";
import {
  claimPlanController,
  reportPlanResultController,
  getPlanResultController,
  getPlanHistoryController,
} from "../../../controller/agent.controller";
import { requireAgentAuth } from "../../../middleware/agentAuth";
import { requireAuth } from "../../../middleware/VerifyToken";

const agentRoute = new Hono();

agentRoute.post("/claim", requireAgentAuth, claimPlanController);

agentRoute.post(
  "/plans/:planId/result",

  requireAgentAuth,
  reportPlanResultController,
);
agentRoute.get("/result/:planId", requireAuth, getPlanResultController);
agentRoute.get("/history", requireAuth, getPlanHistoryController);
export default agentRoute;
