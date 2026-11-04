import { Hono } from "hono";
import {
  createPlanController,
  approvePlanController,
  rejectPlanController,
} from "../../../controller/ai.controller";
import { requireAuth } from "../../../middleware/VerifyToken";

const aiRoute = new Hono();

aiRoute.post("/plan", requireAuth, createPlanController);
aiRoute.post("/plans/:planId/approve", requireAuth, approvePlanController);
aiRoute.post("/plans/:planId/reject", requireAuth, rejectPlanController);
export default aiRoute;
