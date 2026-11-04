import type { Context } from "hono";
import { and, eq, inArray, desc } from "drizzle-orm";
import { z } from "zod";

import { db } from "../db";
import { aiPlans } from "../db/schema";

const paramsSchema = z.object({
  planId: z.string().uuid(),
});

const resultSchema = z.object({
  status: z.enum(["completed", "failed"]),
  results: z.array(z.unknown()).max(100),
});

export function getAuthenticatedUser(c: Context) {
  const user = c.get("userId") as { id: string } | undefined;

  if (!user?.id) {
    return null;
  }

  return user;
}

export async function claimPlanController(c: Context) {
  const user = getAuthenticatedUser(c);

  if (!user) {
    return c.json({ success: false, message: "Authentication required." }, 401);
  }

  try {
    // Find an approved plan belonging to this user.
    const [candidate] = await db
      .select({
        id: aiPlans.id,
      })
      .from(aiPlans)
      .where(and(eq(aiPlans.userId, user.id), eq(aiPlans.status, "approved")))
      .limit(1);

    if (!candidate) {
      return c.body(null, 204);
    }

    // Claim it only if it is still approved.
    // This conditional update prevents duplicate claims.
    const [claimedPlan] = await db
      .update(aiPlans)
      .set({
        status: "executing",
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(aiPlans.id, candidate.id),
          eq(aiPlans.userId, user.id),
          eq(aiPlans.status, "approved"),
        ),
      )
      .returning({
        id: aiPlans.id,
        goal: aiPlans.goal,
        plan: aiPlans.plan,
        status: aiPlans.status,
      });

    if (!claimedPlan) {
      // Another agent may have claimed it first.
      return c.body(null, 204);
    }

    return c.json({
      success: true,
      data: claimedPlan,
    });
  } catch (error) {
    console.error("Claim plan failed:", error);

    return c.json({ success: false, message: "Could not claim a plan." }, 500);
  }
}

export async function reportPlanResultController(c: Context) {
  const user = getAuthenticatedUser(c);

  if (!user) {
    return c.json({ success: false, message: "Authentication required." }, 401);
  }

  const params = paramsSchema.safeParse(c.req.param());

  if (!params.success) {
    return c.json({ success: false, message: "Invalid plan ID." }, 400);
  }

  let body: unknown;

  try {
    body = await c.req.json();
  } catch {
    return c.json({ success: false, message: "Invalid JSON body." }, 400);
  }

  const parsed = resultSchema.safeParse(body);

  if (!parsed.success) {
    return c.json(
      {
        success: false,
        message: "Invalid execution result.",
        errors: parsed.error.flatten(),
      },
      400,
    );
  }

  try {
    const [updatedPlan] = await db
      .update(aiPlans)
      .set({
        status: parsed.data.status,
        executionResult: parsed.data.results,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(aiPlans.id, params.data.planId),
          eq(aiPlans.userId, user.id),
          eq(aiPlans.status, "executing"),
        ),
      )
      .returning({
        id: aiPlans.id,
        goal: aiPlans.goal,
        status: aiPlans.status,
        executionResult: aiPlans.executionResult,
      });

    if (!updatedPlan) {
      return c.json(
        {
          success: false,
          message: "Plan not found or is not being executed.",
        },
        409,
      );
    }

    return c.json({
      success: true,
      message: "Execution result saved successfully.",
      data: updatedPlan,
    });
  } catch (error) {
    console.error("Report execution result failed:", error);

    return c.json(
      {
        success: false,
        message: "Could not save execution result.",
      },
      500,
    );
  }
}

export async function getPlanResultController(c: Context) {
  const user = getAuthenticatedUser(c);

  if (!user) {
    return c.json({ success: false, message: "Authentication required." }, 401);
  }

  const params = paramsSchema.safeParse(c.req.param());

  if (!params.success) {
    return c.json({ success: false, message: "Invalid plan ID." }, 400);
  }

  try {
    const [plan] = await db
      .select({
        id: aiPlans.id,
        goal: aiPlans.goal,
        status: aiPlans.status,
        executionResult: aiPlans.executionResult,
        updatedAt: aiPlans.updatedAt,
      })
      .from(aiPlans)
      .where(
        and(eq(aiPlans.id, params.data.planId), eq(aiPlans.userId, user.id)),
      )
      .limit(1);

    if (!plan) {
      return c.json({ success: false, message: "Plan not found." }, 404);
    }

    if (plan.executionResult === null) {
      return c.json({
        success: true,
        message: "Execution result is not available yet.",
        data: {
          id: plan.id,
          goal: plan.goal,
          status: plan.status,
          executionResult: null,
        },
      });
    }

    return c.json({
      success: true,
      message: "Execution result retrieved successfully.",
      data: plan,
    });
  } catch (error) {
    console.error("Get plan result failed:", error);

    return c.json(
      {
        success: false,
        message: "Could not retrieve execution result.",
      },
      500,
    );
  }
}

export async function getPlanHistoryController(c: Context) {
  const user = getAuthenticatedUser(c);

  if (!user) {
    return c.json({ success: false, message: "Authentication required." }, 401);
  }

  try {
    const history = await db
      .select({
        id: aiPlans.id,
        goal: aiPlans.goal,
        status: aiPlans.status,
        executionResult: aiPlans.executionResult,
        createdAt: aiPlans.createdAt,
        updatedAt: aiPlans.updatedAt,
      })
      .from(aiPlans)
      .where(
        and(
          eq(aiPlans.userId, user.id),
          inArray(aiPlans.status, ["completed", "rejected", "failed"]),
        ),
      )
      .orderBy(desc(aiPlans.createdAt));

    return c.json({
      success: true,
      data: history,
    });
  } catch (error) {
    console.error("Get plan history failed:", error);

    return c.json(
      { success: false, message: "Could not retrieve plan history." },
      500,
    );
  }
}
